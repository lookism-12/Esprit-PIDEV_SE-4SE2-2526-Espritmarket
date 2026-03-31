# 🛠️ Commandes Utiles - Marketplace

## 🚀 Démarrage des Serveurs

### Backend (Port 8090)
```bash
cd backend
launch.bat
```

### Frontend (Port 4200)
```bash
cd frontend
ng serve
```

---

## 🔍 Vérification des Ports

### Vérifier si le backend est en cours d'exécution
```bash
netstat -ano | findstr :8090
```

### Vérifier si le frontend est en cours d'exécution
```bash
netstat -ano | findstr :4200
```

### Tuer un processus sur un port spécifique
```bash
# Trouver le PID
netstat -ano | findstr :PORT

# Tuer le processus
taskkill /F /PID <PID>
```

---

## 🧪 Tests et Compilation

### Compiler le frontend (sans serveur)
```bash
cd frontend
ng build --configuration development
```

### Vérifier les erreurs TypeScript
```bash
cd frontend
ng build --configuration development 2>&1 | Select-Object -First 50
```

### Lancer les tests (si configurés)
```bash
cd frontend
ng test --run
```

---

## 📊 MongoDB

### Se connecter à MongoDB (si local)
```bash
mongosh
```

### Commandes MongoDB utiles
```javascript
// Utiliser la base de données
use esprit_market

// Lister les collections
show collections

// Compter les produits
db.products.countDocuments()

// Voir tous les produits
db.products.find().pretty()

// Voir les produits approuvés
db.products.find({ status: "APPROVED" }).pretty()

// Compter les catégories
db.categories.countDocuments()

// Voir toutes les catégories
db.categories.find().pretty()

// Voir les shops
db.shops.find().pretty()

// Supprimer un produit de test
db.products.deleteOne({ name: "Test Product" })
```

---

## 🔧 Dépannage

### Problème: Port déjà utilisé

**Backend (8090)**:
```bash
netstat -ano | findstr :8090
taskkill /F /PID <PID>
cd backend
launch.bat
```

**Frontend (4200)**:
```bash
netstat -ano | findstr :4200
taskkill /F /PID <PID>
cd frontend
ng serve
```

### Problème: Erreurs de compilation

**Nettoyer et reconstruire**:
```bash
cd frontend
rm -rf node_modules
rm -rf .angular
npm install
ng serve
```

### Problème: Backend ne démarre pas

**Vérifier les logs**:
```bash
cd backend
type backend_final.log
```

**Recompiler le backend**:
```bash
cd backend
mvn clean install -DskipTests
```

---

## 📝 Logs

### Voir les logs backend
```bash
cd backend
type backend_final.log
```

### Voir les dernières lignes des logs
```bash
cd backend
Get-Content backend_final.log -Tail 50
```

### Suivre les logs en temps réel (PowerShell)
```bash
cd backend
Get-Content backend_final.log -Wait -Tail 50
```

---

## 🔄 Git

### Voir les fichiers modifiés
```bash
git status
```

### Voir les différences
```bash
git diff
```

### Ajouter tous les fichiers
```bash
git add .
```

### Commit avec message
```bash
git commit -m "Fix: Category filter and remove fake data"
```

### Push vers le repo
```bash
git push origin main
```

---

## 📦 NPM / Maven

### Installer les dépendances frontend
```bash
cd frontend
npm install
```

### Mettre à jour les dépendances
```bash
cd frontend
npm update
```

### Installer les dépendances backend
```bash
cd backend
mvn clean install
```

### Compiler sans tests
```bash
cd backend
mvn clean install -DskipTests
```

---

## 🌐 URLs Importantes

### Frontend
- **Home**: http://localhost:4200/
- **Products**: http://localhost:4200/products
- **Admin Products**: http://localhost:4200/admin/marketplace/products
- **Admin Categories**: http://localhost:4200/admin/marketplace/categories

### Backend API
- **Products**: http://localhost:8090/api/products
- **Categories**: http://localhost:8090/api/categories
- **Shops**: http://localhost:8090/api/shops
- **Swagger UI**: http://localhost:8090/swagger-ui.html

---

## 🔐 Authentification

### Se connecter en tant que Admin
```
Email: admin@esprit.tn
Password: [votre mot de passe admin]
```

### Se connecter en tant que Seller
```
Email: seller@esprit.tn
Password: [votre mot de passe seller]
```

---

## 📊 Monitoring

### Vérifier l'utilisation mémoire
```bash
# Backend (Java)
jps -lvm

# Frontend (Node)
tasklist | findstr node
```

### Vérifier les connexions réseau
```bash
netstat -ano | findstr LISTENING
```

---

## 🧹 Nettoyage

### Nettoyer les fichiers temporaires frontend
```bash
cd frontend
rm -rf .angular
rm -rf dist
rm -rf node_modules/.cache
```

### Nettoyer les fichiers temporaires backend
```bash
cd backend
mvn clean
rm -rf target
```

### Supprimer tous les fichiers .log
```bash
cd backend
rm *.log
```

---

## 📚 Documentation

### Générer la documentation TypeScript
```bash
cd frontend
npm run docs
```

### Voir la structure du projet
```bash
tree /F /A > project_structure.txt
```

---

## 🎯 Commandes Rapides

### Tout redémarrer
```bash
# Terminal 1 - Backend
cd backend
launch.bat

# Terminal 2 - Frontend
cd frontend
ng serve
```

### Vérifier que tout fonctionne
```bash
# Backend
curl http://localhost:8090/api/products

# Frontend
curl http://localhost:4200
```

### Ouvrir dans le navigateur
```bash
# Windows
start http://localhost:4200

# PowerShell
Start-Process "http://localhost:4200"
```

---

## 💡 Astuces

### Recharger automatiquement le backend
Le backend ne supporte pas le hot reload. Il faut le redémarrer manuellement après chaque modification.

### Recharger automatiquement le frontend
Le frontend supporte le hot reload. Les modifications sont automatiquement détectées et appliquées.

### Vider le cache du navigateur
```
Ctrl + Shift + Delete (Chrome/Edge)
Ou
Ctrl + F5 (Hard refresh)
```

### Voir les requêtes réseau
```
F12 → Onglet Network
```

### Voir les erreurs JavaScript
```
F12 → Onglet Console
```

---

## 🚨 En Cas d'Urgence

### Tout arrêter
```bash
# Tuer tous les processus Java
taskkill /F /IM java.exe

# Tuer tous les processus Node
taskkill /F /IM node.exe
```

### Réinitialiser complètement
```bash
# Backend
cd backend
mvn clean
rm *.log

# Frontend
cd frontend
rm -rf node_modules
rm -rf .angular
rm -rf dist
npm install
```

### Restaurer depuis Git
```bash
git stash
git pull origin main
git stash pop
```
