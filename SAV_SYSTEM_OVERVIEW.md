# 🎯 SAV System - Complete Overview

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ESPRIT MARKET PLATFORM                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐         ┌──────────────────────┐    │
│  │   CLIENT INTERFACE   │         │   ADMIN INTERFACE    │    │
│  ├──────────────────────┤         ├──────────────────────┤    │
│  │ • My Claims List     │         │ • Dashboard (KPIs)   │    │
│  │ • Create Claim       │         │ • All Claims Table   │    │
│  │ • View Details       │         │ • Filters            │    │
│  │ • Edit Claim         │         │ • Manage Claims      │    │
│  │ • Delete Claim       │         │ • Send Responses     │    │
│  │ • Track Status       │         │ • AI Verification    │    │
│  └──────────────────────┘         └──────────────────────┘    │
│           │                                 │                  │
│           └─────────────┬───────────────────┘                  │
│                         │                                      │
│                    ┌────▼─────┐                               │
│                    │  ROUTING  │                               │
│                    ├───────────┤                               │
│                    │ /sav      │                               │
│                    │ /sav/*    │                               │
│                    │ /admin/sav│                               │
│                    └────┬─────┘                                │
│                         │                                      │
│                    ┌────▼──────────────────┐                  │
│                    │   ANGULAR SERVICES    │                  │
│                    ├───────────────────────┤                  │
│                    │ • SavClaimService     │                  │
│                    │ • SavAdminService     │                  │
│                    │ • AuthService         │                  │
│                    │ • HttpClient          │                  │
│                    └────┬──────────────────┘                  │
│                         │                                      │
│                    ┌────▼──────────────────┐                  │
│                    │   REST API LAYER      │                  │
│                    ├───────────────────────┤                  │
│                    │ /api/sav/claims       │                  │
│                    │ /api/admin/sav/claims │                  │
│                    └────┬──────────────────┘                  │
│                         │                                      │
│                    ┌────▼──────────────────┐                  │
│                    │  SPRING BOOT BACKEND  │                  │
│                    ├───────────────────────┤                  │
│                    │ • Controllers         │                  │
│                    │ • Services            │                  │
│                    │ • Repositories        │                  │
│                    │ • Entities            │                  │
│                    └────┬──────────────────┘                  │
│                         │                                      │
│                    ┌────▼──────────────────┐                  │
│                    │   DATABASE (MongoDB)  │                  │
│                    ├───────────────────────┤                  │
│                    │ • SavFeedback         │                  │
│                    │ • Collections         │                  │
│                    │ • Indexes             │                  │
│                    └───────────────────────┘                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### Client Creating a Return Request

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User fills form in SavClaimCreateComponent                   │
│    - Product selection                                          │
│    - Reason, problem nature, desired solution                   │
│    - Priority, rating, message                                  │
│    - Image upload                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Component calls SavClaimService.createSavClaim()             │
│    - Validates form data                                        │
│    - Creates FormData with images                               │
│    - Sends POST request to /api/sav/claims                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Backend receives request in SavClaimClientController         │
│    - Validates JWT token                                        │
│    - Extracts user ID from token                                │
│    - Validates cartItemId belongs to user                       │
│    - Validates all required fields                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Service processes the claim (SavFeedbackService)             │
│    - Creates SavFeedback entity                                 │
│    - Sets initial status to PENDING                             │
│    - Sets readByAdmin to false                                  │
│    - Saves to database                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Response sent back to client                                 │
│    - Success message                                            │
│    - Claim ID                                                   │
│    - Claim details                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Component redirects to claims list                           │
│    - Shows success notification                                 │
│    - Reloads claims list                                        │
│    - New claim appears in list                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ File Organization

### Frontend Structure
```
frontend/src/app/
├── front/
│   ├── core/
│   │   └── sav-claim.service.ts ..................... Client API service
│   ├── pages/
│   │   ├── sav/
│   │   │   └── client-sav.component.ts ............. Wrapper with tabs
│   │   └── sav-claims/
│   │       ├── sav-claims-list.component.ts ........ List all claims
│   │       ├── sav-claim-create.component.ts ....... Create/edit claim
│   │       └── sav-claim-detail.component.ts ....... View details
│   └── layout/navbar/
│       └── navbar.ts .............................. Navigation (updated)
├── back/
│   ├── core/services/
│   │   └── sav-admin.service.ts ................... Admin API service
│   ├── features/sav/
│   │   └── sav-admin.component.ts ................. Admin dashboard
│   ├── shared/components/sidebar/
│   │   └── sidebar.component.ts ................... Navigation (updated)
│   └── back.routes.ts ............................ Admin routes (updated)
└── app.routes.ts ................................ Main routes (updated)
```

### Backend Structure
```
backend/src/main/java/esprit_market/
├── entity/SAV/
│   └── SavFeedback.java .......................... Main entity
├── repository/SAVRepository/
│   └── SavFeedbackRepository.java ............... Data access
├── service/SAVService/
│   └── SavFeedbackService.java .................. Business logic
├── controller/SAVController/
│   └── SavClaimClientController.java ........... Client endpoints
├── controller/adminController/
│   └── SavClaimAdminController.java ............ Admin endpoints
└── dto/SAV/
    ├── SavFeedbackRequestDTO.java .............. Request DTO
    └── SavFeedbackResponseDTO.java ............. Response DTO
```

---

## 🔌 API Endpoints

### Client Endpoints (5 total)
```
POST   /api/sav/claims
       Create a new return request
       Body: SavFeedbackRequestDTO + images
       Response: SavFeedbackResponseDTO

GET    /api/sav/claims/my
       Get all claims for current user
       Response: List<SavFeedbackResponseDTO>

GET    /api/sav/claims/my/:id
       Get specific claim details
       Response: SavFeedbackResponseDTO

PUT    /api/sav/claims/my/:id
       Update claim (only if PENDING)
       Body: SavFeedbackRequestDTO + images
       Response: SavFeedbackResponseDTO

DELETE /api/sav/claims/my/:id
       Delete claim (only if PENDING)
       Response: Success message
```

### Admin Endpoints (9 total)
```
GET    /api/admin/sav/claims
       Get all claims
       Response: List<SavFeedbackResponseDTO>

GET    /api/admin/sav/claims/:id
       Get specific claim
       Response: SavFeedbackResponseDTO

GET    /api/admin/sav/claims/status/:status
       Filter claims by status
       Response: List<SavFeedbackResponseDTO>

GET    /api/admin/sav/claims/unread
       Get unread claims
       Response: List<SavFeedbackResponseDTO>

PUT    /api/admin/sav/claims/:id/status
       Update claim status
       Params: status
       Response: SavFeedbackResponseDTO

PUT    /api/admin/sav/claims/:id/response
       Send admin response
       Params: response
       Response: SavFeedbackResponseDTO

PUT    /api/admin/sav/claims/:id/ai-verification
       Update AI verification
       Params: similarityScore, decision, recommendation
       Response: SavFeedbackResponseDTO

DELETE /api/admin/sav/claims/:id
       Delete claim
       Response: Success message

GET    /api/admin/sav/claims/ai-verification/cases
       Get AI verification cases
       Response: List<SavFeedbackResponseDTO>
```

---

## 🎨 UI Components

### Client Components

#### SavClaimsListComponent
```
┌─────────────────────────────────────────────────────┐
│ My Return Requests                                  │
│ Track your return requests and customer claims      │
│                    [+ Create Return Request]        │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Reason: Defective          [PENDING]            │ │
│ │ Product arrived broken...                       │ │
│ │ 📅 Apr 27, 2026  🎯 Refund  ⚡ HIGH            │ │
│ │ [View Details] [Edit] [Delete]                 │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Reason: Damaged            [INVESTIGATING]      │ │
│ │ Package was damaged in transit...               │ │
│ │ 📅 Apr 26, 2026  🎯 Exchange  ⚡ MEDIUM        │ │
│ │ [View Details]                                 │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

#### SavClaimDetailComponent
```
┌─────────────────────────────────────────────────────┐
│ ← Back to My Claims                                 │
├─────────────────────────────────────────────────────┤
│ Return Request Details                              │
│ Defective                              [PENDING]    │
├─────────────────────────────────────────────────────┤
│ Status Timeline                                     │
│ ✓ Submitted (Apr 27)                               │
│ ○ Under Investigation                              │
│ ○ Resolved                                         │
├─────────────────────────────────────────────────────┤
│ Claim Information                                   │
│ • Problem: Screen shattered                        │
│ • Solution: Refund                                 │
│ • Priority: HIGH                                   │
│ • Rating: ⭐⭐⭐⭐⭐                                │
├─────────────────────────────────────────────────────┤
│ Images                                              │
│ [Image 1] [Image 2] [Image 3]                      │
├─────────────────────────────────────────────────────┤
│ Admin Response                                      │
│ (No response yet)                                   │
└─────────────────────────────────────────────────────┘
```

### Admin Components

#### SavAdminComponent
```
┌─────────────────────────────────────────────────────┐
│ After-Sales Service Dashboard                       │
├─────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│ │ Total    │ │ Pending  │ │ Invest.  │ │Resolved│ │
│ │   42     │ │    8     │ │    15    │ │   19   │ │
│ └──────────┘ └──────────┘ └──────────┘ └────────┘ │
├─────────────────────────────────────────────────────┤
│ Filters: [Status ▼] [Priority ▼]                   │
├─────────────────────────────────────────────────────┤
│ Claims Table                                        │
│ ┌─────┬──────────┬──────────┬──────────┬──────────┐ │
│ │ ID  │ Reason   │ Status   │ Priority │ Actions  │ │
│ ├─────┼──────────┼──────────┼──────────┼──────────┤ │
│ │ 001 │ Defect.  │ PENDING  │ HIGH     │ [View]   │ │
│ │ 002 │ Damaged  │ INVEST.  │ MEDIUM   │ [View]   │ │
│ │ 003 │ Not Desc │ RESOLVED │ LOW      │ [View]   │ │
│ └─────┴──────────┴──────────┴──────────┴──────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 Security Model

### Authentication
```
User Login
    ↓
JWT Token Generated
    ↓
Token Stored in Browser
    ↓
Token Sent in Authorization Header
    ↓
Backend Validates Token
    ↓
User ID Extracted from Token
    ↓
Request Processed
```

### Authorization
```
Client Request
    ↓
Is User Authenticated? → No → 401 Unauthorized
    ↓ Yes
Is User Admin? → No → Check Client Endpoints
    ↓ Yes
Check Admin Endpoints
    ↓
Verify User Ownership (for client endpoints)
    ↓
Verify Status = PENDING (for modifications)
    ↓
Process Request
```

---

## 📊 Status Workflow

```
┌─────────┐
│ PENDING │ ← Initial status when claim created
└────┬────┘
     │
     ▼
┌──────────────┐
│ INVESTIGATING│ ← Admin reviews the claim
└────┬─────────┘
     │
     ├─────────────────────┬──────────────────┐
     │                     │                  │
     ▼                     ▼                  ▼
┌─────────┐          ┌──────────┐      ┌──────────┐
│ RESOLVED│          │ REJECTED │      │ ARCHIVED │
└─────────┘          └──────────┘      └──────────┘
```

---

## 📈 Statistics & KPIs

### Dashboard Metrics
```
Total Claims: 42
├── PENDING: 8 (19%)
├── INVESTIGATING: 15 (36%)
├── RESOLVED: 15 (36%)
├── REJECTED: 3 (7%)
└── ARCHIVED: 1 (2%)

By Priority:
├── HIGH: 12 (29%)
├── MEDIUM: 18 (43%)
└── LOW: 12 (29%)

By Reason:
├── Defective: 18 (43%)
├── Damaged: 12 (29%)
├── Not as Described: 8 (19%)
└── Other: 4 (9%)
```

---

## 🚀 Deployment Checklist

- [x] All components compile
- [x] All routes configured
- [x] All services implemented
- [x] Security configured
- [x] Documentation complete
- [x] Tests defined
- [x] Error handling implemented
- [x] Responsive design verified
- [x] Performance optimized
- [x] Ready for testing

---

## 📞 Quick Reference

| Item | Location |
|------|----------|
| Client Routes | `/sav`, `/sav/claims`, `/sav/claims/create`, `/sav/claims/:id` |
| Admin Route | `/admin/sav` |
| Client Service | `frontend/src/app/front/core/sav-claim.service.ts` |
| Admin Service | `frontend/src/app/back/core/services/sav-admin.service.ts` |
| Backend Service | `backend/src/main/java/esprit_market/service/SAVService/SavFeedbackService.java` |
| Client Controller | `backend/src/main/java/esprit_market/controller/SAVController/SavClaimClientController.java` |
| Admin Controller | `backend/src/main/java/esprit_market/controller/adminController/SavClaimAdminController.java` |
| Testing Guide | `SAV_QUICK_START_TESTING.md` |
| API Examples | `SAV_TEST_EXAMPLES.md` |

---

**Version**: 1.0.0
**Status**: ✅ READY FOR TESTING
**Last Updated**: 2026-04-27
