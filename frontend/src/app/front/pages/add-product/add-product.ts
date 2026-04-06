import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ProductService, CreateProductRequest, ProductImageDTO } from '../../core/product.service';
import { CategoryService } from '../../core/shop.service';
import { ShopService } from '../../core/shop.service';
import { ProductCategory } from '../../models/product';
import { ProductImageUpload } from './product-image-upload';
import { environment } from '../../../../environment';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductImageUpload],
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
          console.log('✅ Using user shop:', shop.id);
        } else {
          // Fallback: get any available shop
          this.loadAnyShop();
        }
      },
      error: () => {
        // Fallback: get any available shop
        this.loadAnyShop();
      }
    });
  }

  private loadAnyShop(): void {
    // Get any available shop for testing
    this.http.get<any[]>(`${environment.apiUrl}/shops`).subscribe({
      next: (shops) => {
        if (shops && shops.length > 0) {
          this.shopId.set(shops[0].id);
          console.log('✅ Using available shop:', shops[0].id);
        } else {
          console.error('❌ No shops available');
          this.errorMessage.set('No shops available. Please create a shop first.');
        }
      },
      error: (error) => {
        console.error('❌ Failed to load shops:', error);
        this.errorMessage.set('Failed to load shop information.');
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

      console.log('🚀 Uploading', files.length, 'images temporarily...');
      this.isUploadingImages.set(true);

      // Create FormData for multipart upload
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append('files', file, file.name);
      });

      console.log('📤 Making upload request to:', `${environment.apiUrl}/uploads/temp-images`);
      console.log('📤 Files to upload:', files.length);
      files.forEach((file, i) => {
        console.log(`📤 File ${i}: ${file.name} (${file.type}, ${file.size} bytes)`);
      });

      // Use XMLHttpRequest directly to avoid Angular interceptor issues
      const xhr = new XMLHttpRequest();
      
      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              console.log('✅ Images uploaded successfully:', response);
              const imageUrls = response.urls || [];
              this.uploadedImageUrls.set(imageUrls);
              this.isUploadingImages.set(false);
              resolve(imageUrls);
            } catch (e) {
              console.error('❌ Failed to parse response:', e);
              this.isUploadingImages.set(false);
              reject(new Error('Failed to parse server response'));
            }
          } else {
            console.error('❌ Upload failed with status:', xhr.status);
            let errorMsg = `Upload failed with status ${xhr.status}`;
            
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              if (errorResponse.error) {
                errorMsg = errorResponse.error;
              } else if (errorResponse.message) {
                errorMsg = errorResponse.message;
              }
            } catch (e) {
              console.warn('Could not parse error response');
            }
            
            this.isUploadingImages.set(false);
            reject(new Error(errorMsg));
          }
        }
      };

      xhr.onerror = () => {
        console.error('❌ Network error during upload');
        this.isUploadingImages.set(false);
        reject(new Error('Network error during upload'));
      };

      xhr.open('POST', `${environment.apiUrl}/uploads/temp-images`);
      
      // Don't set Content-Type header - let browser handle multipart boundary
      // Don't add Authorization header - endpoint is public
      
      xhr.send(formData);
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
        this.errorMessage.set(
          err.error?.message || 
          'Failed to create product. Make sure you have PROVIDER role and all fields are valid.'
        );
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
