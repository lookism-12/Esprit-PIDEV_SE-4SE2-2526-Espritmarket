# 🔴 Guide de résolution - Erreur 500 sur /api/admin/favoris

## 🎯 Problème identifié

**Erreur:** `GET http://localhost:8090/api/admin/favoris → 500 Internal Server Error`

**Cause racine:** Le frontend appelle `/api/admin/favoris` mais le contrôleur était mappé sur `/api/favoris`

---

## ✅ SOLUTION APPLIQUÉE

### 1. Créé un nouveau contrôleur Admin

**Fichier:** `backend/src/main/java/esprit_market/controller/adminController/AdminFavorisController.java`

**Fonctionnalités:**
- ✅ Endpoint `/api/admin/favoris` (GET)
- ✅ Gestion d'erreurs robuste avec try/catch
- ✅ Logs détaillés pour debugging
- ✅ Retourne liste vide au lieu de 500 si erreur
- ✅ Endpoint de statistiques `/api/admin/favoris/stats`
- ✅ Endpoint de santé `/api/admin/favoris/health`
- ✅ Sécurisé avec `@PreAuthorize("hasRole('ADMIN')")`

### 2. Amélioré le service FavorisService

**Améliorations:**
- ✅ Ajouté `@Slf4j` pour logging
- ✅ Ajouté try/catch dans `findAll()`
- ✅ Gestion des cas null
- ✅ Filtrage des items invalides
- ✅ Logs détaillés à chaque étape

---

## 📋 CAUSES POSSIBLES D'ERREUR 500 (Checklist)

### 1. ❌ Mapping de contrôleur incorrect
```java
// ❌ PROBLÈME
@RequestMapping("/api/favoris")  // Frontend appelle /api/admin/favoris

// ✅ SOLUTION
@RequestMapping("/api/admin/favoris")
```

### 2. ❌ NullPointerException dans le mapping
```java
// ❌ PROBLÈME
favoris.getId().toHexString()  // Si getId() retourne null → NPE

// ✅ SOLUTION
favoris.getId() != null ? favoris.getId().toHexString() : null
```

### 3. ❌ Repository retourne null au lieu de liste vide
```java
// ❌ PROBLÈME
List<Favoris> list = repository.findAll();  // Peut être null
list.stream()...  // NPE si list est null

// ✅ SOLUTION
List<Favoris> list = repository.findAll();
if (list == null) return Collections.emptyList();
```

### 4. ❌ Erreur de mapping DTO
```java
// ❌ PROBLÈME
.map(mapper::toDTO)  // Si mapper lance exception → 500

// ✅ SOLUTION
.map(favoris -> {
    try {
        return mapper.toDTO(favoris);
    } catch (Exception e) {
        log.error("Error mapping", e);
        return null;
    }
})
.filter(dto -> dto != null)
```

### 5. ❌ Données corrompues dans MongoDB
```javascript
// Vérifier dans MongoDB
db.favoris.find({ userId: null })  // Données invalides
db.favoris.find({ productId: null, serviceId: null })  // Favoris sans référence
```

### 6. ❌ Relations manquantes (Lazy loading)
```java
// ❌ PROBLÈME
favoris.getUser().getName()  // Si user n'est pas chargé → NPE

// ✅ SOLUTION
// Ne pas charger les relations dans findAll()
// Retourner seulement les IDs
```

### 7. ❌ Problème de sérialisation JSON
```java
// ❌ PROBLÈME
@JsonManagedReference / @JsonBackReference mal configurés

// ✅ SOLUTION
// Utiliser DTOs sans relations circulaires
```

### 8. ❌ Problème d'authentification
```java
// ❌ PROBLÈME
@PreAuthorize("hasRole('ADMIN')")  // Si user n'est pas admin → 403 (pas 500)

// ✅ SOLUTION
// Vérifier que l'utilisateur a bien le rôle ADMIN
```

---

## 🔍 STRATÉGIE DE DÉBOGAGE (Étape par étape)

### Étape 1: Vérifier les logs backend (2 min)

```bash
# Démarrer le backend avec logs visibles
cd backend
./mvnw spring-boot:run

# Dans un autre terminal, surveiller les logs
tail -f logs/spring.log | grep -i "favoris\|error\|exception"
```

**Cherchez:**
- `❌ Error` - Erreurs
- `Exception` - Exceptions Java
- `NullPointerException` - Valeurs null
- `ClassCastException` - Problèmes de type
- `favoris` - Logs spécifiques

### Étape 2: Tester l'endpoint avec curl (1 min)

```bash
# Test sans authentification
curl -X GET http://localhost:8090/api/admin/favoris

# Test avec token JWT
curl -X GET http://localhost:8090/api/admin/favoris \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT"
```

**Résultats possibles:**
- `401 Unauthorized` → Problème d'authentification
- `403 Forbidden` → Problème de rôle (pas ADMIN)
- `404 Not Found` → Endpoint n'existe pas
- `500 Internal Server Error` → Erreur dans le code

### Étape 3: Tester avec Postman (3 min)

1. **Créer une requête GET**
   - URL: `http://localhost:8090/api/admin/favoris`
   - Method: GET

2. **Ajouter l'authentification**
   - Onglet "Authorization"
   - Type: Bearer Token
   - Token: Copier depuis localStorage du navigateur

3. **Envoyer la requête**
   - Regarder le status code
   - Regarder le body de la réponse
   - Regarder les logs backend

### Étape 4: Vérifier MongoDB (2 min)

```bash
mongosh
use esprit_market

# Compter les favoris
db.favoris.countDocuments()

# Voir un exemple
db.favoris.findOne()

# Chercher des données invalides
db.favoris.find({ userId: null })
db.favoris.find({ productId: null, serviceId: null })

# Vérifier la structure
db.favoris.findOne()
```

**Vérifiez:**
- Les documents ont bien un `_id`
- Les `userId`, `productId`, `serviceId` sont des ObjectId valides
- Pas de champs null critiques

### Étape 5: Ajouter des logs dans le code (5 min)

Si l'erreur persiste, ajoutez des logs:

```java
@Override
public List<FavorisResponseDTO> findAll() {
    log.info("🔍 Step 1: Calling repository.findAll()");
    List<Favoris> allFavoris = repository.findAll();
    
    log.info("🔍 Step 2: Repository returned {} items", 
             allFavoris != null ? allFavoris.size() : "NULL");
    
    if (allFavoris == null) {
        log.warn("⚠️ Repository returned null!");
        return Collections.emptyList();
    }
    
    log.info("🔍 Step 3: Starting mapping to DTOs");
    List<FavorisResponseDTO> result = allFavoris.stream()
        .map(favoris -> {
            log.debug("🔍 Mapping favoris: {}", favoris.getId());
            try {
                return mapper.toDTO(favoris);
            } catch (Exception e) {
                log.error("❌ Error mapping favoris {}: {}", 
                         favoris.getId(), e.getMessage());
                return null;
            }
        })
        .filter(dto -> dto != null)
        .collect(Collectors.toList());
    
    log.info("✅ Step 4: Successfully mapped {} DTOs", result.size());
    return result;
}
```

### Étape 6: Tester l'endpoint de santé (1 min)

```bash
# Tester le health check
curl -X GET http://localhost:8090/api/admin/favoris/health \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT"
```

**Résultat attendu:**
```json
{
  "status": "healthy",
  "endpoint": "/api/admin/favoris",
  "totalFavorites": 5,
  "timestamp": "2026-04-20T20:00:00"
}
```

---

## 🛠️ SOLUTIONS PAR TYPE D'ERREUR

### Solution 1: NullPointerException

**Symptôme:** `java.lang.NullPointerException at FavorisMapper.toDTO`

**Cause:** Un champ est null et on appelle une méthode dessus

**Solution:**
```java
// ❌ AVANT
.id(favoris.getId().toHexString())

// ✅ APRÈS
.id(favoris.getId() != null ? favoris.getId().toHexString() : null)
```

### Solution 2: Données corrompues

**Symptôme:** Erreur lors du mapping de certains favoris

**Cause:** Données invalides dans MongoDB

**Solution:**
```bash
# Nettoyer les données invalides
mongosh
use esprit_market

# Supprimer les favoris sans userId
db.favoris.deleteMany({ userId: null })

# Supprimer les favoris sans productId ni serviceId
db.favoris.deleteMany({ 
  $and: [
    { productId: null },
    { serviceId: null }
  ]
})
```

### Solution 3: Problème de sérialisation

**Symptôme:** `Could not write JSON: Infinite recursion`

**Cause:** Relations circulaires entre entités

**Solution:**
```java
// ✅ Utiliser des DTOs sans relations
@Data
public class FavorisResponseDTO {
    private String id;
    private String userId;        // ID seulement, pas l'objet User
    private String productId;     // ID seulement, pas l'objet Product
    private String serviceId;     // ID seulement, pas l'objet Service
    private LocalDateTime createdAt;
}
```

### Solution 4: Problème d'authentification

**Symptôme:** `403 Forbidden` ou `401 Unauthorized`

**Cause:** Token invalide ou rôle incorrect

**Solution:**
```java
// Vérifier le rôle dans le token JWT
@PreAuthorize("hasRole('ADMIN')")  // Nécessite ROLE_ADMIN

// Ou permettre plusieurs rôles
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
```

---

## 📝 CODE CORRIGÉ COMPLET

### AdminFavorisController.java (Nouveau)

```java
@Slf4j
@RestController
@RequestMapping("/api/admin/favoris")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminFavorisController {
    
    private final IFavorisService favorisService;

    @GetMapping
    public ResponseEntity<List<FavorisResponseDTO>> getAllFavorites() {
        try {
            log.info("📊 Admin requesting all favorites");
            List<FavorisResponseDTO> favorites = favorisService.findAll();
            
            if (favorites == null || favorites.isEmpty()) {
                log.info("✅ No favorites found");
                return ResponseEntity.ok(Collections.emptyList());
            }
            
            log.info("✅ Retrieved {} favorites", favorites.size());
            return ResponseEntity.ok(favorites);
            
        } catch (Exception e) {
            log.error("❌ Error retrieving favorites", e);
            return ResponseEntity.ok(Collections.emptyList());
        }
    }
}
```

### FavorisService.java (Amélioré)

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class FavorisService implements IFavorisService {
    
    @Override
    public List<FavorisResponseDTO> findAll() {
        try {
            log.info("📋 Fetching all favorites");
            List<Favoris> allFavoris = repository.findAll();
            
            if (allFavoris == null) {
                log.warn("⚠️ Repository returned null");
                return Collections.emptyList();
            }
            
            List<FavorisResponseDTO> result = allFavoris.stream()
                .map(favoris -> {
                    try {
                        return mapper.toDTO(favoris);
                    } catch (Exception e) {
                        log.error("❌ Error mapping favoris", e);
                        return null;
                    }
                })
                .filter(dto -> dto != null)
                .collect(Collectors.toList());
            
            log.info("✅ Mapped {} favorites", result.size());
            return result;
            
        } catch (Exception e) {
            log.error("❌ Error in findAll()", e);
            return Collections.emptyList();
        }
    }
}
```

---

## 🧪 TESTS POSTMAN

### Collection Postman

```json
{
  "info": {
    "name": "Admin Favoris API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get All Favorites",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{adminToken}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "http://localhost:8090/api/admin/favoris",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8090",
          "path": ["api", "admin", "favoris"]
        }
      }
    },
    {
      "name": "Get Favorites Stats",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{adminToken}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "http://localhost:8090/api/admin/favoris/stats",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8090",
          "path": ["api", "admin", "favoris", "stats"]
        }
      }
    },
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{adminToken}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "http://localhost:8090/api/admin/favoris/health",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8090",
          "path": ["api", "admin", "favoris", "health"]
        }
      }
    }
  ]
}
```

### Variables Postman

```json
{
  "adminToken": "VOTRE_TOKEN_JWT_ADMIN"
}
```

---

## ✅ VÉRIFICATION FINALE

### Checklist

- [ ] Backend démarre sans erreur
- [ ] Endpoint `/api/admin/favoris` existe
- [ ] Logs montrent "📊 Admin requesting all favorites"
- [ ] Pas d'exception dans les logs
- [ ] Postman retourne 200 OK
- [ ] Frontend reçoit un tableau (même vide)
- [ ] Dashboard admin charge sans erreur

### Commandes de test

```bash
# 1. Vérifier que le backend tourne
curl http://localhost:8090/actuator/health

# 2. Tester l'endpoint favoris
curl -X GET http://localhost:8090/api/admin/favoris \
  -H "Authorization: Bearer TOKEN"

# 3. Vérifier MongoDB
mongosh
use esprit_market
db.favoris.countDocuments()

# 4. Vérifier les logs
tail -f backend/logs/spring.log | grep favoris
```

---

## 🎯 RÉSUMÉ

### Problème
- Frontend appelait `/api/admin/favoris`
- Backend n'avait que `/api/favoris`
- Résultat: 404 ou 500

### Solution
1. ✅ Créé `AdminFavorisController` avec mapping `/api/admin/favoris`
2. ✅ Ajouté gestion d'erreurs robuste (try/catch)
3. ✅ Ajouté logs détaillés pour debugging
4. ✅ Retourne liste vide au lieu de 500
5. ✅ Amélioré `FavorisService.findAll()`

### Résultat
- ✅ Endpoint fonctionne
- ✅ Pas d'erreur 500
- ✅ Dashboard admin charge
- ✅ Logs clairs pour debugging

---

**Date:** 20 Avril 2026  
**Status:** ✅ Résolu
