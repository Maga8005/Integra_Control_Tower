# Integra Control Tower - Backend API

Backend MVP para el sistema de financiamiento de importaciones de Integra Control Tower.

## 🚀 Tecnologías

- **Backend**: Express.js + TypeScript
- **Base de datos**: PostgreSQL + TypeORM
- **Seguridad**: Helmet, CORS, JWT
- **Testing**: Jest + Supertest
- **Code Quality**: ESLint + Prettier

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── app.ts                 # Aplicación principal Express
│   ├── config/
│   │   └── database.ts        # Configuración de PostgreSQL
│   └── types/
│       └── Operation.ts       # Definiciones TypeScript
├── dist/                      # Código compilado
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ Instalación y Configuración

### 1. Instalar dependencias
```bash
cd backend
npm install
```

### 2. Variables de entorno
Crear archivo `.env` en la carpeta `backend/`:

```env
# Servidor
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Base de datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=integra_control_tower
DB_TEST_NAME=integra_control_tower_test

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=24h
```

### 3. Configurar PostgreSQL
```sql
-- Crear base de datos
CREATE DATABASE integra_control_tower;
CREATE DATABASE integra_control_tower_test;

-- Crear usuario (opcional)
CREATE USER integra_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE integra_control_tower TO integra_user;
GRANT ALL PRIVILEGES ON DATABASE integra_control_tower_test TO integra_user;
```

## 📋 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Iniciar servidor en modo desarrollo

# Producción
npm run build        # Compilar TypeScript
npm start            # Iniciar servidor compilado

# Testing
npm test             # Ejecutar tests
npm run test:watch   # Tests en modo watch

# Code Quality
npm run lint         # Linter ESLint
npm run lint:fix     # Arreglar errores de linting automáticamente
npm run typecheck    # Verificar tipos TypeScript
```

## 🌐 Endpoints Disponibles

### Health Check
- `GET /health` - Estado del sistema y base de datos
- `GET /api` - Información de la API

### Autenticación (En desarrollo)
- `POST /api/auth/login` - Login de usuarios
- `POST /api/auth/register` - Registro de usuarios

### Operaciones (En desarrollo)  
- `GET /api/operations` - Listar operaciones
- `POST /api/operations` - Crear nueva operación
- `GET /api/operations/:id` - Obtener operación por ID
- `PUT /api/operations/:id` - Actualizar operación

### Documentos (En desarrollo)
- `POST /api/operations/:id/documents` - Subir documento
- `GET /api/operations/:id/documents` - Listar documentos

## 🏗️ Desarrollo

### Iniciar servidor de desarrollo
```bash
npm run dev
```

El servidor se iniciará en `http://localhost:3001`

### Verificar funcionamiento
```bash
# Health check
curl http://localhost:3001/health

# Info de la API
curl http://localhost:3001/api
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Tests en modo watch
npm run test:watch

# Tests con coverage
npm test -- --coverage
```

## 📦 Build para Producción

```bash
# Compilar TypeScript
npm run build

# Iniciar servidor de producción
npm start
```

## 🔧 Clean Architecture

El backend sigue principios de Clean Architecture:

- **Entities**: Modelos de dominio (`src/types/`)
- **Use Cases**: Lógica de negocio (`src/services/`)
- **Interface Adapters**: Controllers y DTOs (`src/controllers/`)
- **Frameworks**: Express, TypeORM (`src/config/`)

## 📊 Monitoreo y Logs

- **Logging**: Winston para logs estructurados
- **Health Checks**: Endpoint `/health` con estado de DB
- **Request IDs**: Trazabilidad de requests con UUIDs
- **Error Handling**: Manejo centralizado de errores

## 🔒 Seguridad

- **Helmet**: Headers de seguridad HTTP
- **CORS**: Configuración restrictiva para frontend
- **Rate Limiting**: Control de tasa de requests
- **Input Validation**: Joi para validación de datos
- **JWT**: Autenticación stateless

## 🚀 Deployment

### Docker (Recomendado)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/app.js"]
```

### Variables de Producción
```env
NODE_ENV=production
PORT=3001
DB_HOST=your_production_db_host
DB_SSL=true
JWT_SECRET=super_secure_secret_for_production
```

## 📞 Soporte

Para problemas o dudas sobre el backend, contactar al equipo de desarrollo de Integra.