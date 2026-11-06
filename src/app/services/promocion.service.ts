import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../shared/config';
import { Promocion, PromocionGuardar } from '../models/promocion';

@Injectable({ providedIn: 'root' })
export class PromocionService {
  private http = inject(HttpClient);
  private apiUrl = `${API_URL}/promociones`;

  // Todas (admin)
  listar(): Observable<Promocion[]> {
    return this.http.get<Promocion[]>(this.apiUrl);
  }

  // Solo las vigentes hoy (inicio de la web)
  vigentes(): Observable<Promocion[]> {
    return this.http.get<Promocion[]>(`${this.apiUrl}/vigentes`);
  }

  registrar(promocion: PromocionGuardar): Observable<Promocion> {
    return this.http.post<Promocion>(this.apiUrl, promocion);
  }

  actualizar(id: number, promocion: PromocionGuardar): Observable<Promocion> {
    return this.http.put<Promocion>(`${this.apiUrl}/${id}`, promocion);
  }

  cambiarEstado(id: number, activa: boolean): Observable<Promocion> {
    return this.http.patch<Promocion>(`${this.apiUrl}/${id}/estado`, null, { params: { activa } });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
