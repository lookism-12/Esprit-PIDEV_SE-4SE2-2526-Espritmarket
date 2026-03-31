# 🧪 Tests des Services Core

## 📁 Structure

```
services/
├── auth.service.ts
├── auth.service.spec.ts          ← À créer
├── toast.service.ts
├── toast.service.spec.ts         ✅ Créé (30+ tests)
├── marketplace.service.ts
├── marketplace.service.spec.ts   ← À créer
└── README_TESTS.md               ← Ce fichier
```

---

## ✅ Tests Existants

### toast.service.spec.ts
**Status**: ✅ Complet (30+ tests)

**Coverage**:
- Service creation
- Success/Error/Info/Warning toasts
- Auto-removal avec timers
- Multiple toasts
- Manual removal
- Clear all
- Edge cases

**Commande**:
```bash
npx vitest run src/app/core/services/toast.service.spec.ts
```

---

## 📝 Tests à Créer

### 1. auth.service.spec.ts (Priorité: HAUTE)

**Tests à inclure**:
- Login/Logout
- Token management
- isAuthenticated()
- getCurrentUser()
- Role checking
- Token refresh
- Error handling

**Template**:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Login', () => {
    it('should login successfully', (done) => {
      const credentials = { email: 'test@test.com', password: 'password' };
      const mockResponse = { token: 'abc123', user: { id: '1', email: 'test@test.com' } };

      service.login(credentials).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(localStorage.getItem('token')).toBe('abc123');
        done();
      });

      const req = httpMock.expectOne('http://localhost:8090/api/auth/login');
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should handle login error', (done) => {
      const credentials = { email: 'test@test.com', password: 'wrong' };

      service.login(credentials).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:8090/api/auth/login');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('Authentication State', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('token', 'abc123');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false when no token', () => {
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('Logout', () => {
    it('should clear token and user data', () => {
      localStorage.setItem('token', 'abc123');
      localStorage.setItem('user', JSON.stringify({ id: '1' }));

      service.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });
});
```

---

### 2. marketplace.service.spec.ts (Priorité: HAUTE)

**Tests à inclure**:
- getProducts()
- getProductById()
- getServices()
- getServiceById()
- getShops()
- Error handling
- Loading states

**Template**:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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

  describe('Products', () => {
    it('should fetch all products', (done) => {
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

    it('should fetch product by id', (done) => {
      const mockProduct = { id: '1', name: 'Product 1', price: 100 };

      service.getProductById('1').subscribe(product => {
        expect(product).toEqual(mockProduct);
        done();
      });

      const req = httpMock.expectOne('http://localhost:8090/api/marketplace/products/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockProduct);
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

  describe('Services', () => {
    it('should fetch all services', (done) => {
      const mockServices = [
        { id: '1', name: 'Service 1', price: 50 },
        { id: '2', name: 'Service 2', price: 75 }
      ];

      service.getServices().subscribe(services => {
        expect(services).toEqual(mockServices);
        expect(services.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne('http://localhost:8090/api/marketplace/services');
      expect(req.request.method).toBe('GET');
      req.flush(mockServices);
    });
  });
});
```

---

## 🚀 Commandes

### Lancer tous les tests des services
```bash
npx vitest run src/app/core/services/**/*.spec.ts
```

### Lancer un test spécifique
```bash
npx vitest run src/app/core/services/toast.service.spec.ts
```

### Mode watch
```bash
npx vitest src/app/core/services/**/*.spec.ts
```

### Avec coverage
```bash
npx vitest run --coverage src/app/core/services/
```

---

## 📊 Objectifs Coverage

```
Minimum Target:
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%
```

---

## ✅ Checklist par Service

Pour chaque service, tester:
- [ ] Création du service
- [ ] Méthodes principales
- [ ] Gestion d'erreurs
- [ ] États de chargement
- [ ] Cas limites (null, undefined, empty)
- [ ] Appels HTTP (avec mocks)
- [ ] Observables
- [ ] LocalStorage (si applicable)

---

## 💡 Bonnes Pratiques

### 1. Toujours nettoyer après les tests
```typescript
afterEach(() => {
  httpMock.verify();
  localStorage.clear();
  sessionStorage.clear();
});
```

### 2. Utiliser des mocks pour les dépendances
```typescript
const mockAuthService = {
  isAuthenticated: vi.fn().mockReturnValue(true)
};
```

### 3. Tester les cas d'erreur
```typescript
it('should handle error', (done) => {
  service.getData().subscribe({
    next: () => done.fail('Should have failed'),
    error: (error) => {
      expect(error).toBeDefined();
      done();
    }
  });
});
```

### 4. Utiliser done() pour les observables
```typescript
it('should emit value', (done) => {
  service.data$.subscribe(value => {
    expect(value).toBe('test');
    done();
  });
});
```

---

## 📚 Ressources

- [Guide Complet](../../../../../FRONTEND_TESTS_GUIDE_FR.md)
- [Démarrage Rapide](../../../../../DEMARRAGE_RAPIDE_TESTS_FR.md)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Angular](https://testing-library.com/docs/angular-testing-library/intro/)

---

## 🎯 Prochaines Étapes

1. ✅ toast.service.spec.ts - FAIT
2. 🔄 auth.service.spec.ts - À CRÉER
3. 🔄 marketplace.service.spec.ts - À CRÉER
4. 🔄 Autres services selon priorité

---

**Happy Testing! 🚀**
