# 🚀 SAV System - Quick Start Testing Guide

## Prerequisites

- Backend running on `http://localhost:8090`
- Frontend running on `http://localhost:4200`
- Valid JWT tokens for client and admin users

## 🎯 Quick Test Flow

### Step 1: Start the Application

```bash
# Terminal 1 - Backend
cd backend
mvn spring-boot:run

# Terminal 2 - Frontend
cd frontend
ng serve
```

### Step 2: Login as Client

1. Navigate to `http://localhost:4200/login`
2. Login with client credentials:
   - Email: `client@example.com`
   - Password: `password123`
3. Copy the JWT token from browser console or network tab

### Step 3: Test Client Features

#### 3.1 Navigate to SAV Page
```
URL: http://localhost:4200/sav
```
You should see two tabs:
- 🚚 Deliveries
- 💬 Claims & Reviews

#### 3.2 Create a Return Request
1. Click on "💬 Claims & Reviews" tab
2. Click "+ Create Return Request" button
3. Fill the form:
   - **Product**: Select from dropdown (or use mock data)
   - **Reason**: Select "defective", "damaged", "not_as_described", etc.
   - **Problem Nature**: Describe the issue
   - **Desired Solution**: Select "refund", "exchange", "repair", etc.
   - **Priority**: Select "LOW", "MEDIUM", "HIGH"
   - **Rating**: Rate 1-5 stars
   - **Message**: Detailed description
   - **Images**: Upload at least one image
4. Click "Submit"
5. Should see success message and redirect to claims list

#### 3.3 View Claims List
```
URL: http://localhost:4200/sav/claims
```
Should display:
- All your return requests
- Status badges (PENDING, INVESTIGATING, RESOLVED, etc.)
- Creation date
- Desired solution
- Priority level
- Action buttons (View Details, Edit, Delete)

#### 3.4 View Claim Details
1. Click "View Details" on any claim
2. Should see:
   - Full claim information
   - Status timeline with progress
   - Uploaded images
   - Admin response (if available)
   - AI verification results (if available)

#### 3.5 Edit Claim (if PENDING)
1. Go to claims list
2. Click "Edit" button (only visible if status=PENDING)
3. Modify the form
4. Click "Submit"
5. Should see success message

#### 3.6 Delete Claim (if PENDING)
1. Go to claims list
2. Click "Delete" button (only visible if status=PENDING)
3. Confirm deletion
4. Claim should be removed from list

### Step 4: Test Admin Features

#### 4.1 Login as Admin
1. Logout from client account
2. Navigate to `http://localhost:4200/login`
3. Login with admin credentials:
   - Email: `admin@example.com`
   - Password: `admin123`

#### 4.2 Navigate to Admin SAV Dashboard
```
URL: http://localhost:4200/admin/sav
```

You should see:
- **KPI Cards**: Total, Pending, Investigating, Resolved claims
- **Filters**: By status and priority
- **Claims Table**: All claims with details
- **Action Buttons**: View, Edit, Delete

#### 4.3 View Admin Dashboard
1. Check KPI cards for statistics
2. Verify total count matches claims in table
3. Check filter dropdowns work

#### 4.4 Filter Claims
1. Select a status filter (e.g., "PENDING")
2. Table should update to show only claims with that status
3. Try different status combinations

#### 4.5 View Claim Details (Admin)
1. Click "View" button on any claim
2. Modal should open showing:
   - Claim information
   - Images
   - Status dropdown
   - Admin response textarea
   - AI verification section
   - Delete button

#### 4.6 Update Claim Status
1. Open a claim modal
2. Change status from dropdown
3. Click "Save Changes"
4. Status should update in table

#### 4.7 Send Admin Response
1. Open a claim modal
2. Type response in "Admin Response" textarea
3. Click "Save Changes"
4. Response should be saved and visible

#### 4.8 Delete Claim (Admin)
1. Open a claim modal
2. Click "Delete" button
3. Confirm deletion
4. Claim should be removed from table

## 🧪 API Testing with cURL

### Get Client Token
```bash
curl -X POST http://localhost:8090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "password": "password123"
  }'
```

### Create Return Request
```bash
curl -X POST http://localhost:8090/api/sav/claims \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "SAV",
    "message": "Product arrived broken",
    "reason": "defective",
    "problemNature": "Screen shattered",
    "desiredSolution": "refund",
    "priority": "HIGH",
    "rating": 1,
    "cartItemId": "507f1f77bcf86cd799439011"
  }'
```

### List My Claims
```bash
curl -X GET http://localhost:8090/api/sav/claims/my \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Claim Details
```bash
curl -X GET http://localhost:8090/api/sav/claims/my/CLAIM_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Admin Token
```bash
curl -X POST http://localhost:8090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

### List All Claims (Admin)
```bash
curl -X GET http://localhost:8090/api/admin/sav/claims \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Update Claim Status (Admin)
```bash
curl -X PUT "http://localhost:8090/api/admin/sav/claims/CLAIM_ID/status?status=INVESTIGATING" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Send Admin Response
```bash
curl -X PUT "http://localhost:8090/api/admin/sav/claims/CLAIM_ID/response?response=We%20are%20investigating%20your%20claim" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## ✅ Verification Checklist

### Client Features
- [ ] Can navigate to `/sav` page
- [ ] Can see "My Claims" in navbar
- [ ] Can create new return request
- [ ] Can upload images
- [ ] Can view claims list
- [ ] Can view claim details
- [ ] Can edit claim (if PENDING)
- [ ] Can delete claim (if PENDING)
- [ ] Edit/Delete buttons hidden if status != PENDING

### Admin Features
- [ ] Can navigate to `/admin/sav` page
- [ ] Can see "After Sales Service" in sidebar
- [ ] Can see KPI cards with statistics
- [ ] Can filter claims by status
- [ ] Can filter claims by priority
- [ ] Can view claim details in modal
- [ ] Can update claim status
- [ ] Can send admin response
- [ ] Can see AI verification results
- [ ] Can delete claims

### UI/UX
- [ ] Professional red/bordeaux color scheme
- [ ] Responsive design on mobile/tablet/desktop
- [ ] Loading spinners appear during data fetch
- [ ] Empty states display correctly
- [ ] Error messages show on failures
- [ ] Success messages show on actions
- [ ] Status badges display correct colors
- [ ] Timeline shows correct progress

### Security
- [ ] Client can only see their own claims
- [ ] Client cannot modify claims with status != PENDING
- [ ] Admin can see all claims
- [ ] Unauthenticated users cannot access SAV pages
- [ ] Non-admin users cannot access admin SAV page

## 🐛 Troubleshooting

### Issue: "Cannot find module" errors
**Solution**: Run `npm install` in frontend directory

### Issue: Backend returns 401 Unauthorized
**Solution**: Ensure JWT token is valid and included in Authorization header

### Issue: Images not uploading
**Solution**: Check that FormData is being sent correctly (not JSON)

### Issue: Claims list is empty
**Solution**: Create a new claim first, or check that cartItemId is valid

### Issue: Admin dashboard shows no data
**Solution**: Ensure you're logged in as admin and have valid token

### Issue: Edit/Delete buttons not showing
**Solution**: Check that claim status is "PENDING" (buttons only show for PENDING claims)

## 📞 Support

For detailed API documentation, see: `SAV_TEST_EXAMPLES.md`
For implementation details, see: `SAV_COMPLETE_IMPLEMENTATION.md`
For integration steps, see: `SAV_INTEGRATION_STEPS.md`

---

**Ready to test!** 🎉
