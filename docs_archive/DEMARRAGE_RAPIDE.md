# ⚡ Démarrage Rapide - Test CRUD Seller

## 🚀 Lancement (2 commandes)

```bash
# Terminal 1
cd backend && ./mvnw spring-boot:run

# Terminal 2
cd frontend && npm start
```

Attendre les messages:
- Backend: `Started EspritMarketApplication`
- Frontend: `✔ Compiled successfully`

---

## 🧪 Test en 3 Étapes (3 minutes)

### 1. Connexion
```
URL: http://localhost:4200/login
Email: seller@esprit.tn
Password: [votre mot de passe]
```

### 2. Accès Marketplace
```
Profile → 🏪 Manage Marketplace
```

### 3. Créer un Produit
```
Add Product → Remplir:
- Name: Test Gaming Mouse
- Description: High-performance gaming mouse
- Price: 85
- Stock: 10
- Category: Electronics
- Condition: NEW
- Image: https://picsum.photos/400/400?random=1
- ☑ Price is Negotiable

→ Create Listing
```

---

## ✅ Vérifications

### Frontend
```
✅ Toast: "Product saved successfully! ✅"
✅ Modal se ferme
✅ Produit dans la liste
✅ Stats: Total Products = 1
```

### MongoDB
```bash
mongosh
use esprit_market
db.products.find({name: "Test Gaming Mouse"}).pretty()
```

---

## 🎯 Résultat Attendu

```
┌────────────────────────────────────────┐
│ [Image] Test Gaming Mouse   [PENDING]  │
│         High-performance gaming...     │
│         85 TND | 10 stock | Electronics│
│         [Edit] [Delete]                │
└────────────────────────────────────────┘
```

---

## 🐛 Si Problème

### Produit ne s'enregistre pas
```
1. F12 → Console → Chercher erreurs
2. Vérifier logs backend (Terminal 1)
3. Vérifier MongoDB: db.products.find().count()
```

### Catégories vides
```bash
mongosh
use esprit_market
db.categories.insertMany([
  {name: "Electronics", description: "Electronic devices", createdAt: new Date(), updatedAt: new Date()},
  {name: "Books", description: "Books", createdAt: new Date(), updatedAt: new Date()}
])
```

### Shop manquant
```bash
mongosh
use esprit_market
db.shops.insertOne({
  name: "My Shop",
  description: "My shop",
  ownerId: "YOUR_USER_ID",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

---

## 📚 Documentation Complète

- **TEST_MAINTENANT.md** - Guide détaillé 5 min
- **CORRECTION_SELLER_CRUD_FR.md** - Explication technique
- **RESUME_SESSION_ACTUELLE.md** - Résumé complet

---

**Status**: ✅ PRÊT  
**Durée**: 3 minutes  
**Objectif**: Vérifier que le CRUD fonctionne

## ▶️ COMMENCER!
