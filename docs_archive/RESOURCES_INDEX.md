# 📚 Index des Ressources - Marketplace ESPRIT

## 🌐 URLs de l'Application

### Frontend (Port 4200)
| Page | URL | Description |
|------|-----|-------------|
| Home | http://localhost:4200/ | Page d'accueil avec produits featured |
| Products | http://localhost:4200/products | Liste des produits avec filtres |
| Product Details | http://localhost:4200/products/:id | Détails d'un produit |
| Services | http://localhost:4200/services | Liste des services |
| Profile | http://localhost:4200/profile | Profil utilisateur |
| Cart | http://localhost:4200/cart | Panier d'achats |
| Favorites | http://localhost:4200/favorites | Produits favoris |
| Forum | http://localhost:4200/forum | Forum communautaire |
| Carpooling | http://localhost:4200/carpooling | Covoiturage |

### Admin Panel (Port 4200)
| Page | URL | Description |
|------|-----|-------------|
| Dashboard | http://localhost:4200/admin | Tableau de bord admin |
| Marketplace Hub | http://localhost:4200/admin/marketplace | Hub marketplace |
| Products Admin | http://localhost:4200/admin/marketplace/products | Gestion des produits |
| Services Admin | http://localhost:4200/admin/marketplace/services | Gestion des services |
| Categories Admin | http://localhost:4200/admin/marketplace/categories | Gestion des catégories |
| Shops Admin | http://localhost:4200/admin/marketplace/shop | Gestion des boutiques |
| Favorites Admin | http://localhost:4200/admin/marketplace/favorites | Statistiques favoris |

### Backend API (Port 8090)
| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/products | GET | Liste des produits approuvés |
| /api/products/all | GET | Tous les produits (Admin) |
| /api/products/mine | GET | Mes produits (Seller) |
| /api/products/:id | GET | Détails d'un produit |
| /api/products | POST | Créer un produit |
| /api/products/:id | PUT | Modifier un produit |
| /api/products/:id | DELETE | Supprimer un produit |
| /api/products/:id/approve | PATCH | Approuver un produit |
| /api/products/:id/reject | PATCH | Rejeter un produit |
| /api/products/shop/:shopId | GET | Produits d'une boutique |
| /api/categories | GET | Liste des catégories |
| /api/categories/:id | GET | Détails d'une catégorie |
| /api/categories | POST | Créer une catégorie |
| /api/categories/:id | PUT | Modifier une catégorie |
| /api/categories/:id | DELETE | Supprimer une catégorie |
| /api/shops | GET | Liste des boutiques |
| /api/shops/me | GET | Ma boutique |
| /api/shops | POST | Créer une boutique |
| /api/favoris/toggle/product/:id | POST | Toggle favori produit |
| /api/favoris/toggle/service/:id | POST | Toggle favori service |
| /api/favoris/my | GET | Mes favoris |
| /swagger-ui.html | GET | Documentation Swagger |

---

## 📁 Structure des Fichiers

### Frontend
```
frontend/
├── src/
│   ├── app/
│   │   ├── front/                    # Pages client
│   │   │   ├── pages/
│   │   │   │   ├── home/            # Page d'accueil
│   │   │   │   ├── products/        # Liste produits
│   │   │   │   ├── profile/         # Profil + Modal
│   │   │   │   └── ...
│   │   │   ├── shared/
│   │   │   │   └── components/
│   │   │   │       └── product-card/ # Carte produit
│   │   │   └── models/
│   │   │       └── product.ts       # Modèles TypeScript
│   │   ├── back/                     # Pages admin
│   │   │   ├── features/
│   │   │   │   └── marketplace/     # Admin marketplace
│   │   │   └── core/
│   │   │       └── services/        # Services admin
│   │   └── core/
│   │       └── services/            # Services partagés
│   │           ├── product.service.ts
│   │           ├── category.service.ts
│   │           └── shop.service.ts
│   └── environment.ts               # Configuration
```

### Backend
```
backend/
├── src/
│   └── main/
│       └── java/
│           └── esprit_market/
│               ├── controller/
│               │   └── marketplaceController/
│               │       ├── ProductController.java
│               │       ├── CategoryController.java
│               │       ├── ShopController.java
│               │       └── FavorisController.java
│               ├── service/
│               │   └── marketplaceService/
│               │       ├── ProductService.java
│               │       ├── CategoryService.java
│               │       ├── ShopService.java
│               │       └── FavorisService.java
│               ├── repository/
│               │   └── marketplaceRepository/
│               ├── entity/
│               │   └── marketplace/
│               │       ├── Product.java
│               │       ├── Category.java
│               │       └── Shop.java
│               ├── dto/
│               │   └── marketplace/
│               ├── mappers/
│               │   └── marketplace/
│               │       ├── ProductMapper.java
│               │       └── CategoryMapper.java
│               └── config/
│                   ├── SecurityConfig.java
│                   ├── CorsConfig.java
│                   └── MongoConfig.java
└── pom.xml
```

---

## 📄 Documentation Créée

### Session Actuelle
| Fichier | Description |
|---------|-------------|
| `CATEGORY_FILTER_FIX.md` | Première correction du filtre |
| `CATEGORY_FILTER_IMPROVED.md` | Amélioration avec approche hybride |
| `FAKE_DATA_REMOVED.md` | Suppression des fake data |
| `SESSION_SUMMARY.md` | Résumé complet de la session |
| `QUICK_TEST_GUIDE.md` | Guide de test rapide |
| `USEFUL_COMMANDS.md` | Commandes utiles |
| `RESOURCES_INDEX.md` | Ce fichier |

### Documentation Existante
| Fichier | Description |
|---------|-------------|
| `SELLER_MARKETPLACE_ACCESS.md` | Accès marketplace pour sellers |
| `CLIENT_MARKETPLACE_COMPLETE.md` | Interface e-commerce client |
| `SHOP_FILTER_FEATURE.md` | Filtre par boutique |
| `FAVORITES_STATS_FEATURE.md` | Statistiques favoris |
| `NAVIGATION_HARMONY.md` | Boutons de navigation |
| `MARKETPLACE_UNIFIED.md` | Unification des modules |

---

## 🔑 Rôles et Permissions

### Guest (Non connecté)
- ✅ Voir les produits approuvés
- ✅ Filtrer et rechercher
- ✅ Voir les détails
- ❌ Ajouter au panier
- ❌ Créer des produits
- ❌ Ajouter aux favoris

### Client (Connecté)
- ✅ Toutes les permissions Guest
- ✅ Ajouter au panier
- ✅ Acheter des produits
- ✅ Ajouter aux favoris
- ✅ Laisser des avis
- ❌ Créer des produits

### Seller (Vendeur)
- ✅ Toutes les permissions Client
- ✅ Créer des produits
- ✅ Modifier ses produits
- ✅ Supprimer ses produits
- ✅ Voir ses statistiques
- ✅ Gérer sa boutique
- ❌ Approuver/Rejeter des produits

### Admin (Administrateur)
- ✅ Toutes les permissions
- ✅ Voir tous les produits (pending, approved, rejected)
- ✅ Approuver/Rejeter des produits
- ✅ Gérer toutes les boutiques
- ✅ Gérer les catégories
- ✅ Voir les statistiques globales
- ✅ Supprimer n'importe quel produit

---

## 🗄️ Collections MongoDB

### products
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  price: Number,
  stock: Number,
  shopId: ObjectId,
  categoryIds: [ObjectId],
  images: [{
    url: String,
    altText: String
  }],
  status: "PENDING" | "APPROVED" | "REJECTED",
  condition: "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR",
  isNegotiable: Boolean
}
```

### categories
```javascript
{
  _id: ObjectId,
  name: String,
  productIds: [ObjectId]
}
```

### shops
```javascript
{
  _id: ObjectId,
  ownerId: ObjectId,
  name: String,
  description: String,
  // ... autres champs
}
```

### favoris
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  productId: ObjectId (optionnel),
  serviceId: ObjectId (optionnel),
  createdAt: Date
}
```

---

## 🎨 Composants Réutilisables

### ProductCard
**Fichier**: `frontend/src/app/front/shared/components/product-card/`

**Props**:
- `product: Product` (required)

**Features**:
- Badge "NEW ARRIVAL" (< 7 jours)
- Image avec fallback
- Prix avec devise
- Rating avec étoiles
- Stock status
- Condition badge
- Hover effects

### ProductModal
**Fichier**: `frontend/src/app/front/pages/profile/product-modal.ts`

**Props**:
- `mode: 'add' | 'edit'`
- `product: Product | null`
- `onClose: () => void`
- `onSave: () => void`

**Features**:
- Formulaire réactif
- Validation
- Chargement catégories MongoDB
- Gestion shopId automatique
- Messages d'erreur
- Loading state

---

## 🔧 Services Frontend

### ProductService
**Fichier**: `frontend/src/app/core/services/product.service.ts`

**Méthodes**:
- `getAll(filter?)`: Liste des produits approuvés
- `getAllAdmin()`: Tous les produits (Admin)
- `getMine()`: Mes produits (Seller)
- `getById(id)`: Détails d'un produit
- `createProduct(data)`: Créer un produit
- `updateProduct(id, data)`: Modifier un produit
- `deleteProduct(id)`: Supprimer un produit
- `approveProduct(id)`: Approuver (Admin)
- `rejectProduct(id)`: Rejeter (Admin)

### CategoryService
**Fichier**: `frontend/src/app/core/services/category.service.ts`

**Méthodes**:
- `getAll()`: Liste des catégories
- `getById(id)`: Détails d'une catégorie
- `create(name)`: Créer une catégorie
- `update(id, name)`: Modifier une catégorie
- `delete(id)`: Supprimer une catégorie

### ShopService
**Fichier**: `frontend/src/app/core/services/shop.service.ts`

**Méthodes**:
- `getMyShop()`: Ma boutique
- `getAll()`: Toutes les boutiques
- `createShop(ownerId)`: Créer une boutique

---

## 🎯 Filtres Disponibles

### Page Products
1. **Search**: Recherche par nom/description
2. **Category**: Filtre par catégorie (MongoDB)
3. **Condition**: NEW, LIKE_NEW, GOOD, FAIR
4. **Price Range**: Min/Max en TND
5. **In Stock Only**: Produits disponibles
6. **Negotiable Price**: Prix négociables
7. **Sort**: Newest, Price Low-High, Price High-Low, Top Rated

---

## 📊 Statistiques et Métriques

### Performance
- **Build Time**: ~4.8 secondes
- **Hot Reload**: ~0.4 secondes
- **Bundle Size**: 357.75 KB (initial)
- **Lazy Chunks**: 30+ fichiers

### API Response Times (estimé)
- **GET /api/products**: ~200ms
- **GET /api/categories**: ~50ms
- **POST /api/products**: ~300ms
- **GET /api/products/:id**: ~100ms

---

## 🐛 Logs de Débogage

### Frontend Console
```javascript
// Chargement catégories
🏷️ Loading categories from MongoDB...
✅ Categories loaded: X

// Chargement produits
📦 Raw products from API: [...]
📦 Mapped products: [...]

// Filtre par catégorie
🏷️ Filtered by category "Electronics": X products found

// Home page
🏠 Loading products for home page...
✅ Products loaded: X
```

### Backend Logs
```
INFO: Product created successfully
INFO: Category loaded from MongoDB
ERROR: Shop not found for user
```

---

## 🔗 Liens Utiles

### Documentation Technique
- **Angular**: https://angular.io/docs
- **Spring Boot**: https://spring.io/projects/spring-boot
- **MongoDB**: https://docs.mongodb.com/

### Outils
- **MongoDB Compass**: Interface graphique MongoDB
- **Postman**: Test des APIs
- **Chrome DevTools**: Débogage frontend

---

## 📞 Support et Aide

### En cas de problème
1. Consulter `QUICK_TEST_GUIDE.md`
2. Consulter `USEFUL_COMMANDS.md`
3. Vérifier les logs (console + backend)
4. Vérifier que MongoDB est connecté
5. Vérifier que les serveurs sont en cours d'exécution

### Fichiers de logs
- Backend: `backend/backend_final.log`
- Frontend: Console du navigateur (F12)

---

## ✨ Fonctionnalités Clés

### ✅ Implémentées
- Filtre par catégorie (MongoDB)
- Modal CRUD produits
- Chargement dynamique des données
- Pagination
- Recherche et filtres avancés
- Rôles et permissions
- Statistiques favoris

### 🚧 En Développement
- Système de promotions dynamique
- Upload d'images vers CDN
- Recommandations AI
- Notifications temps réel

### 💡 Idées Futures
- Chat vendeur-acheteur
- Système de reviews
- Historique des achats
- Analytics avancés
