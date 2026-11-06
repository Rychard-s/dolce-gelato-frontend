import { Producto } from './producto';

export interface Opcion {
  id: number;
  producto: Producto;
  grupo: string;
  nombre: string;
  obligatorio: boolean;
  maxElegir: number;
  disponible: boolean;
}
