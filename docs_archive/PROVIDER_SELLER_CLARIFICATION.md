# 🏪 Clarification: PROVIDER = SELLER

## 📋 Définition

**PROVIDER** et **SELLER** sont la **MÊME PERSONNE**:
- Un étudiant ESPRIT qui vend des produits ou offre des services
- Il peut être appelé "Provider" ou "Seller" (même rôle)
- Dans le code: `Role.SELLER` ou `isSeller()`

---

## 🎯 Capacités du PROVIDER/SELLER

### 1. Gérer Ses Propres Produits/Services ✅
Le seller peut:
- ✅ **Créer** un nouveau produit
- ✅ **Modifier** ses produits existants
- ✅ **Supprimer** ses produits
- ✅ **Voir** tous ses produits (pending, approved, rejected)

### 2. Consulter Tous les Produits ✅
Le seller peut:
- ✅ **Voir** tous les produits des autres sellers
- ✅ **Acheter** des produits d'autres sellers
- ✅ **Ajouter aux favoris** n'importe quel produit
- ✅ **Naviguer** comme un utilisateur normal

---

## 🔧 Correction Appliquée

### Problème Identifié
Quand un seller ajoutait un produit:
- ❌ Rien ne s'enregistrait en base de données
- ❌ Le produit n'apparaissait pas dans la liste
- ❌ Pas de feedback après sauvegarde

### Cause
Le `ProductModal` utilisait des `@Input` functions au lieu d'`@Output` EventEmitters:
```typescript
// AVANT (incorrect)
@Input() onClose: () => void = () => {};
@Input() onSave: () => void = () => {};
```

### Solution
Changé en `@Output` EventEmitters:
```typescript
// APRÈS (correct)
@Output() close = new EventEmitter<void>();
@Output() save = new EventEmitter<void>();
```

---

## 🔄 Flux de Données Corrigé

### Ajout de Produit

```
┌─────────────────────────────────────────────────────┐
│              FLUX D'AJOUT DE PRODUIT                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. Seller clique "Add Product"                     │
│     ↓                                                │
│  2. Modal s'ouvre (ProductModal)                    │
│     ↓                                                │
│  3. Seller remplit le formulaire                    │
│     ↓                                                │
│  4. Seller clique "Create Listing"                  │
│     ↓                                                │
│  5. ProductModal.onSubmit()                         │
│     ↓                                                │
│  6. resolveShopId() → Trouve/Crée le shop          │
│     ↓                                                │
│  7. productService.createProduct(request)           │
│     ↓                                                │
│  8. POST /api/products                              │
│     ↓                                                │
│  9. Backend enregistre en MongoDB                   │
│     ↓                                                │
│  10. Backend retourne le produit créé              │
│     ↓                                                │
│  11. Modal émet save.emit() ✅ CORRIGÉ             │
│     ↓                                                │
│  12. SellerMarketplace.onProductSaved()            │
│     ↓                                                │
│  13. loadProducts() → Recharge la liste            │
│     ↓                                                │
│  14. Toast "Product saved successfully! ✅"        │
│     ↓                                                │
│  15. Produit apparaît dans la liste ✅             │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Endpoints Backend

### Pour le Seller

#### Créer un Produit
```
POST /api/products
Body: {
  name: string,
  description: string,
  price: number,
  shopId: string,
  categoryIds: string[],
  stock: number,
  images: [{url: string, altText: string}],
  isNegotiable: boolean,
  condition: string
}
```

#### Voir Ses Produits
```
GET /api/products/mine
Returns: Product[] (tous les produits du seller, any status)
```

#### Modifier un Produit
```
PUT /api/products/:id
Body: Partial<ProductRequest>
```

#### Supprimer un Produit
```
DELETE /api/products/:id
```

#### Voir Tous les Produits (comme client)
```
GET /api/products
Returns: Product[] (uniquement APPROVED)
```

---

## 🏪 Shop Management

### Création Automatique du Shop

Quand un seller crée son premier produit:

```typescript
private resolveShopId() {
  // 1. Si mode édition, utiliser le shopId existant
  if (this.mode() === 'edit' && this.product()?.sellerId) {
    return of(this.product()!.sellerId);
  }
  
  // 2. Récupérer l'ID de l'utilisateur connecté
  const uid = this.authService.getUserId();
  if (!uid) {
    return throwError(() => new Error('Please sign in'));
  }
  
  // 3. Essayer de récupérer le shop du seller
  return this.shopService.getMyShop().pipe(
    map((s) => s.id),
    catchError((err) => {
      // 4. Si pas de shop (404), en créer un automatiquement
      if (err.status === 404) {
        return this.shopService.createShop(uid).pipe(
          map((s) => s.id)
        );
      }
      return throwError(() => err);
    })
  );
}
```

---

## 🎨 Interface Seller Marketplace

### URL
```
http://localhost:4200/seller/marketplace
```

### Accès
- ✅ Sellers (PROVIDER)
- ✅ Admins
- ❌ Clients (pas de bouton visible)

### Fonctionnalités

#### Tab "My Products"
```
┌──────────────────────────────────────────────┐
│  [+ Add Product]                              │
│                                               │
│  ┌────────────────────────────────────────┐  │
│  │ [Image] Gaming Mouse RGB    [PENDING]  │  │
│  │         High-performance...            │  │
│  │         85 TND | 15 stock | Electronics│  │
│  │                      [Edit] [Delete]   │  │
│  └────────────────────────────────────────┘  │
│                                               │
│  ┌────────────────────────────────────────┐  │
│  │ [Image] Wireless Keyboard   [APPROVED] │  │
│  │         Mechanical keyboard...         │  │
│  │         120 TND | 10 stock | Electronics│ │
│  │                      [Edit] [Delete]   │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

#### Tab "My Services"
```
┌──────────────────────────────────────────────┐
│  [+ Add Service]                              │
│                                               │
│  ┌────────────────────────────────────────┐  │
│  │ [Image] Math Tutoring       [APPROVED] │  │
│  │         Private lessons...             │  │
│  │         30 TND/hour | Tutoring         │  │
│  │                      [Edit] [Delete]   │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

---

## ✅ Tests de Validation

### Test 1: Créer un Produit
```bash
1. Se connecter en tant que SELLER
2. Aller sur /seller/marketplace
3. Cliquer "Add Product"
4. Remplir:
   - Name: Test Product
   - Description: Test description
   - Price: 100
   - Stock: 10
   - Category: Electronics
   - Condition: NEW
5. Cliquer "Create Listing"
6. ✅ Vérifier toast "Product saved successfully!"
7. ✅ Vérifier que le produit apparaît dans la liste
8. ✅ Vérifier en base de données MongoDB
```

### Test 2: Modifier un Produit
```bash
1. Cliquer "Edit" sur un produit
2. Modifier le prix: 120
3. Cliquer "Save Changes"
4. ✅ Vérifier toast de succès
5. ✅ Vérifier que le prix est mis à jour
6. ✅ Vérifier en base de données
```

### Test 3: Supprimer un Produit
```bash
1. Cliquer "Delete" sur un produit
2. Confirmer la suppression
3. ✅ Vérifier toast "Product deleted successfully!"
4. ✅ Vérifier que le produit disparaît
5. ✅ Vérifier en base de données (soft delete ou hard delete)
```

### Test 4: Consulter Tous les Produits
```bash
1. En tant que SELLER
2. Aller sur /products
3. ✅ Vérifier que TOUS les produits s'affichent (pas seulement les siens)
4. ✅ Vérifier qu'il peut ajouter aux favoris
5. ✅ Vérifier qu'il peut voir les détails
```

---

## 🔐 Sécurité

### Backend Validation

#### Création de Produit
```java
@PostMapping
public ResponseEntity<Product> createProduct(@RequestBody ProductRequest request) {
    // 1. Récupérer l'utilisateur connecté
    String userId = SecurityContextHolder.getContext()
        .getAuthentication().getName();
    
    // 2. Vérifier que le shopId appartient au seller
    Shop shop = shopService.findById(request.getShopId());
    if (!shop.getOwnerId().equals(userId)) {
        throw new ForbiddenException("Not your shop");
    }
    
    // 3. Créer le produit
    Product product = productService.create(request);
    return ResponseEntity.ok(product);
}
```

#### Modification de Produit
```java
@PutMapping("/{id}")
public ResponseEntity<Product> updateProduct(
    @PathVariable String id,
    @RequestBody ProductRequest request
) {
    // 1. Récupérer le produit
    Product product = productService.findById(id);
    
    // 2. Vérifier ownership
    String userId = SecurityContextHolder.getContext()
        .getAuthentication().getName();
    Shop shop = shopService.findById(product.getShopId());
    
    if (!shop.getOwnerId().equals(userId) && !isAdmin()) {
        throw new ForbiddenException("Not your product");
    }
    
    // 3. Mettre à jour
    Product updated = productService.update(id, request);
    return ResponseEntity.ok(updated);
}
```

---

## 📊 Statuts des Produits

### Workflow
```
┌─────────────────────────────────────────────┐
│         PRODUCT STATUS WORKFLOW              │
├─────────────────────────────────────────────┤
│                                              │
│  PENDING (créé par seller)                  │
│     ↓                                        │
│  Admin review                                │
│     ↓                                        │
│  ┌─────────┬─────────┐                      │
│  ↓         ↓         ↓                       │
│  APPROVED  REJECTED  (reste PENDING)         │
│                                              │
│  Visible   Pas       Pas visible             │
│  par tous  visible   par clients             │
│                                              │
└─────────────────────────────────────────────┘
```

### Visibilité

| Status | Seller (owner) | Autres Sellers | Clients | Admin |
|--------|---------------|----------------|---------|-------|
| PENDING | ✅ Visible | ❌ Non | ❌ Non | ✅ Visible |
| APPROVED | ✅ Visible | ✅ Visible | ✅ Visible | ✅ Visible |
| REJECTED | ✅ Visible | ❌ Non | ❌ Non | ✅ Visible |

---

## 🎯 Résumé

### Ce Qui Fonctionne Maintenant ✅
1. ✅ Seller peut créer des produits
2. ✅ Produits s'enregistrent en MongoDB
3. ✅ Produits apparaissent dans la liste
4. ✅ Toast notifications fonctionnent
5. ✅ Seller peut modifier ses produits
6. ✅ Seller peut supprimer ses produits
7. ✅ Seller peut voir tous les produits (comme client)
8. ✅ Shop créé automatiquement si nécessaire

### Ce Qui Reste à Faire 🔄
1. 🔄 API Services backend
2. 🔄 Upload d'images (fichiers)
3. 🔄 Filtres et recherche
4. 🔄 Pagination

---

**Date**: 30 Mars 2026  
**Status**: ✅ CORRIGÉ  
**Compilation**: ✅ SUCCESS  
**EventEmitters**: ✅ Fonctionnels  
**CRUD**: ✅ Complet
