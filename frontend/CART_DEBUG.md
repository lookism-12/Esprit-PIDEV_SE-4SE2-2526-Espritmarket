# Debug Guide - Problème d'ajout au panier

## Étapes de diagnostic

### 1. Vérifier l'authentification
Ouvrez la console du navigateur (F12) et tapez:
```javascript
localStorage.getItem('authToken')
```
- Si `null`: Vous n'êtes pas connecté → Connectez-vous d'abord
- Si une chaîne longue: Vous êtes connecté ✅

### 2. Vérifier le format de l'ID du produit
Dans la console, quand vous cliquez sur "Add to Cart", cherchez:
```
🛒 Adding item to cart: { productId: "...", quantity: 1 }
🔍 Request validation: { ... isValidObjectId: true/false }
```

Si `isValidObjectId: false`, le problème est là! L'ID doit être 24 caractères hexadécimaux.

### 3. Vérifier les erreurs HTTP
Cherchez dans la console:
```
❌ Failed to add item to cart: ...
❌ Error details: { status: XXX, ... }
```

Codes d'erreur courants:
- `401`: Non authentifié → Reconnectez-vous
- `400`: Validation échouée → Vérifiez le format de l'ID
- `404`: Produit non trouvé
- `500`: Erreur serveur

### 4. Vérifier que le backend tourne
Dans la console, tapez:
```javascript
fetch('http://localhost:8090/api/cart')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

Si erreur de connexion: Le backend n'est pas démarré!

### 5. Vérifier les logs du backend
Dans les logs Spring Boot, cherchez:
```
POST /api/cart/items
```

## Solutions rapides

### Solution 1: Reconnexion
1. Déconnectez-vous
2. Reconnectez-vous avec `client@test.com` / `password`
3. Réessayez d'ajouter au panier

### Solution 2: Vider le cache
```javascript
localStorage.clear()
sessionStorage.clear()
location.reload()
```
Puis reconnectez-vous.

### Solution 3: Vérifier le produit
Assurez-vous que le produit:
- A un stock > 0
- Est approuvé (status = APPROVED)
- A un ID valide (24 caractères hex)

## Informations à fournir pour le debug

Si le problème persiste, fournissez:
1. Les logs de la console (section Network, onglet XHR)
2. Le statut HTTP de la requête POST /api/cart/items
3. Le corps de la réponse d'erreur
4. Votre rôle utilisateur (CLIENT, PROVIDER, etc.)
