import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_URL } from '../shared/config';
import { EstadoPedido, MetodoPago, Pedido, PedidoRequest, Seguimiento } from '../models/pedido';

const CLAVE_ULTIMO = 'dolce-gelato-ultimo-pedido';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private http = inject(HttpClient);
  private apiUrl = `${API_URL}/pedidos`;

  // El último pedido hecho en este navegador (para la página de confirmación)
  readonly ultimoPedido = signal<Pedido | null>(this.leerUltimo());

  // Público: el cliente hace su pedido
  registrar(pedido: PedidoRequest): Observable<Pedido> {
    return this.http.post<Pedido>(this.apiUrl, pedido).pipe(
      tap((creado) => {
        this.ultimoPedido.set(creado);
        try {
          sessionStorage.setItem(CLAVE_ULTIMO, JSON.stringify(creado));
        } catch {
          // no es crítico
        }
      }),
    );
  }

  // Público: consulta con el código
  seguimiento(codigo: string): Observable<Seguimiento> {
    return this.http.get<Seguimiento>(`${this.apiUrl}/seguimiento/${encodeURIComponent(codigo.trim())}`);
  }

  // Cocina: sin estado devuelve los pedidos en curso
  listar(estado?: EstadoPedido): Observable<Pedido[]> {
    const params: Record<string, string> = estado ? { estado } : {};
    return this.http.get<Pedido[]>(this.apiUrl, { params });
  }

  buscarPorId(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.apiUrl}/${id}`);
  }

  cambiarEstado(id: number, estado: EstadoPedido, motivo?: string): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.apiUrl}/${id}/estado`, { estado, motivo: motivo ?? null });
  }

  registrarPago(id: number, metodoPago: MetodoPago): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.apiUrl}/${id}/pago`, { metodoPago });
  }

  private leerUltimo(): Pedido | null {
    try {
      const guardado = sessionStorage.getItem(CLAVE_ULTIMO);
      return guardado ? (JSON.parse(guardado) as Pedido) : null;
    } catch {
      return null;
    }
  }
}
