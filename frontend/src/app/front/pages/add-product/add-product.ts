import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProductService, CreateProductRequest, ProductImageDTO } from '../../core/product.service';
import { CategoryService } from '../../core/shop.service';
import { ShopService } from '../../core/shop.service';
import { ProductCategory } from '../../models/product';
import { ProductImageUpload } from './product-image-upload';
import { environment } from '../../../../environment';

// ── AI Suggestion types ──────────────────────────────────────
export interface AISuggestion {
  recommendedPrice: number;
  priceRange: { min: number; max: number };
  marketPosition: 'BELOW_MARKET' | 'AT_MARKET' | 'ABOVE_MARKET';
  demandLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  promotionAdvice: string;
  pricingAdvice: string;
  categoryInsight: string;
  confidence: number;
  tips: string[];
}

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-product.html',
  styleUrl: './add-product.scss'
})
export class AddProduct implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private shopService = inject(ShopService);
  private router = inject(Router);
  private http = inject(HttpClient);

  // Categories from backend
  categories = signal<ProductCategory[]>([]);
  isLoadingCategories = signal<boolean>(false);

  // Form state
  productName = signal<string>('');
  description = signal<string>('');
  price = signal<number>(0);
  stock = signal<number>(0);
  selectedCategoryIds = signal<string[]>([]);
  
  // Image Upload State (Direct Upload)
  selectedFiles = signal<File[]>([]);
  uploadedImageUrls = signal<string[]>([]);
  imagePreviewUrls = signal<string[]>([]);
  isUploadingImages = signal<boolean>(false);
  
  // Shop ID (should come from user's shop)
  shopId = signal<string>('');

  // UI State
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  
  // Flow Control
  showImageUpload = signal<boolean>(false);
  createdProductId = signal<string>('');

  // ── AI Panel State ──────────────────────────────────────────
  showAIPanel = signal<boolean>(false);
  aiLoading = signal<boolean>(false);
  aiSuggestion = signal<AISuggestion | null>(null);
  aiError = signal<string>('');

  /** Check if form has enough data for AI analysis */
  readonly canAnalyzeWithAI = computed(() =>
    this.productName().trim().length >= 2 ||
    this.description().trim().length >= 5 ||
    this.price() > 0
  );

  // ── AI Methods ──────────────────────────────────────────────

  openAIPanel(): void {
    this.showAIPanel.set(true);
    this.aiError.set('');
    // Auto-analyze if we have data
    if (this.canAnalyzeWithAI()) {
      this.analyzeWithAI();
    }
  }

  closeAIPanel(): void {
    this.showAIPanel.set(false);
  }

  analyzeWithAI(): void {
    this.aiLoading.set(true);
    this.aiError.set('');
    this.aiSuggestion.set(null);

    // Get selected category names
    const selectedCats = this.categories().filter(c =>
      this.selectedCategoryIds().includes(c.id)
    );
    const categoryName = selectedCats.length > 0 ? selectedCats[0].name : 'General';

    // Call backend ML endpoint
    this.http.post<any>(`${environment.apiUrl}/provider/ml/product-suggestion`, {
      productName: this.productName().trim() || 'New Product',
      description: this.description().trim(),
      price: this.price(),
      stock: this.stock(),
      category: categoryName
    }).subscribe({
      next: (data) => {
        this.aiSuggestion.set(data);
        this.aiLoading.set(false);
      },
      error: () => {
        // Fallback: generate rule-based suggestion locally
        this.aiSuggestion.set(this.generateLocalSuggestion(categoryName));
        this.aiLoading.set(false);
      }
    });
  }

  /** Apply AI recommended price to the form */
  applyAIPrice(): void {
    const suggestion = this.aiSuggestion();
    if (suggestion) {
      this.price.set(suggestion.recommendedPrice);
      this.closeAIPanel();
    }
  }

  /** Rule-based local suggestion when backend is unavailable */
  private generateLocalSuggestion(category: string): AISuggestion {
    const currentPrice = this.price();
    const stock = this.stock();
    const desc = this.description().toLowerCase();

    // Category price benchmarks (from dataset analysis)
    const benchmarks: Record<string, { min: number; max: number; avg: number }> = {
      'Clothing':       { min: 30,  max: 200,  avg: 85  },
      'Electronics':    { min: 50,  max: 800,  avg: 250 },
      'Beauty':         { min: 20,  max: 150,  avg: 65  },
      'Sports':         { min: 25,  max: 300,  avg: 110 },
      'Home & Living':  { min: 30,  max: 400,  avg: 120 },
      'Books':          { min: 10,  max: 80,   avg: 35  },
      'Food & Grocery': { min: 5,   max: 100,  avg: 30  },
      'Toys':           { min: 15,  max: 200,  avg: 70  },
      'General':        { min: 20,  max: 300,  avg: 100 },
    };

    const bench = benchmarks[category] || benchmarks['General'];
    const recommended = currentPrice > 0
      ? Math.round(currentPrice * 0.97)   // slight optimization
      : Math.round(bench.avg * 0.95);

    let marketPosition: AISuggestion['marketPosition'] = 'AT_MARKET';
    if (currentPrice > bench.avg * 1.15) marketPosition = 'ABOVE_MARKET';
    if (currentPrice < bench.avg * 0.85) marketPosition = 'BELOW_MARKET';

    // Demand from description keywords
    const highDemandWords = ['premium', 'luxury', 'exclusive', 'limited', 'new', 'trending'];
    const hasHighDemand = highDemandWords.some(w => desc.includes(w));
    const demandLevel: AISuggestion['demandLevel'] = hasHighDemand ? 'HIGH' : stock > 100 ? 'LOW' : 'MEDIUM';

    const tips: string[] = [];
    if (marketPosition === 'ABOVE_MARKET') tips.push(`Price is above ${category} average (${bench.avg} TND) — consider lowering slightly`);
    if (marketPosition === 'BELOW_MARKET') tips.push(`Price is below market — you can increase to ${bench.avg} TND`);
    if (stock > 200) tips.push('High stock level — consider a launch promotion to drive initial sales');
    if (stock < 10 && stock > 0) tips.push('Low stock — create urgency with "Only a few left!" messaging');
    if (!this.description().trim()) tips.push('Add a detailed description to improve search visibility');
    if (tips.length === 0) tips.push('Your product looks well-configured for the market');

    return {
      recommendedPrice: recommended,
      priceRange: { min: bench.min, max: bench.max },
      marketPosition,
      demandLevel,
      promotionAdvice: demandLevel === 'LOW'
        ? 'Consider a 10% launch discount to attract first buyers'
        : 'No promotion needed — demand is healthy',
      pricingAdvice: marketPosition === 'ABOVE_MARKET'
        ? `Reduce price to ${recommended} TND to stay competitive`
        : marketPosition === 'BELOW_MARKET'
        ? `You can increase to ${recommended} TND — market supports it`
        : `Price of ${recommended} TND is optimal for this category`,
      categoryInsight: `${category} products sell between ${bench.min}–${bench.max} TND (avg: ${bench.avg} TND)`,
      confidence: 0.78,
      tips
    };
  }
  ngOnInit(): void {
    this.loadCategories();
    this.loadUserShop();
  }

  loadCategories(): void {
    this.isLoadingCategories.set(true);
    this.errorMessage.set(''); // Clear previous errors
    console.log('🔄 Starting to load categories...');
    
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.isLoadingCategories.set(false);
        console.log('✅ Categories loaded for product form:', categories.length, categories);
        
        if (categories.length === 0) {
          console.warn('⚠️ No categories returned from API');
          this.errorMessage.set('No categories available. Please contact an administrator to create categories first.');
        }
      },
      error: (err) => {
        console.error('❌ Failed to load categories:', err);
        console.error('❌ Error details:', {
          message: err.message,
          status: err.status,
          url: err.url,
          error: err.error
        });
        
        let errorMsg = 'Failed to load categories. ';
        if (err.status === 0) {
          errorMsg += 'Cannot connect to server. Please check if the backend is running on port 8090.';
        } else if (err.status === 404) {
          errorMsg += 'Categories endpoint not found.';
        } else if (err.status === 403) {
          errorMsg += 'Access denied. Please log in again.';
        } else {
          errorMsg += `Server error (${err.status}). Please try again later.`;
        }
        
        this.errorMessage.set(errorMsg);
        this.isLoadingCategories.set(false);
      }
    });
  }

  loadUserShop(): void {
    // Load available shops and use the first one for testing
    this.shopService.getMyShop().subscribe({
      next: (shop) => {
        if (shop && shop.id) {
          this.shopId.set(shop.id);
          console.log('✅ Using user shop:', shop.id, shop);
        } else {
          console.error('❌ Shop response is empty or missing ID');
          this.errorMessage.set('Your provider account does not have a shop. Please contact support or try logging out and back in.');
        }
      },
      error: (error) => {
        console.error('❌ Failed to load user shop:', error);
        if (error.status === 404) {
          this.errorMessage.set('No shop found for your account. Your shop may not have been created during registration. Please contact support.');
        } else if (error.status === 403) {
          this.errorMessage.set('Access denied. Please ensure you are logged in as a PROVIDER.');
        } else {
          this.errorMessage.set('Failed to load shop information: ' + (error.error?.message || error.message));
        }
      }
    });
  }

  // Direct Image Upload Methods (replacing URL-based methods)
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleSelectedFiles(Array.from(input.files));
    }
  }

  private handleSelectedFiles(files: File[]): void {
    this.errorMessage.set('');
    
    const currentFiles = this.selectedFiles();
    const totalFiles = currentFiles.length + files.length;
    const maxFiles = 8;

    if (totalFiles > maxFiles) {
      this.errorMessage.set(`Maximum ${maxFiles} images allowed. You're trying to add ${files.length} more to ${currentFiles.length} existing.`);
      return;
    }

    const validFiles: File[] = [];
    const newPreviewUrls: string[] = [];

    files.forEach(file => {
      // Validate file type
      if (!file.type.startsWith('image/') || !['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
        this.errorMessage.set(`File "${file.name}" is not a valid image. Please use JPG, PNG, or GIF.`);
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage.set(`File "${file.name}" is too large. Maximum size is 5MB.`);
        return;
      }

      // Check for duplicate names
      if (currentFiles.some(f => f.name === file.name)) {
        this.errorMessage.set(`File "${file.name}" is already selected.`);
        return;
      }

      validFiles.push(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviewUrls.push(e.target?.result as string);
        
        // Update signals when all previews are ready
        if (newPreviewUrls.length === validFiles.length) {
          this.selectedFiles.update(current => [...current, ...validFiles]);
          this.imagePreviewUrls.update(current => [...current, ...newPreviewUrls]);
          console.log('✅ Files added:', validFiles.length, 'Total files:', this.selectedFiles().length);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  removeSelectedImage(index: number): void {
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
    this.imagePreviewUrls.update(urls => urls.filter((_, i) => i !== index));
    console.log('🗑️ Image removed at index:', index);
  }

  clearAllImages(): void {
    this.selectedFiles.set([]);
    this.imagePreviewUrls.set([]);
    this.uploadedImageUrls.set([]);
    this.errorMessage.set('');
    console.log('🧹 All images cleared');
  }

  uploadProductImages(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const files = this.selectedFiles();
      if (files.length === 0) {
        resolve([]);
        return;
      }

      console.log('🚀 Uploading', files.length, 'image(s) to Cloudinary...');
      this.isUploadingImages.set(true);

      const formData = new FormData();
      files.forEach(file => formData.append('files', file, file.name));

      this.http.post<{ urls: string[]; count: number }>(
        `${environment.apiUrl}/uploads/temp-images`,
        formData
      ).subscribe({
        next: (response) => {
          const imageUrls = response.urls || [];
          console.log('✅ Images uploaded to Cloudinary:', imageUrls);
          this.uploadedImageUrls.set(imageUrls);
          this.isUploadingImages.set(false);
          resolve(imageUrls);
        },
        error: (err) => {
          console.error('❌ Image upload failed:', err);
          this.isUploadingImages.set(false);
          const msg = err.error?.error || err.error?.message || err.message || `Upload failed (${err.status})`;
          reject(new Error(msg));
        }
      });
    });
  }

  toggleCategory(categoryId: string): void {
    const current = this.selectedCategoryIds();
    if (current.includes(categoryId)) {
      this.selectedCategoryIds.set(current.filter(id => id !== categoryId));
    } else {
      this.selectedCategoryIds.set([...current, categoryId]);
    }
  }

  isCategorySelected(categoryId: string): boolean {
    return this.selectedCategoryIds().includes(categoryId);
  }

  validateForm(): boolean {
    this.errorMessage.set('');

    if (!this.productName().trim()) {
      this.errorMessage.set('Product name is required');
      return false;
    }

    if (!this.description().trim()) {
      this.errorMessage.set('Description is required');
      return false;
    }

    if (this.price() <= 0) {
      this.errorMessage.set('Price must be greater than 0');
      return false;
    }

    if (this.stock() < 0) {
      this.errorMessage.set('Stock cannot be negative');
      return false;
    }

    if (this.selectedCategoryIds().length === 0) {
      this.errorMessage.set('⚠️ You must select at least one category');
      return false;
    }

    if (!this.shopId()) {
      this.errorMessage.set('Shop ID is missing. Please contact support.');
      return false;
    }

    return true;
  }

  createProduct(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    // Step 1: Upload images first if any are selected
    if (this.selectedFiles().length > 0) {
      console.log('🚀 Uploading images first, then creating product...');
      this.uploadProductImages()
        .then((imageUrls) => {
          console.log('✅ Images uploaded, now creating product with images:', imageUrls);
          this.createProductWithImages(imageUrls);
        })
        .catch((error) => {
          console.error('❌ Image upload failed:', error);
          this.errorMessage.set(error.message || 'Failed to upload images. Please try again.');
          this.isSubmitting.set(false);
        });
    } else {
      // No images selected, create product without images
      console.log('🚀 Creating product without images...');
      this.createProductWithImages([]);
    }
  }

  private createProductWithImages(imageUrls: string[]): void {
    const productData: CreateProductRequest = {
      name: this.productName().trim(),
      description: this.description().trim(),
      shopId: this.shopId(),
      categoryIds: this.selectedCategoryIds(),
      price: this.price(),
      stock: this.stock(),
      images: imageUrls.map(url => ({
        url: url,
        altText: this.productName().trim()
      } as ProductImageDTO))
    };

    console.log('🚀 Creating product with data:', productData);

    this.productService.create(productData).subscribe({
      next: (createdProduct) => {
        console.log('✅ Product created successfully:', createdProduct);
        this.successMessage.set('Product created successfully! Now you can upload images.');
        this.isSubmitting.set(false);
        
        // Store the created product ID and show image upload
        this.createdProductId.set(createdProduct.id);
        this.showImageUpload.set(true);
        
        // Reset form but keep success message
        this.resetFormButKeepSuccess();
      },
      error: (err) => {
        console.error('❌ Failed to create product:', err);
        console.error('❌ Error details:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          error: err.error
        });
        
        let errorMsg = 'Failed to create product. ';
        
        if (err.status === 400) {
          // Bad Request - validation error
          if (err.error?.message) {
            errorMsg = err.error.message;
          } else if (typeof err.error === 'string') {
            errorMsg = err.error;
          } else {
            errorMsg += 'Please check all fields are valid.';
          }
        } else if (err.status === 403) {
          errorMsg = 'Access denied. Please ensure you are logged in as a PROVIDER.';
        } else if (err.status === 404) {
          errorMsg = 'Shop or category not found. Please contact support.';
        } else if (err.status === 0) {
          errorMsg = 'Cannot connect to server. Please check if the backend is running.';
        } else {
          errorMsg += err.error?.message || err.message || 'Unknown error occurred.';
        }
        
        this.errorMessage.set(errorMsg);
        this.isSubmitting.set(false);
      }
    });
  }

  resetForm(): void {
    this.productName.set('');
    this.description.set('');
    this.price.set(0);
    this.stock.set(0);
    this.selectedCategoryIds.set([]);
    this.clearAllImages();
    this.errorMessage.set('');
    this.successMessage.set('');
    this.showImageUpload.set(false);
    this.createdProductId.set('');
  }

  resetFormButKeepSuccess(): void {
    this.productName.set('');
    this.description.set('');
    this.price.set(0);
    this.stock.set(0);
    this.selectedCategoryIds.set([]);
    this.clearAllImages();
    this.errorMessage.set('');
    // Keep successMessage and showImageUpload for image upload flow
  }

  finishProductCreation(): void {
    // Called when user finishes uploading images or skips
    this.successMessage.set('Product creation completed successfully!');
    setTimeout(() => {
      this.router.navigate(['/products']);
    }, 1500);
  }

  skipImageUpload(): void {
    // Allow user to skip image upload and finish
    this.finishProductCreation();
  }

  createAnotherProduct(): void {
    // Reset everything and start over
    this.resetForm();
  }

  cancel(): void {
    this.router.navigate(['/products']);
  }
}
