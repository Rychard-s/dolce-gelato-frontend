export type Linea = 'GELATO' | 'BURGER';

export interface Categoria {
  id: number;
  nombre: string;
  linea: Linea;
  orden: number;
}
