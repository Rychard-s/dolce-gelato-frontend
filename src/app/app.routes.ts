import { Routes } from '@angular/router';
import { rolGuard } from './guards/rol.guard';
import { Inicio } from './pages/inicio/inicio';
import { Pedido } from './pages/pedido/pedido';
import { Confirmacion } from './pages/confirmacion/confirmacion';
import { SeguimientoPagina } from './pages/seguimiento/seguimiento';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';

// Las páginas del cliente se cargan de inmediato.
// Las internas (cocina, admin) y "Mis pedidos" se cargan solo cuando se entra (lazy loading):
// así la web pública abre más rápido.
export const routes: Routes = [
  // Público (cliente)
  { path: '', component: Inicio, title: 'Dolce Gelato · Pide en línea' },
  { path: 'pedido', component: Pedido, title: 'Tu pedido · Dolce Gelato' },
  { path: 'pedido/:codigo', component: Confirmacion, title: 'Pedido recibido · Dolce Gelato' },
  { path: 'seguimiento', component: SeguimientoPagina, title: 'Sigue tu pedido · Dolce Gelato' },
  { path: 'seguimiento/:codigo', component: SeguimientoPagina, title: 'Sigue tu pedido · Dolce Gelato' },
  { path: 'login', component: Login, title: 'Ingresar · Dolce Gelato' },
  { path: 'registro', component: Registro, title: 'Crea tu cuenta · Dolce Gelato' },

  // Cliente registrado
  {
    path: 'mis-pedidos',
    loadComponent: () => import('./pages/mis-pedidos/mis-pedidos').then((m) => m.MisPedidos),
    canActivate: [rolGuard(['CLIENTE'])],
    title: 'Mis pedidos · Dolce Gelato',
  },

  // Interno: cocina y caja
  {
    path: 'cocina',
    loadComponent: () => import('./pages/cocina/cocina').then((m) => m.Cocina),
    canActivate: [rolGuard(['COCINA', 'ADMIN'])],
    title: 'Cocina · Dolce Gelato',
  },

  // Interno: administrador
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin').then((m) => m.Admin),
    canActivate: [rolGuard(['ADMIN'])],
    children: [
      { path: '', redirectTo: 'productos', pathMatch: 'full' },
      {
        path: 'productos',
        loadComponent: () => import('./pages/admin/productos/admin-productos').then((m) => m.AdminProductos),
        title: 'Productos · Admin',
      },
      {
        path: 'productos/nuevo',
        loadComponent: () => import('./pages/admin/producto-form/producto-form').then((m) => m.ProductoForm),
        title: 'Nuevo producto · Admin',
      },
      {
        path: 'productos/editar/:id',
        loadComponent: () => import('./pages/admin/producto-form/producto-form').then((m) => m.ProductoForm),
        title: 'Editar producto · Admin',
      },
      {
        path: 'disponibilidad',
        loadComponent: () => import('./pages/admin/disponibilidad/admin-disponibilidad').then((m) => m.AdminDisponibilidad),
        title: 'Agotados · Admin',
      },
      {
        path: 'promociones',
        loadComponent: () => import('./pages/admin/promociones/admin-promociones').then((m) => m.AdminPromociones),
        title: 'Promociones · Admin',
      },
      {
        path: 'zonas',
        loadComponent: () => import('./pages/admin/zonas/admin-zonas').then((m) => m.AdminZonas),
        title: 'Zonas · Admin',
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./pages/admin/usuarios/admin-usuarios').then((m) => m.AdminUsuarios),
        title: 'Usuarios · Admin',
      },
      {
        path: 'reportes',
        loadComponent: () => import('./pages/admin/reportes/admin-reportes').then((m) => m.AdminReportes),
        title: 'Reportes · Admin',
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
