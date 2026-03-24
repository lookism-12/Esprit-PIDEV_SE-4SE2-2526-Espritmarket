import { Component, signal, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/user.service';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../../environment';

@Component({
  selector: 'app-avatar-upload-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <!-- Header -->
        <div class="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 class="text-2xl font-bold text-dark">Change Avatar</h2>
          <button (click)="onClose()" class="text-gray-400 hover:text-dark text-2xl">&times;</button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-4">
          <!-- Preview -->
          @if (preview(); as url) {
            <div class="flex justify-center">
              <img [src]="url" alt="Preview" class="w-48 h-48 rounded-full object-cover border-4 border-primary">
            </div>
          } @else {
            <div class="flex justify-center">
              <div class="w-48 h-48 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-200">
                <span class="text-gray-400 text-4xl">📷</span>
              </div>
            </div>
          }

          <!-- Upload Area -->
          <div 
            (click)="fileInput.click()"
            class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition"
            [class.border-primary]="isDragging()">
            <input 
              #fileInput 
              type="file" 
              accept="image/*" 
              (change)="onFileSelected($event)"
              hidden>
            <svg class="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <p class="text-sm font-bold text-dark">Click or drag image here</p>
            <p class="text-xs text-gray-500 mt-1">JPG, PNG up to 5MB</p>
          </div>

          <!-- File Info -->
          @if (selectedFile()) {
            <div class="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
              <p class="text-sm text-blue-800">
                <strong>Selected:</strong> {{ selectedFile()?.name }}<br>
                <strong>Size:</strong> {{ (selectedFile()?.size! / 1024 / 1024).toFixed(2) }} MB
              </p>
            </div>
          }

          <!-- Buttons -->
          <div class="flex gap-3 pt-4 border-t border-gray-200">
            <button 
              type="button" 
              (click)="onClose()"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-bold text-dark hover:bg-gray-50">
              Cancel
            </button>
            <button 
              type="button"
              (click)="uploadAvatar()"
              [disabled]="!selectedFile() || isUploading()"
              class="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50">
              {{ isUploading() ? 'Uploading...' : 'Upload' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AvatarUploadModal {
  private userService = inject(UserService);
  private authService = inject(AuthService);

  @Input() onClose: () => void = () => {};
  @Input() onUploadComplete: (url: string) => void = () => {};

  selectedFile = signal<File | null>(null);
  preview = signal<string | null>(null);
  isDragging = signal(false);
  isUploading = signal(false);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    
    if (!files || files.length === 0) {
      console.log('❌ No files selected');
      return;
    }

    const file = files[0];
    console.log('✓ File selected:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      console.error('❌ File too large:', file.size);
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('❌ Invalid file type:', file.type);
      alert('Please select an image file');
      return;
    }

    console.log('✓ File validation passed');
    this.selectedFile.set(file);

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.preview.set(e.target?.result as string);
      console.log('✓ Preview generated');
    };
    reader.readAsDataURL(file);
  }

  uploadAvatar(): void {
    const file = this.selectedFile();
    if (!file) {
      console.error('❌ No file selected');
      alert('Please select an image file first');
      return;
    }

    console.log('🚀 Starting avatar upload');
    console.log('  File:', file.name);
    console.log('  Size:', (file.size / 1024 / 1024).toFixed(2) + ' MB');
    console.log('  Type:', file.type);

    this.isUploading.set(true);

    this.userService.uploadAvatar(file).subscribe({
      next: (response) => {
        console.log('📡 Server response received:', response);
        
        if (!response || !response.url) {
          console.error('❌ Invalid response from server:', response);
          alert('Upload succeeded but server response was invalid. Please try again.');
          this.isUploading.set(false);
          return;
        }

        // Convert relative URL to absolute URL with backend host
        let avatarUrl = response.url;
        if (!avatarUrl.startsWith('http')) {
          const backendHost = environment.apiUrl.replace('/api', '');
          avatarUrl = backendHost + avatarUrl;
          console.log('✓ Converting relative URL to absolute using environment config');
        }

        console.log('✅ Avatar uploaded successfully');
        console.log('  Server returned URL:', response.url);
        console.log('  Full URL for display:', avatarUrl);

        this.isUploading.set(false);
        this.selectedFile.set(null);
        this.preview.set(null);
        
        // CRITICAL FIX: Update auth service avatar AND reload user profile
        this.onUploadComplete(avatarUrl);
        
        // Reload user profile to ensure avatar is persisted in signals
        // This fixes the issue where avatar disappears after logout/login
        setTimeout(() => {
          console.log('🔄 Reloading user profile to persist avatar in auth service...');
          this.authService.loadCurrentUser().subscribe({
            next: () => {
              console.log('✅ User profile reloaded with persisted avatar');
              this.onClose();
            },
            error: (err) => {
              console.error('⚠️ Failed to reload user profile, but avatar is saved:', err);
              // Still close modal even if reload fails - avatar is saved in DB
              this.onClose();
            }
          });
        }, 500);
      },
      error: (error) => {
        console.error('❌ Avatar upload failed:', error);
        console.error('  Status:', error.status);
        console.error('  Error body:', error.error);
        console.error('  URL attempted:', error.url);
        console.error('  Headers:', error.headers);
        
        let errorMessage = 'Failed to upload avatar. Please try again.';
        
        if (error.status === 400) {
          errorMessage = 'Invalid file format. Please use JPG or PNG.';
        } else if (error.status === 413) {
          errorMessage = 'File is too large. Maximum size is 5MB.';
        } else if (error.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (error.status === 500) {
          errorMessage = 'Server error: ' + (error.error?.error || 'Unknown error');
        } else if (error.error?.error) {
          errorMessage = error.error.error;
        }
        
        alert(errorMessage);
        this.isUploading.set(false);
      }
    });
  }
}
