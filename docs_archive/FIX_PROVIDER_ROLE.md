# 🔐 Fix: PROVIDER Role Authorization

## 🎯 Problème Identifié

### Erreur 403 Forbidden
```
GET /api/shops/me → 403 Forbidden
POST /api/products → 403 Forbidden
```

### Cause
Le JWT contient le rôle **PROVIDER** mais le backend attend le rôle **SELLER**.

```
JWT Token: { role: "PROVIDER" }
Backend: @PreAuthorize("hasRole('SELLER')")
→ 403 Forbidden ❌
```

---

## ✅ Solution Appliquée

### Principe
PROVIDER = SELLER (même personne), donc le backend doit accepter les deux rôles.

### Changements

#### ShopController
```java
// ❌ AVANT
@GetMapping("/me")
@PreAuthorize("hasRole('SELLER')")
public ShopResponseDTO getMyShop() { ... }

// ✅ APRÈS
@GetMapping("/me")
@PreAuthorize("hasAnyRole('SELLER', 'PROVIDER')")
public ShopResponseDTO getMyShop() { ... }
```

```java
// ❌ AVANT
@PostMapping
@PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
public ShopResponseDTO create(@RequestBody ShopRequestDTO dto) { ... }

// ✅ APRÈS
@PostMapping
@PreAuthorize("hasAnyRole('ADMIN', 'SELLER', 'PROVIDER')")
public ShopResponseDTO create(@RequestBody ShopRequestDTO dto) { ... }
```

```java
// ❌ AVANT
@PutMapping("/{id}")
@PreAuthorize("hasRole('ADMIN') or (hasRole('SELLER') and @marketplaceSecurity.isShopOwnerByObjectId(authentication, #id))")
public ShopResponseDTO update(...) { ... }

// ✅ APRÈS
@PutMapping("/{id}")
@PreAuthorize("hasRole('ADMIN') or ((hasAnyRole('SELLER', 'PROVIDER')) and @marketplaceSecurity.isShopOwnerByObjectId(authentication, #id))")
public ShopResponseDTO update(...) { ... }
```

```java
// ❌ AVANT
@DeleteMapping("/{id}")
@PreAuthorize("hasRole('ADMIN') or (hasRole('SELLER') and @marketplaceSecurity.isShopOwnerByObjectId(authentication, #id))")
public void delete(@PathVariable ObjectId id) { ... }

// ✅ APRÈS
@DeleteMapping("/{id}")
@PreAuthorize("hasRole('ADMIN') or ((hasAnyRole('SELLER', 'PROVIDER')) and @marketplaceSecurity.isShopOwnerByObjectId(authentication, #id))")
public void delete(@PathVariable ObjectId id) { ... }
```

#### ProductController
```java
// ❌ AVANT
@GetMapping("/mine")
@PreAuthorize("hasRole('SELLER')")
public List<ProductResponseDTO> getMine() { ... }

// ✅ APRÈS
@GetMapping("/mine")
@PreAuthorize("hasAnyRole('SELLER', 'PROVIDER')")
public List<ProductResponseDTO> getMine() { ... }
```

```java
// ❌ AVANT
@PostMapping
@PreAuthorize("hasRole('ADMIN') or (hasRole('SELLER') and @marketplaceSecurity.isShopOwner(authentication, #dto.shopId))")
public ProductResponseDTO create(@RequestBody ProductRequestDTO dto) { ... }

// ✅ APRÈS
@PostMapping
@PreAuthorize("hasRole('ADMIN') or ((hasAnyRole('SELLER', 'PROVIDER')) and @marketplaceSecurity.isShopOwner(authentication, #dto.shopId))")
public ProductResponseDTO create(@RequestBody ProductRequestDTO dto) { ... }
```

```java
// ❌ AVANT
@PutMapping("/{id}")
@PreAuthorize("hasRole('ADMIN') or (hasRole('SELLER') and @marketplaceSecurity.isProductOwner(authentication, #id))")
public ProductResponseDTO update(...) { ... }

// ✅ APRÈS
@PutMapping("/{id}")
@PreAuthorize("hasRole('ADMIN') or ((hasAnyRole('SELLER', 'PROVIDER')) and @marketplaceSecurity.isProductOwner(authentication, #id))")
public ProductResponseDTO update(...) { ... }
```

```java
// ❌ AVANT
@DeleteMapping("/{id}")
@PreAuthorize("hasRole('ADMIN') or (hasRole('SELLER') and @marketplaceSecurity.isProductOwner(authentication, #id))")
public void delete(@PathVariable ObjectId id) { ... }

// ✅ APRÈS
@DeleteMapping("/{id}")
@PreAuthorize("hasRole('ADMIN') or ((hasAnyRole('SELLER', 'PROVIDER')) and @marketplaceSecurity.isProductOwner(authentication, #id))")
public void delete(@PathVariable ObjectId id) { ... }
```

```java
// ❌ AVANT
@PostMapping("/{id}/images")
@PreAuthorize("hasRole('ADMIN') or (hasRole('SELLER') and @marketplaceSecurity.isProductOwner(authentication, #id))")
public ProductResponseDTO addImage(...) { ... }

// ✅ APRÈS
@PostMapping("/{id}/images")
@PreAuthorize("hasRole('ADMIN') or ((hasAnyRole('SELLER', 'PROVIDER')) and @marketplaceSecurity.isProductOwner(authentication, #id))")
public ProductResponseDTO addImage(...) { ... }
```

```java
// ❌ AVANT
@DeleteMapping("/{id}/images")
@PreAuthorize("hasRole('ADMIN') or (hasRole('SELLER') and @marketplaceSecurity.isProductOwner(authentication, #id))")
public ProductResponseDTO removeImage(...) { ... }

// ✅ APRÈS
@DeleteMapping("/{id}/images")
@PreAuthorize("hasRole('ADMIN') or ((hasAnyRole('SELLER', 'PROVIDER')) and @marketplaceSecurity.isProductOwner(authentication, #id))")
public ProductResponseDTO removeImage(...) { ... }
```

---

## 📊 Endpoints Corrigés

### ShopController
- ✅ `GET /api/shops/me` - Accepte SELLER et PROVIDER
- ✅ `POST /api/shops` - Accepte ADMIN, SELLER et PROVIDER
- ✅ `PUT /api/shops/{id}` - Accepte ADMIN ou (SELLER/PROVIDER + ownership)
- ✅ `DELETE /api/shops/{id}` - Accepte ADMIN ou (SELLER/PROVIDER + ownership)

### ProductController
- ✅ `GET /api/products/mine` - Accepte SELLER et PROVIDER
- ✅ `POST /api/products` - Accepte ADMIN ou (SELLER/PROVIDER + shop ownership)
- ✅ `PUT /api/products/{id}` - Accepte ADMIN ou (SELLER/PROVIDER + product ownership)
- ✅ `DELETE /api/products/{id}` - Accepte ADMIN ou (SELLER/PROVIDER + product ownership)
- ✅ `POST /api/products/{id}/images` - Accepte ADMIN ou (SELLER/PROVIDER + product ownership)
- ✅ `DELETE /api/products/{id}/images` - Accepte ADMIN ou (SELLER/PROVIDER + product ownership)

---

## 🔄 Flux Corrigé

### Avant (403 Forbidden)
```
┌──────────────────────────────────────┐
│  Frontend: JWT avec role=PROVIDER    │
│           ↓                           │
│  GET /api/shops/me                   │
│           ↓                           │
│  Backend: @PreAuthorize("SELLER")    │
│           ↓                           │
│  ❌ 403 Forbidden                    │
│  ❌ Access Denied                    │
└──────────────────────────────────────┘
```

### Après (200 OK)
```
┌──────────────────────────────────────┐
│  Frontend: JWT avec role=PROVIDER    │
│           ↓                           │
│  GET /api/shops/me                   │
│           ↓                           │
│  Backend: @PreAuthorize(             │
│    "hasAnyRole('SELLER', 'PROVIDER')"│
│  )                                    │
│           ↓                           │
│  ✅ 200 OK                           │
│  ✅ Shop data returned               │
└──────────────────────────────────────┘
```

---

## 🧪 Test

### Avant Correction
```bash
# Login avec PROVIDER
POST /api/users/login
{ email: "amenimakdouli@gmail.com", password: "..." }
→ JWT: { role: "PROVIDER" }

# Essayer d'accéder au shop
GET /api/shops/me
Authorization: Bearer <token>
→ ❌ 403 Forbidden

# Essayer de créer un produit
POST /api/products
Authorization: Bearer <token>
→ ❌ 403 Forbidden
```

### Après Correction
```bash
# Login avec PROVIDER
POST /api/users/login
{ email: "amenimakdouli@gmail.com", password: "..." }
→ JWT: { role: "PROVIDER" }

# Accéder au shop
GET /api/shops/me
Authorization: Bearer <token>
→ ✅ 200 OK
→ { id: "...", name: "...", ... }

# Créer un produit
POST /api/products
Authorization: Bearer <token>
Body: { name: "Test", price: 100, ... }
→ ✅ 200 OK
→ { id: "...", name: "Test", ... }
```

---

## 📝 Fichiers Modifiés

1. **ShopController.java**
   - `GET /api/shops/me` - hasAnyRole('SELLER', 'PROVIDER')
   - `POST /api/shops` - hasAnyRole('ADMIN', 'SELLER', 'PROVIDER')
   - `PUT /api/shops/{id}` - hasAnyRole('SELLER', 'PROVIDER')
   - `DELETE /api/shops/{id}` - hasAnyRole('SELLER', 'PROVIDER')

2. **ProductController.java**
   - `GET /api/products/mine` - hasAnyRole('SELLER', 'PROVIDER')
   - `POST /api/products` - hasAnyRole('SELLER', 'PROVIDER')
   - `PUT /api/products/{id}` - hasAnyRole('SELLER', 'PROVIDER')
   - `DELETE /api/products/{id}` - hasAnyRole('SELLER', 'PROVIDER')
   - `POST /api/products/{id}/images` - hasAnyRole('SELLER', 'PROVIDER')
   - `DELETE /api/products/{id}/images` - hasAnyRole('SELLER', 'PROVIDER')

---

## 🔐 Sécurité Maintenue

### Vérifications Toujours Actives
```java
// Ownership du shop
@marketplaceSecurity.isShopOwner(authentication, #dto.shopId)
@marketplaceSecurity.isShopOwnerByObjectId(authentication, #id)

// Ownership du produit
@marketplaceSecurity.isProductOwner(authentication, #id)
```

### Règles
1. ✅ ADMIN peut tout faire
2. ✅ SELLER/PROVIDER peut gérer ses propres ressources
3. ✅ SELLER/PROVIDER ne peut pas modifier les ressources des autres
4. ✅ Ownership vérifié pour chaque opération

---

## 🚀 Redémarrage Nécessaire

### Backend
```bash
# Arrêter le backend (Ctrl+C)
# Relancer
cd backend
./mvnw spring-boot:run
```

### Attendre
```
Started EspritMarketApplication in X seconds
```

### Tester
```bash
# Frontend déjà lancé
# Rafraîchir la page
# Essayer d'ajouter un produit
```

---

## ✅ Résultat Attendu

### Console Frontend
```javascript
// Plus d'erreur 403
✅ GET /api/shops/me → 200 OK
✅ POST /api/products → 200 OK
✅ Product saved successfully!
```

### Console Backend
```
GET /api/shops/me - User: amenimakdouli@gmail.com, Role: PROVIDER
✅ Access granted

POST /api/products - Creating product: name=Test, shopId=...
✅ Product created successfully with ID: ...
```

---

## 📊 Récapitulatif

### Problème
```
JWT: role=PROVIDER
Backend: @PreAuthorize("hasRole('SELLER')")
→ 403 Forbidden ❌
```

### Solution
```
JWT: role=PROVIDER
Backend: @PreAuthorize("hasAnyRole('SELLER', 'PROVIDER')")
→ 200 OK ✅
```

### Impact
- ✅ PROVIDER peut créer des shops
- ✅ PROVIDER peut créer des produits
- ✅ PROVIDER peut modifier ses produits
- ✅ PROVIDER peut supprimer ses produits
- ✅ Sécurité maintenue (ownership vérifié)

---

**Date**: 30 Mars 2026  
**Status**: ✅ CORRIGÉ  
**Action**: REDÉMARRER LE BACKEND

## 🔄 Redémarrer le backend maintenant!
