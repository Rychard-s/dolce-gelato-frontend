import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../shared/config';
import { Sabor } from '../models/sabor';

@Injectable({ providedIn: 'root' })
export class SaborService {
  private http = inject(HttpClient);
  private apiUrl = `${API_URL}/sabores`;

  listar(soloDisponibles = false): Observable<Sabor[]> {
    return this.http.get<Sabor[]>(this.apiUrl, { params: { disponibles: soloDisponibles } });
  }

  registrar(sabor: Sabor): Observable<Sabor> {
    return this.http.post<Sabor>(this.apiUrl, sabor);
  }

  actualizar(id: number, sabor: Sabor): Observable<Sabor> {
    return this.http.put<Sabor>(`${this.apiUrl}/${id}`, sabor);
  }

  // RF-08: marcar agotado o disponible
  cambiarDisponibilidad(id: number, disponible: boolean): Observable<Sabor> {
    return this.http.patch<Sabor>(`${this.apiUrl}/${id}/disponibilidad`, null, { params: { disponible } });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
