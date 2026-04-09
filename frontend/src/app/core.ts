// ============================================================================
// Global Core Module Barrel Export
// ============================================================================
// Central hub for all services, guards, and models
// Consolidates exports from front/core and back/core for easier imports
// 
// Usage: import { AuthService, authGuard, Product } from '@app/core';
// ============================================================================

// ==================== Front-End Services ====================
export {
  AuthService,
  type LoginRequest,
  type RegisterRequest,
  type AuthResponse,
  type BaseRegisterRequest,
  type ClientRegisterRequest,
  type ProviderRegisterRequest,
  type DriverRegisterRequest,
  type DeliveryRegisterRequest
} from './front/core/auth.service';

export { ProductService } from './front/core/product.service';
export type { ProductFilter, ProductListResponse, CreateProductRequest, UpdateProductRequest } from './front/core/product.service';

export { CartService } from './front/core/cart.service';

export { OrderService } from './front/core/order.service';
export type { OrderFilter, OrderListResponse, UpdateOrderStatusRequest } from './front/core/order.service';

export { PaymentService } from './front/core/payment.service';
export type { PaymentRequest, PaymentResponse, RefundRequest, RefundResponse, CardDetails, MobilePaymentDetails } from './front/core/payment.service';

export { UserService } from './front/core/user.service';
export type { UpdateProfileRequest, UserListResponse, UserFilter } from './front/core/user.service';

export { InvoiceService } from './front/core/invoice.service';
export type { InvoiceListResponse, GenerateInvoiceRequest } from './front/core/invoice.service';

export { CouponService } from './front/core/coupon.service';
export type { CreateCouponRequest, UpdateCouponRequest } from './front/core/coupon.service';

export { NotificationService } from './front/core/notification.service';
export type { NotificationListResponse } from './front/core/notification.service';

export { FavoriteService } from './front/core/favorite.service';
export { NegotiationService } from './front/core/negotiation.service';
export { DeliveryService, SavService } from './front/core/delivery.service';
export { CarpoolingService } from './front/core/carpooling.service';
export { ForumService, GroupService, ChatService } from './front/core/forum.service';
export { LoyaltyService } from './front/core/loyalty.service';
export { PreferencesService } from './front/core/preferences.service';
export { ShopService, CategoryService } from './front/core/shop.service';

// ==================== Front-End Guards ====================
export { authGuard, guestGuard } from './front/core/auth.guard';
export { roleGuard, adminGuard, sellerGuard, buyerGuard, providerGuard, driverGuard, clientGuard } from './front/core/role.guard';
export { adminAuthGuard } from './front/core/admin-auth.guard';

// ==================== Front-End Models ====================
export type { User, AcademicInfo, ReputationInfo, Badge, UserPreferences, NotificationPreferences, UserRole, RoleGroup, ClientSubRole, LogisticsSubRole, ReputationLevel } from './front/models/user.model';
export type { Product } from './front/models/product';
export type { Cart, CartItem } from './front/models/cart.model';
export type { Order, OrderStatus, OrderItem } from './front/models/order.model';
export type { Invoice } from './front/models/invoice.model';
export type { AppNotification, NotificationResponse, NotificationPriority } from './front/models/notification.model';
export { NotificationType } from './front/models/notification.model';
export type { Promotion } from './front/models/promotion.model';
export type { Favorite } from './front/models/favorite.model';
export type { Negotiation } from './front/models/negotiation.model';
export type { Delivery, DeliveryStatus } from './front/models/delivery.model';
export type { Ride, RideStatus, Booking } from './front/models/carpooling.model';
export type { Post, ForumCategory } from './front/models/forum.model';
export type { LoyaltyAccount, LoyaltyLevel } from './front/models/loyalty.model';
export * as PreferencesModels from './front/models/preferences.model';

// ==================== Back-End Services ====================
export { DashboardService } from './back/core/services/dashboard.service';
export { SupportService } from './back/core/services/support.service';
export { ToastService } from './back/core/services/toast.service';
export type { Toast } from './back/core/services/toast.service';
export { KYCService } from './back/core/services/kyc.service';

// Back Product and Order services (with different names to avoid conflicts)
export { ProductService as AdminProductService } from './back/core/services/product.service';
export { OrderService as AdminOrderService } from './back/core/services/order.service';
export { UserService as AdminUserService } from './back/core/services/user.service';

// ==================== Back-End Models ====================
export type { MenuItem } from './back/core/models/menu-item.model';
export type { User as AdminUser } from './back/core/models/entities.model';
