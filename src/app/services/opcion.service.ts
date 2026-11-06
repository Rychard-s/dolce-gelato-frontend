import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../shared/config';
import { Opcion } from '../models/opcion';

@Injectable({ providedIn: 'root' })
export class OpcionService {
  private http = inject(HttpClient);
  private apiUrl = `${API_URL}/opciones`;

  listarPorProducto(productoId: number, soloDisponibles = false): Observable<Opcion[]> {
    return this.http.get<Opcion[]>(this.apiUrl, { params: { productoId, disponibles: soloDisponibles } });
  }

  // RF-08: marcar agotado o disponible (ej. un sabor de alitas)
  cambiarDisponibilidad(id: number, disponible: boolean): Observable<Opcion> {
    return this.http.patch<Opcion>(`${this.apiUrl}/${id}/disponibilidad`, null, { params: { disponible } });
  }
}
