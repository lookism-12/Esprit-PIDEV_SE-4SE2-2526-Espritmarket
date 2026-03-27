import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ShopService } from '../../core/shop.service';
import { Shop } from '../../models/product';

@Component({
  selector: 'app-shop-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './shop-settings.html',
  styleUrl: './shop-settings.scss'
})
export class ShopSettings implements OnInit {
  private fb = inject(FormBuilder);
  private shopService = inject(ShopService);
  private router = inject(Router);

  // State
  shopForm!: FormGroup;
  isLoading = signal(false);
  isSaving = signal(false);
  shop = signal<Shop | null>(null);

  ngOnInit(): void {
    this.initForm();
    this.loadShop();
  }

  private initForm(): void {
    this.shopForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      logo: [''],
      banner: ['']
    });
  }

  loadShop(): void {
    this.isLoading.set(true);
    this.shopService.getMyShop().subscribe({
      next: (shop) => {
        this.shop.set(shop);
        this.shopForm.patchValue({
          name: shop.name,
          description: shop.description,
          logo: shop.logo,
          banner: shop.banner
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading shop:', err);
        this.isLoading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.shopForm.invalid) {
      this.shopForm.markAllAsTouched();
      return;
    }

    const currentShop = this.shop();
    if (!currentShop) return;

    this.isSaving.set(true);
    this.shopService.updateShop(currentShop.id, this.shopForm.value).subscribe({
      next: () => {
        this.isSaving.set(false);
        // show success message or navigate
      },
      error: (err) => {
        console.error('Error updating shop:', err);
        this.isSaving.set(false);
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.shopForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
