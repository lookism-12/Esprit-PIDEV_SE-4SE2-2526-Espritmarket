# 🧪 MARKETPLACE TESTING GUIDE

## 🎯 HOW TO TEST THE UNIFIED MARKETPLACE

### Prerequisites:
1. Backend running on `http://localhost:8090`
2. Frontend running on `http://localhost:4200`
3. User logged in with Admin or Seller role

---

## 📋 TEST SCENARIOS

### 1. PRODUCTS MODULE

#### Test as ADMIN:
1. Navigate to `/admin/marketplace/products`
2. ✅ Verify header shows "Products" (not "My Products")
3. ✅ Verify you see ALL products from all sellers
4. ✅ Click "Refresh" button - data should reload
5. ✅ Check stats: Total, Approved, Pending, Rejected
6. ✅ Click "+ Add Product"
   - Fill form (Name, Price, Shop required)
   - Click "Create"
   - ✅ Product should appear in table immediately
7. ✅ Click "Edit" on a product
   - Modify name
   - Click "Update"
   - ✅ Changes should reflect immediately
8. ✅ Click "Approve" on a PENDING product
   - ✅ Status should change to APPROVED
9. ✅ Click "Reject" on a PENDING product
   - ✅ Status should change to REJECTED
10. ✅ Click "Delete" on a product
    - Confirm deletion
    - ✅ Product should disappear immediately

#### Test as SELLER:
1. Navigate to `/admin/marketplace/products`
2. ✅ Verify header shows "My Products" (not "Products")
3. ✅ Verify you see ONLY your products
4. ✅ Verify NO approve/reject buttons visible
5. ✅ Can add/edit/delete own products

---

### 2. SERVICES MODULE

#### Test as ADMIN:
1. Navigate to `/admin/marketplace/services`
2. ✅ Verify header shows "Services"
3. ✅ Check stats: Total, Avg Price, Shops
4. ✅ Click "Refresh" - data reloads
5. ✅ Click "+ Add Service"
   - Fill form (Name, Price required)
   - Click "Create"
   - ✅ Service appears immediately
6. ✅ Edit a service
   - ✅ Changes reflect immediately
7. ✅ Delete a service
   - ✅ Disappears immediately

#### Test as SELLER:
1. Navigate to `/admin/marketplace/services`
2. ✅ Verify header shows "My Services"
3. ✅ Can manage own services

---

### 3. SHOPS MODULE

#### Test as ADMIN:
1. Navigate to `/admin/marketplace/shop`
2. ✅ Verify header shows "All Shops"
3. ✅ Check stats: Total Shops, Total Products, Active Sellers
4. ✅ Click "Refresh" - data reloads
5. ✅ Verify card layout with:
   - Shop icon 🏪
   - Shop name
   - Owner name
   - Product count
   - "View Products" button
6. ✅ Click "View Products" - navigates to products page

#### Test as SELLER:
1. Navigate to `/admin/marketplace/shop`
2. ✅ Verify header shows "My Shop"
3. ✅ Verify you see ONLY your shop
4. ✅ Verify shop details are correct

---

### 4. FAVORITES MODULE

#### Test as ADMIN:
1. Navigate to `/admin/marketplace/favorites`
2. ✅ Check stats: Total Favorites, Unique Users, Unique Products
3. ✅ Click "Refresh" - data reloads
4. ✅ Verify card layout (not table)
5. ✅ Each card shows:
   - ❤️ icon
   - User ID
   - Product ID or Service ID
   - Date added
   - "Remove Favorite" button
6. ✅ Click "Remove Favorite"
   - Confirm deletion
   - ✅ Card disappears immediately

---

### 5. CATEGORIES MODULE

#### Test as ADMIN:
1. Navigate to `/admin/marketplace/categories`
2. ✅ Check stats: Total Categories, Total Products
3. ✅ Click "Refresh" - data reloads
4. ✅ Click "+ Add Category"
   - Enter name (e.g., "Electronics")
   - Click "Create"
   - ✅ Category appears immediately
5. ✅ Edit a category
   - Change name
   - Click "Update"
   - ✅ Changes reflect immediately
6. ✅ Delete a category
   - Confirm deletion
   - ✅ Disappears immediately

---

## 🔍 VISUAL CHECKS

### All Pages Should Have:
- ✅ Consistent header style
- ✅ Stats dashboard with icons
- ✅ Refresh button
- ✅ Primary action button (Add)
- ✅ Loading spinner when loading
- ✅ Empty state with icon and message
- ✅ Smooth hover effects
- ✅ Consistent colors and spacing

### Empty States:
1. Delete all items in a module
2. ✅ Verify empty state shows:
   - Large emoji icon
   - Bold title
   - Helpful message

### Loading States:
1. Slow down network (Chrome DevTools)
2. Click "Refresh"
3. ✅ Verify spinner appears
4. ✅ Verify "Loading..." text shows

---

## 🐛 ERROR HANDLING

### Test Error Scenarios:

1. **Network Error**
   - Disconnect internet
   - Try to load data
   - ✅ Error should be logged in console
   - ✅ Loading should stop

2. **Validation Error**
   - Try to create product without required fields
   - ✅ Alert should show
   - ✅ Form should mark invalid fields

3. **Delete Error**
   - Try to delete non-existent item
   - ✅ Error alert should show

---

## 📱 RESPONSIVE TESTING

### Desktop (1920x1080):
- ✅ 3-4 columns in grids
- ✅ All content visible
- ✅ No horizontal scroll

### Tablet (768x1024):
- ✅ 2 columns in grids
- ✅ Buttons stack properly
- ✅ Tables scroll horizontally if needed

### Mobile (375x667):
- ✅ 1 column in grids
- ✅ Buttons stack vertically
- ✅ Text doesn't overflow

---

## 🔐 ROLE-BASED ACCESS

### Admin Role:
- ✅ Can access all modules
- ✅ Sees all data
- ✅ Can approve/reject products
- ✅ Full CRUD on everything

### Seller Role:
- ✅ Can access all modules
- ✅ Sees only own data
- ✅ Cannot approve/reject
- ✅ CRUD on own items only

### Client Role:
- ❌ Cannot access admin pages
- ✅ Can view public marketplace
- ✅ Can add to favorites

---

## 📊 CONSOLE LOGGING

Open browser console and verify logs:

### On Page Load:
```
🔄 [Module] component initialized
🔄 Loading [items]...
✅ [Items] loaded: X
```

### On Create:
```
🚀 Saving [item]: {...}
✅ [Item] saved: {...}
🔄 Force reloading [items]...
```

### On Delete:
```
🗑️ Deleting [item]: id
✅ [Item] deleted
🔄 Loading [items]...
```

### On Error:
```
❌ Failed to load [items]: {...}
```

---

## ✅ ACCEPTANCE CRITERIA

### UI Consistency:
- [ ] All pages have same header structure
- [ ] All pages have stats dashboard
- [ ] All pages have refresh button
- [ ] All pages have consistent spacing
- [ ] All pages use same color scheme

### Functionality:
- [ ] All CRUD operations work
- [ ] Real-time updates after actions
- [ ] Role-based filtering works
- [ ] Loading states show properly
- [ ] Empty states show properly
- [ ] Error handling works

### Performance:
- [ ] Pages load quickly
- [ ] No unnecessary re-renders
- [ ] Smooth animations
- [ ] No console errors

### Code Quality:
- [ ] No TypeScript errors
- [ ] No linting warnings
- [ ] Comprehensive logging
- [ ] Proper error handling

---

## 🎯 FINAL CHECKLIST

Before marking as complete:
- [ ] Test all modules as Admin
- [ ] Test all modules as Seller
- [ ] Test on desktop
- [ ] Test on tablet
- [ ] Test on mobile
- [ ] Test error scenarios
- [ ] Verify console logs
- [ ] Check for TypeScript errors
- [ ] Verify no broken layouts
- [ ] Confirm real-time updates work

---

## 🚀 READY FOR PRODUCTION

If all tests pass:
- ✅ Marketplace is unified
- ✅ UI is consistent
- ✅ UX is smooth
- ✅ Code is clean
- ✅ Ready to deploy!

---

**Happy Testing! 🎉**
