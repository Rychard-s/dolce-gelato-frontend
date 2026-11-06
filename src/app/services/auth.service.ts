import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_URL } from '../shared/config';
import { LoginRequest, LoginResponse, Rol } from '../models/usuario';

const CLAVE_SESION = 'dolce-gelato-sesion';

// Sesión de admin y cocina. El token se envía en cada petición con el interceptor.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${API_URL}/usuarios`;

  readonly sesion = signal<LoginResponse | null>(this.leer());
  readonly estaLogueado = computed(() => this.sesion() !== null);
  readonly rol = computed<Rol | null>(() => this.sesion()?.rol ?? null);
  readonly esAdmin = computed(() => this.rol() === 'ADMIN');

  login(datos: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, datos).pipe(
      tap((respuesta) => {
        this.sesion.set(respuesta);
        try {
          localStorage.setItem(CLAVE_SESION, JSON.stringify(respuesta));
        } catch {
          // sin almacenamiento la sesión dura mientras la pestaña esté abierta
        }
      }),
    );
  }

  logout(): void {
    if (this.token()) {
      this.http.post(`${this.apiUrl}/logout`, null).subscribe({ error: () => undefined });
    }
    this.limpiar();
    this.router.navigate(['/login']);
  }

  token(): string | null {
    return this.sesion()?.token ?? null;
  }

  // Se usa cuando el backend responde 401 (token vencido o backend reiniciado)
  limpiar(): void {
    this.sesion.set(null);
    try {
      localStorage.removeItem(CLAVE_SESION);
    } catch {
      // nada que hacer
    }
  }

  private leer(): LoginResponse | null {
    try {
      const guardada = localStorage.getItem(CLAVE_SESION);
      if (!guardada) return null;
      const sesion = JSON.parse(guardada) as LoginResponse;
      return new Date(sesion.expira) > new Date() ? sesion : null;
    } catch {
      return null;
    }
  }
}
