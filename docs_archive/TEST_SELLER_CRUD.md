# 🧪 Test CRUD Seller - Guide Complet

## 🎯 Objectif
Vérifier que le seller (PROVIDER) peut créer, modifier et supprimer des produits, et que tout s'enregistre correctement en base de données.

---

## ⚙️ Prérequis

### 1. Serveurs Lancés
```bash
# Terminal 1 - Backend (port 8090)
cd backend
./mvnw spring-boot:run

# Terminal 2 - Frontend (port 4200)
cd frontend
npm start
```

### 2. Compte Seller
- Email: seller@esprit.tn (ou créer un nouveau compte)
- Role: SELLER
- Mot de passe: [votre mot de passe]

### 3. MongoDB
- MongoDB doit être lancé
- Base de données: esprit_market

---

## ✅ Test 1: CREATE (Créer un Produit)

### Étapes
```
1. Se connecter en tant que SELLER
   URL: http://localhost:4200/login
   
2. Aller sur le profil
   URL: http://localhost:4200/profile
   
3. Cliquer sur "🏪 Manage Marketplace"
   → Redirection vers /seller/marketplace
   
4. Vérifier que la page se charge
   ✅ Dashboard stats affichées
   ✅ Tab "My Products" actif
   
5. Cliquer sur "Add Product" (Quick Actions ou Empty State)
   ✅ Modal s'ouvre
   
6. Remplir le formulaire:
   Name: Gaming Mouse RGB Pro
   Description: High-performance gaming mouse with RGB lighting and programmable buttons
   Price: 85
   Stock: 15
   Category: Electronics (sélectionner dans la liste)
   Condition: NEW
   Image URL: https://picsum.photos/400/400?random=1
   ☑ Price is Negotiable
   
7. Cliquer "Create Listing"
   
8. Attendre 1-2 secondes
```

### Résultats Attendus
```
✅ Toast notification: "Product saved successfully! ✅"
✅ Modal se ferme automatiquement
✅ Produit apparaît dans la liste "My Products"
✅ Stats se mettent à jour (Total Products +1)
✅ Produit affiché avec:
   - Image
   - Nom: "Gaming Mouse RGB Pro"
   - Description tronquée
   - Prix: 85 TND
   - Stock: 15
   - Catégorie: Electronics
   - Status: PENDING (badge jaune)
   - Boutons Edit et Delete visibles
```

### Vérification en Base de Données
```bash
# Ouvrir MongoDB
mongosh

# Sélectionner la base
use esprit_market

# Chercher le produit
db.products.find({name: "Gaming Mouse RGB Pro"}).pretty()

# Vérifier les champs:
✅ name: "Gaming Mouse RGB Pro"
✅ description: "High-performance gaming..."
✅ price: 85
✅ stock: 15
✅ categoryIds: [ObjectId(...)]
✅ condition: "NEW"
✅ isNegotiable: true
✅ status: "PENDING"
✅ shopId: ObjectId(...)
✅ images: [{url: "https://...", altText: "..."}]
✅ createdAt: Date(...)
✅ updatedAt: Date(...)
```

---

## ✅ Test 2: READ (Lire les Produits)

### Étapes
```
1. Sur /seller/marketplace
2. Observer la liste des produits
3. Vérifier les stats dashboard
```

### Résultats Attendus
```
✅ Tous les produits du seller affichés
✅ Stats correctes:
   - Total Products: X
   - Active Products: Y (status APPROVED)
   - Pending Products: Z (status PENDING)
✅ Chaque produit affiche:
   - Image
   - Nom
   - Description
   - Prix
   - Stock
   - Catégorie
   - Status badge
   - Boutons Edit/Delete
✅ Hover effect sur les cards
✅ Pas d'erreur console
```

---

## ✅ Test 3: UPDATE (Modifier un Produit)

### Étapes
```
1. Sur /seller/marketplace
2. Trouver le produit "Gaming Mouse RGB Pro"
3. Cliquer sur "Edit"
4. Modal s'ouvre avec données pré-remplies
5. Modifier:
   Name: Gaming Mouse RGB Pro Max
   Price: 95
   Stock: 20
   Description: Enhanced version with...
6. Cliquer "Save Changes"
7. Attendre 1-2 secondes
```

### Résultats Attendus
```
✅ Toast notification: "Product saved successfully! ✅"
✅ Modal se ferme
✅ Produit mis à jour dans la liste:
   - Nom: "Gaming Mouse RGB Pro Max"
   - Prix: 95 TND
   - Stock: 20
✅ Description mise à jour
✅ Pas d'erreur console
```

### Vérification en Base de Données
```bash
mongosh
use esprit_market
db.products.find({name: "Gaming Mouse RGB Pro Max"}).pretty()

# Vérifier:
✅ name: "Gaming Mouse RGB Pro Max"
✅ price: 95
✅ stock: 20
✅ updatedAt: Date(...) (plus récent que createdAt)
```

---

## ✅ Test 4: DELETE (Supprimer un Produit)

### Étapes
```
1. Sur /seller/marketplace
2. Trouver un produit à supprimer
3. Cliquer sur "Delete"
4. Dialog de confirmation s'affiche
5. Confirmer la suppression
6. Attendre 1-2 secondes
```

### Résultats Attendus
```
✅ Dialog de confirmation: "Delete [nom du produit]?"
✅ Toast notification: "Product deleted successfully! 🗑️"
✅ Produit disparaît de la liste
✅ Stats se mettent à jour (Total Products -1)
✅ Pas d'erreur console
```

### Vérification en Base de Données
```bash
mongosh
use esprit_market

# Chercher le produit supprimé
db.products.find({name: "Gaming Mouse RGB Pro Max"})

# Résultat attendu:
✅ Aucun document trouvé (hard delete)
OU
✅ Document avec status: "DELETED" (soft delete)
```

---

## ✅ Test 5: Consulter Tous les Produits (comme Client)

### Étapes
```
1. En tant que SELLER connecté
2. Aller sur /products
3. Observer la liste
```

### Résultats Attendus
```
✅ TOUS les produits APPROVED affichés (pas seulement les siens)
✅ Produits d'autres sellers visibles
✅ Peut cliquer "Quick View"
✅ Peut ajouter aux favoris
✅ Peut voir les détails
✅ Interface e-commerce normale
```

---

## ✅ Test 6: Empty State

### Étapes
```
1. Seller sans aucun produit
2. Aller sur /seller/marketplace
3. Tab "My Products"
```

### Résultats Attendus
```
✅ Empty state affiché:
   [📦]
   No products yet
   Start selling by adding your first product
   [Add Product]
   
✅ Bouton "Add Product" fonctionnel
✅ Clic ouvre le modal
```

---

## ✅ Test 7: Loading State

### Étapes
```
1. Rafraîchir la page /seller/marketplace
2. Observer pendant le chargement
```

### Résultats Attendus
```
✅ Loading spinner affiché
✅ Spinner disparaît après chargement
✅ Données s'affichent
✅ Pas de flash de contenu
```

---

## ✅ Test 8: Validation Formulaire

### Étapes
```
1. Ouvrir modal "Add Product"
2. Essayer de soumettre sans remplir
3. Remplir progressivement
```

### Résultats Attendus
```
✅ Bouton "Create Listing" disabled si formulaire invalide
✅ Messages d'erreur sous les champs:
   - Name: "Required field"
   - Description: "Required field"
   - Price: "Must be positive"
   - Category: "Required field"
✅ Champs requis marqués en rouge
✅ Validation en temps réel
✅ Bouton enabled quand formulaire valide
```

---

## ✅ Test 9: Shop Auto-Creation

### Étapes
```
1. Nouveau seller sans shop
2. Créer son premier produit
3. Observer les logs backend
```

### Résultats Attendus
```
✅ Shop créé automatiquement
✅ Produit associé au shop
✅ Pas d'erreur
✅ Seller peut continuer à ajouter des produits
```

### Vérification en Base de Données
```bash
mongosh
use esprit_market

# Chercher le shop du seller
db.shops.find({ownerId: "seller_user_id"}).pretty()

# Vérifier:
✅ Shop existe
✅ ownerId correspond au seller
✅ name, description, etc.
```

---

## ✅ Test 10: Erreurs Backend

### Étapes
```
1. Arrêter le backend
2. Essayer de créer un produit
3. Observer le comportement
```

### Résultats Attendus
```
✅ Toast error: "Failed to save product"
✅ Modal reste ouvert
✅ Formulaire garde les données
✅ Utilisateur peut réessayer
✅ Pas de crash frontend
```

---

## 🐛 Problèmes Possibles

### Problème 1: Produit ne s'enregistre pas
**Symptômes**: Toast success mais produit n'apparaît pas

**Solutions**:
```bash
# 1. Vérifier les logs backend
cd backend
# Observer les logs dans le terminal

# 2. Vérifier MongoDB
mongosh
use esprit_market
db.products.find().sort({createdAt: -1}).limit(1).pretty()

# 3. Vérifier la console frontend
F12 → Console → Chercher les erreurs
```

### Problème 2: Modal ne se ferme pas
**Symptômes**: Modal reste ouvert après sauvegarde

**Solutions**:
```bash
# 1. Vérifier les EventEmitters
# Fichier: product-modal.component.ts
# Ligne: @Output() close = new EventEmitter<void>();
# Ligne: @Output() save = new EventEmitter<void>();

# 2. Vérifier le template
# Fichier: seller-marketplace.html
# Ligne: (close)="closeProductModal()"
# Ligne: (save)="onProductSaved()"
```

### Problème 3: Shop non créé
**Symptômes**: Erreur "No shop exists"

**Solutions**:
```bash
# 1. Vérifier ShopService
# 2. Créer un shop manuellement:
mongosh
use esprit_market
db.shops.insertOne({
  name: "My Shop",
  description: "My shop description",
  ownerId: "seller_user_id",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

---

## 📊 Checklist Complète

### Création
- [ ] Modal s'ouvre
- [ ] Formulaire vide
- [ ] Catégories chargées
- [ ] Validation fonctionne
- [ ] Sauvegarde réussie
- [ ] Toast affiché
- [ ] Modal se ferme
- [ ] Produit dans la liste
- [ ] Stats mises à jour
- [ ] En base de données

### Lecture
- [ ] Liste affichée
- [ ] Stats correctes
- [ ] Images affichées
- [ ] Status badges corrects
- [ ] Hover effects
- [ ] Pas d'erreur console

### Modification
- [ ] Modal s'ouvre
- [ ] Données pré-remplies
- [ ] Modifications enregistrées
- [ ] Toast affiché
- [ ] Liste mise à jour
- [ ] En base de données

### Suppression
- [ ] Dialog de confirmation
- [ ] Suppression réussie
- [ ] Toast affiché
- [ ] Produit disparaît
- [ ] Stats mises à jour
- [ ] En base de données

### Navigation
- [ ] Bouton "Manage Marketplace" visible
- [ ] Redirection correcte
- [ ] Back to Profile fonctionne
- [ ] Peut consulter /products
- [ ] Voit tous les produits

---

## 🎯 Résultat Attendu Global

Après tous les tests, le seller doit pouvoir:
1. ✅ Créer des produits qui s'enregistrent en MongoDB
2. ✅ Voir tous ses produits avec stats
3. ✅ Modifier ses produits
4. ✅ Supprimer ses produits
5. ✅ Consulter tous les produits comme un client
6. ✅ Recevoir des feedbacks clairs (toasts)
7. ✅ Naviguer intuitivement
8. ✅ Shop créé automatiquement si nécessaire

---

**Date**: 30 Mars 2026  
**Status**: ✅ PRÊT POUR TEST  
**Durée Estimée**: 15-20 minutes  
**Tests**: 10 scénarios
