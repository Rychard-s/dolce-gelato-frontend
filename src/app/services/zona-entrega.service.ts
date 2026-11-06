import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../shared/config';
import { ZonaEntrega } from '../models/zona-entrega';

@Injectable({ providedIn: 'root' })
export class ZonaEntregaService {
  private http = inject(HttpClient);
  private apiUrl = `${API_URL}/zonas`;

  listar(soloActivas = false): Observable<ZonaEntrega[]> {
    return this.http.get<ZonaEntrega[]>(this.apiUrl, { params: { activas: soloActivas } });
  }

  registrar(zona: ZonaEntrega): Observable<ZonaEntrega> {
    return this.http.post<ZonaEntrega>(this.apiUrl, zona);
  }

  actualizar(id: number, zona: ZonaEntrega): Observable<ZonaEntrega> {
    return this.http.put<ZonaEntrega>(`${this.apiUrl}/${id}`, zona);
  }

  cambiarEstado(id: number, activa: boolean): Observable<ZonaEntrega> {
    return this.http.patch<ZonaEntrega>(`${this.apiUrl}/${id}/estado`, null, { params: { activa } });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
