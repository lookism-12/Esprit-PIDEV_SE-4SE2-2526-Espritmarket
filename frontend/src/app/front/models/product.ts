export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    category: string;
    /** Mongo category ids from API (when available) */
    categoryIds?: string[];
    subcategory?: string;
    imageUrl: string;
    images?: string[];
    sellerId: string;
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
    status: ProductStatus;
}

export enum ProductStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

export enum StockStatus {
    IN_STOCK = 'IN_STOCK',
    LOW_STOCK = 'LOW_STOCK',
    OUT_OF_STOCK = 'OUT_OF_STOCK'
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
export interface ProductImagePayload {
    url: string;
    altText?: string;
}

export interface MarketplaceProductRequest {
    name: string;
    description: string;
    price: number;
    shopId: string;
    categoryIds: string[];
    stock: number;
    images?: ProductImagePayload[];
    isNegotiable: boolean;
    condition: ProductCondition;
    status?: ProductStatus;
}
