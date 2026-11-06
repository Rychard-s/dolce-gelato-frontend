import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

// Contenedor del panel de administración: menú lateral + página elegida
@Component({
  selector: 'app-admin',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin {
  protected secciones = [
    { ruta: 'productos', texto: 'Productos' },
    { ruta: 'disponibilidad', texto: 'Sabores y toppings' },
    { ruta: 'promociones', texto: 'Promociones' },
    { ruta: 'zonas', texto: 'Zonas de delivery' },
    { ruta: 'usuarios', texto: 'Usuarios' },
    { ruta: 'reportes', texto: 'Reportes' },
  ];
}
