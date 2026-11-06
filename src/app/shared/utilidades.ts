import { HttpErrorResponse } from '@angular/common/http';
import { EstadoPedido } from '../models/pedido';

// Convierte el error del backend en un mensaje claro para el usuario
export function mensajeDeError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No pudimos conectar con el sistema del local. Revisa que el backend esté encendido e inténtalo otra vez.';
    }
    const cuerpo = error.error as { mensaje?: string; errores?: Record<string, string> } | null;
    if (cuerpo?.errores) {
      return Object.values(cuerpo.errores).join('. ');
    }
    if (cuerpo?.mensaje) {
      return cuerpo.mensaje;
    }
  }
  return 'Ocurrió un error inesperado. Inténtalo otra vez.';
}

// ---- Horarios (RN-01) ----

export function aMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

export function minutosAhora(): number {
  const ahora = new Date();
  return ahora.getHours() * 60 + ahora.getMinutes();
}

// "18:30:00" → "18:30"
export function horaCorta(hora: string | null | undefined): string {
  return hora ? hora.slice(0, 5) : '';
}

// Momento del día según los horarios de las dos líneas
export type Momento = 'antes' | 'gelato' | 'ambos' | 'cerrado';

export function momentoActual(minutos = minutosAhora()): Momento {
  if (minutos < aMinutos('10:00')) return 'antes';
  if (minutos < aMinutos('18:30')) return 'gelato';
  if (minutos < aMinutos('22:00')) return 'ambos';
  return 'cerrado';
}

// ---- Estados del pedido (RN-10) ----

export const NOMBRE_ESTADO: Record<EstadoPedido, string> = {
  RECIBIDO: 'Recibido',
  EN_PREPARACION: 'En preparación',
  LISTO: 'Listo',
  EN_CAMINO: 'En camino',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

// En los paneles internos mostramos también el código HTTP (útil para diagnosticar)
export function mensajeConEstado(error: unknown): string {
  const mensaje = mensajeDeError(error);
  return error instanceof HttpErrorResponse ? `Error HTTP ${error.status}: ${mensaje}` : mensaje;
}

// "2026-11-05T15:31:42" → "15:31"
export function horaDe(fechaHora: string | null | undefined): string {
  return fechaHora ? fechaHora.slice(11, 16) : '';
}
