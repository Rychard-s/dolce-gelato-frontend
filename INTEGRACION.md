# Dolce Gelato · Evidencias de integración Angular + Spring Boot

## URLs

- Frontend: http://localhost:4200
- Backend: http://localhost:8080/api
- Base de datos: MySQL `dolce_gelato` (localhost:3306)

## Configuración por capa

| Capa | Archivo | Qué configura |
|---|---|---|
| MySQL | `application.properties` | URL, usuario, contraseña, `ddl-auto=update` |
| Spring Boot | `CorsConfig.java` | Permite el origen `http://localhost:4200` |
| Spring Boot | `WebConfig.java` + `AutenticacionInterceptor.java` | Rutas públicas y protegidas por rol |
| Angular | `app.config.ts` | `provideHttpClient(withInterceptors([authInterceptor]))` |
| Angular | `shared/config.ts` | URL base de la API |

## Pruebas (DevTools > Network)

Completar el estado observado y adjuntar captura de cada una.

| # | Acción en la web | Método y URL | Estado esperado | Estado observado |
|---|---|---|---|---|
| 1 | Abrir el inicio | GET /api/productos/carta | 200 | |
| 2 | Ver promociones | GET /api/promociones/vigentes | 200 | |
| 3 | Confirmar un pedido | POST /api/pedidos | 201 | |
| 4 | Confirmar pedido con sabor agotado | POST /api/pedidos | 400 | |
| 5 | Consultar seguimiento | GET /api/pedidos/seguimiento/{codigo} | 200 | |
| 6 | Código que no existe | GET /api/pedidos/seguimiento/XXXX | 404 | |
| 7 | Iniciar sesión | POST /api/usuarios/login | 200 | |
| 8 | Contraseña incorrecta | POST /api/usuarios/login | 401 | |
| 9 | Cocina: avanzar estado | PATCH /api/pedidos/{id}/estado | 200 | |
| 10 | Cocina: registrar pago | PATCH /api/pedidos/{id}/pago | 200 | |
| 11 | Admin: nuevo producto | POST /api/productos | 201 | |
| 12 | Admin: editar producto | PUT /api/productos/{id} | 200 | |
| 13 | Admin: eliminar producto sin pedidos | DELETE /api/productos/{id} | 204 | |
| 14 | Admin: marcar sabor agotado | PATCH /api/sabores/{id}/disponibilidad | 200 | |
| 15 | Cocina intenta crear producto | POST /api/productos | 403 | |

## Manejo de errores demostrado

| Situación | Qué se ve en la web | Explicación |
|---|---|---|
| Backend apagado | "No pudimos conectar con el sistema del local…" (HTTP 0) | No hubo respuesta: revisar que Spring Boot esté corriendo |
| Recurso que no existe | Mensaje del backend (HTTP 404) | La URL o el id no corresponde a un registro |
| Regla de negocio | Mensaje del backend (HTTP 400), ej. "El sabor Coconut está agotado" | La petición llegó pero no cumple las reglas |
| Sesión vencida o backend reiniciado | Vuelve al login con "Tu sesión terminó" (HTTP 401) | El token ya no es válido |
| Rol sin permiso | Mensaje del backend (HTTP 403) | El usuario de cocina no puede editar la carta |

## Problema encontrado y solución

**Error:** al crear un producto el backend respondía 400 "El formato del JSON es incorrecto", con la causa `Cannot map null into type int (categoria → orden)`.

**Diagnóstico:** Spring Boot 4 usa Jackson 3. Como las entidades tenían `@AllArgsConstructor`, Jackson armaba el objeto con ese constructor y ponía `null` en los campos `int` que no venían en el JSON.

**Solución:** se quitó `@AllArgsConstructor` de las entidades y se agregó `spring.jackson.deserialization.fail-on-null-for-primitives=false` en `application.properties`.

## Evidencias

Agregar aquí las capturas de Network de cada prueba.
