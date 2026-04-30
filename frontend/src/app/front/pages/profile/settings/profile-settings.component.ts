import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth.service';
import { UserService } from '../../../core/user.service';
import { UserRole } from '../../../models/user.model';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="rounded-2xl p-6" style="background-color:var(--card-bg);border:1px solid var(--border)">
      <h2 class="text-xl font-black mb-5" style="color:var(--text-color)">👤 Account Settings</h2>

      <!-- Profile Information -->
      <div class="mb-6">
        <h3 class="font-bold text-sm mb-3" style="color:var(--text-color)">Profile Information</h3>
        <form [formGroup]="profileForm" class="space-y-3">
          <div>
            <label class="block text-xs font-semibold mb-1" style="color:var(--muted)">First Name</label>
            <input type="text" formControlName="firstName" 
              class="w-full px-3 py-2 rounded-lg text-sm font-semibold"
              style="background-color:var(--subtle);color:var(--text-color);border:1px solid var(--border)">
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1" style="color:var(--muted)">Last Name</label>
            <input type="text" formControlName="lastName" 
              class="w-full px-3 py-2 rounded-lg text-sm font-semibold"
              style="background-color:var(--subtle);color:var(--text-color);border:1px solid var(--border)">
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1" style="color:var(--muted)">Email</label>
            <input type="email" formControlName="email" 
              class="w-full px-3 py-2 rounded-lg text-sm font-semibold"
              style="background-color:var(--subtle);color:var(--text-color);border:1px solid var(--border)">
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1" style="color:var(--muted)">Phone</label>
            <input type="tel" formControlName="phone" 
              class="w-full px-3 py-2 rounded-lg text-sm font-semibold"
              style="background-color:var(--subtle);color:var(--text-color);border:1px solid var(--border)">
          </div>
          <button type="button" (click)="saveProfile()" [disabled]="isSaving()"
            class="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all disabled:opacity-50">
            {{ isSaving() ? 'Saving...' : 'Save Changes' }}
          </button>
        </form>
      </div>

      @if (isDeliveryAgent()) {
        <div class="mb-6 rounded-2xl p-5 bg-amber-500/10 border border-amber-500/20">
          <div class="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-4">
            <div>
              <h3 class="font-black text-base" style="color:var(--text-color)">Courier Workflow</h3>
              <p class="text-xs mt-1" style="color:var(--muted)">Keep your delivery zone accurate so admin can assign nearby orders.</p>
            </div>
            <span class="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest w-max">
              Active delivery profile
            </span>
          </div>

          <form [formGroup]="courierForm" class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold mb-1" style="color:var(--muted)">Delivery Zone</label>
              <select formControlName="deliveryZone"
                class="w-full px-3 py-2 rounded-lg text-sm font-semibold"
                style="background-color:var(--card-bg);color:var(--text-color);border:1px solid var(--border)">
                @for (zone of deliveryZones; track zone) {
                  <option [value]="zone">{{ zone }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1" style="color:var(--muted)">Vehicle</label>
              <select formControlName="vehicleType"
                class="w-full px-3 py-2 rounded-lg text-sm font-semibold"
                style="background-color:var(--card-bg);color:var(--text-color);border:1px solid var(--border)">
                <option value="Scooter">Scooter</option>
                <option value="Motorbike">Motorbike</option>
                <option value="Car">Car</option>
                <option value="Bike">Bike</option>
              </select>
            </div>
            <div class="md:col-span-2 flex flex-col sm:flex-row gap-2 pt-2">
              <button type="button" (click)="saveCourierSettings()" [disabled]="isSavingCourier()"
                class="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all disabled:opacity-50">
                {{ isSavingCourier() ? 'Saving...' : 'Save courier settings' }}
              </button>
              <button type="button" (click)="shareCurrentLocation()" [disabled]="isSavingLocation()"
                class="px-5 py-2.5 font-bold rounded-xl transition-all"
                style="background-color:var(--subtle);color:var(--text-color)">
                {{ isSavingLocation() ? 'Updating location...' : 'Update live location' }}
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Change Password -->
      <div class="mb-6">
        <h3 class="font-bold text-sm mb-3" style="color:var(--text-color)">Change Password</h3>
        <button (click)="openPasswordChange()" 
          class="px-6 py-2 font-bold rounded-xl transition-all"
          style="background-color:var(--subtle);color:var(--text-color)">
          🔐 Change Password
        </button>
      </div>

      <!-- Avatar Upload -->
      <div class="mb-6">
        <h3 class="font-bold text-sm mb-3" style="color:var(--text-color)">Profile Picture</h3>
        <button (click)="openAvatarUpload()" 
          class="px-6 py-2 font-bold rounded-xl transition-all"
          style="background-color:var(--subtle);color:var(--text-color)">
          📷 Upload Avatar
        </button>
      </div>

      <!-- Danger Zone -->
      <div class="mt-8 pt-6" style="border-top:1px solid var(--border)">
        <h3 class="font-bold text-sm mb-3 text-red-600">Danger Zone</h3>
        <div class="space-y-3">
          <button (click)="deactivateAccount()" 
            class="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all">
            Deactivate Account
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ProfileSettingsComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private userService = inject(UserService);

  isSaving = signal(false);
  isSavingCourier = signal(false);
  isSavingLocation = signal(false);
  isDeliveryAgent = computed(() => this.authService.userRole() === UserRole.DELIVERY);
  deliveryZones = [
    'Grand Tunis', 'Tunis', 'Ariana', 'Ben Arous', 'Manouba',
    'La Marsa', 'Carthage', 'Sidi Bou Said',
    'Nabeul', 'Korba', 'Hammamet', 'Bizerte',
    'Sousse', 'Monastir', 'Mahdia', 'Sfax',
    'Kairouan', 'Sidi Bouzid', 'Kasserine', 'Gafsa',
    'Gabes', 'Medenine', 'Tataouine', 'Kebili', 'Tozeur',
    'Beja', 'Jendouba', 'Kef', 'Siliana', 'Zaghouan'
  ];

  profileForm: FormGroup = this.fb.group({
    firstName: [this.authService.userFirstName() || '', [Validators.required, Validators.minLength(2)]],
    lastName: [this.authService.userLastName() || '', [Validators.required, Validators.minLength(2)]],
    email: [this.authService.userEmail() || '', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(/^[0-9]{8,15}$/)]]
  });

  courierForm: FormGroup = this.fb.group({
    deliveryZone: [this.authService.userDeliveryZone() || 'Grand Tunis', [Validators.required]],
    vehicleType: [this.authService.currentUser()?.vehicleType || 'Scooter', [Validators.required]]
  });

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.userService.updateProfile(this.profileForm.value).subscribe({
      next: (user: any) => {
        this.authService.userFirstName.set(user.firstName);
        this.authService.userLastName.set(user.lastName);
        this.isSaving.set(false);
        alert('Profile updated successfully!');
      },
      error: (error) => {
        console.error('Failed to update profile:', error);
        this.isSaving.set(false);
        alert('Failed to update profile. Please try again.');
      }
    });
  }

  saveCourierSettings(): void {
    if (this.courierForm.invalid) {
      this.courierForm.markAllAsTouched();
      return;
    }

    this.isSavingCourier.set(true);
    this.userService.updateProfile(this.courierForm.value).subscribe({
      next: (user: any) => {
        this.authService.userDeliveryZone.set(user.deliveryZone || this.courierForm.value.deliveryZone);
        this.authService.currentUser.update(current => current ? {
          ...current,
          deliveryZone: user.deliveryZone || this.courierForm.value.deliveryZone,
          vehicleType: user.vehicleType || this.courierForm.value.vehicleType
        } : current);
        this.isSavingCourier.set(false);
        alert('Courier settings updated successfully!');
      },
      error: (error) => {
        console.error('Failed to update courier settings:', error);
        this.isSavingCourier.set(false);
        alert('Failed to update courier settings. Please try again.');
      }
    });
  }

  shareCurrentLocation(): void {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    this.isSavingLocation.set(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        this.userService.updateProfile({
          currentLatitude: position.coords.latitude,
          currentLongitude: position.coords.longitude
        }).subscribe({
          next: (user: any) => {
            this.authService.currentUser.update(current => current ? {
              ...current,
              currentLatitude: user.currentLatitude,
              currentLongitude: user.currentLongitude,
              lastLocationUpdatedAt: user.lastLocationUpdatedAt
            } : current);
            this.isSavingLocation.set(false);
            alert('Live location updated for smart assignment.');
          },
          error: error => {
            console.error('Failed to update location:', error);
            this.isSavingLocation.set(false);
            alert('Failed to update location. Please try again.');
          }
        });
      },
      () => {
        this.isSavingLocation.set(false);
        alert('Location permission denied or unavailable.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  openPasswordChange(): void {
    alert('Password change modal would open here');
  }

  openAvatarUpload(): void {
    alert('Avatar upload modal would open here');
  }

  deactivateAccount(): void {
    if (confirm('Are you sure you want to deactivate your account? This action cannot be undone.')) {
      alert('Account deactivation would be processed here');
    }
  }
}
