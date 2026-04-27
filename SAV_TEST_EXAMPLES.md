# 🧪 SAV - Exemples de Test

## 📋 Prérequis

- Backend Spring Boot en cours d'exécution sur `http://localhost:8090`
- Token JWT valide pour authentification
- Postman ou cURL installé

## 🔑 Authentification

### Obtenir un Token
```bash
curl -X POST http://localhost:8090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "password": "password123"
  }'

# Réponse:
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "userId": "user123",
#   "role": "CLIENT"
# }
```

### Token Admin
```bash
curl -X POST http://localhost:8090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

## 👤 Tests Client

### 1. Créer une Demande SAV

**Endpoint**: `POST /api/sav/claims`

```bash
curl -X POST http://localhost:8090/api/sav/claims \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN" \
  -d '{
    "type": "SAV",
    "message": "The product arrived broken. The screen is completely shattered and the device does not turn on.",
    "reason": "defective",
    "problemNature": "Screen shattered, device not working",
    "desiredSolution": "refund",
    "priority": "HIGH",
    "rating": 1,
    "cartItemId": "507f1f77bcf86cd799439011"
  }'
```

**Réponse Attendue**:
```json
{
  "success": true,
  "message": "Your return request has been submitted successfully",
  "claimId": "507f1f77bcf86cd799439012",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "type": "SAV",
    "message": "The product arrived broken...",
    "reason": "defective",
    "status": "PENDING",
    "readByAdmin": false,
    "creationDate": "2026-04-27T10:30:00",
    "cartItemId": "507f1f77bcf86cd799439011"
  }
}
```

### 2. Lister Mes Demandes SAV

**Endpoint**: `GET /api/sav/claims/my`

```bash
curl -X GET http://localhost:8090/api/sav/claims/my \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN"
```

**Réponse Attendue**:
```json
[
  {
    "id": "507f1f77bcf86cd799439012",
    "type": "SAV",
    "message": "The product arrived broken...",
    "reason": "defective",
    "status": "PENDING",
    "priority": "HIGH",
    "creationDate": "2026-04-27T10:30:00",
    "readByAdmin": false
  },
  {
    "id": "507f1f77bcf86cd799439013",
    "type": "SAV",
    "message": "Wrong item received...",
    "reason": "wrong_item",
    "status": "INVESTIGATING",
    "priority": "MEDIUM",
    "creationDate": "2026-04-27T09:15:00",
    "readByAdmin": true,
    "adminResponse": "We are investigating this issue..."
  }
]
```

### 3. Consulter une Demande SAV

**Endpoint**: `GET /api/sav/claims/my/{id}`

```bash
curl -X GET http://localhost:8090/api/sav/claims/my/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN"
```

**Réponse Attendue**:
```json
{
  "id": "507f1f77bcf86cd799439012",
  "type": "SAV",
  "message": "The product arrived broken...",
  "reason": "defective",
  "problemNature": "Screen shattered",
  "desiredSolution": "refund",
  "status": "PENDING",
  "priority": "HIGH",
  "rating": 1,
  "readByAdmin": false,
  "imageUrls": [
    "https://res.cloudinary.com/...",
    "https://res.cloudinary.com/..."
  ],
  "creationDate": "2026-04-27T10:30:00",
  "cartItemId": "507f1f77bcf86cd799439011",
  "userId": "user123"
}
```

### 4. Modifier une Demande SAV

**Endpoint**: `PUT /api/sav/claims/my/{id}`

```bash
curl -X PUT http://localhost:8090/api/sav/claims/my/507f1f77bcf86cd799439012 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN" \
  -d '{
    "type": "SAV",
    "message": "Updated message: The product arrived broken and I need a refund urgently.",
    "reason": "defective",
    "problemNature": "Screen shattered, device not working",
    "desiredSolution": "refund",
    "priority": "URGENT",
    "rating": 1,
    "cartItemId": "507f1f77bcf86cd799439011"
  }'
```

**Réponse Attendue**:
```json
{
  "success": true,
  "message": "Your return request has been updated",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "message": "Updated message: The product arrived broken...",
    "priority": "URGENT",
    "lastUpdatedDate": "2026-04-27T11:00:00"
  }
}
```

### 5. Supprimer une Demande SAV

**Endpoint**: `DELETE /api/sav/claims/my/{id}`

```bash
curl -X DELETE http://localhost:8090/api/sav/claims/my/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN"
```

**Réponse Attendue**:
```json
{
  "success": true,
  "message": "Your return request has been deleted"
}
```

## 👨‍💼 Tests Admin

### 1. Lister Toutes les Demandes SAV

**Endpoint**: `GET /api/admin/sav/claims`

```bash
curl -X GET http://localhost:8090/api/admin/sav/claims \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Réponse Attendue**:
```json
[
  {
    "id": "507f1f77bcf86cd799439012",
    "type": "SAV",
    "message": "The product arrived broken...",
    "reason": "defective",
    "status": "PENDING",
    "priority": "HIGH",
    "readByAdmin": false,
    "userId": "user123",
    "creationDate": "2026-04-27T10:30:00"
  },
  {
    "id": "507f1f77bcf86cd799439013",
    "type": "SAV",
    "message": "Wrong item received...",
    "reason": "wrong_item",
    "status": "INVESTIGATING",
    "priority": "MEDIUM",
    "readByAdmin": true,
    "userId": "user456",
    "creationDate": "2026-04-27T09:15:00"
  }
]
```

### 2. Consulter une Demande SAV (Admin)

**Endpoint**: `GET /api/admin/sav/claims/{id}`

```bash
curl -X GET http://localhost:8090/api/admin/sav/claims/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 3. Lister par Statut

**Endpoint**: `GET /api/admin/sav/claims/status/{status}`

```bash
# Lister toutes les demandes PENDING
curl -X GET http://localhost:8090/api/admin/sav/claims/status/PENDING \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Lister toutes les demandes INVESTIGATING
curl -X GET http://localhost:8090/api/admin/sav/claims/status/INVESTIGATING \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Lister toutes les demandes RESOLVED
curl -X GET http://localhost:8090/api/admin/sav/claims/status/RESOLVED \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 4. Lister les Demandes Non Lues

**Endpoint**: `GET /api/admin/sav/claims/unread`

```bash
curl -X GET http://localhost:8090/api/admin/sav/claims/unread \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 5. Changer le Statut

**Endpoint**: `PUT /api/admin/sav/claims/{id}/status`

```bash
# Passer de PENDING à INVESTIGATING
curl -X PUT "http://localhost:8090/api/admin/sav/claims/507f1f77bcf86cd799439012/status?status=INVESTIGATING" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Passer de INVESTIGATING à RESOLVED
curl -X PUT "http://localhost:8090/api/admin/sav/claims/507f1f77bcf86cd799439012/status?status=RESOLVED" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Passer de INVESTIGATING à REJECTED
curl -X PUT "http://localhost:8090/api/admin/sav/claims/507f1f77bcf86cd799439012/status?status=REJECTED" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Réponse Attendue**:
```json
{
  "success": true,
  "message": "Claim status updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "status": "INVESTIGATING",
    "readByAdmin": true,
    "lastUpdatedDate": "2026-04-27T11:30:00"
  }
}
```

### 6. Envoyer une Réponse Admin

**Endpoint**: `PUT /api/admin/sav/claims/{id}/response`

```bash
curl -X PUT "http://localhost:8090/api/admin/sav/claims/507f1f77bcf86cd799439012/response?response=We%20have%20received%20your%20return%20request.%20We%20are%20investigating%20the%20issue%20and%20will%20contact%20you%20within%2048%20hours." \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Réponse Attendue**:
```json
{
  "success": true,
  "message": "Response sent successfully",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "adminResponse": "We have received your return request...",
    "readByAdmin": true,
    "lastUpdatedDate": "2026-04-27T11:45:00"
  }
}
```

### 7. Mettre à Jour la Vérification IA

**Endpoint**: `PUT /api/admin/sav/claims/{id}/ai-verification`

```bash
# Cas MATCH
curl -X PUT "http://localhost:8090/api/admin/sav/claims/507f1f77bcf86cd799439012/ai-verification?similarityScore=92&decision=MATCH&recommendation=Product%20matches%20the%20shipped%20item.%20Approve%20return." \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Cas UNCERTAIN
curl -X PUT "http://localhost:8090/api/admin/sav/claims/507f1f77bcf86cd799439012/ai-verification?similarityScore=65&decision=UNCERTAIN&recommendation=Manual%20verification%20required." \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Cas MISMATCH
curl -X PUT "http://localhost:8090/api/admin/sav/claims/507f1f77bcf86cd799439012/ai-verification?similarityScore=35&decision=MISMATCH&recommendation=Possible%20mismatch.%20Verify%20before%20approving%20return." \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Réponse Attendue**:
```json
{
  "success": true,
  "message": "AI verification updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "aiSimilarityScore": 92,
    "aiDecision": "MATCH",
    "aiRecommendation": "Product matches the shipped item...",
    "lastUpdatedDate": "2026-04-27T12:00:00"
  }
}
```

### 8. Supprimer une Demande SAV

**Endpoint**: `DELETE /api/admin/sav/claims/{id}`

```bash
curl -X DELETE http://localhost:8090/api/admin/sav/claims/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Réponse Attendue**:
```json
{
  "success": true,
  "message": "Claim deleted successfully"
}
```

### 9. Lister les Cas de Vérification IA

**Endpoint**: `GET /api/admin/sav/claims/ai-verification/cases`

```bash
curl -X GET http://localhost:8090/api/admin/sav/claims/ai-verification/cases \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 🧪 Scénarios de Test Complets

### Scénario 1: Flux Complet Client → Admin

```bash
# 1. Client crée une demande
CLAIM_ID=$(curl -s -X POST http://localhost:8090/api/sav/claims \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -d '{
    "type": "SAV",
    "message": "Product broken",
    "reason": "defective",
    "problemNature": "Screen not working",
    "desiredSolution": "refund",
    "cartItemId": "507f1f77bcf86cd799439011"
  }' | jq -r '.claimId')

echo "Created claim: $CLAIM_ID"

# 2. Client consulte sa demande
curl -s -X GET http://localhost:8090/api/sav/claims/my/$CLAIM_ID \
  -H "Authorization: Bearer CLIENT_TOKEN" | jq

# 3. Admin consulte la demande
curl -s -X GET http://localhost:8090/api/admin/sav/claims/$CLAIM_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" | jq

# 4. Admin change le statut
curl -s -X PUT "http://localhost:8090/api/admin/sav/claims/$CLAIM_ID/status?status=INVESTIGATING" \
  -H "Authorization: Bearer ADMIN_TOKEN" | jq

# 5. Admin envoie une réponse
curl -s -X PUT "http://localhost:8090/api/admin/sav/claims/$CLAIM_ID/response?response=We%20are%20investigating" \
  -H "Authorization: Bearer ADMIN_TOKEN" | jq

# 6. Client consulte la réponse
curl -s -X GET http://localhost:8090/api/sav/claims/my/$CLAIM_ID \
  -H "Authorization: Bearer CLIENT_TOKEN" | jq '.adminResponse'

# 7. Admin met à jour la vérification IA
curl -s -X PUT "http://localhost:8090/api/admin/sav/claims/$CLAIM_ID/ai-verification?similarityScore=85&decision=MATCH" \
  -H "Authorization: Bearer ADMIN_TOKEN" | jq

# 8. Admin change le statut à RESOLVED
curl -s -X PUT "http://localhost:8090/api/admin/sav/claims/$CLAIM_ID/status?status=RESOLVED" \
  -H "Authorization: Bearer ADMIN_TOKEN" | jq

# 9. Client consulte le statut final
curl -s -X GET http://localhost:8090/api/sav/claims/my/$CLAIM_ID \
  -H "Authorization: Bearer CLIENT_TOKEN" | jq '.status'
```

## ✅ Checklist de Test

- [ ] Client peut créer une demande SAV
- [ ] Client peut lister ses demandes
- [ ] Client peut consulter une demande
- [ ] Client peut modifier une demande (si PENDING)
- [ ] Client peut supprimer une demande (si PENDING)
- [ ] Admin peut lister toutes les demandes
- [ ] Admin peut consulter une demande
- [ ] Admin peut filtrer par statut
- [ ] Admin peut changer le statut
- [ ] Admin peut envoyer une réponse
- [ ] Admin peut mettre à jour la vérification IA
- [ ] Admin peut supprimer une demande
- [ ] Client ne peut pas voir les demandes d'autres clients
- [ ] Client ne peut pas modifier une demande non-PENDING
- [ ] Admin peut voir toutes les demandes

## 🐛 Erreurs Courantes

### 401 Unauthorized
**Cause**: Token invalide ou expiré
**Solution**: Obtenir un nouveau token

### 403 Forbidden
**Cause**: Permissions insuffisantes
**Solution**: Vérifier le rôle (CLIENT vs ADMIN)

### 404 Not Found
**Cause**: Demande n'existe pas
**Solution**: Vérifier l'ID de la demande

### 400 Bad Request
**Cause**: Données invalides
**Solution**: Vérifier le format JSON et les champs obligatoires

---

**Status**: Prêt pour les tests
**Version**: 1.0.0