import { Producto } from './producto';

export type TipoPromocion = 'PORCENTAJE' | 'PRECIO_FIJO';

export interface Promocion {
  id: number;
  titulo: string;
  descripcion: string | null;
  tipo: TipoPromocion;
  valor: number;
  producto: Producto | null;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
  vigente: boolean; // campo calculado (@Transient) en el backend
}

export interface PromocionGuardar {
  titulo: string;
  descripcion: string | null;
  tipo: TipoPromocion;
  valor: number;
  producto: { id: number } | null;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
}
