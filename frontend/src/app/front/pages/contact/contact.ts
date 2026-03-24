import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-contact',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './contact.html',
    styleUrls: []
})
export class Contact {
    private fb = inject(FormBuilder);

    contactForm: FormGroup;
    isSubmitting = signal(false);
    submitted = signal(false);
    errorMessage = signal<string | null>(null);

    constructor() {
        this.contactForm = this.fb.group({
            firstName: ['', [Validators.required, Validators.minLength(2)]],
            lastName: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            subject: ['', [Validators.required, Validators.minLength(5)]],
            message: ['', [Validators.required, Validators.minLength(20)]]
        });
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.contactForm.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }

    getFieldError(fieldName: string): string {
        const field = this.contactForm.get(fieldName);
        if (!field?.errors) return '';
        
        if (field.errors['required']) return 'This field is required';
        if (field.errors['email']) return 'Please enter a valid email';
        if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters`;
        
        return 'Invalid input';
    }

    onSubmit(): void {
        if (this.contactForm.invalid) {
            this.contactForm.markAllAsTouched();
            return;
        }

        this.isSubmitting.set(true);
        this.errorMessage.set(null);

        // Mock submission
        setTimeout(() => {
            console.log('Contact form submitted:', this.contactForm.value);
            this.isSubmitting.set(false);
            this.submitted.set(true);
            this.contactForm.reset();
        }, 1500);
    }

    resetForm(): void {
        this.submitted.set(false);
        this.contactForm.reset();
    }
}
