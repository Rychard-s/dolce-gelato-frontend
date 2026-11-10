import { Categoria } from './categoria';

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: Categoria;
  horaInicio: string; // "18:30:00"
  horaFin: string;
  cantidadSabores: number; // máximo de sabores
  saboresMinimos: number;  // mínimo (ej. helado de litro: de 1 a 3)
  toppingsLiquidos: number;
  toppingsSolidos: number;
  aptoDelivery: boolean;
  activo: boolean;
  disponibleAhora: boolean; // campo calculado (@Transient) en el backend
}

// Lo que se envía al registrar o actualizar un producto
export interface ProductoGuardar {
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: { id: number };
  horaInicio: string;
  horaFin: string;
  cantidadSabores: number;
  saboresMinimos: number;
  toppingsLiquidos: number;
  toppingsSolidos: number;
  aptoDelivery: boolean;
  activo: boolean;
}
