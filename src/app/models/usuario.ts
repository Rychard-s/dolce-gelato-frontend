// ADMIN y COCINA: personal del local. CLIENTE: se registra desde la web
export type Rol = 'ADMIN' | 'COCINA' | 'CLIENTE';

export interface Usuario {
  id: number;
  username: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  telefono?: string | null; // solo clientes
}

// Al registrar la contraseña es obligatoria; al editar, si va vacía se mantiene
export interface UsuarioGuardar {
  username: string;
  nombre: string;
  password: string | null;
  rol: Rol;
  activo: boolean;
}

// Registro de clientes: el celular será su usuario
export interface RegistroRequest {
  nombre: string;
  telefono: string;
  password: string;
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
