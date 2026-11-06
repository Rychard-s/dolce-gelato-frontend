# Dolce Gelato · Frontend (Angular)

Sistema web de pedidos para Dolce Gelato y Dolce Burger (Jesús María, Lima).
Proyecto del curso **Soluciones Web y Aplicaciones Distribuidas**, UPN.

El backend (Spring Boot) está en el repositorio `dolce-gelato-backend`.

## Requisitos

- Node.js LTS y Angular CLI (`npm install -g @angular/cli`)
- El backend corriendo en `http://localhost:8080`

## Cómo ejecutar

Orden recomendado: **MySQL → backend → frontend**.

```bash
npm install      # solo la primera vez
ng serve
```

Abrir `http://localhost:4200`.

## Usuarios de prueba

| Usuario | Contraseña | Rol | Entra a |
|---|---|---|---|
| admin | admin123 | Administrador | `/admin` y `/cocina` |
| cocina | cocina123 | Cocina / caja | `/cocina` |

El acceso del personal está en el pie de página o en `/login`.

## Páginas

| Ruta | Quién | Para qué |
|---|---|---|
| `/` | Cliente | Inicio, promociones y carta |
| `/pedido` | Cliente | Carrito, recojo o delivery, datos y confirmación |
| `/pedido/:codigo` | Cliente | Pedido recibido, total final y WhatsApp |
| `/seguimiento/:codigo` | Cliente | Estado del pedido (se actualiza solo) |
| `/cocina` | Cocina y admin | Cola de pedidos, estados, pago y aviso por WhatsApp |
| `/admin/...` | Admin | Productos, sabores y toppings, promociones, zonas, usuarios y reportes |

## Estructura

```
src/app
├── models/        interfaces que tipan los datos del backend (una por entidad)
├── services/      un servicio por recurso de la API (HttpClient)
├── interceptors/  agrega el token a cada petición
├── guards/        protege las páginas internas por rol
├── components/    piezas reutilizables (cabecera, pie, armar producto)
├── pages/         una carpeta por página
└── shared/        configuración, utilidades y pipe de soles
```

La URL del backend está en `src/app/shared/config.ts`.
