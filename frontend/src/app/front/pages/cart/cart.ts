import { Component, signal, computed, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/cart.service';
import { CartResponse, CartItemResponse } from '../../models/cart.model';
import { CouponService } from '../../core/coupon.service';
import { LoyaltyService } from '../../core/loyalty.service';
import { InvoiceService } from '../../core/invoice.service';
import { ToastService } from '../../core/toast.service';
import { ImageUrlHelper } from '../../../shared/utils/image-url.helper';
import { LoyaltyLevel } from '../../models/loyalty.model';
import { AuthService } from '../../core/auth.service';
import { TaxConfigService } from '../../../back/features/platform-management/tax-config.service';
import { CardDetails, CardOtpResponse, PaymentService } from '../../core/payment.service';
import { CartMLService, CartMLSuggestion } from '../../core/cart-ml.service';
import { forkJoin, switchMap } from 'rxjs';

// Enhanced cart item interface for display
interface DisplayCartItem extends CartItemResponse {
  product: {
    id: string;
    name: string;
    imageUrl: string;
    price: number;
    category: string;
    sellerName: string;
    stock: number;
    stockStatus: string;
  };
  maxQuantity: number;
}

type PaymentGatewayState =
  | 'IDLE'
  | 'READY'
  | 'SENDING_OTP'
  | 'OTP_SENT'
  | 'CONFIRMING'
  | 'FAILED'
  | 'SUCCEEDED';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class Cart implements OnInit {
  private router = inject(Router);
  private cartService = inject(CartService);
  private couponService = inject(CouponService);
  private loyaltyService = inject(LoyaltyService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private invoiceService = inject(InvoiceService);
  private taxConfigService = inject(TaxConfigService);
  private paymentService = inject(PaymentService);
  private cartMLService = inject(CartMLService);
  private route = inject(ActivatedRoute);

  // ML Suggestions
  readonly mlSuggestions = signal<CartMLSuggestion[]>([]);
  readonly mlLoading = signal(false);

  /** Returns the ML suggestion for a given productId, or null */
  getMLSuggestion(productId: string): CartMLSuggestion | null {
    return this.mlSuggestions().find(s => s.product_id === productId) ?? null;
  }

  // New Wizard Flow State
  readonly currentStep = signal<'CART' | 'PLACE_ORDER' | 'PAY' | 'COMPLETE'>('CART');

  // Place Order Form Signals
  readonly shippingName = signal<string>('');
  readonly shippingPhone = signal<string>('');
  readonly shippingAddress = signal<string>('');
  readonly shippingCity = signal<string>('');
  readonly saveAsDefault = signal<boolean>(false);
  readonly paymentMethod = signal<'CARD' | 'CASH'>('CARD');
  readonly estimatedDelivery = signal<string>('');

  // Internal OTP payment state. The full card number stays in the browser for format checks only.
  readonly isProcessingPayment = signal<boolean>(false);
  readonly paymentGatewayState = signal<PaymentGatewayState>('IDLE');
  readonly paymentGatewayMessage = signal<string>('Enter card details to request SMS verification.');
  readonly paymentDisplayAmount = signal<number | null>(null);
  readonly paymentCurrency = signal<string>('TND');
  readonly cardNumber = signal<string>('');
  readonly expiryDate = signal<string>('');
  readonly cvv = signal<string>('');
  readonly cardholderName = signal<string>('');
  readonly otpCode = signal<string>('');
  readonly cardVerificationId = signal<string | null>(null);
  readonly maskedCard = signal<string | null>(null);
  readonly maskedPhone = signal<string | null>(null);

  // Complete Step Data
  readonly orderNumber = signal<string | null>(null);
  readonly orderId = signal<string | null>(null);
  readonly orderStatus = signal<string | null>(null);
  readonly isDownloadingInvoice = signal<boolean>(false);

  // Backend-connected state
  readonly cart = this.cartService.cart;
  readonly cartItems = signal<DisplayCartItem[]>([]);
  readonly isLoading = this.cartService.isLoading;
  readonly error = this.cartService.error;

  // UI state
  readonly couponCode = signal<string>('');
  readonly appliedCoupon = signal<{ code: string; discount: number; type: 'percentage' | 'fixed' } | null>(null);
  readonly couponError = signal<string>('');
  readonly isApplyingCoupon = signal<boolean>(false);
  readonly usePoints = signal<boolean>(false);
  readonly pointsToRedeem = signal<number>(0);

  // Real loyalty data from backend
  readonly loyaltyPoints = signal<number>(0);
  readonly loyaltyLevel = signal<LoyaltyLevel>(LoyaltyLevel.BRONZE);

  // Tax rate — fetched from backend, falls back to 19% TVA Tunisia
  readonly taxRate = signal<number>(0.19);
  readonly taxName = signal<string>('TVA 19%');

  // Computed values from backend cart
  readonly subtotal = computed(() => this.cart()?.subtotal ?? 0);
  readonly discountAmount = computed(() => this.cart()?.discountAmount ?? 0);
  readonly taxAmount = computed(() => this.cart()?.taxAmount ?? 0);
  readonly total = computed(() => this.cart()?.total ?? 0);

  readonly itemCount = computed(() => {
    return this.cartItems().reduce((sum, item) => sum + item.quantity, 0);
  });

  readonly isEmpty = computed(() => this.cartItems().length === 0);

  // Invoice button text based on order status
  readonly invoiceButtonText = computed(() => {
    const status = this.orderStatus();
    return status === 'PAID' ? '📄 Download Invoice' : '📄 Download Proforma Invoice';
  });

  readonly shipping = computed(() => {
    if (this.loyaltyLevel() === LoyaltyLevel.GOLD || this.loyaltyLevel() === LoyaltyLevel.PLATINUM) {
      return 0; // Free shipping for Gold/Platinum
    }
    return this.subtotal() > 100 ? 0 : 7;
  });

  readonly earnedPoints = computed(() => {
    const multipliers: Record<string, number> = {
      'BRONZE': 1,
      'SILVER': 1.5,
      'GOLD': 2,
      'PLATINUM': 3
    };
    return Math.floor(this.subtotal() * (multipliers[this.loyaltyLevel()] || 1));
  });

  readonly couponDiscount = computed(() => {
    const coupon = this.appliedCoupon();
    if (!coupon) return 0;
    if (coupon.type === 'percentage') {
      return this.subtotal() * (coupon.discount / 100);
    }
    return Math.min(coupon.discount, this.subtotal());
  });

  // Auto discount from backend (automatic shop rules)
  readonly autoDiscount = computed(() => {
    const cart = this.cart();
    const manualDiscount = this.couponDiscount() + this.pointsDiscount();
    const totalDiscount = cart?.discountAmount ?? 0;
    // Auto discount = total discount - manual discounts
    return Math.max(0, totalDiscount - manualDiscount);
  });

  readonly pointsDiscount = computed(() => {
    if (!this.usePoints()) return 0;
    return Math.min(this.pointsToRedeem() / 100, this.subtotal() - this.couponDiscount());
  });

  readonly tax = computed(() => {
    const cart = this.cart();
    return cart?.taxAmount ?? (this.subtotal() * this.taxRate());
  });

  readonly maxRedeemablePoints = computed(() => {
    const maxDiscount = this.subtotal() - this.couponDiscount();
    return Math.min(this.loyaltyPoints(), Math.floor(maxDiscount * 100));
  });

  readonly canSubmitCardPayment = computed(() => {
    if (this.isProcessingPayment()) return false;
    if (this.cardVerificationId()) {
      return /^\d{6}$/.test(this.otpCode().trim());
    }
    return this.isCardFormComplete();
  });

  constructor() {
    // Watch for wizard step redirect (e.g. from Buy Now)
    effect(() => {
      const step = this.route.snapshot.queryParamMap.get('step');
      if (step === 'PLACE_ORDER' && this.canCheckout()) {
        this.goToStep('PLACE_ORDER');
      }
    });
  }

  ngOnInit(): void {
    this.loadRealCartData();
    this.loadLoyaltyData();
    this.initDeliveryEstimation();
    this.prefillUserProfile();
    // Fetch dynamic TVA rate
    this.taxConfigService.getEffective().subscribe({
      next: (cfg) => { this.taxRate.set(cfg.rate); this.taxName.set(cfg.name); },
      error: () => { /* fallback 19% already set */ }
    });
  }

  private initDeliveryEstimation(): void {
    const today = new Date();
    const minDay = new Date(today);
    minDay.setDate(today.getDate() + 3);
    const maxDay = new Date(today);
    maxDay.setDate(today.getDate() + 5);
    
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    this.estimatedDelivery.set(`${minDay.toLocaleDateString('en-US', options)} - ${maxDay.toLocaleDateString('en-US', options)}`);
  }

  private prefillUserProfile(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.shippingName.set(`${user.firstName} ${user.lastName}`.trim());
      this.shippingPhone.set(user.phone || '');
      // Try to parse out City and Address if "Aouina, Tunis"
      const addr = (user as any).address || '';
      if (addr.includes(',')) {
        const parts = addr.split(',');
        this.shippingAddress.set(parts[0].trim());
        this.shippingCity.set(parts[1].trim());
      } else {
        this.shippingAddress.set(addr);
      }
    }
  }

  // ============== WIZARD NAVIGATION ==============

  goToStep(step: 'CART' | 'PLACE_ORDER' | 'PAY' | 'COMPLETE') {
    if (step === 'PLACE_ORDER' && this.hasStockIssues()) return;
    this.currentStep.set(step);
    window.scrollTo(0, 0);
  }

  proceedToPlaceOrder() {
    if (!this.validateCartStock()) return;
    this.goToStep('PLACE_ORDER');
  }

  proceedToPaymentOrComplete() {
    if (!this.shippingName() || !this.shippingAddress() || !this.shippingCity() || !this.shippingPhone()) {
      this.toastService.warning('Please fill in all required delivery fields.');
      return;
    }

    if (this.paymentMethod() === 'CASH') {
      this.submitCashOrder();
    } else {
      this.prepareCardPayment();
    }
  }

  private prepareCardPayment(): void {
    this.paymentDisplayAmount.set(this.total());
    this.paymentCurrency.set('TND');
    this.paymentGatewayState.set(this.cardVerificationId() ? 'OTP_SENT' : 'READY');
    this.paymentGatewayMessage.set(this.cardVerificationId()
      ? `Enter the SMS code sent to ${this.maskedPhone()}.`
      : 'Enter card details to request SMS verification.');
    this.goToStep('PAY');
  }

  processCardPayment(): void {
    if (this.cardVerificationId()) {
      this.confirmCardOtpAndSubmitOrder();
      return;
    }
    this.requestCardOtp();
  }

  submitOrder() {
    if (this.paymentMethod() === 'CASH') {
      this.submitCashOrder();
      return;
    }
    this.processCardPayment();
    return;

    this.toastService.info('Processing your order...', 2000);
    
    // Concat address & city
    const fullAddress = `${this.shippingAddress()}, ${this.shippingCity()}`;
    const mappedPayment = this.paymentMethod() === 'CARD' ? 'CREDIT_CARD' : 'CASH_ON_DELIVERY';

    const checkoutData = {
      shippingAddress: fullAddress,
      paymentMethod: mappedPayment
    };

    this.cartService.checkout(checkoutData).subscribe({
      next: (order) => {
        // For CARD payment: confirm payment immediately (mark as PAID)
        // For CASH payment: keep as PENDING (payment on delivery)
        if (this.paymentMethod() === 'CARD') {
          const paymentId = `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
          
          this.cartService.confirmPayment(order.id, paymentId).subscribe({
            next: (confirmedOrder) => {
              this.isProcessingPayment.set(false);
              this.orderNumber.set(confirmedOrder.orderNumber || confirmedOrder.id || `ORD-${Math.floor(Math.random() * 1000000)}`);
              this.orderId.set(confirmedOrder.id);
              this.orderStatus.set(confirmedOrder.status || 'PAID');
              this.goToStep('COMPLETE');
              this.toastService.success('🎉 Order placed successfully!', 4000);
              this.triggerConfetti();
              sessionStorage.removeItem('pendingPurchase');
            },
            error: (error) => {
              this.isProcessingPayment.set(false);
              console.error('❌ Payment confirmation failed:', error);
              this.toastService.error('Payment confirmation failed. Please contact support.');
            }
          });
        } else {
          // Cash on Delivery - order stays PENDING
          this.isProcessingPayment.set(false);
          this.orderNumber.set(order.orderNumber || order.id || `ORD-${Math.floor(Math.random() * 1000000)}`);
          this.orderId.set(order.id);
          this.orderStatus.set(order.status || 'PENDING');
          this.goToStep('COMPLETE');
          this.toastService.success('🎉 Order placed successfully! Payment on delivery.', 4000);
          this.triggerConfetti();
          sessionStorage.removeItem('pendingPurchase');
        }
      },
      error: (error) => {
        this.isProcessingPayment.set(false);
        console.error('❌ Checkout failed:', error);
        this.toastService.error('Checkout failed. Please try again.');
      }
    });
  }

  private requestCardOtp(): void {
    const expiry = this.parseExpiryDate();
    const cardDetails: CardDetails = {
      cardNumber: this.cardNumber(),
      expiryMonth: expiry.month,
      expiryYear: expiry.year,
      cvv: this.cvv(),
      cardholderName: this.cardholderName()
    };

    if (!this.paymentService.validateCard(cardDetails)) {
      this.handleCardPaymentFailure('Card number, expiry date or CVV is invalid.');
      return;
    }

    this.isProcessingPayment.set(true);
    this.paymentGatewayState.set('SENDING_OTP');
    this.paymentGatewayMessage.set('Sending SMS verification code...');

    const digits = this.cardDigits();
    this.paymentService.requestCardOtp({
      cardLast4: digits.slice(-4),
      cardBrand: this.detectCardBrand(digits),
      expiryMonth: expiry.month,
      expiryYear: expiry.year,
      cardholderName: this.cardholderName().trim()
    }).subscribe({
      next: (response) => this.handleOtpSent(response),
      error: (error) => {
        const message = error.error?.message || 'Unable to send SMS verification code.';
        this.handleCardPaymentFailure(message);
      }
    });
  }

  private handleOtpSent(response: CardOtpResponse): void {
    this.isProcessingPayment.set(false);
    this.cardVerificationId.set(response.verificationId);
    this.maskedCard.set(response.maskedCard);
    this.maskedPhone.set(response.maskedPhone);
    this.paymentGatewayState.set('OTP_SENT');
    this.paymentGatewayMessage.set(`SMS code sent to ${response.maskedPhone}.`);
    this.toastService.success('SMS verification code sent.');
  }

  private confirmCardOtpAndSubmitOrder(): void {
    const verificationId = this.cardVerificationId();
    if (!verificationId) return;

    this.isProcessingPayment.set(true);
    this.paymentGatewayState.set('CONFIRMING');
    this.paymentGatewayMessage.set('Validating SMS code and confirming order...');

    this.paymentService.confirmCardOtp({
      verificationId,
      otpCode: this.otpCode().trim()
    }).pipe(
      switchMap((verification) =>
        this.cartService.checkout(this.buildCheckoutData('CREDIT_CARD')).pipe(
          switchMap((order) => {
            this.orderNumber.set(order.orderNumber || order.id || `ORD-${Math.floor(Math.random() * 1000000)}`);
            this.orderId.set(order.id);
            return this.cartService.confirmPayment(order.id, verification.transactionId);
          })
        )
      )
    ).subscribe({
      next: (confirmedOrder) => {
        this.isProcessingPayment.set(false);
        this.paymentGatewayState.set('SUCCEEDED');
        this.orderNumber.set(confirmedOrder.orderNumber || confirmedOrder.id || this.orderNumber());
        this.orderId.set(confirmedOrder.id);
        this.orderStatus.set(confirmedOrder.paymentStatus || confirmedOrder.status || 'PAID');
        this.goToStep('COMPLETE');
        this.toastService.success('Order placed successfully!', 4000);
        this.triggerConfetti();
        sessionStorage.removeItem('pendingPurchase');
      },
      error: (error) => {
        const message = error.error?.message || 'Payment verification failed. Please try again.';
        console.error('Payment verification failed:', error);
        this.handleCardPaymentFailure(message);
      }
    });
  }

  private submitCashOrder(): void {
    this.isProcessingPayment.set(true);
    this.toastService.info('Processing your order...', 2000);

    this.cartService.checkout(this.buildCheckoutData('CASH_ON_DELIVERY')).subscribe({
      next: (order) => {
        this.isProcessingPayment.set(false);
        this.orderNumber.set(order.orderNumber || order.id || `ORD-${Math.floor(Math.random() * 1000000)}`);
        this.orderId.set(order.id);
        this.orderStatus.set(order.paymentStatus || order.status || 'PENDING');
        this.goToStep('COMPLETE');
        this.toastService.success('Order placed successfully! Payment on delivery.', 4000);
        this.triggerConfetti();
        sessionStorage.removeItem('pendingPurchase');
      },
      error: (error) => {
        this.isProcessingPayment.set(false);
        console.error('Checkout failed:', error);
        this.toastService.error('Checkout failed. Please try again.');
      }
    });
  }

  private buildCheckoutData(paymentMethod: 'CREDIT_CARD' | 'CASH_ON_DELIVERY') {
    return {
      shippingAddress: `${this.shippingAddress()}, ${this.shippingCity()}`,
      paymentMethod
    };
  }

  private isCardFormComplete(): boolean {
    const digits = this.cardDigits();
    if (digits.length < 16) return false;
    if (digits === '0000000000000000') return false;

    if (this.expiryDate().trim().length < 5) return false;
    const exp = this.parseExpiryDate();
    const month = parseInt(exp.month, 10);
    const year = parseInt('20' + exp.year, 10);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (month < 1 || month > 12) return false;
    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;

    return /^\d{3,4}$/.test(this.cvv().trim())
      && this.cardholderName().trim().length >= 3;
  }

  formatCardNumber(value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    this.cardNumber.set(digits.replace(/(.{4})/g, '$1 ').trim());
    this.cardVerificationId.set(null);
    this.otpCode.set('');
    this.maskedCard.set(null);
    this.maskedPhone.set(null);
  }

  formatExpiryDate(value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    this.expiryDate.set(formatted);
    this.cardVerificationId.set(null);
    this.otpCode.set('');
  }

  formatCvv(value: string): void {
    this.cvv.set(value.replace(/\D/g, '').slice(0, 3));
    this.cardVerificationId.set(null);
    this.otpCode.set('');
  }

  formatOtp(value: string): void {
    this.otpCode.set(value.replace(/\D/g, '').slice(0, 6));
  }

  private cardDigits(): string {
    return this.cardNumber().replace(/\D/g, '');
  }

  private parseExpiryDate(): { month: string; year: string } {
    const digits = this.expiryDate().replace(/\D/g, '');
    return {
      month: digits.slice(0, 2),
      year: digits.slice(2, 4)
    };
  }

  private detectCardBrand(digits: string): string {
    if (digits.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'MASTERCARD';
    if (/^3[47]/.test(digits)) return 'AMEX';
    return 'CARD';
  }

  private handleCardPaymentFailure(message: string): void {
    this.isProcessingPayment.set(false);
    this.paymentGatewayState.set('FAILED');
    this.paymentGatewayMessage.set(message);
    this.toastService.error(message);
  }

  triggerConfetti(): void {
    // Inject a quick DOM-based confetti to celebrate without heavy libraries
    const colors = ['#dc2626', '#fca5a5', '#ef4444', '#ffffff', '#fee2e2'];
    for (let i = 0; i < 60; i++) {
      const conf = document.createElement('div');
      conf.style.position = 'fixed';
      conf.style.zIndex = '9999';
      conf.style.width = Math.random() * 10 + 5 + 'px';
      conf.style.height = Math.random() * 10 + 5 + 'px';
      conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      conf.style.top = '-10px';
      conf.style.left = Math.random() * 100 + 'vw';
      conf.style.opacity = Math.random() + 0.5 + '';
      conf.style.transform = `rotate(${Math.random() * 360}deg)`;
      // Fast dropping animation
      const duration = Math.random() * 2 + 2;
      conf.style.transition = `top ${duration}s ease-in, opacity ${duration}s ease-in, transform ${duration}s ease-in`;
      document.body.appendChild(conf);

      // Trigger animation
      setTimeout(() => {
        conf.style.top = '100vh';
        conf.style.opacity = '0';
        conf.style.transform = `rotate(${Math.random() * 720}deg)`;
      }, 10);

      // Cleanup
      setTimeout(() => document.body.removeChild(conf), duration * 1000 + 100);
    }
  }

  /**
   * Download invoice PDF for the completed order
   */
  downloadInvoice(): void {
    const orderIdValue = this.orderId();
    
    if (!orderIdValue) {
      this.toastService.error('Order ID not found');
      return;
    }

    this.isDownloadingInvoice.set(true);
    this.toastService.info('Generating your invoice...', 2000);

    this.invoiceService.downloadInvoice(orderIdValue).subscribe({
      next: (blob) => {
        this.invoiceService.triggerDownload(blob, `invoice-${orderIdValue}.pdf`);
        this.toastService.success('Invoice downloaded successfully! 📄');
        this.isDownloadingInvoice.set(false);
      },
      error: (err) => {
        console.error('Error downloading invoice:', err);
        if (err.status === 400) {
          this.toastService.error('Invoice can only be generated for paid orders');
        } else if (err.status === 403) {
          this.toastService.error('You do not have permission to download this invoice');
        } else if (err.status === 404) {
          this.toastService.error('Order not found');
        } else {
          this.toastService.error('Failed to download invoice. Please try again.');
        }
        this.isDownloadingInvoice.set(false);
      }
    });
  }

  // ============== EXISTING CART LOGIC ==============

  private loadLoyaltyData(): void {
    this.loyaltyService.getDashboard().subscribe({
      next: (dashboard) => {
        this.loyaltyPoints.set(dashboard.totalPoints);
        this.loyaltyLevel.set(dashboard.loyaltyLevel as LoyaltyLevel);
      },
      error: () => {
        // Fallback to defaults
        this.loyaltyPoints.set(0);
        this.loyaltyLevel.set(LoyaltyLevel.BRONZE);
      }
    });
  }

  loadRealCartData(): void {
    forkJoin({
      cart: this.cartService.getCart(),
      items: this.cartService.getCartItems()
    }).subscribe({
      next: ({ items }) => {
        this.processCartItems(items);
        this.loadMLSuggestions();
      },
      error: () => this.cartItems.set([])
    });
  }

  private loadMLSuggestions(): void {
    this.mlLoading.set(true);
    this.cartMLService.getSuggestions().subscribe({
      next: (suggestions) => {
        this.mlSuggestions.set(suggestions);
        this.mlLoading.set(false);
        if (suggestions.length > 0) {
          const promoCount = suggestions.filter(s => s.promotion_suggestion === 'YES').length;
          if (promoCount > 0) {
            this.toastService.info(`🤖 ML: ${promoCount} item(s) eligible for promotion`, 3000);
          }
        }
      },
      error: () => this.mlLoading.set(false)
    });
  }

  private processCartItems(backendItems: CartItemResponse[]): void {
    const displayItems: DisplayCartItem[] = backendItems.map(item => ({
      ...item,
      product: {
        id: item.productId,
        name: item.productName,
        imageUrl: ImageUrlHelper.toAbsoluteUrl(item.imageUrl),
        price: item.unitPrice,
        category: item.category || 'General',
        sellerName: item.sellerName || 'Unknown Seller',
        stock: item.stock || 0,
        stockStatus: item.stockStatus || 'UNKNOWN'
      },
      maxQuantity: item.stock || 100
    }));
    this.cartItems.set(displayItems);
  }

  private setError(message: string): void {
    this.cartService.error.set(message);
  }

  updateQuantity(itemId: string, change: number): void {
    const currentItem = this.cartItems().find(item => item.id === itemId);
    if (!currentItem) return;

    const newQuantity = currentItem.quantity + change;
    if (newQuantity < 1) {
      this.removeItem(itemId);
      return;
    }

    this.cartService.updateItemQuantity(itemId, newQuantity).subscribe({
      next: () => {
        this.toastService.success('Quantity updated');
        this.loadRealCartData();
      },
      error: () => this.toastService.error('Failed to update quantity.')
    });
  }

  removeItem(id: string): void {
    const item = this.cartItems().find(item => item.id === id);
    const productName = item?.product.name || 'this item';
    this.toastService.withAction(`Remove ${productName}?`, 'Remove', () => this.confirmRemoveItem(id), 'warning');
  }

  private confirmRemoveItem(id: string): void {
    this.cartService.removeItem(id).subscribe({
      next: () => {
        this.toastService.success('Item removed');
        this.loadRealCartData();
      },
      error: () => this.toastService.error('Failed to remove item.')
    });
  }

  clearCart(): void {
    this.toastService.withAction(`Remove all ${this.itemCount()} items?`, 'Clear Cart', () => this.confirmClearCart(), 'warning');
  }

  private confirmClearCart(): void {
    this.cartService.clearCart().subscribe({
      next: () => {
        this.cartItems.set([]);
        this.appliedCoupon.set(null);
        this.couponCode.set('');
        this.toastService.success('Cart cleared');
        this.loadRealCartData();
      },
      error: () => this.toastService.error('Failed to clear cart.')
    });
  }

  applyCoupon(): void {
    const code = this.couponCode().trim();
    if (!code) {
      this.toastService.warning('Enter code');
      return;
    }

    this.isApplyingCoupon.set(true);
    this.couponError.set('');

    this.cartService.applyCoupon(code).subscribe({
      next: () => {
        if (code.toUpperCase() === 'ESPRIT10') {
          this.appliedCoupon.set({ code: 'ESPRIT10', discount: 10, type: 'percentage' });
        } else {
          this.appliedCoupon.set({ code: code.toUpperCase(), discount: 5, type: 'percentage' });
        }
        this.toastService.success('Coupon applied!');
        this.couponCode.set('');
        this.isApplyingCoupon.set(false);
      },
      error: () => {
        this.couponError.set('Invalid coupon code');
        this.isApplyingCoupon.set(false);
      }
    });
  }

  removeCoupon(): void {
    this.cartService.removeCoupon().subscribe({
      next: () => {
        this.appliedCoupon.set(null);
        this.toastService.info('Coupon removed');
      },
      error: () => this.appliedCoupon.set(null)
    });
  }

  toggleUsePoints(): void {
    this.usePoints.update(v => !v);
    if (this.usePoints()) {
      this.pointsToRedeem.set(this.maxRedeemablePoints());
    } else {
      this.pointsToRedeem.set(0);
    }
  }

  updatePointsToRedeem(points: number): void {
    this.pointsToRedeem.set(Math.min(points, this.maxRedeemablePoints()));
  }

  getLevelBadgeClass(level: LoyaltyLevel): string {
    switch (level) {
      case LoyaltyLevel.BRONZE: return 'bg-amber-100 text-amber-700';
      case LoyaltyLevel.SILVER: return 'bg-gray-200 text-gray-700';
      case LoyaltyLevel.GOLD: return 'bg-yellow-100 text-yellow-700';
      case LoyaltyLevel.PLATINUM: return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  readonly hasStockIssues = computed(() => {
    return this.cartItems().some(item => item.product.stock <= 0 || item.quantity > item.product.stock);
  });

  readonly stockIssueItems = computed(() => {
    return this.cartItems().filter(item => item.product.stock <= 0 || item.quantity > item.product.stock);
  });

  readonly canCheckout = computed(() => {
    return !this.isEmpty() && !this.hasStockIssues() && !this.isLoading();
  });

  getStockWarningMessage(): string {
    const issues = this.stockIssueItems();
    if (issues.length === 0) return '';
    if (issues.length === 1) {
      const item = issues[0];
      if (item.product.stock <= 0) return `"${item.product.name}" is out of stock`;
      return `Only ${item.product.stock} available (you requested ${item.quantity})`;
    }
    return `${issues.length} items have stock issues`;
  }

  private validateCartStock(): boolean {
    if (this.hasStockIssues()) {
      this.toastService.error(this.getStockWarningMessage(), 5000);
      return false;
    }
    return true;
  }
}



