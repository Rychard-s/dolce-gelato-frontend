import { Promocion } from './promocion';
import { ZonaEntrega } from './zona-entrega';

export type TipoEntrega = 'RECOJO' | 'DELIVERY';
export type MetodoPago = 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TARJETA';
export type EstadoPedido = 'RECIBIDO' | 'EN_PREPARACION' | 'LISTO' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO';

export interface DetallePedido {
  id: number;
  productoId: number;
  nombreProducto: string;
  precioUnitario: number;
  cantidad: number;
  sabores: string | null;
  toppings: string | null;
  opciones: string | null;
  costoExtras: number;
  subtotal: number;
}

export interface Pedido {
  id: number;
  codigoSeguimiento: string;
  nombreCliente: string;
  telefono: string;
  tipoEntrega: TipoEntrega;
  direccion: string | null;
  referencia: string | null;
  zona: ZonaEntrega | null;
  costoEnvio: number;
  horaSolicitada: string | null;
  subtotal: number;
  descuento: number;
  total: number;
  promocion: Promocion | null;
  estado: EstadoPedido;
  motivoCancelacion: string | null;
  metodoPago: MetodoPago | null;
  pagado: boolean;
  creadoEn: string;
  detalles: DetallePedido[];
  estadosSiguientes: EstadoPedido[]; // calculado en el backend (RN-10)
}

// Respuesta pública del seguimiento: solo el estado
export interface Seguimiento {
  codigo: string;
  estado: EstadoPedido;
  tipoEntrega: TipoEntrega;
  total: number;
  horaSolicitada: string | null;
  creadoEn: string;
}

// Lo que se envía al crear un pedido (nunca lleva precios)
export interface ItemPedidoRequest {
  productoId: number;
  cantidad: number;
  saborIds: number[];
  toppingIds: number[];
  opcionIds: number[];
}

export interface PedidoRequest {
  nombreCliente: string;
  telefono: string;
  tipoEntrega: TipoEntrega;
  direccion: string | null;
  referencia: string | null;
  zonaId: number | null;
  horaSolicitada: string | null;
  items: ItemPedidoRequest[];
}

// RF-17: reporte de más vendidos
export interface ProductoVendido {
  nombreProducto: string;
  cantidad: number;
}
