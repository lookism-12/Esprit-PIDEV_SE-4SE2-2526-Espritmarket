# Esprit Market

## Overview

**Esprit Market** is a comprehensive e-commerce platform developed as part of the PIDEV (Integrated Development Project) during the 3rd year of Engineering at **Esprit School of Engineering – Tunisia**. The platform provides a modern marketplace solution with robust features for users, vendors, and administrators to manage products, orders, and transactions seamlessly.

This project was developed during the **2025–2026 academic year** and demonstrates practical application of modern web technologies, security practices, and full-stack development principles.

## Features

- **User Authentication & Authorization**: Secure JWT-based authentication system with role-based access control
- **Product Management**: Create, read, update, and delete product listings with image upload support
- **Shopping Cart**: Real-time cart management with persistent storage
- **Order Processing**: Complete order lifecycle management from placement to delivery
- **User Profiles**: Customizable user accounts with order history and preferences
- **Admin Dashboard**: Administrative interface for managing users, products, and orders
- **Search & Filtering**: Advanced product search and category-based filtering
- **Responsive Design**: Mobile-first, responsive UI built with modern CSS frameworks
- **API Documentation**: Interactive Swagger/OpenAPI documentation

## Tech Stack

### Frontend
- **Angular 21**: Modern TypeScript-based frontend framework
- **RxJS**: Reactive programming for asynchronous operations
- **TailwindCSS**: Utility-first CSS framework for responsive design
- **Vitest**: Fast unit testing framework
- **TypeScript 5.9**: Type-safe JavaScript development

### Backend
- **Spring Boot 3.3.5**: Enterprise-grade Java framework
- **Spring Security**: Authentication and authorization framework
- **JWT (JSON Web Tokens)**: Secure token-based authentication
- **Spring Data MongoDB**: Data access layer for MongoDB
- **Spring AOP**: Aspect-oriented programming for cross-cutting concerns
- **SpringDoc OpenAPI**: API documentation (Swagger UI)
- **Lombok**: Reducing boilerplate code in Java
- **Maven**: Build automation and dependency management

### Database
- **MongoDB**: NoSQL document-oriented database for flexible data modeling

### Other Tools
- **Docker**: Containerization for consistent deployment
- **Git**: Version control system
- **Prettier**: Code formatting for consistent style
- **Java 17**: LTS version of Java platform

## Architecture

The project follows a **monolithic architecture** with clear separation of concerns:

- **Frontend (Angular)**: Single Page Application (SPA) communicating with the backend via RESTful APIs
- **Backend (Spring Boot)**: Layered architecture with Controllers, Services, Repositories, and Security layers
- **Database (MongoDB)**: Document-based storage with collections for users, products, orders, and more
- **Authentication**: JWT-based stateless authentication with Spring Security filters
- **API Layer**: RESTful endpoints with comprehensive validation and error handling

```
┌─────────────────────────┐
│   Angular Frontend      │
│   (Port 4200)           │
└───────────┬─────────────┘
            │ HTTP/REST
            │ (JWT Token)
┌───────────▼─────────────┐
│  Spring Boot Backend    │
│  (Port 8090)            │
│  - Controllers          │
│  - Services             │
│  - Security (JWT)       │
│  - Repositories         │
└───────────┬─────────────┘
            │
┌───────────▼─────────────┐
│   MongoDB Database      │
│   (Port 27017)          │
└─────────────────────────┘
```

## Contributors

This project was developed by a dedicated team of 3rd-year Engineering students at Esprit:

- **Zekri Farah**
- **Tessnim Bouzekri**
- **Mohamed Amine Shili**
- **Feriel Guesmi**
- **Eya Weslati**
- **Ameni Makdouli**

## Academic Context

- **Institution**: Esprit School of Engineering – Tunisia
- **Program**: PIDEV (Integrated Development Project) – 3rd Year Engineering
- **Academic Year**: 2025–2026
- **Objective**: Develop a full-stack web application demonstrating proficiency in modern software development, team collaboration, and project management

## Getting Started

### Prerequisites

Before running the project, ensure you have the following installed:

- **Java 17** or higher
- **Node.js 18+** and **npm 11+**
- **MongoDB 6+** (running locally or via Docker)
- **Maven 3.8+** (or use the included Maven wrapper)
- **Git**

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/[YOUR-USERNAME]/Espritmarket.git
cd espritmarket
```

2. **Configure MongoDB**

Ensure MongoDB is running on `localhost:27017`, or update the connection string in `backend/src/main/resources/application.properties`:

```properties
spring.data.mongodb.uri=mongodb://localhost:27017/esprit_market
```

3. **Configure Backend Environment**

Copy the example environment file and configure as needed:

```bash
cd backend
cp .env.example .env
# Edit .env with your configuration (JWT secret, MongoDB URI, etc.)
```

### Running the Backend

Navigate to the backend directory and run:

```bash
cd backend

# Using Maven wrapper (recommended)
./mvnw spring-boot:run

# OR using installed Maven
mvn spring-boot:run
```

The backend will start at: **http://localhost:8080**

API Documentation (Swagger UI): **http://localhost:8080/swagger-ui.html**

### Running the Frontend

Navigate to the frontend directory and run:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will start at: **http://localhost:4200**

### Docker Deployment (Optional)

To run the entire application using Docker:

```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# Stop all services
docker-compose down
```

### Running Tests

**Frontend Tests:**

```bash
cd frontend
npm test              # Run tests once
npm run test:watch    # Run tests in watch mode
```

**Backend Tests:**

```bash
cd backend
mvn test
```

## Project Structure

```
Espritmarket/
├── backend/               # Spring Boot backend application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/     # Java source code
│   │   │   └── resources/ # Configuration files
│   │   └── test/         # Unit and integration tests
│   ├── pom.xml           # Maven configuration
│   └── Dockerfile        # Backend Docker configuration
│
├── frontend/             # Angular frontend application
│   ├── src/
│   │   ├── app/          # Application components, services, guards
│   │   ├── assets/       # Static assets (images, fonts)
│   │   └── environments/ # Environment configurations
│   ├── package.json      # npm dependencies
│   ├── angular.json      # Angular CLI configuration
│   ├── tailwind.config.js # TailwindCSS configuration
│   └── Dockerfile        # Frontend Docker configuration
│
├── infra/                # Infrastructure and deployment configs
└── README.md             # This file
```

## API Endpoints

The backend exposes RESTful APIs organized by domain:

- **Authentication**: `/api/auth/*` - Login, register, token refresh
- **Users**: `/api/users/*` - User management
- **Products**: `/api/products/*` - Product CRUD operations
- **Orders**: `/api/orders/*` - Order management
- **Categories**: `/api/categories/*` - Category management

Full API documentation is available at **http://localhost:8080/swagger-ui.html** when the backend is running.

## Security

- JWT-based authentication with access and refresh tokens
- Password encryption using BCrypt
- CORS configuration for frontend-backend communication
- Input validation and sanitization
- Role-based access control (USER, ADMIN, VENDOR roles)

## Acknowledgments

We would like to express our gratitude to:

- **Esprit School of Engineering** for providing the academic framework and resources
- Our **PIDEV supervisors and instructors** for their guidance and support throughout the project
- The **open-source community** for the excellent frameworks and libraries that made this project possible

---

**Developed with ❤️ at Esprit School of Engineering – Tunisia | PIDEV 4se2 | 2025–2026**
