# 🧪 GUIDE COMPLET DES TESTS FRONTEND AVEC VITEST

## 📋 TABLE DES MATIÈRES

1. [Configuration Actuelle](#configuration-actuelle)
2. [Commandes de Test](#commandes-de-test)
3. [Structure des Tests](#structure-des-tests)
4. [Exemples de Tests](#exemples-de-tests)
5. [Bonnes Pratiques](#bonnes-pratiques)

---

## ⚙️ CONFIGURATION ACTUELLE

### Technologies Utilisées
- **Framework**: Angular 21
- **Test Runner**: Vitest 4.1.1
- **Testing Library**: @testing-library/angular 19.2.1
- **Environment**: jsdom
- **Coverage**: v8 provider

### Configuration Vitest
```typescript
// vitest.config.ts
- Globals: activés
- Environment: jsdom
- Setup: src/vitest.setup.ts
- Include: src/**/*.spec.ts
- Coverage: text, json, html
```

---

## 🚀 COMMANDES DE TEST

### Exécuter les Tests

```bash
# Lancer tous les tests (une fois)
npm test

# Mode watch (re-exécute automatiquement)
npm run test:watch

# Avec interface UI
npx vitest --ui

# Avec coverage
npx vitest run --coverage
```

### Commandes Utiles

```bash
# Tester un fichier spécifique
npx vitest run src/app/core/services/auth.service.spec.ts

# Tester un pattern
npx vitest run src/app/front/**/*.spec.ts

# Mode debug
npx vitest --inspect-brk

# Voir les tests disponibles
npx vitest list
```

---

## 📁 STRUCTURE DES TESTS

### Organisation Recommandée

```
frontend/src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   └── auth.service.spec.ts          ✅ Tests unitaires
│   │   └── guards/
│   │       ├── auth.guard.ts
│   │       └── auth.guard.spec.ts
│   ├── shared/
│   │   └── components/
│   │       ├── product-card/
│   │       │   ├── product-card.ts
│   │       │   └── product-card.spec.ts      ✅ Tests composants
│   └── front/
│       └── pages/
│           ├── home/
│           │   ├── home.ts
│           │   └── home.spec.ts              ✅ Tests pages
└── vitest.setup.ts                           ⚙️ Configuration globale
```

---

## 📝 EXEMPLES DE TESTS

### 1. Test d'un Service Simple

```typescript
// src/app/core/services/toast.service.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService]
    });
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show success toast', () => {
    const spy = vi.spyOn(service.toasts$, 'next');
    
    service.success('Test message');
    
    expect(spy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'success',
          message: 'Test message'
        })
      ])
    );
  });

  it('should remove toast after timeout', async () => {
    vi.useFakeTimers();
    
    service.success('Test');
    expect(service.toasts$.value.length).toBe(1);
    
    vi.advanceTimersByTime(3000);
    expect(service.toasts$.value.length).toBe(0);
    
    vi.useRealTimers();
  });
});
```

### 2. Test d'un Service avec HTTP

```typescript
// src/app/core/services/marketplace.service.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MarketplaceService } from './marketplace.service';

describe('MarketplaceService', () => {
  let service: MarketplaceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MarketplaceService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    
    service = TestBed.inject(MarketplaceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch products', (done) => {
    const mockProducts = [
      { id: '1', name: 'Product 1', price: 100 },
      { id: '2', name: 'Product 2', price: 200 }
    ];

    service.getProducts().subscribe(products => {
      expect(products).toEqual(mockProducts);
      expect(products.length).toBe(2);
      done();
    });

    const req = httpMock.expectOne('http://localhost:8090/api/marketplace/products');
    expect(req.request.method).toBe('GET');
    req.flush(mockProducts);
  });

  it('should handle error when fetching products', (done) => {
    service.getProducts().subscribe({
      next: () => done.fail('Should have failed'),
      error: (error) => {
        expect(error.status).toBe(500);
        done();
      }
    });

    const req = httpMock.expectOne('http://localhost:8090/api/marketplace/products');
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
  });
});
```

### 3. Test d'un Composant Simple

```typescript
// src/app/shared/components/loading-spinner/loading-spinner.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingSpinnerComponent } from './loading-spinner';

describe('LoadingSpinnerComponent', () => {
  let component: LoadingSpinnerComponent;
  let fixture: ComponentFixture<LoadingSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinnerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display default size', () => {
    const compiled = fixture.nativeElement;
    const spinner = compiled.querySelector('.spinner');
    expect(spinner.classList.contains('spinner-md')).toBe(true);
  });

  it('should display custom size', () => {
    component.size = 'lg';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    const spinner = compiled.querySelector('.spinner');
    expect(spinner.classList.contains('spinner-lg')).toBe(true);
  });
});
```

### 4. Test d'un Composant avec Testing Library

```typescript
// src/app/shared/components/product-card/product-card.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/angular';
import { ProductCardComponent } from './product-card';

describe('ProductCardComponent', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    price: 99.99,
    imageUrl: 'test.jpg',
    description: 'Test description'
  };

  it('should render product information', async () => {
    await render(ProductCardComponent, {
      componentInputs: { product: mockProduct }
    });

    expect(screen.getByText('Test Product')).toBeTruthy();
    expect(screen.getByText('99.99 DT')).toBeTruthy();
  });

  it('should emit event when clicked', async () => {
    let clickedProduct = null;
    
    await render(ProductCardComponent, {
      componentInputs: { product: mockProduct },
      componentOutputs: {
        productClick: (product: any) => { clickedProduct = product; }
      }
    });

    const card = screen.getByRole('article');
    await fireEvent.click(card);

    expect(clickedProduct).toEqual(mockProduct);
  });

  it('should show favorite button when user is logged in', async () => {
    await render(ProductCardComponent, {
      componentInputs: { 
        product: mockProduct,
        isLoggedIn: true
      }
    });

    expect(screen.getByLabelText('Add to favorites')).toBeTruthy();
  });
});
```

### 5. Test d'un Guard

```typescript
// src/app/core/guards/auth.guard.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    const authServiceMock = {
      isAuthenticated: vi.fn()
    };

    const routerMock = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('should allow access when authenticated', () => {
    vi.spyOn(authService, 'isAuthenticated').mockReturnValue(true);

    const result = guard.canActivate();

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to login when not authenticated', () => {
    vi.spyOn(authService, 'isAuthenticated').mockReturnValue(false);

    const result = guard.canActivate();

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
```

### 6. Test d'un Pipe

```typescript
// src/app/shared/pipes/currency-format.pipe.spec.ts
import { describe, it, expect } from 'vitest';
import { CurrencyFormatPipe } from './currency-format.pipe';

describe('CurrencyFormatPipe', () => {
  let pipe: CurrencyFormatPipe;

  beforeEach(() => {
    pipe = new CurrencyFormatPipe();
  });

  it('should format number to currency', () => {
    expect(pipe.transform(100)).toBe('100.00 DT');
    expect(pipe.transform(99.99)).toBe('99.99 DT');
  });

  it('should handle zero', () => {
    expect(pipe.transform(0)).toBe('0.00 DT');
  });

  it('should handle null', () => {
    expect(pipe.transform(null)).toBe('0.00 DT');
  });
});
```

---

## ✅ BONNES PRATIQUES

### 1. Organisation des Tests

```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Configuration commune
  });

  // Tests groupés par fonctionnalité
  describe('Initialization', () => {
    it('should create', () => {});
    it('should load data on init', () => {});
  });

  describe('User Interactions', () => {
    it('should handle click', () => {});
    it('should submit form', () => {});
  });

  describe('Error Handling', () => {
    it('should display error message', () => {});
  });
});
```

### 2. Nommage des Tests

```typescript
// ✅ BON - Descriptif et clair
it('should display error message when login fails', () => {});
it('should disable submit button when form is invalid', () => {});

// ❌ MAUVAIS - Trop vague
it('should work', () => {});
it('test login', () => {});
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should add product to cart', () => {
  // Arrange - Préparer les données
  const product = { id: '1', name: 'Test', price: 100 };
  const cart = new CartService();

  // Act - Exécuter l'action
  cart.addProduct(product);

  // Assert - Vérifier le résultat
  expect(cart.items.length).toBe(1);
  expect(cart.items[0]).toEqual(product);
});
```

### 4. Mocking Efficace

```typescript
// Mock d'un service
const mockAuthService = {
  login: vi.fn().mockResolvedValue({ token: 'abc123' }),
  logout: vi.fn(),
  isAuthenticated: vi.fn().mockReturnValue(true)
};

// Mock d'une réponse HTTP
const mockProducts = [
  { id: '1', name: 'Product 1' },
  { id: '2', name: 'Product 2' }
];
```

### 5. Tests Asynchrones

```typescript
// Avec async/await
it('should load data', async () => {
  const data = await service.getData();
  expect(data).toBeDefined();
});

// Avec done callback
it('should emit event', (done) => {
  service.event$.subscribe(value => {
    expect(value).toBe('test');
    done();
  });
  service.triggerEvent();
});

// Avec fakeAsync
it('should debounce input', fakeAsync(() => {
  component.search('test');
  tick(300);
  expect(component.results.length).toBeGreaterThan(0);
}));
```

### 6. Coverage Minimum

```typescript
// Viser au minimum:
// - Statements: 80%
// - Branches: 75%
// - Functions: 80%
// - Lines: 80%
```

---

## 🎯 CHECKLIST POUR CHAQUE COMPOSANT

- [ ] Test de création du composant
- [ ] Test des inputs/outputs
- [ ] Test des interactions utilisateur
- [ ] Test de la gestion d'erreurs
- [ ] Test des cas limites (null, undefined, empty)
- [ ] Test de l'accessibilité (si applicable)
- [ ] Test des appels API (avec mocks)
- [ ] Test de la navigation (si applicable)

---

## 📊 COMMANDES DE COVERAGE

```bash
# Générer le rapport de coverage
npx vitest run --coverage

# Ouvrir le rapport HTML
# Le fichier sera dans: frontend/coverage/index.html
```

---

## 🔧 DEBUGGING

### Avec Chrome DevTools

```bash
# Lancer en mode debug
npx vitest --inspect-brk

# Ouvrir chrome://inspect dans Chrome
# Cliquer sur "inspect" pour le process Node
```

### Avec Console Logs

```typescript
it('should debug test', () => {
  console.log('Debug info:', component.data);
  expect(component.data).toBeDefined();
});
```

---

## 📚 RESSOURCES

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Angular](https://testing-library.com/docs/angular-testing-library/intro/)
- [Angular Testing Guide](https://angular.dev/guide/testing)

---

## ✨ PROCHAINES ÉTAPES

1. Créer les premiers tests pour les services critiques
2. Ajouter des tests pour les composants partagés
3. Configurer le CI/CD pour exécuter les tests automatiquement
4. Viser 80% de coverage minimum

**Status**: ✅ Configuration prête - Prêt à écrire des tests!
