import { Injectable, computed, effect, signal } from '@angular/core';
import { ItemPedidoRequest } from '../models/pedido';
import { Opcion } from '../models/opcion';
import { Producto } from '../models/producto';
import { Sabor } from '../models/sabor';
import { Topping } from '../models/topping';

export interface ToppingElegido {
  topping: Topping;
  extra: boolean; // RN-03: pasa del límite incluido y se cobra aparte
}

export interface ItemCarrito {
  clave: string;
  producto: Producto;
  cantidad: number;
  sabores: Sabor[];
  toppings: ToppingElegido[];
  opciones: Opcion[];
  precioUnitario: number; // precio + extras (referencial: el total final lo calcula el backend)
}

const CLAVE_ALMACEN = 'dolce-gelato-carrito';
const MAX_CANTIDAD = 20;

// Carrito del cliente. Se guarda en el navegador para no perderlo al recargar.
@Injectable({ providedIn: 'root' })
export class CarritoService {
  readonly items = signal<ItemCarrito[]>(this.leer());

  readonly cantidad = computed(() => this.items().reduce((suma, item) => suma + item.cantidad, 0));
  readonly subtotal = computed(() =>
    this.items().reduce((suma, item) => suma + item.precioUnitario * item.cantidad, 0),
  );

  constructor() {
    effect(() => this.guardar(this.items()));
  }

  agregar(item: Omit<ItemCarrito, 'clave'>): void {
    const clave = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : String(Date.now() + Math.random());
    this.items.update((items) => [...items, { ...item, clave }]);
  }

  cambiarCantidad(clave: string, cantidad: number): void {
    if (cantidad < 1) {
      this.quitar(clave);
      return;
    }
    const limitada = Math.min(cantidad, MAX_CANTIDAD);
    this.items.update((items) => items.map((i) => (i.clave === clave ? { ...i, cantidad: limitada } : i)));
  }

  quitar(clave: string): void {
    this.items.update((items) => items.filter((i) => i.clave !== clave));
  }

  vaciar(): void {
    this.items.set([]);
  }

  // Solo ids: el backend vuelve a validar todo y calcula los precios
  paraEnviar(): ItemPedidoRequest[] {
    return this.items().map((item) => ({
      productoId: item.producto.id,
      cantidad: item.cantidad,
      saborIds: item.sabores.map((s) => s.id!),
      toppingIds: item.toppings.map((t) => t.topping.id!),
      opcionIds: item.opciones.map((o) => o.id),
    }));
  }

  private leer(): ItemCarrito[] {
    try {
      const guardado = localStorage.getItem(CLAVE_ALMACEN);
      return guardado ? (JSON.parse(guardado) as ItemCarrito[]) : [];
    } catch {
      return [];
    }
  }

  private guardar(items: ItemCarrito[]): void {
    try {
      localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(items));
    } catch {
      // Si el navegador no permite guardar, el carrito igual funciona mientras la página esté abierta
    }
  }
}
