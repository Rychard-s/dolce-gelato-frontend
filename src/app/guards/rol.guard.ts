import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Rol } from '../models/usuario';

// Protege las páginas según el rol: internas (admin, cocina) y del cliente (mis pedidos)
export function rolGuard(rolesPermitidos: Rol[]): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.estaLogueado()) {
      return router.createUrlTree(['/login'], { queryParams: { volver: state.url } });
    }
    const rol = auth.rol();
    if (rol && rolesPermitidos.includes(rol)) {
      return true;
    }
    return router.createUrlTree([rol ? auth.inicioSegunRol(rol) : '/']);
  };
}
