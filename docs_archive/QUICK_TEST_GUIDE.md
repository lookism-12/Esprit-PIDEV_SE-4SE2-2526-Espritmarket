# 🧪 Guide de Test Rapide - Marketplace

## 🚀 Serveurs en Cours d'Exécution

- **Backend**: http://localhost:8090 ✅
- **Frontend**: http://localhost:4200 ✅

## 📋 Tests à Effectuer

### Test 1: Filtre de Catégories ⭐ PRIORITAIRE

**URL**: http://localhost:4200/products

**Étapes**:
1. Ouvrir la page products
2. Ouvrir la console du navigateur (F12)
3. Observer les logs:
   ```
   🏷️ Loading categories from MongoDB...
   ✅ Categories loaded: X
   📦 Raw products from API: [...]
   📦 Mapped products: [...]
   ```
4. Cliquer sur "Electronics" dans la sidebar
5. Observer le log:
   ```
   🏷️ Filtered by category "Electronics": X products found
   ```
6. Vérifier que TOUS les produits Electronics s'affichent
7. Répéter pour d'autres catégories

**Résultat Attendu**: 
- ✅ Tous les produits de la catégorie sélectionnée s'affichent
- ✅ Le compteur "X products found" est correct
- ✅ Aucune erreur dans la console

---

### Test 2: Modal "List New Product" ⭐ PRIORITAIRE

**URL**: http://localhost:4200/products

**Prérequis**: Être connecté en tant que Seller ou Admin

**Étapes**:
1. Cliquer sur le bouton "LIST NEW PRODUCT"
2. Vérifier que le modal s'ouvre
3. Vérifier que le dropdown "Category" contient des catégories (depuis MongoDB)
4. Remplir le formulaire:
   - **Name**: "Test Product"
   - **Description**: "This is a test product for validation"
   - **Price**: 50
   - **Stock**: 10
   - **Category**: Sélectionner une catégorie
   - **Condition**: NEW
   - **Image URL**: https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400
   - **Negotiable**: Cocher ou non
5. Cliquer sur "CREATE LISTING"
6. Observer la console pour les logs
7. Vérifier que le modal se ferme
8. Vérifier que le produit apparaît dans la liste

**Résultat Attendu**:
- ✅ Modal s'ouvre correctement
- ✅ Catégories chargées depuis MongoDB
- ✅ Validation fonctionne (champs requis)
- ✅ Produit créé avec succès
- ✅ Produit visible dans la liste
- ✅ Aucune erreur dans la console

---

### Test 3: Page Home avec Données MongoDB

**URL**: http://localhost:4200/

**Étapes**:
1. Ouvrir la page d'accueil
2. Ouvrir la console du navigateur (F12)
3. Observer les logs:
   ```
   🏷️ Loading categories for home page...
   ✅ Categories loaded: X
   🏠 Loading products for home page...
   ✅ Products loaded: X
   ```
4. Vérifier la section "Browse by Category"
   - Les catégories affichées proviennent de MongoDB
   - Les compteurs (X items) sont réels
5. Vérifier la section "Flash Sales"
   - 4 produits featured affichés
6. Vérifier la section "Recommended For You"
   - 6 produits recommandés affichés
7. Cliquer sur une catégorie
   - Redirection vers /products avec filtre appliqué

**Résultat Attendu**:
- ✅ Catégories dynamiques depuis MongoDB
- ✅ Compteurs réels (productIds.length)
- ✅ Produits affichés depuis MongoDB
- ✅ Pas de section "Promotions" (supprimée)
- ✅ Navigation vers /products fonctionne

---

### Test 4: Filtres Avancés

**URL**: http://localhost:4200/products

**Étapes**:
1. Tester le filtre "Search"
   - Taper "keyboard" dans la barre de recherche
   - Vérifier que les produits correspondants s'affichent
2. Tester le filtre "Condition"
   - Sélectionner "NEW"
   - Vérifier que seuls les produits neufs s'affichent
3. Tester le filtre "Price Range"
   - Min: 0, Max: 100
   - Vérifier que seuls les produits dans cette gamme s'affichent
4. Tester "In Stock Only"
   - Cocher la case
   - Vérifier que seuls les produits en stock s'affichent
5. Tester "Negotiable Price"
   - Cocher la case
   - Vérifier que seuls les produits négociables s'affichent
6. Tester le tri
   - Sélectionner "Price: Low to High"
   - Vérifier que les produits sont triés par prix croissant
7. Cliquer sur "Clear All"
   - Vérifier que tous les filtres sont réinitialisés

**Résultat Attendu**:
- ✅ Tous les filtres fonctionnent correctement
- ✅ Les filtres peuvent être combinés
- ✅ "Clear All" réinitialise tout
- ✅ Le compteur "X products found" est toujours correct

---

### Test 5: Pagination

**URL**: http://localhost:4200/products

**Étapes**:
1. Vérifier le texte "Showing X to Y of Z products"
2. Cliquer sur la page 2
3. Vérifier que de nouveaux produits s'affichent
4. Vérifier que le bouton page 2 est actif (fond noir)
5. Cliquer sur "Previous" (←)
6. Vérifier le retour à la page 1
7. Cliquer sur "Next" (→)
8. Vérifier le passage à la page 2

**Résultat Attendu**:
- ✅ Pagination fonctionne
- ✅ Boutons actifs/inactifs corrects
- ✅ Compteur "Showing X to Y" correct
- ✅ 9 produits par page (configurable)

---

## 🐛 Problèmes Connus et Solutions

### Problème: Catégories vides
**Solution**: Vérifier que des catégories existent dans MongoDB
```bash
# Via MongoDB Compass ou shell
db.categories.find()
```

### Problème: Produits ne s'affichent pas
**Solution**: Vérifier que des produits existent et sont APPROVED
```bash
db.products.find({ status: "APPROVED" })
```

### Problème: Modal ne s'ouvre pas
**Solution**: 
1. Vérifier que vous êtes connecté
2. Vérifier que vous avez le rôle SELLER ou ADMIN
3. Vérifier la console pour les erreurs

### Problème: Erreur "No shop exists"
**Solution**: Le système crée automatiquement un shop si nécessaire
- Vérifier les logs backend
- Vérifier que l'endpoint `/api/shops/me` fonctionne

---

## 📊 Checklist Complète

### Fonctionnalités Core
- [ ] Filtre par catégorie (MongoDB)
- [ ] Filtre par condition
- [ ] Filtre par prix
- [ ] Filtre par stock
- [ ] Filtre par négociable
- [ ] Recherche par texte
- [ ] Tri (4 options)
- [ ] Pagination
- [ ] Modal CRUD
- [ ] Création de produit
- [ ] Édition de produit
- [ ] Suppression de produit

### Page Home
- [ ] Catégories dynamiques (MongoDB)
- [ ] Compteurs réels
- [ ] Produits featured (4)
- [ ] Produits recommandés (6)
- [ ] Navigation vers products
- [ ] Pas de fake data

### Qualité
- [ ] Aucune erreur console
- [ ] Logs de débogage présents
- [ ] Temps de chargement acceptable
- [ ] UI responsive
- [ ] Validation formulaire
- [ ] Messages d'erreur clairs

---

## 🎯 Critères de Succès

### ✅ Session Réussie Si:
1. Tous les filtres fonctionnent correctement
2. Le modal CRUD permet de créer des produits
3. Les catégories proviennent de MongoDB
4. Aucune fake data n'est affichée
5. Les logs de débogage sont présents
6. Aucune erreur dans la console

### ❌ Session Échouée Si:
1. Les filtres ne fonctionnent pas
2. Le modal ne s'ouvre pas ou ne crée pas de produit
3. Des fake data sont encore présentes
4. Des erreurs apparaissent dans la console
5. Les catégories sont hardcodées

---

## 📞 Support

En cas de problème:
1. Vérifier les logs dans la console browser (F12)
2. Vérifier les logs backend (terminal backend)
3. Vérifier que MongoDB est connecté
4. Vérifier que les deux serveurs sont en cours d'exécution
5. Consulter les fichiers de documentation:
   - `CATEGORY_FILTER_IMPROVED.md`
   - `FAKE_DATA_REMOVED.md`
   - `SESSION_SUMMARY.md`
