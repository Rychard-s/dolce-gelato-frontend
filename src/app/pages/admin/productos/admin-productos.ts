import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProductoService } from '../../../services/producto.service';
import { Producto, ProductoGuardar } from '../../../models/producto';
import { SolesPipe } from '../../../shared/soles.pipe';
import { horaCorta, mensajeConEstado } from '../../../shared/utilidades';

// Listado de productos: buscar, editar, activar/desactivar y eliminar (CRUD)
@Component({
  selector: 'app-admin-productos',
  imports: [RouterLink, SolesPipe],
  templateUrl: './admin-productos.html',
  styleUrl: '../admin-comun.scss',
})
export class AdminProductos implements OnInit {
  // Query param: /admin/productos?q=helado
  readonly q = input<string>();

  private productoService = inject(ProductoService);
  private router = inject(Router);

  productos = signal<Producto[]>([]);
  cargando = signal(false);
  error = signal('');
  protected horaCorta = horaCorta;

  // Filtro local por nombre o categoría (el backend no tiene endpoint de búsqueda)
  filtrados = computed(() => {
    const texto = (this.q() ?? '').trim().toLowerCase();
    const lista = [...this.productos()].sort(
      (a, b) => a.categoria.orden - b.categoria.orden || a.nombre.localeCompare(b.nombre),
    );
    if (!texto) return lista;
    return lista.filter(
      (p) => p.nombre.toLowerCase().includes(texto) || p.categoria.nombre.toLowerCase().includes(texto),
    );
  });

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.cargando.set(true);
    this.error.set('');
    this.productoService.listar().subscribe({
      next: (datos) => {
        this.productos.set(datos);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeConEstado(err));
        this.cargando.set(false);
      },
    });
  }

  // Actualiza el query param q (así se conserva al recargar la página)
  buscar(texto: string): void {
    this.router.navigate([], { queryParams: { q: texto.trim() || null }, queryParamsHandling: 'merge' });
  }

  cambiarActivo(producto: Producto): void {
    const datos: ProductoGuardar = {
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      categoria: { id: producto.categoria.id },
      horaInicio: horaCorta(producto.horaInicio),
      horaFin: horaCorta(producto.horaFin),
      cantidadSabores: producto.cantidadSabores,
      toppingsLiquidos: producto.toppingsLiquidos,
      toppingsSolidos: producto.toppingsSolidos,
      aptoDelivery: producto.aptoDelivery,
      activo: !producto.activo,
    };
    this.productoService.actualizar(producto.id, datos).subscribe({
      next: () => this.cargarProductos(),
      error: (err) => this.error.set(mensajeConEstado(err)),
    });
  }

  eliminar(producto: Producto): void {
    if (!confirm(`¿Desea eliminar "${producto.nombre}"?`)) return;
    this.productoService.eliminar(producto.id).subscribe({
      next: () => this.cargarProductos(),
      error: (err) => this.error.set(mensajeConEstado(err)),
    });
  }
}
