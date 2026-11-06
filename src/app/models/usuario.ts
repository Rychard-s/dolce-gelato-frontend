export type Rol = 'ADMIN' | 'COCINA';

export interface Usuario {
  id: number;
  username: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
}

// Al registrar la contraseña es obligatoria; al editar, si va vacía se mantiene
export interface UsuarioGuardar {
  username: string;
  nombre: string;
  password: string | null;
  rol: Rol;
  activo: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  nombre: string;
  rol: Rol;
  expira: string;
}
