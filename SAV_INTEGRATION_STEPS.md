# 🔧 SAV - Étapes d'Intégration

## Phase 1: Vérification Backend ✅

### 1.1 Vérifier les Imports
```bash
# Vérifier que les fichiers compilent
mvn clean compile
```

### 1.2 Vérifier les Endpoints
```bash
# Tester les endpoints avec curl

# Client: Créer une demande SAV
curl -X POST http://localhost:8090/api/sav/claims \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "SAV",
    "message": "Product is broken",
    "reason": "defective",
    "problemNature": "Screen not working",
    "desiredSolution": "refund",
    "cartItemId": "CART_ITEM_ID"
  }'

# Client: Lister mes demandes
curl -X GET http://localhost:8090/api/sav/claims/my \
  -H "Authorization: Bearer YOUR_TOKEN"

# Admin: Lister toutes les demandes
curl -X GET http://localhost:8090/api/admin/sav/claims \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Phase 2: Intégration Frontend - Routes

### 2.1 Ajouter les Routes
Fichier: `frontend/src/app/app.routes.ts`

```typescript
// Ajouter dans les routes client
{
  path: 'my-account',
  component: MyAccountComponent,
  children: [
    // ... autres routes
    {
      path: 'sav-claims',
      children: [
        {
          path: '',
          component: SavClaimsListComponent
        },
        {
          path: 'create',
          component: SavClaimCreateComponent
        },
        {
          path: ':id',
          component: SavClaimDetailComponent
        },
        {
          path: ':id/edit',
          component: SavClaimCreateComponent
        }
      ]
    }
  ]
},

// Ajouter dans les routes admin
{
  path: 'admin',
  component: AdminLayoutComponent,
  children: [
    // ... autres routes
    {
      path: 'sav',
      component: SavAdminComponent
    }
  ]
}
```

### 2.2 Importer les Composants
```typescript
import { SavClaimsListComponent } from './front/pages/sav-claims/sav-claims-list.component';
import { SavClaimCreateComponent } from './front/pages/sav-claims/sav-claim-create.component';
import { SavClaimDetailComponent } from './front/pages/sav-claims/sav-claim-detail.component';
import { SavAdminComponent } from './back/features/sav/sav-admin.component';
```

## Phase 3: Intégration Frontend - Navigation

### 3.1 Ajouter le Lien dans le Menu Client
Fichier: `frontend/src/app/front/components/navbar/navbar.component.ts`

```typescript
// Dans le menu "My Account"
{
  label: 'My Return Requests',
  icon: '📦',
  route: '/my-account/sav-claims'
}
```

### 3.2 Ajouter le Lien dans le Menu Admin
Fichier: `frontend/src/app/back/components/admin-sidebar/admin-sidebar.component.ts`

```typescript
// Dans le menu admin
{
  label: 'After-Sales Service',
  icon: '🔧',
  route: '/admin/sav'
}
```

### 3.3 Ajouter le Bouton sur la Page Produit
Fichier: `frontend/src/app/front/pages/product-detail/product-detail.component.ts`

```typescript
// Dans le template, ajouter le bouton
@if (isProductPurchased()) {
  <button (click)="createReturnRequest()" 
          class="px-6 py-3 bg-primary text-white font-black rounded-xl">
    📦 Request Return
  </button>
}

// Dans la classe
createReturnRequest(): void {
  this.router.navigate(['/my-account/sav-claims/create'], {
    queryParams: { cartItemId: this.cartItemId }
  });
}
```

### 3.4 Ajouter le Bouton dans l'Historique de Commandes
Fichier: `frontend/src/app/front/pages/order-history/order-history.component.ts`

```typescript
// Pour chaque article acheté, ajouter un bouton
<button (click)="createReturnRequest(cartItem.id)" 
        class="px-4 py-2 bg-primary/10 text-primary font-bold rounded-lg">
  📦 Return
</button>

// Dans la classe
createReturnRequest(cartItemId: string): void {
  this.router.navigate(['/my-account/sav-claims/create'], {
    queryParams: { cartItemId }
  });
}
```

## Phase 4: Amélioration du Composant de Création

### 4.1 Charger les CartItems Achetés
Fichier: `frontend/src/app/front/pages/sav-claims/sav-claim-create.component.ts`

```typescript
// Injecter le service de panier
private cartService = inject(CartService);

// Dans ngOnInit
ngOnInit(): void {
  this.loadPurchasedItems();
  
  // Si cartItemId en query param
  const cartItemId = this.route.snapshot.queryParamMap.get('cartItemId');
  if (cartItemId) {
    this.form.patchValue({ cartItemId });
  }
}

loadPurchasedItems(): void {
  this.cartService.getPurchasedItems().subscribe({
    next: (items) => {
      this.purchasedItems.set(items);
    }
  });
}
```

### 4.2 Implémenter l'Upload d'Images
```typescript
// Utiliser Cloudinary pour l'upload
private cloudinaryService = inject(CloudinaryService);

onFilesSelected(event: any): void {
  const files = event.target.files;
  if (files) {
    Array.from(files).forEach((file: any) => {
      this.cloudinaryService.uploadImage(file).subscribe({
        next: (response) => {
          this.selectedImages.set([
            ...this.selectedImages(),
            {
              file,
              name: file.name,
              preview: response.secure_url,
              url: response.secure_url
            }
          ]);
        }
      });
    });
  }
}

submit(): void {
  // ... validation ...
  
  const claim: SavClaim = {
    type: 'SAV',
    ...this.form.value as any,
    imageUrls: this.selectedImages().map(img => img.url)
  };

  this.savService.createSavClaim(claim).subscribe({
    next: (response) => {
      alert('Your return request has been submitted successfully');
      this.router.navigate(['/my-account/sav-claims']);
    }
  });
}
```

## Phase 5: Tests

### 5.1 Test Client - Créer une Demande
1. Aller à `/my-account/sav-claims`
2. Cliquer sur "Create Return Request"
3. Remplir le formulaire
4. Ajouter une image
5. Soumettre
6. Vérifier que la demande apparaît dans la liste

### 5.2 Test Client - Consulter une Demande
1. Cliquer sur "View Details"
2. Vérifier que tous les détails s'affichent
3. Vérifier la timeline
4. Vérifier les images

### 5.3 Test Client - Modifier une Demande
1. Cliquer sur "Edit" (si status = PENDING)
2. Modifier les champs
3. Soumettre
4. Vérifier que les modifications sont sauvegardées

### 5.4 Test Admin - Consulter les Demandes
1. Aller à `/admin/sav`
2. Vérifier que les KPIs s'affichent
3. Vérifier que la table affiche les demandes
4. Tester les filtres

### 5.5 Test Admin - Gérer une Demande
1. Cliquer sur "View" pour une demande
2. Ajouter une réponse admin
3. Changer le statut
4. Cliquer "Save Changes"
5. Vérifier que les modifications sont sauvegardées

## Phase 6: Notifications (Optionnel)

### 6.1 Notifier le Client
```typescript
// Quand le statut change
this.notificationService.sendNotification({
  type: 'SAV_STATUS_CHANGED',
  title: 'Your return request status has been updated',
  message: `Status: ${newStatus}`,
  userId: claim.userId
});
```

### 6.2 Notifier l'Admin
```typescript
// Quand une nouvelle demande arrive
this.notificationService.sendNotification({
  type: 'NEW_SAV_CLAIM',
  title: 'New return request',
  message: `From ${claim.userId}: ${claim.reason}`,
  adminOnly: true
});
```

## Phase 7: Vérification IA (Futur)

### 7.1 Intégrer le Modèle Siamese Network
```typescript
// Quand une demande est créée avec images
this.aiService.analyzeProductImages(claim.imageUrls).subscribe({
  next: (result) => {
    this.savAdminService.updateAiVerification(
      claim.id,
      result.similarityScore,
      result.decision,
      result.recommendation
    ).subscribe({
      next: () => {
        // Mise à jour réussie
      }
    });
  }
});
```

## 🐛 Troubleshooting

### Problème: "CartItem not found"
**Solution**: Vérifier que le cartItemId existe et appartient à l'utilisateur

### Problème: "Cannot modify claim"
**Solution**: Vérifier que le statut est PENDING avant de modifier

### Problème: "Unauthorized"
**Solution**: Vérifier que le token JWT est valide et que l'utilisateur a le bon rôle

### Problème: Images ne s'affichent pas
**Solution**: Vérifier que les URLs Cloudinary sont correctes et accessibles

### Problème: Filtres ne fonctionnent pas
**Solution**: Vérifier que les valeurs de filtre correspondent aux statuts/priorités

## ✅ Checklist Finale

- [ ] Routes Angular intégrées
- [ ] Liens de navigation ajoutés
- [ ] Boutons "Create Return Request" ajoutés
- [ ] Upload d'images fonctionnel
- [ ] Tests client réussis
- [ ] Tests admin réussis
- [ ] Notifications configurées (optionnel)
- [ ] Vérification IA intégrée (futur)
- [ ] Documentation mise à jour
- [ ] Déploiement en production

## 📞 Support

En cas de problème:
1. Vérifier les logs du backend: `tail -f logs/application.log`
2. Vérifier la console du navigateur: F12 → Console
3. Vérifier les endpoints avec Postman
4. Vérifier les permissions (roles)
5. Vérifier les URLs des images

---

**Status**: Prêt pour l'intégration
**Version**: 1.0.0