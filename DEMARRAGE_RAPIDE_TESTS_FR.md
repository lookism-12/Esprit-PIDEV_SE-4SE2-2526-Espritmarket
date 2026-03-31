# 🚀 DÉMARRAGE RAPIDE - TESTS FRONTEND

## ⚡ EN 5 MINUTES

### 1. Vérifier l'Installation

```bash
cd frontend
npm install
```

### 2. Lancer le Premier Test

```bash
# Test du ToastService (déjà créé)
npm test
```

### 3. Voir les Résultats

Vous devriez voir :
```
✓ ToastService (30 tests)
  ✓ Service Creation (2)
  ✓ Success Toast (2)
  ✓ Error Toast (2)
  ✓ Info Toast (1)
  ✓ Warning Toast (1)
  ✓ Multiple Toasts (2)
  ✓ Manual Toast Removal (2)
  ✓ Clear All Toasts (1)
  ✓ Edge Cases (3)

Test Files  1 passed (1)
     Tests  30 passed (30)
```

---

## 📝 CRÉER VOTRE PREMIER TEST

### Exemple: Tester un Service Simple

```bash
# 1. Créer le fichier de test
touch frontend/src/app/core/services/auth.service.spec.ts
```

```typescript
// 2. Copier ce template
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Ajoutez vos tests ici
});
```

```bash
# 3. Lancer le test
npm test
```

---

## 🎯 COMMANDES ESSENTIELLES

```bash
# Lancer tous les tests
npm test

# Mode watch (re-exécute automatiquement)
npm run test:watch

# Avec interface UI
npx vitest --ui

# Avec coverage
npx vitest run --coverage

# Test d'un fichier spécifique
npx vitest run src/app/core/services/auth.service.spec.ts
```

---

## 📚 TEMPLATES RAPIDES

### Service avec HTTP

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { YourService } from './your.service';

describe('YourService', () => {
  let service: YourService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        YourService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(YourService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch data', (done) => {
    const mockData = { id: 1, name: 'Test' };

    service.getData().subscribe(data => {
      expect(data).toEqual(mockData);
      done();
    });

    const req = httpMock.expectOne('http://localhost:8090/api/data');
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });
});
```

### Composant Simple

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { YourComponent } from './your.component';

describe('YourComponent', () => {
  let component: YourComponent;
  let fixture: ComponentFixture<YourComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YourComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(YourComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

### Guard

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { YourGuard } from './your.guard';
import { AuthService } from '../services/auth.service';

describe('YourGuard', () => {
  let guard: YourGuard;
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
        YourGuard,
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    guard = TestBed.inject(YourGuard);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('should allow access when authenticated', () => {
    vi.spyOn(authService, 'isAuthenticated').mockReturnValue(true);
    expect(guard.canActivate()).toBe(true);
  });
});
```

---

## 🐛 DEBUGGING

### Voir les Logs

```typescript
it('should debug', () => {
  console.log('Debug:', component.data);
  expect(component.data).toBeDefined();
});
```

### Mode Debug Chrome

```bash
npx vitest --inspect-brk
# Ouvrir chrome://inspect dans Chrome
```

---

## ✅ CHECKLIST RAPIDE

Pour chaque nouveau composant/service:

1. [ ] Créer le fichier `.spec.ts`
2. [ ] Ajouter le test de création
3. [ ] Tester les méthodes principales
4. [ ] Tester les cas d'erreur
5. [ ] Lancer `npm test`
6. [ ] Vérifier que tout passe ✅

---

## 📊 VOIR LE COVERAGE

```bash
# Générer le rapport
npx vitest run --coverage

# Ouvrir le rapport HTML
# Fichier: frontend/coverage/index.html
```

---

## 🎯 OBJECTIFS

- Minimum 80% de coverage
- Tous les tests passent
- Tests rapides (< 1s par test)

---

## 💡 ASTUCES

### 1. Mode Watch
Gardez `npm run test:watch` ouvert pendant le développement

### 2. Tests Focalisés
```typescript
it.only('should test this one', () => {
  // Seul ce test sera exécuté
});
```

### 3. Skip Temporaire
```typescript
it.skip('should test later', () => {
  // Ce test sera ignoré
});
```

### 4. Grouper les Tests
```typescript
describe('Feature A', () => {
  it('test 1', () => {});
  it('test 2', () => {});
});

describe('Feature B', () => {
  it('test 3', () => {});
});
```

---

## 🆘 AIDE

### Erreur: "Cannot find module"
```bash
npm install
```

### Erreur: "TestBed not configured"
```typescript
beforeEach(() => {
  TestBed.configureTestingModule({
    // Configuration ici
  });
});
```

### Tests Lents
```typescript
// Utiliser des mocks au lieu de vrais services
const mockService = {
  method: vi.fn().mockReturnValue('result')
};
```

---

## 📚 DOCUMENTATION COMPLÈTE

- **Guide Complet**: `FRONTEND_TESTS_GUIDE_FR.md`
- **Exemple Complet**: `frontend/src/app/core/services/toast.service.spec.ts`
- **Vue d'Ensemble**: `TESTS_COMPLETS_BACKEND_FRONTEND.md`

---

## ✨ PRÊT À COMMENCER !

```bash
cd frontend
npm run test:watch
```

Ouvrez votre éditeur et commencez à écrire des tests ! 🚀
