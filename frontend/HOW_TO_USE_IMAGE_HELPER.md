# 🖼️ Guide d'utilisation - ImageUrlHelper

## Pourquoi ce helper?

Les images sont stockées sur le backend (port 8090) mais l'application Angular tourne sur le port 4200. Sans ce helper, les URLs relatives comme `/uploads/products/image.jpg` pointent vers `http://localhost:4200/uploads/...` au lieu de `http://localhost:8090/uploads/...`, causant des erreurs 404.

## Import

```typescript
import { ImageUrlHelper } from '@shared/utils/image-url.helper';
```

## Utilisation de base

### 1. Image unique

```typescript
// Dans votre composant
export class ProductCard {
  product = input.required<Product>();
  
  getImageUrl(): string {
    return ImageUrlHelper.toAbsoluteUrl(this.product().imageUrl);
  }
}
```

```html
<!-- Dans votre template -->
<img [src]="getImageUrl()" [alt]="product().name">
```

### 2. Tableau d'images

```typescript
export class ProductDetails {
  product = signal<Product | null>(null);
  
  getImages(): string[] {
    const product = this.product();
    if (!product) return [];
    
    return ImageUrlHelper.toAbsoluteUrls(product.images);
  }
}
```

```html
<!-- Galerie d'images -->
@for (imageUrl of getImages(); track $index) {
  <img [src]="imageUrl" [alt]="product().name">
}
```

### 3. Avec fallback personnalisé

```typescript
getAvatarUrl(user: User): string {
  return ImageUrlHelper.toAbsoluteUrl(
    user.avatarUrl, 
    '/assets/images/default-avatar.svg' // Fallback personnalisé
  );
}
```

## Exemples par cas d'usage

### Product Card

```typescript
@Component({
  selector: 'app-product-card',
  template: `
    <div class="product-card">
      <img [src]="productImage()" [alt]="product().name">
      <h3>{{ product().name }}</h3>
      <p>{{ product().price }} TND</p>
    </div>
  `
})
export class ProductCard {
  product = input.required<Product>();
  
  productImage = computed(() => 
    ImageUrlHelper.toAbsoluteUrl(this.product().imageUrl)
  );
}
```

### User Avatar

```typescript
@Component({
  selector: 'app-user-profile',
  template: `
    <div class="profile">
      <img [src]="avatarUrl()" class="avatar">
      <h2>{{ user().name }}</h2>
    </div>
  `
})
export class UserProfile {
  user = input.required<User>();
  
  avatarUrl = computed(() => 
    ImageUrlHelper.toAbsoluteUrl(
      this.user().avatarUrl,
      '/assets/images/default-avatar.svg'
    )
  );
}
```

### Shop Logo

```typescript
@Component({
  selector: 'app-shop-card',
  template: `
    <div class="shop-card">
      <img [src]="shopLogo()" [alt]="shop().name">
      <h3>{{ shop().name }}</h3>
    </div>
  `
})
export class ShopCard {
  shop = input.required<Shop>();
  
  shopLogo = computed(() => 
    ImageUrlHelper.toAbsoluteUrl(
      this.shop().logoUrl,
      '/assets/images/shop-placeholder.svg'
    )
  );
}
```

### Product Gallery

```typescript
@Component({
  selector: 'app-product-gallery',
  template: `
    <div class="gallery">
      <div class="main-image">
        <img [src]="selectedImage()" [alt]="product().name">
      </div>
      <div class="thumbnails">
        @for (img of thumbnails(); track $index) {
          <img [src]="img" (click)="selectImage(img)">
        }
      </div>
    </div>
  `
})
export class ProductGallery {
  product = input.required<Product>();
  selectedImage = signal<string>('');
  
  thumbnails = computed(() => 
    ImageUrlHelper.toAbsoluteUrls(this.product().images)
  );
  
  ngOnInit() {
    const images = this.thumbnails();
    if (images.length > 0) {
      this.selectedImage.set(images[0]);
    }
  }
  
  selectImage(url: string) {
    this.selectedImage.set(url);
  }
}
```

## Types d'URLs gérées

### 1. URLs relatives backend (`/uploads/`)
```typescript
// Input
'/uploads/products/image.jpg'

// Output
'http://localhost:8090/uploads/products/image.jpg'
```

### 2. URLs relatives backend (sans `/`)
```typescript
// Input
'uploads/temp/image.jpg'

// Output
'http://localhost:8090/uploads/temp/image.jpg'
```

### 3. URLs absolutes (déjà complètes)
```typescript
// Input
'http://example.com/image.jpg'

// Output (inchangé)
'http://example.com/image.jpg'
```

### 4. Assets frontend
```typescript
// Input
'/assets/images/logo.svg'

// Output (inchangé - servi par Angular)
'/assets/images/logo.svg'
```

### 5. URLs null/undefined
```typescript
// Input
null

// Output (fallback)
'http://localhost:8090/assets/images/placeholder.png'
```

## Méthodes disponibles

### `toAbsoluteUrl(url, fallback?)`
Convertit une URL unique en URL absolue.

**Paramètres:**
- `url`: string | undefined | null - L'URL à convertir
- `fallback`: string (optionnel) - Image de secours si URL invalide

**Retour:** string - URL absolue

```typescript
ImageUrlHelper.toAbsoluteUrl('/uploads/image.jpg')
// → 'http://localhost:8090/uploads/image.jpg'

ImageUrlHelper.toAbsoluteUrl(null, '/assets/no-image.svg')
// → '/assets/no-image.svg'
```

### `toAbsoluteUrls(images)`
Convertit un tableau d'images en URLs absolues.

**Paramètres:**
- `images`: Array<{url: string} | string> | undefined

**Retour:** string[] - Tableau d'URLs absolues

```typescript
ImageUrlHelper.toAbsoluteUrls([
  { url: '/uploads/img1.jpg' },
  { url: '/uploads/img2.jpg' }
])
// → [
//   'http://localhost:8090/uploads/img1.jpg',
//   'http://localhost:8090/uploads/img2.jpg'
// ]
```

### `getBackendUrl(path?)`
Obtient l'URL de base du backend.

**Paramètres:**
- `path`: string (optionnel) - Chemin à ajouter

**Retour:** string - URL backend complète

```typescript
ImageUrlHelper.getBackendUrl()
// → 'http://localhost:8090'

ImageUrlHelper.getBackendUrl('/uploads/products')
// → 'http://localhost:8090/uploads/products'
```

## Migration du code existant

### Avant (❌ Erreur 404)
```typescript
export class ProductCard {
  product = input.required<Product>();
  
  // ❌ Pointe vers localhost:4200
  imageUrl = computed(() => this.product().imageUrl);
}
```

### Après (✅ Fonctionne)
```typescript
export class ProductCard {
  product = input.required<Product>();
  
  // ✅ Pointe vers localhost:8090
  imageUrl = computed(() => 
    ImageUrlHelper.toAbsoluteUrl(this.product().imageUrl)
  );
}
```

## Bonnes pratiques

### ✅ À FAIRE

1. **Utiliser computed() pour les images**
```typescript
imageUrl = computed(() => 
  ImageUrlHelper.toAbsoluteUrl(this.product().imageUrl)
);
```

2. **Toujours fournir un fallback pour les avatars**
```typescript
avatarUrl = computed(() => 
  ImageUrlHelper.toAbsoluteUrl(
    this.user().avatarUrl,
    '/assets/images/default-avatar.svg'
  )
);
```

3. **Gérer les tableaux vides**
```typescript
images = computed(() => {
  const imgs = this.product().images;
  if (!imgs || imgs.length === 0) {
    return [ImageUrlHelper.toAbsoluteUrl(null)];
  }
  return ImageUrlHelper.toAbsoluteUrls(imgs);
});
```

### ❌ À ÉVITER

1. **Ne pas utiliser directement les URLs relatives**
```typescript
// ❌ MAUVAIS
<img [src]="product.imageUrl">

// ✅ BON
<img [src]="ImageUrlHelper.toAbsoluteUrl(product.imageUrl)">
```

2. **Ne pas reconstruire manuellement les URLs**
```typescript
// ❌ MAUVAIS
imageUrl = 'http://localhost:8090' + product.imageUrl;

// ✅ BON
imageUrl = ImageUrlHelper.toAbsoluteUrl(product.imageUrl);
```

3. **Ne pas oublier les cas null**
```typescript
// ❌ MAUVAIS (crash si null)
imageUrl = ImageUrlHelper.toAbsoluteUrl(product.imageUrl!);

// ✅ BON (gère null automatiquement)
imageUrl = ImageUrlHelper.toAbsoluteUrl(product.imageUrl);
```

## Environnements

Le helper s'adapte automatiquement à l'environnement:

### Development
```typescript
// environment.ts
apiUrl: 'http://localhost:8090/api'

// Images pointent vers
http://localhost:8090/uploads/...
```

### Production
```typescript
// environment.prod.ts
apiUrl: 'https://api.espritmarket.com/api'

// Images pointent vers
https://api.espritmarket.com/uploads/...
```

## Dépannage

### Images toujours en 404?

1. **Vérifiez que le backend tourne**
```bash
curl http://localhost:8090/uploads/test.jpg
```

2. **Vérifiez la configuration WebConfig**
```java
// backend/src/main/java/esprit_market/config/WebConfig.java
registry.addResourceHandler("/uploads/**")
    .addResourceLocations("file:" + uploadsDir + "/");
```

3. **Vérifiez les logs**
```typescript
console.log('Image URL:', ImageUrlHelper.toAbsoluteUrl(url));
```

### Images en double?

Vérifiez que vous n'utilisez pas le helper deux fois:
```typescript
// ❌ MAUVAIS
const url = ImageUrlHelper.toAbsoluteUrl(product.imageUrl);
const finalUrl = ImageUrlHelper.toAbsoluteUrl(url); // Double conversion!

// ✅ BON
const url = ImageUrlHelper.toAbsoluteUrl(product.imageUrl);
```

## Support

Pour toute question ou problème:
1. Vérifiez ce guide
2. Consultez `FIXES_APPLIED.md`
3. Vérifiez les logs de la console
4. Contactez l'équipe de développement
