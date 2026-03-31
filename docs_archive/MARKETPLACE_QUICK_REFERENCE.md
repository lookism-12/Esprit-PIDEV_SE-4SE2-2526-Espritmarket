# 🚀 MARKETPLACE QUICK REFERENCE

## 📋 COMPONENT TEMPLATE

Copy this template when creating new marketplace modules:

```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MarketplaceAdminService } from '../../core/services/marketplace-admin.service';
import { AdminAuthService } from '../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-[module]',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl shadow-soft border border-gray-100">
        <div>
          <h1 class="text-3xl font-black text-dark tracking-tight">{{ isAdmin() ? 'All Items' : 'My Items' }}</h1>
          <p class="text-secondary font-medium mt-1">Description here</p>
        </div>
        <div class="flex gap-3">
          <button (click)="loadData()" class="px-6 py-3 bg-gray-50 hover:bg-gray-100 text-dark font-black rounded-xl transition-all uppercase tracking-widest text-[10px] border border-gray-100">
            🔄 Refresh
          </button>
          <button (click)="openModal()" class="px-6 py-3 bg-primary text-white font-black rounded-xl transition-all uppercase tracking-widest text-[10px] hover:bg-primary/90">
            + Add Item
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-xl">📦</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Total</p>
            <p class="text-2xl font-black text-dark">{{ items().length }}</p>
          </div>
        </div>
      </div>

      <!-- Content (Table or Cards) -->
      <!-- Add your content here -->

    </div>
  `,
  styles: [`.shadow-soft { box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); }`]
})
export class YourComponent implements OnInit {
  private svc = inject(MarketplaceAdminService);
  private authService = inject(AdminAuthService);
  
  items = signal<any[]>([]);
  isLoading = signal(false);
  isAdmin = signal(false);
  isSeller = signal(false);

  ngOnInit(): void {
    this.isAdmin.set(this.authService.isAdmin());
    this.isSeller.set(this.authService.isSeller());
    console.log('👤 User role - Admin:', this.isAdmin(), 'Seller:', this.isSeller());
    this.loadData();
  }

  loadData(): void {
    console.log('🔄 Loading items...');
    this.isLoading.set(true);
    this.svc.getItems().subscribe({
      next: (data) => {
        console.log('✅ Items loaded:', data.length);
        this.items.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Failed to load items:', err);
        this.isLoading.set(false);
      }
    });
  }
}
```

---

## 🎨 COMMON UI PATTERNS

### Header with Actions:
```html
<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl shadow-soft border border-gray-100">
  <div>
    <h1 class="text-3xl font-black text-dark tracking-tight">Title</h1>
    <p class="text-secondary font-medium mt-1">Subtitle</p>
  </div>
  <div class="flex gap-3">
    <button (click)="refresh()" class="px-6 py-3 bg-gray-50 hover:bg-gray-100 text-dark font-black rounded-xl transition-all uppercase tracking-widest text-[10px] border border-gray-100">
      🔄 Refresh
    </button>
    <button (click)="add()" class="px-6 py-3 bg-primary text-white font-black rounded-xl transition-all uppercase tracking-widest text-[10px] hover:bg-primary/90">
      + Add
    </button>
  </div>
</div>
```

### Stats Card:
```html
<div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
  <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-xl">📦</div>
  <div>
    <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Label</p>
    <p class="text-2xl font-black text-dark">{{ value }}</p>
  </div>
</div>
```

### Loading State:
```html
@if (isLoading()) {
  <div class="flex flex-col items-center gap-3 py-20">
    <div class="w-10 h-10 border-4 border-gray-100 border-t-primary rounded-full animate-spin"></div>
    <p class="text-xs font-black text-secondary uppercase tracking-widest">Loading...</p>
  </div>
}
```

### Empty State:
```html
@if (items().length === 0) {
  <div class="bg-white rounded-3xl border border-gray-100 shadow-soft p-16 text-center">
    <span class="text-6xl block mb-4">📦</span>
    <p class="text-lg font-black text-dark mb-2">No items found</p>
    <p class="text-secondary font-medium">Start by adding your first item</p>
  </div>
}
```

### Table Row:
```html
<tr class="hover:bg-gray-50/50 transition-colors group">
  <td class="px-6 py-4">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-lg">📦</div>
      <div>
        <p class="font-black text-dark text-sm">{{ item.name }}</p>
        <p class="text-[10px] text-secondary">{{ item.description }}</p>
      </div>
    </div>
  </td>
  <td class="px-6 py-4 text-right">
    <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button (click)="edit(item)" class="p-2 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors text-sm">✏️</button>
      <button (click)="delete(item.id)" class="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors text-sm">🗑️</button>
    </div>
  </td>
</tr>
```

### Card:
```html
<div class="bg-white rounded-3xl border border-gray-100 shadow-soft hover:shadow-lg hover:border-primary/30 transition-all duration-300 overflow-hidden group">
  <!-- Header -->
  <div class="bg-gradient-to-br from-primary/5 to-primary/10 p-6 border-b border-gray-100">
    <div class="flex items-start justify-between mb-3">
      <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform">
        📦
      </div>
    </div>
    <h3 class="font-black text-dark text-lg mb-1">{{ item.name }}</h3>
    <p class="text-xs text-secondary font-medium">{{ item.description }}</p>
  </div>
  
  <!-- Content -->
  <div class="p-6 space-y-4">
    <!-- Add content here -->
  </div>
  
  <!-- Actions -->
  <div class="p-6 pt-0">
    <button class="w-full py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all hover:bg-primary/90">
      Action
    </button>
  </div>
</div>
```

### Modal:
```html
@if (showModal()) {
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="closeModal()">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 space-y-6" (click)="$event.stopPropagation()">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-black text-dark">{{ editingId() ? 'Edit' : 'Add' }} Item</h2>
        <button (click)="closeModal()" class="text-secondary hover:text-dark transition-colors text-xl">✕</button>
      </div>
      
      <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
        <!-- Form fields -->
        
        <div class="flex gap-3 pt-2">
          <button type="submit" [disabled]="form.invalid || isSaving()"
            class="flex-1 py-3 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 text-sm uppercase tracking-widest">
            {{ isSaving() ? 'Saving...' : (editingId() ? 'Update' : 'Create') }}
          </button>
          <button type="button" (click)="closeModal()"
            class="px-6 py-3 bg-gray-100 text-dark font-black rounded-xl hover:bg-gray-200 transition-all text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
}
```

---

## 🔧 COMMON METHODS

### Load Data:
```typescript
loadData(): void {
  console.log('🔄 Loading items...');
  this.isLoading.set(true);
  
  this.svc.getItems().subscribe({
    next: (data) => {
      console.log('✅ Items loaded:', data.length);
      this.items.set(data);
      this.isLoading.set(false);
    },
    error: (err) => {
      console.error('❌ Failed to load items:', err);
      this.isLoading.set(false);
    }
  });
}
```

### Save (Create/Update):
```typescript
save(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    alert('Please fill all required fields');
    return;
  }
  
  this.isSaving.set(true);
  const payload = this.form.value;
  const id = this.editingId();
  
  console.log('🚀 Saving item:', payload);
  const req = id ? this.svc.update(id, payload) : this.svc.create(payload);
  
  req.subscribe({
    next: (result) => {
      console.log('✅ Item saved:', result);
      this.closeModal();
      this.loadData();
      this.isSaving.set(false);
    },
    error: (e) => {
      console.error('❌ Save failed:', e);
      alert(e.error?.message || 'Operation failed');
      this.isSaving.set(false);
    }
  });
}
```

### Delete:
```typescript
delete(id: string): void {
  if (!confirm('Delete this item?')) return;
  
  console.log('🗑️ Deleting item:', id);
  this.svc.delete(id).subscribe({
    next: () => {
      console.log('✅ Item deleted');
      this.loadData();
    },
    error: (e) => {
      console.error('❌ Delete failed:', e);
      alert(e.error?.message || 'Delete failed');
    }
  });
}
```

---

## 🎨 TAILWIND CLASSES CHEATSHEET

### Layout:
```
p-4, p-6, p-8           → Padding
gap-3, gap-4, gap-6     → Gap between items
space-y-4, space-y-6    → Vertical spacing
flex, grid              → Display
items-center            → Align items center
justify-between         → Space between
```

### Sizing:
```
w-full, w-12, w-16      → Width
h-full, h-12, h-16      → Height
max-w-7xl               → Max width
```

### Colors:
```
bg-white                → White background
bg-primary              → Primary color
bg-gray-50              → Light gray
text-dark               → Dark text
text-secondary          → Secondary text
border-gray-100         → Light border
```

### Typography:
```
text-xs, text-sm, text-lg, text-xl, text-2xl, text-3xl
font-medium, font-bold, font-black
uppercase, tracking-widest
```

### Borders & Radius:
```
border, border-2        → Border width
rounded-xl, rounded-2xl, rounded-3xl
```

### Effects:
```
shadow-soft             → Custom shadow
hover:bg-gray-100       → Hover background
transition-all          → Smooth transitions
opacity-0, opacity-100  → Opacity
```

---

## 📊 LOGGING CONVENTIONS

```typescript
// Loading
console.log('🔄 Loading [module]...');

// Success
console.log('✅ [Module] loaded:', data.length);
console.log('✅ [Item] saved:', result);
console.log('✅ [Item] deleted');

// Error
console.error('❌ Failed to load [module]:', err);
console.error('❌ Save failed:', e);
console.error('❌ Delete failed:', e);

// Actions
console.log('🚀 Saving [item]:', payload);
console.log('🗑️ Deleting [item]:', id);
console.log('👤 User role - Admin:', isAdmin, 'Seller:', isSeller);
```

---

## 🔐 ROLE-BASED LOGIC

```typescript
// Detect role
this.isAdmin.set(this.authService.isAdmin());
this.isSeller.set(this.authService.isSeller());

// Load data based on role
const request = this.isAdmin() 
  ? this.svc.getAll()      // Admin: all items
  : this.svc.getMine();    // Seller: own items

// Dynamic header
{{ isAdmin() ? 'All Items' : 'My Items' }}

// Conditional actions
@if (isAdmin()) {
  <button>Admin Action</button>
}
```

---

## ✅ CHECKLIST FOR NEW COMPONENTS

- [ ] Import CommonModule, ReactiveFormsModule
- [ ] Inject services (MarketplaceAdminService, AdminAuthService)
- [ ] Add signals (items, isLoading, isAdmin, isSeller)
- [ ] Implement ngOnInit with role detection
- [ ] Add loadData() method with logging
- [ ] Add header with title and actions
- [ ] Add stats dashboard
- [ ] Add loading state
- [ ] Add empty state
- [ ] Add content (table or cards)
- [ ] Add modal for create/edit
- [ ] Implement save() method
- [ ] Implement delete() method
- [ ] Add comprehensive logging
- [ ] Test role-based access
- [ ] Verify responsive layout

---

## 🚀 QUICK COMMANDS

### Check for errors:
```bash
npm run build
```

### Run diagnostics:
```typescript
getDiagnostics(['path/to/component.ts'])
```

### Test in browser:
1. Open DevTools (F12)
2. Check Console for logs
3. Test CRUD operations
4. Verify role-based access

---

**Keep this reference handy when building new marketplace modules! 📚**
