import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SavClaimService, SavClaim } from '../../core/sav-claim.service';
import { CartService } from '../../core/cart.service';
import { UserService } from '../../core/user.service';
import { User, UserRole } from '../../models/user.model';

@Component({
  selector: 'app-sav-claim-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sav-claim-create.component.html',
  styleUrls: ['./sav-claim-create.component.css']
})
export class SavClaimCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private savService = inject(SavClaimService);
  private cartService = inject(CartService);
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    targetType: ['PRODUCT', Validators.required],
    cartItemId: ['', Validators.required],
    deliveryAgentId: [''],
    reason: ['', Validators.required],
    problemNature: ['', Validators.required],
    desiredSolution: ['', Validators.required],
    priority: ['MEDIUM'],
    message: ['', Validators.required],
    rating: [0]
  });

  purchasedItems = signal<any[]>([]);
  deliveryAgents = signal<User[]>([]);
  selectedImages = signal<any[]>([]);
  isSubmitting = signal(false);
  isLoadingItems = signal(false);
  isDeliveryAgentMode = signal(false);

  ngOnInit(): void {
    const deliveryMode = this.route.snapshot.queryParamMap.get('target') === 'delivery';
    this.isDeliveryAgentMode.set(deliveryMode);
    if (deliveryMode) {
      this.form.patchValue({
        targetType: 'DELIVERY_AGENT',
        desiredSolution: 'investigate_agent'
      });
    }

    if (!deliveryMode) {
      this.loadPurchasedItems();
    }
    this.loadDeliveryAgents();
    this.syncTargetValidators();
    
    // Check if cartItemId is in query params
    const cartItemId = this.route.snapshot.queryParamMap.get('cartItemId');
    if (cartItemId) {
      this.form.patchValue({ cartItemId });
    }

  }

  loadPurchasedItems(): void {
    this.isLoadingItems.set(true);
    
    // Load purchased items from cart service (from database)
    this.cartService.getPurchasedItems().subscribe({
      next: (items: any[]) => {
        this.purchasedItems.set(items);
        this.isLoadingItems.set(false);
      },
      error: (err: any) => {
        console.error('Error loading purchased items:', err);
        this.purchasedItems.set([]);
        this.isLoadingItems.set(false);
      }
    });
  }

  loadDeliveryAgents(): void {
    this.userService.getAllUsers({ role: UserRole.DELIVERY, limit: 500 }).subscribe({
      next: (res: any) => {
        const users = res.content || res.users || (Array.isArray(res) ? res : []);
        this.deliveryAgents.set(users.filter((user: any) => {
          if (Array.isArray(user.roles)) return user.roles.includes(UserRole.DELIVERY);
          return user.role === UserRole.DELIVERY;
        }));
      },
      error: () => this.deliveryAgents.set([])
    });
  }

  private syncTargetValidators(): void {
    const apply = () => {
      const cartItemControl = this.form.get('cartItemId');
      const agentControl = this.form.get('deliveryAgentId');
      if (this.form.value.targetType === 'DELIVERY_AGENT') {
        agentControl?.setValidators([Validators.required]);
        cartItemControl?.clearValidators();
        cartItemControl?.setValue('');
      } else {
        cartItemControl?.setValidators([Validators.required]);
        agentControl?.clearValidators();
        agentControl?.setValue('');
      }
      cartItemControl?.updateValueAndValidity();
      agentControl?.updateValueAndValidity();
    };

    apply();
    this.form.get('targetType')?.valueChanges.subscribe(apply);
  }

  onFilesSelected(event: any): void {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files).map((file: any) => {
        const reader = new FileReader();
        reader.onload = () => {
          // Update preview
        };
        reader.readAsDataURL(file);
        return {
          file,
          name: file.name,
          preview: URL.createObjectURL(file)
        };
      });
      this.selectedImages.set([...this.selectedImages(), ...newImages]);
    }
  }

  removeImage(name: string): void {
    this.selectedImages.set(this.selectedImages().filter(img => img.name !== name));
  }

  setRating(rating: number): void {
    this.form.patchValue({ rating });
  }

  submit(): void {
    if (this.form.invalid) {
      alert('Please fill all required fields');
      return;
    }

    this.isSubmitting.set(true);
    const claim: SavClaim = {
      type: 'SAV',
      ...this.form.value as any
    };

    const files = this.selectedImages().map(img => img.file);

    this.savService.createSavClaim(claim, files).subscribe({
      next: () => {
        alert(this.form.value.targetType === 'DELIVERY_AGENT'
          ? 'Your delivery agent claim has been submitted successfully'
          : 'Your return request has been submitted successfully');
        this.router.navigate(this.form.value.targetType === 'DELIVERY_AGENT' ? ['/sav'] : ['/sav/claims']);
      },
      error: (err) => {
        console.error('Error creating claim:', err);
        alert('Failed to submit return request');
        this.isSubmitting.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(this.form.value.targetType === 'DELIVERY_AGENT' ? ['/sav'] : ['/sav/claims']);
  }
}
