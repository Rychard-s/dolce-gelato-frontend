export type TipoTopping = 'LIQUIDO' | 'SOLIDO';

export interface Topping {
  id?: number;
  nombre: string;
  tipo: TipoTopping;
  precioExtra: number;
  disponible: boolean;
}
