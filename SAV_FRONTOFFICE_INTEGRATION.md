# 🎯 Intégration SAV - Frontoffice (Client)

## 📍 Où est intégrée la gestion SAV dans la frontoffice?

### 1. **Navigation - Navbar**

#### Localisation: `frontend/src/app/front/layout/navbar/navbar.ts`

La gestion SAV est accessible via le menu "Orders & Delivery" dans la navbar:

```typescript
{
  title: 'Orders & Delivery',
  icon: '📦',
  items: [
    { label: 'My Orders', route: '/orders', icon: '🛍️' },
    { label: 'Track Deliveries', route: '/sav/deliveries', icon: '📍' },
    { label: 'My Claims', route: '/sav', icon: '📄' }  // ← SAV LINK
  ]
}
```

**Accès**: Cliquez sur "My Claims" dans le menu navbar → `/sav`

---

### 2. **Routes - Configuration**

#### Localisation: `frontend/src/app/app.routes.ts` (lignes 95-120)

```typescript
{
    path: 'sav',
    canActivate: [authGuard],  // ← Protégé - authentification requise
    children: [
        {
            path: '',
            loadComponent: () => import('./front/pages/sav/client-sav.component')
                .then(m => m.ClientSavComponent)
        },
        {
            path: 'claims',
            loadComponent: () => import('./front/pages/sav-claims/sav-claims-list.component')
                .then(m => m.SavClaimsListComponent)
        },
        {
            path: 'claims/create',
            loadComponent: () => import('./front/pages/sav-claims/sav-claim-create.component')
                .then(m => m.SavClaimCreateComponent)
        },
        {
            path: 'claims/:id',
            loadComponent: () => import('./front/pages/sav-claims/sav-claim-detail.component')
                .then(m => m.SavClaimDetailComponent)
        },
        {
            path: 'claims/:id/edit',
            loadComponent: () => import('./front/pages/sav-claims/sav-claim-create.component')
                .then(m => m.SavClaimCreateComponent)
        }
    ]
}
```

---

### 3. **Pages SAV - Structure**

#### Localisation: `frontend/src/app/front/pages/sav-claims/`

```
frontend/src/app/front/pages/
├── sav/
│   └── client-sav.component.ts          ← Wrapper avec tabs
├── sav-claims/
│   ├── sav-claims-list.component.ts     ← Liste des demandes
│   ├── sav-claim-create.component.ts    ← Créer/Éditer demande
│   └── sav-claim-detail.component.ts    ← Détails demande
```

---

## 🗺️ Flux de Navigation Client

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVBAR - "My Claims"                     │
│                         ↓                                    │
│                    /sav (Main Page)                         │
│              (Tabs: Deliveries | Claims)                    │
│                         ↓                                    │
│    ┌────────────────────┴────────────────────┐              │
│    ↓                                         ↓              │
│ /sav/claims                          /sav/claims/create    │
│ (List all claims)                    (Create new claim)    │
│    ↓                                         ↑              │
│    └─────────────────────┬────────────────────┘             │
│                          ↓                                  │
│                  /sav/claims/:id                           │
│              (View claim details)                          │
│                          ↓                                  │
│              /sav/claims/:id/edit                          │
│              (Edit claim if PENDING)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 Pages SAV Disponibles

### 1. **Page Principale SAV** (`/sav`)
**Fichier**: `frontend/src/app/front/pages/sav/client-sav.component.ts`

- Affiche 2 onglets:
  - 🚚 **Deliveries** - Suivi des livraisons
  - 💬 **Claims & Reviews** - Demandes de retour

### 2. **Liste des Demandes** (`/sav/claims`)
**Fichier**: `frontend/src/app/front/pages/sav-claims/sav-claims-list.component.ts`

**Fonctionnalités**:
- ✅ Affiche toutes les demandes de l'utilisateur
- ✅ Filtrage par statut (PENDING, INVESTIGATING, RESOLVED, etc.)
- ✅ Bouton "Create Return Request"
- ✅ Boutons d'action: View Details, Edit, Delete
- ✅ Affichage des statuts avec badges colorés
- ✅ État vide avec message

**Statuts affichés**:
- 🟡 PENDING (Jaune)
- 🔵 INVESTIGATING (Bleu)
- 🟢 RESOLVED (Vert)
- 🔴 REJECTED (Rouge)
- ⚫ ARCHIVED (Gris)

### 3. **Créer une Demande** (`/sav/claims/create`)
**Fichier**: `frontend/src/app/front/pages/sav-claims/sav-claim-create.component.ts`

**Formulaire**:
- 📦 Sélection du produit acheté
- 🔍 Raison du retour (Défectueux, Endommagé, Pas conforme, etc.)
- 📝 Description du problème
- 🎯 Solution désirée (Remboursement, Échange, Réparation, etc.)
- ⚡ Priorité (Basse, Moyenne, Haute, Urgente)
- 💬 Message détaillé
- ⭐ Note (1-5 étoiles)
- 📸 Upload d'images (obligatoire)

**Validation**:
- Tous les champs obligatoires
- Au moins 1 image requise
- Validation en temps réel

### 4. **Détails de la Demande** (`/sav/claims/:id`)
**Fichier**: `frontend/src/app/front/pages/sav-claims/sav-claim-detail.component.ts`

**Affichage**:
- 📋 Informations complètes de la demande
- 📊 Timeline du statut (progression visuelle)
- 📸 Images uploadées
- 💬 Réponse de l'admin (si disponible)
- 🤖 Résultats de vérification IA (si disponible)
- 📅 Dates de création et mise à jour

**Timeline**:
```
✓ Submitted (Soumis)
  ↓
○ Under Investigation (En investigation)
  ↓
○ Resolved (Résolu)
```

---

## 🔐 Sécurité & Permissions

### Authentification
- ✅ Route protégée par `authGuard`
- ✅ Utilisateur doit être connecté
- ✅ Token JWT requis

### Autorisation
- ✅ Client ne voit que ses propres demandes
- ✅ Client ne peut éditer que si statut = PENDING
- ✅ Client ne peut supprimer que si statut = PENDING
- ✅ Vérification côté backend

---

## 🎨 Design & UX

### Couleurs
- **Primaire**: Rouge/Bordeaux (boutons, badges actifs)
- **Secondaire**: Gris (texte, icônes)
- **Statuts**:
  - Jaune: PENDING
  - Bleu: INVESTIGATING
  - Vert: RESOLVED
  - Rouge: REJECTED
  - Gris: ARCHIVED

### Responsive
- ✅ Mobile (< 640px)
- ✅ Tablet (640px - 1024px)
- ✅ Desktop (> 1024px)

### Composants
- ✅ Loading spinners
- ✅ Empty states
- ✅ Error messages
- ✅ Success notifications
- ✅ Status badges
- ✅ Timeline visualization
- ✅ Image gallery

---

## 📡 Services & API

### Service Client
**Fichier**: `frontend/src/app/front/core/sav-claim.service.ts`

```typescript
// Créer une demande
createSavClaim(claim: SavClaim, images?: File[]): Observable<any>

// Récupérer mes demandes
getMySavClaims(): Observable<SavClaim[]>

// Récupérer une demande
getMySavClaimById(id: string): Observable<SavClaim>

// Mettre à jour une demande
updateMySavClaim(id: string, claim: SavClaim, images?: File[]): Observable<any>

// Supprimer une demande
deleteMySavClaim(id: string): Observable<any>
```

### Endpoints Backend
```
POST   /api/sav/claims              - Créer
GET    /api/sav/claims/my           - Lister mes demandes
GET    /api/sav/claims/my/:id       - Détails
PUT    /api/sav/claims/my/:id       - Mettre à jour
DELETE /api/sav/claims/my/:id       - Supprimer
```

---

## 🔄 Flux Utilisateur Complet

### 1. **Accès à la gestion SAV**
```
Utilisateur connecté
    ↓
Clique sur "My Claims" dans navbar
    ↓
Accès à /sav (page principale)
```

### 2. **Créer une demande de retour**
```
Clique sur "Create Return Request"
    ↓
Remplit le formulaire
    ↓
Upload des images
    ↓
Clique "Submit"
    ↓
Demande créée avec statut PENDING
    ↓
Redirection vers liste des demandes
```

### 3. **Consulter une demande**
```
Clique sur "View Details"
    ↓
Affichage des détails complets
    ↓
Voir la timeline du statut
    ↓
Voir les images
    ↓
Voir la réponse de l'admin (si disponible)
```

### 4. **Éditer une demande (si PENDING)**
```
Clique sur "Edit"
    ↓
Modifie le formulaire
    ↓
Clique "Submit"
    ↓
Demande mise à jour
```

### 5. **Supprimer une demande (si PENDING)**
```
Clique sur "Delete"
    ↓
Confirmation
    ↓
Demande supprimée
    ↓
Redirection vers liste
```

---

## 📊 Exemple d'Utilisation

### Scénario: Client signale un produit défectueux

1. **Accès**: Navbar → "My Claims" → `/sav`
2. **Création**: Clique "Create Return Request"
3. **Formulaire**:
   - Produit: "Wireless Headphones"
   - Raison: "Defective/Broken"
   - Problème: "Left speaker not working"
   - Solution: "Refund"
   - Priorité: "HIGH"
   - Message: "The left speaker stopped working after 2 days of use"
   - Images: Upload 2 photos du produit
4. **Soumission**: Clique "Submit Return Request"
5. **Confirmation**: Message de succès
6. **Suivi**: Voit la demande dans la liste avec statut PENDING
7. **Détails**: Clique pour voir la timeline et les images
8. **Attente**: Admin examine et change le statut
9. **Notification**: Client voit la réponse de l'admin

---

## 🔗 Intégration avec d'autres pages

### Depuis la page produit
- Bouton "Request Return" (si produit acheté)
- Redirige vers `/sav/claims/create?cartItemId=XXX`

### Depuis l'historique de commandes
- Bouton "Return" pour chaque article
- Redirige vers `/sav/claims/create?cartItemId=XXX`

### Depuis le profil utilisateur
- Lien vers `/sav` dans le menu profil
- Affiche les demandes récentes

---

## 📚 Documentation Complète

Pour plus de détails, consultez:
- `SAV_QUICK_START_TESTING.md` - Guide de test
- `SAV_TEST_EXAMPLES.md` - Exemples cURL
- `SAV_COMPLETE_IMPLEMENTATION.md` - Détails techniques
- `SAV_SYSTEM_OVERVIEW.md` - Vue d'ensemble du système

---

## ✅ Checklist d'Intégration

- [x] Routes configurées
- [x] Navigation intégrée dans navbar
- [x] Composants créés
- [x] Services implémentés
- [x] Sécurité configurée
- [x] Design responsive
- [x] Validation des formulaires
- [x] Gestion des erreurs
- [x] Loading states
- [x] Empty states
- [x] Documentation complète

---

**Status**: ✅ INTÉGRATION COMPLÈTE
**Accessible**: OUI - Via navbar "My Claims"
**Protégé**: OUI - Authentification requise
**Responsive**: OUI - Mobile, Tablet, Desktop
**Prêt pour test**: OUI

---

**Version**: 1.0.0
**Dernière mise à jour**: 2026-04-27
