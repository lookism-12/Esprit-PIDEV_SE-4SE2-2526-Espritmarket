# 🚀 Quick Start - Testing Guide

## ⚡ Démarrage Rapide

### 1. Lancer les Serveurs

```bash
# Terminal 1 - Backend (port 8090)
cd backend
./mvnw spring-boot:run

# Terminal 2 - Frontend (port 4200)
cd frontend
npm start
```

### 2. Accéder à l'Application

```
Frontend: http://localhost:4200
Backend API: http://localhost:8090
```

---

## 🧪 Tests Rapides

### Test 1: Quick View Fix (2 min)

```bash
1. Ouvrir http://localhost:4200/products
2. Cliquer "Quick View" sur "Wireless Keyboard"
   ✅ Vérifier que "Wireless Keyboard" s'affiche
3. Cliquer "Quick View" sur "Gaming Mouse"
   ✅ Vérifier que "Gaming Mouse" s'affiche
```

**Résultat**: Chaque produit affiche ses propres données ✅

---

### Test 2: Favoris (1 min)

```bash
1. Sur http://localhost:4200/products
2. Hover sur une ProductCard
3. Cliquer sur l'icône cœur (en haut à droite)
   ✅ Toast "Added to favorites! ❤️"
   ✅ Icône devient rouge et pleine
4. Cliquer à nouveau
   ✅ Toast "Removed from favorites"
   ✅ Icône redevient vide
```

**Résultat**: Toggle favoris fonctionne avec feedback ✅

---

### Test 3: Seller Marketplace (5 min)

```bash
1. Se connecter en tant que SELLER
2. Aller sur http://localhost:4200/profile
3. Cliquer "🏪 Manage Marketplace"
   ✅ Redirection vers /seller/marketplace
   ✅ Dashboard stats s'affiche
4. Cliquer "Add Product" (Quick Actions)
5. Remplir le formulaire:
   Name: Test Product
   Description: Test description for testing
   Price: 100
   Stock: 10
   Category: Electronics
   Condition: NEW
6. Cliquer "Create Listing"
   ✅ Toast "Product saved successfully! ✅"
   ✅ Produit apparaît dans la liste
7. Cliquer "Edit" sur le produit
8. Modifier le prix à 120
9. Cliquer "Save Changes"
   ✅ Toast de succès
   ✅ Prix mis à jour
10. Cliquer "Delete"
11. Confirmer
    ✅ Toast "Product deleted successfully! 🗑️"
    ✅ Produit disparaît
```

**Résultat**: CRUD complet fonctionne ✅

---

## 🎯 Checklist Rapide

### Bugs Fixes
- [ ] Quick View affiche le bon produit
- [ ] Favoris toggle fonctionne
- [ ] Toast notifications s'affichent
- [ ] Pas d'erreur console

### Seller Marketplace
- [ ] Bouton "Manage Marketplace" visible pour sellers
- [ ] Dashboard stats affichées
- [ ] Ajout de produit fonctionne
- [ ] Édition de produit fonctionne
- [ ] Suppression de produit fonctionne
- [ ] Empty states affichés
- [ ] Loading spinners affichés

---

## 🐛 Problèmes Connus

### Services API 🔄
**Status**: TODO  
**Description**: API Services backend pas encore implémentée  
**Impact**: Tab "My Services" affiche empty state

**Workaround**: Utiliser uniquement tab "My Products" pour l'instant

---

## 📝 Commandes Utiles

### Compilation
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
./mvnw clean package
```

### Logs
```bash
# Frontend (console browser)
F12 → Console

# Backend (terminal)
Voir output du mvnw spring-boot:run
```

### Reset
```bash
# Restart Frontend
Ctrl+C dans terminal frontend
npm start

# Restart Backend
Ctrl+C dans terminal backend
./mvnw spring-boot:run
```

---

## 🎨 URLs Importantes

### Frontend
- Home: http://localhost:4200
- Products: http://localhost:4200/products
- Product Details: http://localhost:4200/product/:id
- Profile: http://localhost:4200/profile
- Seller Marketplace: http://localhost:4200/seller/marketplace
- Login: http://localhost:4200/login

### Backend API
- Products: http://localhost:8090/api/products
- My Products: http://localhost:8090/api/products/mine
- Categories: http://localhost:8090/api/categories
- Shops: http://localhost:8090/api/shops
- Favoris: http://localhost:8090/api/favoris

---

## 👤 Comptes de Test

### Seller
```
Email: seller@esprit.tn
Password: [votre mot de passe]
Role: SELLER
```

### Admin
```
Email: admin@esprit.tn
Password: [votre mot de passe]
Role: ADMIN
```

### Client
```
Email: client@esprit.tn
Password: [votre mot de passe]
Role: CLIENT
```

---

## ✅ Résultat Attendu

Après les tests, vous devriez avoir:

1. ✅ Quick View qui affiche le bon produit
2. ✅ Favoris fonctionnels avec toast
3. ✅ Seller Marketplace accessible
4. ✅ CRUD produits complet
5. ✅ Dashboard stats affichées
6. ✅ Empty states et loading states
7. ✅ Toast notifications
8. ✅ Pas d'erreur console

---

## 🆘 En Cas de Problème

### Frontend ne compile pas
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Backend ne démarre pas
```bash
cd backend
./mvnw clean
./mvnw spring-boot:run
```

### Port déjà utilisé
```bash
# Frontend (port 4200)
lsof -ti:4200 | xargs kill -9

# Backend (port 8090)
lsof -ti:8090 | xargs kill -9
```

### Erreur MongoDB
```bash
# Vérifier que MongoDB est lancé
mongosh

# Si pas lancé
mongod --dbpath /path/to/data
```

---

## 📊 Temps Estimés

- Setup (lancer serveurs): 2 min
- Test Quick View: 2 min
- Test Favoris: 1 min
- Test Seller Marketplace: 5 min
- **Total**: ~10 minutes

---

## 🎯 Priorités de Test

### Priorité 1 (Critique)
1. Quick View affiche bon produit
2. Favoris toggle fonctionne
3. Seller Marketplace accessible

### Priorité 2 (Important)
1. CRUD produits complet
2. Dashboard stats correctes
3. Toast notifications

### Priorité 3 (Nice to have)
1. Empty states
2. Loading states
3. Responsive design

---

**Date**: 30 Mars 2026  
**Version**: 1.0.0  
**Status**: ✅ Ready for Testing  
**Temps Total**: ~10 minutes
