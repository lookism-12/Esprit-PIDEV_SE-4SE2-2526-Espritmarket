export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    category: string;
    categoryIds?: string[]; // ✅ Added for backend compatibility
    subcategory?: string;
    imageUrl: string;
    images?: string[];
    sellerId: string;
    shopId?: string; // ✅ Added shopId field for shop filtering
    sellerName: string;
    sellerAvatar?: string;
    rating: number;
    reviewsCount: number;
    stock: number;
    stockStatus: StockStatus;
    condition: ProductCondition;
    tags?: string[];
    isNegotiable: boolean;
    isFavorite?: boolean;
    viewCount?: number;
    createdAt?: Date;
    updatedAt?: Date;
    // New stock management fields
    maxPurchaseQuantity?: number;
    isAvailable?: boolean;
    stockWarningThreshold?: number;
    // ✅ APPROVAL WORKFLOW FIELDS
    status?: ProductStatus;
    approvedAt?: Date;
    approvedBy?: string;
    rejectionReason?: string;
    // ========================================
    // TRUST & REPUTATION SYSTEM FIELDS
    // ========================================
    /**
     * Seller's trust score (0-100)
     */
    trustScore?: number;
    /**
     * Seller's trust badge
     * Values: NEW_SELLER, GROWING_SELLER, TRUSTED_SELLER, TOP_SELLER
     */
    trustBadge?: string;
}

export enum ProductStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    SUSPENDED = 'SUSPENDED'
}

export enum StockStatus {
    IN_STOCK = 'IN_STOCK',
    LOW_STOCK = 'LOW_STOCK', 
    OUT_OF_STOCK = 'OUT_OF_STOCK',
    DISCONTINUED = 'DISCONTINUED'
}

export enum ProductCondition {
    NEW = 'NEW',
    LIKE_NEW = 'LIKE_NEW',
    GOOD = 'GOOD',
    FAIR = 'FAIR',
    POOR = 'POOR'
}

export interface ProductCategory {
    id: string;
    name: string;
    slug: string;
    icon: string;
    description?: string;
    parentId?: string;
    children?: ProductCategory[];
    productCount: number;
    productIds?: string[];
}

export interface Shop {
    id: string;
    userId: string;
    name: string;
    slug: string;
    description?: string;
    logo?: string;
    banner?: string;
    rating: number;
    reviewsCount: number;
    productCount: number;
    totalProducts?: number;  // ✅ Added for backend compatibility
    totalSales: number;
    isVerified: boolean;
    isActive?: boolean;  // ✅ Added for backend compatibility
    joinedAt: Date;
    responseTime?: string;
    responseRate?: number;
    categories?: string[];
}

