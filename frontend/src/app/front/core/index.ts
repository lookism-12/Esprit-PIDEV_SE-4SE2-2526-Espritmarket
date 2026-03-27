// Core Module - Services and Guards Barrel Export
// All injectable services and functional guards for the front module

// Services
export { AuthService } from './auth.service';
export type { LoginRequest, RegisterRequest, AuthResponse, BaseRegisterRequest, ClientRegisterRequest, ProviderRegisterRequest, DriverRegisterRequest, DeliveryRegisterRequest } from './auth.service';

export { ProductService } from './product.service';
export type { ProductFilter, ProductListResponse, CreateProductRequest, UpdateProductRequest } from './product.service';

export { CartService } from './cart.service';

export { OrderService } from './order.service';
export type { OrderFilter, OrderListResponse, UpdateOrderStatusRequest } from './order.service';

export { PaymentService } from './payment.service';
export type { PaymentRequest, PaymentResponse, RefundRequest, RefundResponse, CardDetails, MobilePaymentDetails } from './payment.service';

export { UserService } from './user.service';
export type { UpdateProfileRequest, UserListResponse, UserFilter } from './user.service';

export { InvoiceService } from './invoice.service';
export type { InvoiceListResponse, GenerateInvoiceRequest } from './invoice.service';

export { CouponService } from './coupon.service';
export type { CreateCouponRequest, UpdateCouponRequest } from './coupon.service';

export { NotificationService } from './notification.service';
export type { NotificationListResponse } from './notification.service';

// New Services
export { FavoriteService } from './favorite.service';
export { NegotiationService } from './negotiation.service';
export { DeliveryService, SavService } from './delivery.service';
export { CarpoolingService } from './carpooling.service';
export { ForumService } from './forum.service';
export { LoyaltyService } from './loyalty.service';
export { PreferencesService } from './preferences.service';
export { ShopService } from './shop.service';
export { CategoryService } from './category.service';
export { MarketplaceService } from './marketplace-service.service';
export type { ServiceEntity } from './marketplace-service.service';

// Guards
export { authGuard, guestGuard } from './auth.guard';
export { roleGuard, adminGuard, sellerGuard, buyerGuard, providerGuard, driverGuard, clientGuard } from './role.guard';
