import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../shared/config';
import { DetallePedido, ProductoVendido } from '../models/pedido';

@Injectable({ providedIn: 'root' })
export class DetallePedidoService {
  private http = inject(HttpClient);
  private apiUrl = `${API_URL}/detalles-pedido`;

  listarPorPedido(pedidoId: number): Observable<DetallePedido[]> {
    return this.http.get<DetallePedido[]>(this.apiUrl, { params: { pedidoId } });
  }

  // RF-17: sin fechas trae todo el historial
  masVendidos(desde?: string, hasta?: string): Observable<ProductoVendido[]> {
    const params: Record<string, string> = desde && hasta ? { desde, hasta } : {};
    return this.http.get<ProductoVendido[]>(`${this.apiUrl}/mas-vendidos`, { params });
  }
}
