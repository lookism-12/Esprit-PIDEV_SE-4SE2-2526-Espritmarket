# 🚀 TEST MAINTENANT - Guide Rapide

## ⚡ Lancement Rapide

### Terminal 1: Backend
```bash
cd backend
./mvnw spring-boot:run
```

Attendre le message:
```
Started EspritMarketApplication in X seconds
```

### Terminal 2: Frontend
```bash
cd frontend
npm start
```

Attendre le message:
```
✔ Compiled successfully
```

---

## 🧪 Test Complet en 5 Minutes

### 1. Se Connecter (30 secondes)
```
URL: http://localhost:4200/login

Credentials:
- Email: seller@esprit.tn (ou votre compte SELLER)
- Password: [votre mot de passe]

Cliquer "Login"
```

### 2. Accéder au Marketplace Seller (10 secondes)
```
URL: http://localhost:4200/profile

Cliquer sur le bouton:
🏪 Manage Marketplace

→ Redirection vers /seller/marketplace
```

### 3. Créer un Produit (2 minutes)
```
Sur /seller/marketplace:

1. Cliquer "Add Product" (Quick Actions ou Empty State)

2. Remplir le formulaire:
   ┌─────────────────────────────────────────┐
   │ Product Name *                          │
   │ [Test Gaming Mouse RGB Pro]             │
   │                                         │
   │ Price (TND) *      Stock Quantity       │
   │ [85.00]            [15]                 │
   │                                         │
   │ Category *         Condition            │
   │ [Electronics ▼]    [NEW ▼]              │
   │                                         │
   │ Description *                           │
   │ [High-performance gaming mouse with]    │
   │ [RGB lighting and programmable buttons] │
   │                                         │
   │ Image URL                               │
   │ [https://picsum.photos/400/400?random=1]│
   │                                         │
   │ ☑ Price is Negotiable                  │
   │                                         │
   │ [Cancel]  [Create Listing]              │
   └─────────────────────────────────────────┘

3. Cliquer "Create Listing"
```

### 4. Vérifier le Résultat (30 secondes)
```
✅ Vérifications immédiates:

1. Toast notification apparaît:
   "Product saved successfully! ✅"

2. Modal se ferme automatiquement

3. Produit apparaît dans la liste:
   ┌────────────────────────────────────────┐
   │ [Image] Test Gaming Mouse RGB Pro      │
   │         [PENDING]                      │
   │         High-performance gaming...     │
   │         85 TND | 15 stock | Electronics│
   │         [Edit] [Delete]                │
   └────────────────────────────────────────┘

4. Stats mises à jour:
   Total Products: 1
   Pending Products: 1
```

### 5. Vérifier MongoDB (1 minute)
```bash
# Ouvrir un nouveau terminal
mongosh

# Commandes:
use esprit_market
db.products.find({name: "Test Gaming Mouse RGB Pro"}).pretty()

# Résultat attendu:
{
  _id: ObjectId("..."),
  name: "Test Gaming Mouse RGB Pro",
  description: "High-performance gaming mouse...",
  price: 85,
  stock: 15,
  categoryIds: [ObjectId("...")],
  condition: "NEW",
  isNegotiable: true,
  status: "PENDING",
  shopId: ObjectId("..."),
  images: [{url: "https://...", altText: "..."}],
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

---

## ✅ Checklist Rapide

### Création ✓
- [ ] Modal s'ouvre
- [ ] Formulaire vide
- [ ] Catégories chargées
- [ ] Validation fonctionne
- [ ] Sauvegarde réussie
- [ ] Toast affiché
- [ ] Modal se ferme
- [ ] Produit dans la liste
- [ ] Stats mises à jour
- [ ] En MongoDB

### Modification ✓
- [ ] Clic "Edit" ouvre modal
- [ ] Données pré-remplies
- [ ] Modifications enregistrées
- [ ] Liste mise à jour

### Suppression ✓
- [ ] Dialog de confirmation
- [ ] Suppression réussie
- [ ] Produit disparaît
- [ ] Stats mises à jour

---

## 🐛 Si Problème

### Produit ne s'enregistre pas

#### 1. Vérifier Console Frontend (F12)
```javascript
// Doit afficher:
✅ Product saved successfully!
🔄 Loading seller products...
✅ Products loaded: 1

// Si erreur:
❌ Failed to save product
→ Vérifier les logs backend
```

#### 2. Vérifier Logs Backend (Terminal 1)
```
// Doit afficher:
POST /api/products - Creating product: name=Test Gaming Mouse RGB Pro, shopId=..., categoryIds=...
Product created successfully with ID: ...

// Si erreur:
❌ Error creating product: ...
→ Lire le message d'erreur
```

#### 3. Vérifier MongoDB
```bash
mongosh
use esprit_market

# Vérifier que la base existe
show dbs

# Vérifier les collections
show collections

# Vérifier les produits
db.products.find().count()
db.products.find().pretty()
```

### Modal ne se ferme pas

```
Cause: EventEmitters non connectés

Solution:
1. Vérifier que product-modal.component.ts a:
   @Output() close = new EventEmitter<void>();
   @Output() save = new EventEmitter<void>();

2. Vérifier que seller-marketplace.html a:
   (close)="closeProductModal()"
   (save)="onProductSaved()"

3. Recompiler:
   cd frontend
   npm start
```

### Erreur "No shop exists"

```bash
# Créer un shop manuellement
mongosh
use esprit_market

db.shops.insertOne({
  name: "My Shop",
  description: "My shop description",
  ownerId: "YOUR_USER_ID",  # Remplacer par votre user ID
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Catégories vides

```bash
# Ajouter des catégories
mongosh
use esprit_market

db.categories.insertMany([
  {name: "Electronics", description: "Electronic devices", createdAt: new Date(), updatedAt: new Date()},
  {name: "Books", description: "Books and textbooks", createdAt: new Date(), updatedAt: new Date()},
  {name: "Clothing", description: "Clothes and accessories", createdAt: new Date(), updatedAt: new Date()},
  {name: "Sports", description: "Sports equipment", createdAt: new Date(), updatedAt: new Date()}
])
```

---

## 📊 Console Logs Attendus

### Frontend (F12 → Console)
```javascript
// Au chargement de /seller/marketplace
🔄 Loading seller products...
✅ Products loaded: 0

// Lors de la création
POST http://localhost:8090/api/products 200 OK
✅ Product saved successfully!
🔄 Loading seller products...
GET http://localhost:8090/api/products/mine 200 OK
✅ Products loaded: 1

// Lors de la modification
PUT http://localhost:8090/api/products/... 200 OK
✅ Product saved successfully!
🔄 Loading seller products...
✅ Products loaded: 1

// Lors de la suppression
🗑️ Deleting product: ...
DELETE http://localhost:8090/api/products/... 200 OK
✅ Product deleted
🔄 Loading seller products...
✅ Products loaded: 0
```

### Backend (Terminal 1)
```
// Au démarrage
Started EspritMarketApplication in 15.234 seconds

// Lors de la création
POST /api/products - Creating product: name=Test Gaming Mouse RGB Pro, shopId=..., categoryIds=...
Product created successfully with ID: 67890abcdef...

// Lors de la récupération
GET /api/products/mine - Requesting products for seller
Returning 1 products

// Lors de la modification
PUT /api/products/67890abcdef... - Updating product
Product updated successfully

// Lors de la suppression
DELETE /api/products/67890abcdef... - Deleting product
Product deleted successfully
```

---

## 🎯 Test Réussi Si...

```
✅ Toast "Product saved successfully! ✅" affiché
✅ Modal se ferme automatiquement
✅ Produit visible dans la liste avec:
   - Image
   - Nom: "Test Gaming Mouse RGB Pro"
   - Prix: 85 TND
   - Stock: 15
   - Catégorie: Electronics
   - Status: PENDING (badge jaune)
   - Boutons Edit et Delete
✅ Stats dashboard mises à jour:
   - Total Products: 1
   - Pending Products: 1
✅ Produit en MongoDB avec tous les champs
✅ Console logs corrects (pas d'erreur)
✅ Backend logs corrects (pas d'erreur)
```

---

## 🚀 Après Test Réussi

### Tester la Modification
```
1. Cliquer "Edit" sur le produit
2. Changer le prix: 95
3. Changer le stock: 20
4. Cliquer "Save Changes"
5. Vérifier que les changements sont visibles
```

### Tester la Suppression
```
1. Cliquer "Delete" sur le produit
2. Confirmer dans le dialog
3. Vérifier que le produit disparaît
4. Vérifier les stats: Total Products: 0
```

### Tester en tant que Client
```
1. Aller sur /products
2. Vérifier que le produit n'est PAS visible (status PENDING)
3. En tant qu'admin, approuver le produit
4. Retourner sur /products
5. Vérifier que le produit est maintenant visible
```

---

## 📝 Rapport de Test

Après avoir effectué tous les tests, remplir:

```
Date: _______________
Testeur: _______________

CRÉATION:
[ ] Modal s'ouvre: ___
[ ] Sauvegarde: ___
[ ] Toast: ___
[ ] Liste mise à jour: ___
[ ] MongoDB: ___

MODIFICATION:
[ ] Modal s'ouvre: ___
[ ] Sauvegarde: ___
[ ] Liste mise à jour: ___
[ ] MongoDB: ___

SUPPRESSION:
[ ] Confirmation: ___
[ ] Suppression: ___
[ ] Liste mise à jour: ___
[ ] MongoDB: ___

NOTES:
_________________________________
_________________________________
_________________________________
```

---

**Date**: 30 Mars 2026  
**Durée Estimée**: 5 minutes  
**Prérequis**: Backend + Frontend lancés  
**Objectif**: Vérifier que le CRUD fonctionne

## ▶️ COMMENCER MAINTENANT!
