# 🛒 Cart Troubleshooting Guide - Step by Step

## 🔍 Diagnostic rapide (5 minutes)

### Étape 1: Vérifier l'authentification

Ouvrez la console du navigateur (F12) et tapez:

```javascript
// Vérifier le token
const token = localStorage.getItem('authToken');
console.log('Token:', token ? 'EXISTS ✅' : 'MISSING ❌');

// Vérifier l'utilisateur
const user = localStorage.getItem('currentUser');
console.log('User:', user ? JSON.parse(user) : 'MISSING ❌');
```

**Résultat attendu:**
```
Token: EXISTS ✅
User: { id: "...", email: "client@test.com", role: "CLIENT" }
```

**Si token manquant:**
1. Déconnectez-vous
2. Reconnectez-vous avec `client@test.com` / `password`
3. Réessayez

---

### Étape 2: Tester l'ajout au panier manuellement

Dans la console, exécutez:

```javascript
// Remplacez PRODUCT_ID par un vrai ID de produit (24 caractères hex)
const productId = 'PRODUCT_ID_ICI'; // Ex: '507f1f77bcf86cd799439011'

fetch('http://localhost:8090/api/cart/items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
  },
  body: JSON.stringify({
    productId: productId,
    quantity: 1
  })
})
.then(response => {
  console.log('Status:', response.status);
  return response.json();
})
.then(data => {
  console.log('✅ Success:', data);
})
.catch(error => {
  console.error('❌ Error:', error);
});
```

**Résultats possibles:**

#### ✅ Success (201 Created)
```json
{
  "id": "...",
  "cartId": "...",
  "productId": "...",
  "quantity": 1,
  "unitPrice": 100,
  "subTotal": 100
}
```
→ Le panier fonctionne! Le problème est dans le frontend.

#### ❌ Error 401 (Unauthorized)
```json
{
  "message": "User not authenticated"
}
```
→ Token invalide ou expiré. Reconnectez-vous.

#### ❌ Error 400 (Bad Request)
```json
{
  "fieldErrors": {
    "productId": "Product ID must be a valid 24-character hexadecimal string"
  }
}
```
→ L'ID du produit n'est pas au bon format.

#### ❌ Error 404 (Not Found)
```json
{
  "message": "Product not found"
}
```
→ Le produit n'existe pas dans la base de données.

#### ❌ Error 500 (Server Error)
```json
{
  "message": "Internal server error"
}
```
→ Problème backend. Vérifiez les logs Spring Boot.

---

### Étape 3: Vérifier le format de l'ID produit

Les IDs MongoDB doivent être des chaînes hexadécimales de 24 caractères.

```javascript
// Tester si un ID est valide
function isValidObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// Exemples
console.log(isValidObjectId('507f1f77bcf86cd799439011')); // true ✅
console.log(isValidObjectId('123')); // false ❌
console.log(isValidObjectId('invalid-id')); // false ❌
```

**Pour obtenir un ID produit valide:**

```javascript
// Récupérer un produit depuis l'API
fetch('http://localhost:8090/api/products')
  .then(r => r.json())
  .then(products => {
    if (products.length > 0) {
      const firstProduct = products[0];
      console.log('Product ID:', firstProduct.id);
      console.log('Is valid:', isValidObjectId(firstProduct.id));
    }
  });
```

---

## 🔧 Diagnostic approfondi (15 minutes)

### Vérifier le backend

#### 1. Backend est-il démarré?

```bash
curl http://localhost:8090/api/products
```

**Résultat attendu:** Liste de produits en JSON

**Si erreur de connexion:**
```bash
cd backend
./mvnw spring-boot:run
```

#### 2. Vérifier les logs backend

```bash
# Linux/Mac
tail -f backend/logs/spring.log

# Windows PowerShell
Get-Content backend/logs/spring.log -Wait -Tail 50
```

**Cherchez:**
- `POST /api/cart/items` - Requête reçue
- `ERROR` - Erreurs
- `Exception` - Exceptions Java
- `CartController` - Logs du contrôleur

#### 3. Vérifier MongoDB

```bash
mongosh
```

```javascript
// Dans mongosh
use esprit_market

// Vérifier les produits
db.products.countDocuments()
db.products.findOne()

// Vérifier les paniers
db.carts.countDocuments()
db.carts.findOne()

// Vérifier les items du panier
db.cart_items.countDocuments()
db.cart_items.find().pretty()
```

---

### Vérifier le frontend

#### 1. Logs de debug activés

Quand vous cliquez sur "Add to Cart", vous devriez voir dans la console:

```
🛒 Adding item to cart: { productId: "...", quantity: 1 }
🔍 Request validation: {
  productIdType: "string",
  productIdLength: 24,
  productIdValue: "507f1f77bcf86cd799439011",
  quantityType: "number",
  quantityValue: 1,
  isValidObjectId: true
}
```

**Si `isValidObjectId: false`:**
→ Le problème est l'ID du produit. Vérifiez comment les produits sont chargés.

#### 2. Vérifier la requête HTTP

1. Ouvrez les DevTools (F12)
2. Onglet "Network"
3. Filtrez par "XHR"
4. Cliquez sur "Add to Cart"
5. Cherchez la requête `POST /api/cart/items`

**Vérifiez:**
- **Status:** Doit être 201 (Created)
- **Request Headers:** Doit contenir `Authorization: Bearer ...`
- **Request Payload:** Doit contenir `{ productId: "...", quantity: 1 }`
- **Response:** Doit contenir l'item ajouté

#### 3. Vérifier le service CartService

```typescript
// Dans votre composant
console.log('Cart service:', this.cartService);
console.log('Is loading:', this.cartService.isLoading());
console.log('Cart items:', this.cartService.cartItems());
console.log('Item count:', this.cartService.itemCount());
```

---

## 🐛 Problèmes courants et solutions

### Problème 1: "Product ID must be a valid 24-character hexadecimal string"

**Cause:** L'ID du produit n'est pas au format MongoDB ObjectId

**Solution:**

```typescript
// Vérifier comment les produits sont chargés
getProducts() {
  this.productService.getAll().subscribe(products => {
    console.log('First product:', products[0]);
    console.log('Product ID:', products[0].id);
    console.log('ID length:', products[0].id.length);
    console.log('Is valid ObjectId:', /^[0-9a-fA-F]{24}$/.test(products[0].id));
  });
}
```

**Si l'ID n'est pas valide:**
- Vérifiez le mapping backend → frontend
- Vérifiez que le backend retourne `id` et non `_id`

---

### Problème 2: "User not authenticated"

**Cause:** Token JWT manquant ou invalide

**Solution:**

```typescript
// Vérifier le token
const token = localStorage.getItem('authToken');
if (!token) {
  console.error('❌ No token found');
  // Rediriger vers login
  this.router.navigate(['/login']);
}

// Vérifier si le token est expiré
try {
  const payload = JSON.parse(atob(token.split('.')[1]));
  const exp = payload.exp * 1000; // Convertir en millisecondes
  const now = Date.now();
  
  if (exp < now) {
    console.error('❌ Token expired');
    localStorage.removeItem('authToken');
    this.router.navigate(['/login']);
  } else {
    console.log('✅ Token valid until:', new Date(exp));
  }
} catch (e) {
  console.error('❌ Invalid token format');
}
```

---

### Problème 3: "Product not found"

**Cause:** Le produit n'existe pas ou a été supprimé

**Solution:**

```javascript
// Vérifier dans MongoDB
db.products.findOne({ _id: ObjectId("PRODUCT_ID_ICI") })

// Si null, le produit n'existe pas
// Créer un produit de test:
db.products.insertOne({
  name: "Test Product",
  description: "Test description",
  price: 100,
  stock: 10,
  status: "APPROVED",
  shopId: ObjectId("SHOP_ID_ICI"),
  categoryIds: [],
  images: [],
  createdAt: new Date(),
  updatedAt: new Date()
})
```

---

### Problème 4: Panier vide après ajout

**Cause:** Le panier n'est pas rafraîchi après l'ajout

**Solution:**

```typescript
// Dans CartService, après addItem success
this.refreshCartAndItems();
this.cartUpdateSubject.next(true);

// Dans le composant panier
ngOnInit() {
  // S'abonner aux mises à jour du panier
  this.cartService.cartUpdated$.subscribe(() => {
    console.log('🔄 Cart updated, refreshing...');
    this.cartService.getCartItems().subscribe();
  });
  
  // Charger le panier initial
  this.cartService.getCartItems().subscribe();
}
```

---

### Problème 5: Erreur CORS

**Cause:** Le backend bloque les requêtes depuis le frontend

**Symptômes:**
```
Access to fetch at 'http://localhost:8090/api/cart/items' from origin 'http://localhost:4200' has been blocked by CORS policy
```

**Solution:**

Vérifiez `backend/src/main/java/esprit_market/config/CorsConfig.java`:

```java
@Configuration
public class CorsConfig {
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOrigin("http://localhost:4200"); // ✅ Frontend URL
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

---

## 📋 Checklist de vérification complète

### Frontend
- [ ] Token JWT existe dans localStorage
- [ ] Token JWT n'est pas expiré
- [ ] Utilisateur a le rôle CLIENT
- [ ] Product ID est au format ObjectId (24 chars hex)
- [ ] Requête POST contient Authorization header
- [ ] Requête POST contient bon Content-Type
- [ ] CartService est injecté correctement
- [ ] Logs de debug apparaissent dans console

### Backend
- [ ] Backend est démarré (port 8090)
- [ ] Endpoint `/api/cart/items` existe
- [ ] CORS est configuré pour localhost:4200
- [ ] JWT filter est actif
- [ ] CartController résout userId correctement
- [ ] Produit existe dans MongoDB
- [ ] Stock du produit > 0
- [ ] Pas d'exceptions dans les logs

### Base de données
- [ ] MongoDB est démarré
- [ ] Base `esprit_market` existe
- [ ] Collection `products` contient des produits
- [ ] Collection `carts` existe
- [ ] Collection `cart_items` existe
- [ ] Produits ont des IDs valides (ObjectId)

---

## 🆘 Aide supplémentaire

Si le problème persiste après toutes ces vérifications:

1. **Capturez les informations suivantes:**
   - Screenshot de la console (onglet Console)
   - Screenshot de la requête HTTP (onglet Network)
   - Logs backend (dernières 50 lignes)
   - Version de Node.js: `node --version`
   - Version de Java: `java --version`
   - Version de MongoDB: `mongosh --version`

2. **Créez un rapport de bug avec:**
   - Étapes pour reproduire
   - Comportement attendu
   - Comportement actuel
   - Informations capturées ci-dessus

3. **Testez avec un utilisateur différent:**
   - Créez un nouveau compte
   - Essayez d'ajouter au panier
   - Comparez les résultats

4. **Testez avec un produit différent:**
   - Choisissez un autre produit
   - Vérifiez son ID
   - Essayez de l'ajouter au panier

---

**Dernière mise à jour:** 20 Avril 2026  
**Version:** 1.0
