import { Categoria } from './categoria';
import { Producto } from './producto';

export type TipoPromocion = 'PORCENTAJE' | 'PRECIO_FIJO' | 'CANTIDAD';
export type DiaSemana = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface Promocion {
  id: number;
  titulo: string;
  descripcion: string | null;
  tipo: TipoPromocion;
  valor: number;            // PORCENTAJE: %  |  PRECIO_FIJO: precio unitario  |  CANTIDAD: precio del grupo
  producto: Producto | null;
  categoria: Categoria | null;
  cantidad: number | null;  // solo CANTIDAD (ej. 2 litros)
  diaSemana: DiaSemana | null; // promoción semanal; null = todos los días
  soloEnTienda: boolean;    // informativa: no se aplica a pedidos web
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
  vigente: boolean; // calculado en el backend (@Transient)
}

export interface PromocionGuardar {
  titulo: string;
  descripcion: string | null;
  tipo: TipoPromocion;
  valor: number;
  producto: { id: number } | null;
  categoria: { id: number } | null;
  cantidad: number | null;
  diaSemana: DiaSemana | null;
  soloEnTienda: boolean;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
}

export const NOMBRE_DIA: Record<DiaSemana, string> = {
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
};
