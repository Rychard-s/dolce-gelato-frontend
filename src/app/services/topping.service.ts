import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../shared/config';
import { Topping } from '../models/topping';

@Injectable({ providedIn: 'root' })
export class ToppingService {
  private http = inject(HttpClient);
  private apiUrl = `${API_URL}/toppings`;

  listar(soloDisponibles = false): Observable<Topping[]> {
    return this.http.get<Topping[]>(this.apiUrl, { params: { disponibles: soloDisponibles } });
  }

  registrar(topping: Topping): Observable<Topping> {
    return this.http.post<Topping>(this.apiUrl, topping);
  }

  actualizar(id: number, topping: Topping): Observable<Topping> {
    return this.http.put<Topping>(`${this.apiUrl}/${id}`, topping);
  }

  // RF-08: marcar agotado o disponible
  cambiarDisponibilidad(id: number, disponible: boolean): Observable<Topping> {
    return this.http.patch<Topping>(`${this.apiUrl}/${id}/disponibilidad`, null, { params: { disponible } });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
