import { Routes } from '@angular/router';
import { rolGuard } from './guards/rol.guard';
import { Inicio } from './pages/inicio/inicio';
import { Pedido } from './pages/pedido/pedido';
import { Confirmacion } from './pages/confirmacion/confirmacion';
import { SeguimientoPagina } from './pages/seguimiento/seguimiento';
import { Login } from './pages/login/login';
import { Cocina } from './pages/cocina/cocina';
import { Admin } from './pages/admin/admin';
import { AdminProductos } from './pages/admin/productos/admin-productos';
import { ProductoForm } from './pages/admin/producto-form/producto-form';
import { AdminDisponibilidad } from './pages/admin/disponibilidad/admin-disponibilidad';
import { AdminPromociones } from './pages/admin/promociones/admin-promociones';
import { AdminZonas } from './pages/admin/zonas/admin-zonas';
import { AdminUsuarios } from './pages/admin/usuarios/admin-usuarios';
import { AdminReportes } from './pages/admin/reportes/admin-reportes';

export const routes: Routes = [
  // Público (cliente)
  { path: '', component: Inicio, title: 'Dolce Gelato · Pide en línea' },
  { path: 'pedido', component: Pedido, title: 'Tu pedido · Dolce Gelato' },
  { path: 'pedido/:codigo', component: Confirmacion, title: 'Pedido recibido · Dolce Gelato' },
  { path: 'seguimiento', component: SeguimientoPagina, title: 'Sigue tu pedido · Dolce Gelato' },
  { path: 'seguimiento/:codigo', component: SeguimientoPagina, title: 'Sigue tu pedido · Dolce Gelato' },
  { path: 'login', component: Login, title: 'Ingresar · Dolce Gelato' },

  // Interno: cocina y caja
  { path: 'cocina', component: Cocina, canActivate: [rolGuard(['COCINA', 'ADMIN'])], title: 'Cocina · Dolce Gelato' },

  // Interno: administrador
  {
    path: 'admin',
    component: Admin,
    canActivate: [rolGuard(['ADMIN'])],
    children: [
      { path: '', redirectTo: 'productos', pathMatch: 'full' },
      { path: 'productos', component: AdminProductos, title: 'Productos · Admin' },
      { path: 'productos/nuevo', component: ProductoForm, title: 'Nuevo producto · Admin' },
      { path: 'productos/editar/:id', component: ProductoForm, title: 'Editar producto · Admin' },
      { path: 'disponibilidad', component: AdminDisponibilidad, title: 'Agotados · Admin' },
      { path: 'promociones', component: AdminPromociones, title: 'Promociones · Admin' },
      { path: 'zonas', component: AdminZonas, title: 'Zonas · Admin' },
      { path: 'usuarios', component: AdminUsuarios, title: 'Usuarios · Admin' },
      { path: 'reportes', component: AdminReportes, title: 'Reportes · Admin' },
    ],
  },

  { path: '**', redirectTo: '' },
];
