# ⚡ Test rapide - Endpoint /api/admin/favoris

## 🎯 Test en 5 minutes

### Étape 1: Redémarrer le backend (1 min)

```bash
cd backend
./mvnw spring-boot:run
```

Attendez le message: `Started EspritMarketApplication`

---

### Étape 2: Obtenir un token admin (2 min)

#### Option A: Depuis le navigateur

1. Ouvrir http://localhost:4200
2. Se connecter en tant qu'admin
3. Ouvrir la console (F12)
4. Taper: `localStorage.getItem('authToken')`
5. Copier le token

#### Option B: Avec curl

```bash
curl -X POST http://localhost:8090/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password"
  }'
```

Copier le `token` de la réponse.

---

### Étape 3: Tester l'endpoint (1 min)

```bash
# Remplacer YOUR_TOKEN par votre token
curl -X GET http://localhost:8090/api/admin/favoris \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## ✅ Résultats attendus

### Success (200 OK)

```json
[]
```
ou
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "productId": "507f1f77bcf86cd799439013",
    "serviceId": null,
    "createdAt": "2026-04-20T20:00:00"
  }
]
```

### Erreurs possibles

#### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
→ Token manquant ou invalide. Reconnectez-vous.

#### 403 Forbidden
```json
{
  "error": "Forbidden"
}
```
→ Utilisateur n'est pas admin. Utilisez un compte admin.

#### 404 Not Found
```
Cannot GET /api/admin/favoris
```
→ Backend pas démarré ou endpoint n'existe pas.

---

## 🔍 Vérifier les logs

Dans le terminal du backend, vous devriez voir:

```
📊 Admin requesting all favorites
✅ Successfully retrieved 0 favorites
```

ou

```
📊 Admin requesting all favorites
✅ Successfully retrieved 5 favorites
```

---

## 🧪 Tests supplémentaires

### Test 1: Health check

```bash
curl -X GET http://localhost:8090/api/admin/favoris/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Résultat attendu:**
```json
{
  "status": "healthy",
  "endpoint": "/api/admin/favoris",
  "totalFavorites": 0,
  "timestamp": "2026-04-20T20:00:00"
}
```

### Test 2: Statistics

```bash
curl -X GET http://localhost:8090/api/admin/favoris/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Résultat attendu:**
```json
{
  "totalFavorites": 0,
  "productFavorites": 0,
  "serviceFavorites": 0
}
```

---

## 🌐 Test depuis le frontend

### Option 1: Console du navigateur

```javascript
// Dans la console (F12)
fetch('http://localhost:8090/api/admin/favoris', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

### Option 2: Dashboard admin

1. Ouvrir http://localhost:4200/admin/dashboard
2. Se connecter en tant qu'admin
3. Vérifier que le dashboard charge
4. Ouvrir la console (F12)
5. Vérifier qu'il n'y a pas d'erreur

---

## 📊 Vérifier MongoDB

```bash
mongosh
use esprit_market

# Compter les favoris
db.favoris.countDocuments()

# Voir tous les favoris
db.favoris.find().pretty()

# Créer un favori de test
db.favoris.insertOne({
  userId: ObjectId("507f1f77bcf86cd799439011"),
  productId: ObjectId("507f1f77bcf86cd799439012"),
  serviceId: null,
  createdAt: new Date()
})
```

---

## ✅ Checklist de validation

- [ ] Backend démarre sans erreur
- [ ] curl retourne 200 OK
- [ ] Réponse est un tableau JSON
- [ ] Logs montrent "📊 Admin requesting"
- [ ] Health check retourne "healthy"
- [ ] Frontend dashboard charge
- [ ] Pas d'erreur 500

---

## 🆘 Si ça ne fonctionne pas

### Problème: 404 Not Found

**Solution:**
```bash
# Vérifier que le fichier existe
ls backend/src/main/java/esprit_market/controller/adminController/AdminFavorisController.java

# Recompiler
cd backend
./mvnw clean install
./mvnw spring-boot:run
```

### Problème: 401 Unauthorized

**Solution:**
```bash
# Obtenir un nouveau token
curl -X POST http://localhost:8090/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password"}'
```

### Problème: 403 Forbidden

**Solution:**
```bash
# Vérifier le rôle de l'utilisateur
mongosh
use esprit_market
db.users.findOne({ email: "admin@test.com" })
# Vérifier que role = "ADMIN"
```

### Problème: Logs montrent une erreur

**Solution:**
```bash
# Voir les logs complets
tail -100 backend/logs/spring.log

# Chercher l'erreur
grep -i "error\|exception" backend/logs/spring.log
```

---

## 📞 Support

Si le problème persiste:

1. **Capturez les informations:**
   - Commande curl utilisée
   - Réponse complète
   - Logs backend (dernières 50 lignes)
   - Version Java: `java --version`

2. **Consultez:**
   - `FAVORIS_500_ERROR_GUIDE.md` - Guide complet
   - `FIXES_APPLIED.md` - Toutes les corrections

3. **Vérifiez:**
   - Backend tourne sur port 8090
   - MongoDB tourne
   - Token JWT valide
   - Utilisateur a le rôle ADMIN

---

**Temps total:** 5 minutes  
**Difficulté:** Facile  
**Prérequis:** Backend démarré, compte admin
