# S.I. Protection — Sistema de Supervisión Operativa

Sistema web para la supervisión remota de personal de seguridad, desarrollado como Proyecto de Titulación en la Universidad del Bío-Bío.

## Descripción

Permite al supervisor asignar tareas al personal de seguridad desde la sala de monitoreo, recibir evidencia fotográfica de su ejecución desde terreno, validar su cumplimiento y generar informes automáticos de turno.

## Tecnologías

- **Backend:** Node.js + Express + TypeScript + Prisma ORM
- **Base de datos:** PostgreSQL 16
- **Frontend:** React + Vite + TypeScript
- **Infraestructura:** Docker + Docker Compose

## Requisitos previos

- Docker Desktop instalado y en ejecución
- Git instalado

## Despliegue

```bash
# 1. Clonar el repositorio
git clone https://github.com/carlosss12/sip-supervision.git

# 2. Ingresar al directorio
cd sip-supervision

# 3. (Opcional) Configurar variables de entorno
cp .env.example .env
# Editar .env si se requieren valores personalizados

# 4. Levantar el proyecto
docker compose up --build
```

El proyecto levanta automáticamente sin necesidad de configurar el `.env`, ya que el `docker-compose.yml` define valores por defecto para todas las variables.

## Acceso al sistema

| Servicio | URL |
|---|---|
| Frontend (aplicación web) | http://localhost:5173 |
| Backend (API REST) | http://localhost:4000 |
| Health check | http://localhost:4000/api/health |

## Credenciales de prueba

El sistema crea automáticamente un usuario supervisor al levantar por primera vez:

| Rol | Email | Contraseña |
|---|---|---|
| Supervisor | supervisor@sip.cl | admin123 |

Los guardias son creados por el supervisor desde el panel de gestión del sistema.

## Estructura del repositorio

```
sip-supervision/
├── docker-compose.yml
├── .env.example
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── controllers/
│       ├── middlewares/
│       ├── routes/
│       └── index.ts
└── frontend/
    ├── Dockerfile
    └── src/
        ├── components/
        ├── pages/
        ├── types/
        └── App.tsx
```

## Autor

Carlos Ignacio Gana González  
Ingeniería en Ejecución en Computación e Informática  
Universidad del Bío-Bío — 2026
