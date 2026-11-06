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

  // RF-17
  masVendidos(): Observable<ProductoVendido[]> {
    return this.http.get<ProductoVendido[]>(`${this.apiUrl}/mas-vendidos`);
  }
}
