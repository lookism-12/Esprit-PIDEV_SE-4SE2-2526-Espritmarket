import { Component, signal, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../core/product.service';
import { environment } from '../../../../environment';

interface UploadedImage {
  url: string;
  altText: string;
  file?: File;
  preview?: string;
}

@Component({
  selector: 'app-product-image-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-xl font-bold text-gray-900">Product Images</h3>
          <p class="text-sm text-gray-600 mt-1">Upload images to showcase your product</p>
        </div>
        <div class="text-sm text-gray-500">
          {{ selectedFiles().length }}/{{ maxImages }} images
        </div>
      </div>

      <!-- Upload Area -->
      <div 
        class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors mb-6"
        [class.border-blue-500]="isDragging()"
        [class.bg-blue-50]="isDragging()"
        (click)="fileInput.click()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)">
        
        <input 
          #fileInput 
          type="file" 
          accept="image/jpeg,image/jpg,image/png,image/gif" 
          multiple
          (change)="onFilesSelected($event)"
          hidden>
          
        <div class="flex flex-col items-center">
          <svg class="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <p class="text-lg font-semibold text-gray-700 mb-2">Upload Product Images</p>
          <p class="text-sm text-gray-500">Click to browse or drag & drop images here</p>
          <p class="text-xs text-gray-400 mt-2">JPG, PNG, GIF up to 5MB each (max {{ maxImages }} images)</p>
        </div>
      </div>

      <!-- Selected Images Preview -->
      @if (selectedFiles().length > 0) {
        <div class="mb-6">
          <h4 class="text-sm font-semibold text-gray-700 mb-3">Selected Images ({{ selectedFiles().length }})</h4>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            @for (file of selectedFiles(); track $index) {
              <div class="relative group">
                <div class="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                  <img 
                    [src]="file.preview" 
                    [alt]="file.altText"
                    class="w-full h-full object-cover">
                </div>
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <button 
                    (click)="removeFile($index)"
                    class="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-2 truncate">
                  {{ file.altText }}
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Uploaded Images Display -->
      @if (uploadedImages().length > 0) {
        <div class="mb-6">
          <h4 class="text-sm font-semibold text-gray-700 mb-3">Uploaded Images ({{ uploadedImages().length }})</h4>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            @for (image of uploadedImages(); track image.url) {
              <div class="relative group">
                <div class="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-green-200">
                  <img 
                    [src]="getFullImageUrl(image.url)" 
                    [alt]="image.altText"
                    class="w-full h-full object-cover">
                </div>
                <div class="absolute top-2 right-2">
                  <span class="bg-green-500 text-white text-xs px-2 py-1 rounded-full">✓ Uploaded</span>
                </div>
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <button 
                    (click)="deleteUploadedImage(image.url)"
                    [disabled]="isDeleting()"
                    class="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all disabled:opacity-50">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-2 truncate">
                  {{ image.altText }}
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Error Messages -->
      @if (errorMessage()) {
        <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <svg class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p class="text-sm font-medium text-red-800">Upload Error</p>
            <p class="text-sm text-red-700 mt-1">{{ errorMessage() }}</p>
          </div>
        </div>
      }

      <!-- Success Messages -->
      @if (successMessage()) {
        <div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p class="text-sm font-medium text-green-800">Success!</p>
            <p class="text-sm text-green-700 mt-1">{{ successMessage() }}</p>
          </div>
        </div>
      }

      <!-- Action Buttons -->
      <div class="flex gap-3 pt-4 border-t border-gray-200">
        <button 
          (click)="uploadImages()"
          [disabled]="selectedFiles().length === 0 || isUploading()"
          class="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
          @if (isUploading()) {
            <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Uploading...</span>
          } @else {
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Upload {{ selectedFiles().length }} Image{{ selectedFiles().length !== 1 ? 's' : '' }}</span>
          }
        </button>
        
        @if (selectedFiles().length > 0) {
          <button 
            (click)="clearSelectedFiles()"
            class="px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors">
            Clear
          </button>
        }
      </div>

      <!-- Tips -->
      <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h5 class="text-sm font-semibold text-blue-900 mb-2">💡 Tips for Better Images</h5>
        <ul class="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Use high-quality images (recommended: 1200x1200px or larger)</li>
          <li>Show your product from different angles</li>
          <li>Ensure good lighting and clear backgrounds</li>
          <li>First image will be used as the main product image</li>
        </ul>
      </div>
    </div>
  `,
  styles: []
})
export class ProductImageUpload {
  private productService = inject(ProductService);

  @Input() productId!: string;
  @Input() maxImages: number = 8;

  selectedFiles = signal<UploadedImage[]>([]);
  uploadedImages = signal<UploadedImage[]>([]);
  isDragging = signal(false);
  isUploading = signal(false);
  isDeleting = signal(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    
    if (event.dataTransfer?.files) {
      this.addFiles(Array.from(event.dataTransfer.files));
    }
  }

  private addFiles(files: File[]): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    const currentFiles = this.selectedFiles();
    const totalFiles = currentFiles.length + files.length;

    if (totalFiles > this.maxImages) {
      this.errorMessage.set(`Maximum ${this.maxImages} images allowed. You're trying to add ${files.length} more.`);
      return;
    }

    const validFiles: UploadedImage[] = [];

    files.forEach(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.errorMessage.set(`File "${file.name}" is not an image.`);
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage.set(`File "${file.name}" is too large. Maximum size is 5MB.`);
        return;
      }

      // Check for duplicates
      if (currentFiles.some(f => f.altText === file.name)) {
        this.errorMessage.set(`File "${file.name}" is already selected.`);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const uploadedImage: UploadedImage = {
          url: '',
          altText: file.name,
          file: file,
          preview: e.target?.result as string
        };

        validFiles.push(uploadedImage);
        
        if (validFiles.length === files.filter(f => f.type.startsWith('image/')).length) {
          this.selectedFiles.update(current => [...current, ...validFiles]);
          console.log('✅ Files added:', validFiles.length);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  removeFile(index: number): void {
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
    console.log('🗑️ File removed at index:', index);
  }

  clearSelectedFiles(): void {
    this.selectedFiles.set([]);
    this.errorMessage.set('');
    this.successMessage.set('');
    console.log('🧹 All selected files cleared');
  }

  uploadImages(): void {
    const files = this.selectedFiles().map(f => f.file!).filter(Boolean);
    
    if (files.length === 0) {
      this.errorMessage.set('No files selected for upload.');
      return;
    }

    if (!this.productId) {
      this.errorMessage.set('Product ID is required for upload.');
      return;
    }

    console.log('🚀 Starting upload of', files.length, 'files for product:', this.productId);
    
    this.isUploading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.productService.uploadProductImages(this.productId, files).subscribe({
      next: (response) => {
        console.log('✅ Upload successful:', response);
        
        if (response.images) {
          this.uploadedImages.update(current => [...current, ...response.images]);
          this.successMessage.set(`Successfully uploaded ${response.images.length} images!`);
        }
        
        // Clear selected files after successful upload
        this.selectedFiles.set([]);
        this.isUploading.set(false);
      },
      error: (error) => {
        console.error('❌ Upload failed:', error);
        
        let errorMsg = 'Failed to upload images. ';
        if (error.status === 400) {
          errorMsg += error.error?.error || 'Invalid file format or size.';
        } else if (error.status === 401 || error.status === 403) {
          errorMsg += 'Authentication required. Please log in as a PROVIDER.';
        } else if (error.status === 404) {
          errorMsg += 'Product not found.';
        } else if (error.status === 413) {
          errorMsg += 'Files are too large. Maximum size is 5MB each.';
        } else {
          errorMsg += error.error?.error || 'Please try again later.';
        }
        
        this.errorMessage.set(errorMsg);
        this.isUploading.set(false);
      }
    });
  }

  deleteUploadedImage(imageUrl: string): void {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    console.log('🗑️ Deleting uploaded image:', imageUrl);
    this.isDeleting.set(true);
    this.errorMessage.set('');

    this.productService.deleteProductImage(this.productId, imageUrl).subscribe({
      next: () => {
        this.uploadedImages.update(images => images.filter(img => img.url !== imageUrl));
        this.successMessage.set('Image deleted successfully!');
        this.isDeleting.set(false);
        console.log('✅ Image deleted:', imageUrl);
      },
      error: (error) => {
        console.error('❌ Delete failed:', error);
        this.errorMessage.set('Failed to delete image. Please try again.');
        this.isDeleting.set(false);
      }
    });
  }

  getFullImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    
    const baseUrl = environment.apiUrl.replace('/api', '');
    return baseUrl + url;
  }
}