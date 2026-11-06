import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CarritoService } from '../../services/carrito.service';
import { AuthService } from '../../services/auth.service';
import { SolesPipe } from '../../shared/soles.pipe';

@Component({
  selector: 'app-cabecera',
  imports: [RouterLink, RouterLinkActive, SolesPipe],
  templateUrl: './cabecera.html',
  styleUrl: './cabecera.scss',
})
export class Cabecera {
  protected carrito = inject(CarritoService);
  protected auth = inject(AuthService);
}
