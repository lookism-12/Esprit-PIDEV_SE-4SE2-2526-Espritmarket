# 🎯 Support SELLER - Gestion des Produits

## ✅ Fonctionnalités Ajoutées

Le système supporte maintenant **deux rôles** pour la gestion des produits:

### 👑 ADMIN
- ✅ Voir **tous** les produits (tous les shops)
- ✅ Créer des produits pour n'importe quel shop
- ✅ Modifier **tous** les produits
- ✅ Supprimer **tous** les produits
- ✅ **Approuver** les produits PENDING → APPROVED
- ✅ **Rejeter** les produits PENDING → REJECTED

### 🏪 SELLER
- ✅ Voir **uniquement** ses propres produits (son shop)
- ✅ Créer des produits pour son shop
- ✅ Modifier **uniquement** ses propres produits
- ✅ Supprimer **uniquement** ses propres produits
- ❌ **Pas d'accès** aux boutons Approve/Reject (réservé Admin)

---

## 🔧 Modifications Appliquées

### 1. Backend (Déjà Existant)

Le backend avait déjà les endpoints nécessaires:

**Endpoints**:
```java
// Admin: tous les produits
GET /api/products/all
@PreAuthorize("hasRole('ADMIN')")

// Seller: ses produits uniquement
GET /api/products/mine
@PreAuthorize("hasRole('SELLER')")

// Création: Admin ou Seller (si propriétaire du shop)
POST /api/products
@PreAuthorize("hasRole('ADMIN') or (hasRole('SELLER') and @marketplaceSecurity.isShopOwner(authentication, #dto.shopId))")

// Modification: Admin ou Seller (si propriétaire du produit)
PUT /api/products/{id}
@PreAuthorize("hasRole('ADMIN') or (hasRole('SELLER') and @marketplaceSecurity.isProductOwner(authentication, #id))")

// Suppression: Admin ou Seller (si propriétaire du produit)
DELETE /api/products/{id}
@PreAuthorize("hasRole('ADMIN') or (hasRole('SELLER') and @marketplaceSecurity.isProductOwner(authentication, #id))")

// Approbation: Admin uniquement
PATCH /api/products/{id}/approve
@PreAuthorize("hasRole('ADMIN')")

// Rejet: Admin uniquement
PATCH /api/products/{id}/reject
@PreAuthorize("hasRole('ADMIN')")
```

**Service**:
```java
@Override
public List<ProductResponseDTO> findForCurrentSeller() {
    // Récupère l'utilisateur connecté
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    User user = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    
    // Trouve le shop du seller
    Shop shop = shopRepository.findByOwnerId(user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("No shop found for this seller"));
    
    // Retourne uniquement les produits de ce shop
    return repository.findByShopId(shop.getId()).stream()
            .map(mapper::toDTO)
            .collect(Collectors.toList());
}
```

### 2. Frontend - Auth Service

**Fichier**: `frontend/src/app/back/core/services/admin-auth.service.ts`

**Ajout**:
```typescript
hasRole(role: string): boolean {
  const user = this.currentUser();
  return user?.roles?.includes(role) || false;
}

isAdmin(): boolean {
  return this.hasRole('ADMIN');
}

isSeller(): boolean {
  return this.hasRole('SELLER');
}
```

### 3. Frontend - Marketplace Service

**Fichier**: `frontend/src/app/back/core/services/marketplace-admin.service.ts`

**Ajout**:
```typescript
getMyProducts(): Observable<ProductAdminDto[]> {
  const url = `${this.base}/products/mine`;
  console.log('📡 GET', url, '(Seller products)');
  return this.http.get<ProductAdminDto[]>(url).pipe(
    tap(data => {
      console.log('✅ Received seller products:', data.length);
      console.log('📦 Seller products:', data);
    }),
    catchError(err => {
      console.error('❌ Failed to load seller products:', err);
      return throwError(() => err);
    })
  );
}
```

### 4. Frontend - Products Component

**Fichier**: `frontend/src/app/back/features/marketplace/products-admin.component.ts`

**Changements**:

#### A. Détection du Rôle
```typescript
export class ProductsAdminComponent implements OnInit {
  private authService = inject(AdminAuthService);
  
  isAdmin = signal(false);
  isSeller = signal(false);
  
  ngOnInit(): void {
    this.isAdmin.set(this.authService.isAdmin());
    this.isSeller.set(this.authService.isSeller());
    console.log('👤 User role - Admin:', this.isAdmin(), 'Seller:', this.isSeller());
    
    this.loadData();
  }
}
```

#### B. Chargement Conditionnel
```typescript
loadData(): void {
  // Load products based on role
  const productsRequest = this.isAdmin() 
    ? this.svc.getProductsAdmin()  // Admin: all products
    : this.svc.getMyProducts();     // Seller: only their products
  
  productsRequest.subscribe({
    next: (data) => {
      this.products.set(data);
      this.isLoading.set(false);
    }
  });
}
```

#### C. UI Conditionnelle
```html
<!-- Header dynamique -->
<h1>{{ isAdmin() ? 'Products' : 'My Products' }}</h1>
<p>{{ isAdmin() ? 'Manage all marketplace products' : 'Manage your shop products' }}</p>

<!-- Actions conditionnelles -->
<td class="px-6 py-4 text-right">
  <div class="flex justify-end gap-1">
    <!-- Approve/Reject: Admin uniquement -->
    @if (isAdmin() && p.status === 'PENDING') {
      <button (click)="approve(p.id)">✅</button>
      <button (click)="reject(p.id)">🚫</button>
    }
    
    <!-- Edit/Delete: Admin et Seller -->
    <button (click)="openModal(p)">✏️</button>
    <button (click)="deleteProduct(p.id)">🗑️</button>
  </div>
</td>
```

---

## 🧪 Comment Tester

### Test 1: En tant qu'ADMIN

1. **Connectez-vous** avec un compte ADMIN
2. **Allez sur**: `http://localhost:4200/admin/marketplace/products`
3. **Vérifiez**:
   - ✅ Titre: "Products"
   - ✅ Description: "Manage all marketplace products"
   - ✅ Voir **tous** les produits de tous les shops
   - ✅ Boutons Approve/Reject visibles pour produits PENDING
   - ✅ Peut créer un produit pour n'importe quel shop
   - ✅ Peut modifier/supprimer n'importe quel produit

### Test 2: En tant que SELLER

1. **Connectez-vous** avec un compte SELLER
2. **Allez sur**: `http://localhost:4200/admin/marketplace/products`
3. **Vérifiez**:
   - ✅ Titre: "My Products"
   - ✅ Description: "Manage your shop products"
   - ✅ Voir **uniquement** les produits de son shop
   - ❌ Boutons Approve/Reject **non visibles**
   - ✅ Peut créer un produit pour son shop
   - ✅ Peut modifier/supprimer ses propres produits

### Test 3: Création de Produit (SELLER)

1. **Cliquez** "+ Add Product"
2. **Remplissez**:
   - Name: `Mon Produit Seller`
   - Price: `150`
   - Stock: `20`
   - Shop: **Automatiquement son shop** (ou sélection si plusieurs)
   - Category: (optionnel)
3. **Cliquez** "Create"
4. **Résultat**:
   - ✅ Produit créé avec status PENDING
   - ✅ Produit apparaît dans la liste
   - ✅ Seller peut le modifier/supprimer
   - ⏳ Attend approbation Admin

### Test 4: Sécurité Backend

**Tentative d'accès non autorisé** (doit échouer):

```javascript
// Seller essaie de modifier un produit d'un autre shop
// Backend doit retourner 403 Forbidden
```

Le backend vérifie automatiquement avec `@marketplaceSecurity.isProductOwner()`.

---

## 🔐 Sécurité Implémentée

### Backend
- ✅ `@PreAuthorize` sur tous les endpoints sensibles
- ✅ Vérification du propriétaire du shop lors de la création
- ✅ Vérification du propriétaire du produit lors de modification/suppression
- ✅ Approve/Reject réservés à ADMIN uniquement

### Frontend
- ✅ Chargement conditionnel des produits (all vs mine)
- ✅ Boutons Approve/Reject cachés pour SELLER
- ✅ UI adaptée au rôle (titres, descriptions)
- ✅ Même composant pour les deux rôles (code réutilisable)

---

## 📊 Flux de Travail

### Workflow SELLER:
1. **Seller** crée un produit → Status: PENDING
2. **Admin** voit le produit dans la liste
3. **Admin** clique "Approve" → Status: APPROVED
4. **Produit** devient visible pour les clients

### Workflow ADMIN:
1. **Admin** crée un produit → Status: PENDING (ou peut approuver immédiatement)
2. **Admin** peut approuver ses propres produits
3. **Produit** devient visible pour les clients

---

## 🎯 Résultat Final

### Interface ADMIN:
```
┌─────────────────────────────────────────────────────────┐
│ Products                              🔄 Refresh  + Add  │
│ Manage all marketplace products                         │
├─────────────────────────────────────────────────────────┤
│ 📦 Total: 10   ✅ Approved: 5   ⏳ Pending: 3   ❌ Rejected: 2 │
├─────────────────────────────────────────────────────────┤
│ Product         │ Category │ Price  │ Stock │ Status   │ Actions      │
├─────────────────┼──────────┼────────┼───────┼──────────┼──────────────┤
│ Produit Shop A  │ Tech     │ 50 TND │ 🟢 15 │ PENDING  │ ✅ 🚫 ✏️ 🗑️ │
│ Produit Shop B  │ Food     │ 30 TND │ 🟠 8  │ APPROVED │ ✏️ 🗑️       │
└─────────────────────────────────────────────────────────┘
```

### Interface SELLER:
```
┌─────────────────────────────────────────────────────────┐
│ My Products                           🔄 Refresh  + Add  │
│ Manage your shop products                               │
├─────────────────────────────────────────────────────────┤
│ 📦 Total: 3    ✅ Approved: 1    ⏳ Pending: 2           │
├─────────────────────────────────────────────────────────┤
│ Product         │ Category │ Price  │ Stock │ Status   │ Actions │
├─────────────────┼──────────┼────────┼───────┼──────────┼─────────┤
│ Mon Produit 1   │ Tech     │ 50 TND │ 🟢 15 │ PENDING  │ ✏️ 🗑️  │
│ Mon Produit 2   │ Food     │ 30 TND │ 🟠 8  │ APPROVED │ ✏️ 🗑️  │
└─────────────────────────────────────────────────────────┘
```

**Différences**:
- Seller ne voit **pas** les boutons ✅ Approve et 🚫 Reject
- Seller ne voit **que** ses propres produits
- Titres et descriptions adaptés au rôle

---

## 🔍 Logs Attendus

### Console Frontend (ADMIN):
```
👤 User role - Admin: true Seller: false
🔄 loadData() called - Starting to load products...
📡 GET http://localhost:8090/api/products/all
✅ Received products: 10
✅ Products loaded from API: 10 products
```

### Console Frontend (SELLER):
```
👤 User role - Admin: false Seller: true
🔄 loadData() called - Starting to load products...
📡 GET http://localhost:8090/api/products/mine (Seller products)
✅ Received seller products: 3
✅ Products loaded from API: 3 products
```

---

## 🧪 Scénarios de Test

### Scénario 1: SELLER Crée un Produit
1. Connecté en tant que SELLER
2. Cliquez "+ Add Product"
3. Remplissez le formulaire
4. Cliquez "Create"

**Résultat**:
- ✅ Produit créé avec status PENDING
- ✅ Produit lié au shop du seller
- ✅ Produit apparaît dans "My Products"
- ⏳ Attend approbation Admin

### Scénario 2: ADMIN Approuve le Produit
1. Connecté en tant que ADMIN
2. Voir le produit PENDING du seller
3. Cliquez "✅ Approve"

**Résultat**:
- ✅ Status change: PENDING → APPROVED
- ✅ Produit visible pour les clients
- ✅ Seller voit le changement de status

### Scénario 3: SELLER Modifie Son Produit
1. Connecté en tant que SELLER
2. Cliquez "✏️ Edit" sur un de ses produits
3. Modifiez le prix ou le stock
4. Cliquez "Update"

**Résultat**:
- ✅ Produit mis à jour
- ✅ Changements visibles immédiatement

### Scénario 4: SELLER Essaie de Modifier un Produit d'un Autre Shop
**Backend bloque automatiquement** avec 403 Forbidden grâce à:
```java
@PreAuthorize("hasRole('ADMIN') or (hasRole('SELLER') and @marketplaceSecurity.isProductOwner(authentication, #id))")
```

---

## 🎨 UI Adaptée au Rôle

### Éléments Dynamiques:

| Élément | ADMIN | SELLER |
|---------|-------|--------|
| Titre | "Products" | "My Products" |
| Description | "Manage all marketplace products" | "Manage your shop products" |
| Produits affichés | Tous | Seulement les siens |
| Bouton "+ Add Product" | ✅ | ✅ |
| Bouton "✅ Approve" | ✅ (si PENDING) | ❌ |
| Bouton "🚫 Reject" | ✅ (si PENDING) | ❌ |
| Bouton "✏️ Edit" | ✅ | ✅ (ses produits) |
| Bouton "🗑️ Delete" | ✅ | ✅ (ses produits) |

---

## 🔄 Workflow Complet

### Cycle de Vie d'un Produit SELLER:

```
1. SELLER crée produit
   ↓
   Status: PENDING
   ↓
2. ADMIN voit le produit
   ↓
3. ADMIN approuve
   ↓
   Status: APPROVED
   ↓
4. Produit visible pour clients
   ↓
5. SELLER peut modifier (prix, stock, etc.)
   ↓
6. Changements visibles immédiatement
```

### Cycle de Vie d'un Produit ADMIN:

```
1. ADMIN crée produit
   ↓
   Status: PENDING
   ↓
2. ADMIN peut s'auto-approuver
   ↓
   Status: APPROVED
   ↓
3. Produit visible pour clients
```

---

## ✅ Avantages de Cette Implémentation

### 1. Sécurité
- ✅ Contrôle d'accès au niveau backend (impossible de contourner)
- ✅ Vérification du propriétaire pour chaque opération
- ✅ Rôles clairement séparés

### 2. Réutilisabilité
- ✅ **Même composant** pour Admin et Seller
- ✅ **Même UI** avec adaptations conditionnelles
- ✅ **Même code** avec logique basée sur le rôle

### 3. Maintenabilité
- ✅ Un seul fichier à maintenir
- ✅ Logique centralisée
- ✅ Facile à étendre

### 4. UX
- ✅ Interface adaptée au rôle
- ✅ Pas de confusion (seller ne voit que ses produits)
- ✅ Admin garde le contrôle total

---

## 🚀 Fonctionnalités Complètes

### CRUD Products
- ✅ **Create** - Admin (tous shops) / Seller (son shop)
- ✅ **Read** - Admin (tous) / Seller (les siens)
- ✅ **Update** - Admin (tous) / Seller (les siens)
- ✅ **Delete** - Admin (tous) / Seller (les siens)

### Workflow d'Approbation
- ✅ **Approve** - Admin uniquement
- ✅ **Reject** - Admin uniquement
- ✅ Status visible pour tous

### Affichage
- ✅ Tableau adapté au rôle
- ✅ Compteurs par statut
- ✅ Actions contextuelles
- ✅ Mise à jour en temps réel

---

## 🎉 Conclusion

Le système de gestion des produits supporte maintenant:
- ✅ **ADMIN** - Contrôle total sur tous les produits
- ✅ **SELLER** - Gestion de ses propres produits uniquement
- ✅ **Sécurité** - Vérifications backend + frontend
- ✅ **UI cohérente** - Même design, logique adaptée
- ✅ **Workflow d'approbation** - Produits SELLER doivent être approuvés

**Le module Marketplace est maintenant complet et sécurisé pour les deux rôles !** 🚀
