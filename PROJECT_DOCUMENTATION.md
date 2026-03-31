# Esprit Market - Project Documentation

## 📚 Quick Navigation

### Essential Documentation
- **[README.md](README.md)** - Main project documentation
- **[USEFUL_COMMANDS.md](USEFUL_COMMANDS.md)** - Common commands for development

### Testing Documentation
- **[FRONTEND_TESTS_GUIDE_FR.md](FRONTEND_TESTS_GUIDE_FR.md)** - Complete frontend testing guide
- **[DEMARRAGE_RAPIDE_TESTS_FR.md](DEMARRAGE_RAPIDE_TESTS_FR.md)** - Quick start for tests
- **[UNIT_TESTS_COMPLETE_FINAL.md](UNIT_TESTS_COMPLETE_FINAL.md)** - Backend unit tests guide

### Feature Documentation
- **[SELLER_MARKETPLACE_FEATURE.md](SELLER_MARKETPLACE_FEATURE.md)** - Seller marketplace features
- **[FAVORITES_FEATURE_COMPLETE.md](FAVORITES_FEATURE_COMPLETE.md)** - Favorites system
- **[MARKETPLACE_UNIFIED.md](MARKETPLACE_UNIFIED.md)** - Complete marketplace overview

## 🚀 Quick Start

### Backend (Spring Boot)
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### Frontend (Angular)
```bash
cd frontend
npm install
ng serve
```

### Run Tests
```bash
# Backend tests
cd backend
mvn test

# Frontend tests
cd frontend
npm test
```

## 📊 Test Coverage

### Backend Tests (Java/Spring Boot)
- ✅ ProductServiceTest: 14 tests
- ✅ ServiceServiceTest: 17 tests
- ✅ ShopServiceTest: 12 tests
- ✅ FavorisServiceTest: 22 tests
- **Total**: 65 tests (100% passing)

### Frontend Tests (Angular/Vitest)
- ✅ ToastService: 15 tests
- ✅ Other services: 62 tests
- **Total**: 77 tests (100% passing)

## 🏗️ Project Structure

```
Espritmarket/
├── backend/                 # Spring Boot backend
│   ├── src/
│   │   ├── main/java/      # Application code
│   │   └── test/java/      # Unit tests
│   └── pom.xml
│
├── frontend/               # Angular frontend
│   ├── src/
│   │   ├── app/           # Application code
│   │   └── vitest.setup.ts
│   └── package.json
│
└── docs/                  # Documentation (archived)
```

## 🔧 Key Features

### Marketplace
- Product listing and management
- Service offerings
- Shop management
- Category filtering
- Search functionality

### User Roles
- **CLIENT**: Browse and purchase
- **PROVIDER**: Sell products/services
- **DRIVER**: Offer rides
- **DELIVERY**: Delivery services
- **ADMIN**: System administration

### Additional Features
- Favorites system
- Shopping cart
- Loyalty program
- Reviews and ratings
- Real-time notifications

## 📝 Development Notes

### Backend
- Java 17
- Spring Boot 3.x
- MongoDB
- JWT Authentication

### Frontend
- Angular 21
- Vitest for testing
- TailwindCSS
- Signals API

## 🐛 Troubleshooting

### Backend won't start
```bash
cd backend
mvn clean install -DskipTests
mvn spring-boot:run
```

### Frontend compilation errors
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Tests failing
```bash
# Backend
mvn clean test

# Frontend
npm test -- --run
```

## 📞 Support

For issues or questions, refer to:
1. This documentation
2. Test guides in the testing section
3. Feature-specific documentation

---

**Last Updated**: 2024
**Version**: 1.0.0
