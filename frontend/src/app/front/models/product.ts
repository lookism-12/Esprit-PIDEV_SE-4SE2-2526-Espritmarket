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
    totalSales: number;
    isVerified: boolean;
    joinedAt: Date;
    responseTime?: string;
    responseRate?: number;
    categories?: string[];
}

