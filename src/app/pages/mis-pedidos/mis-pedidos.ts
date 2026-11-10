import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { AuthService } from '../../services/auth.service';
import { Pedido } from '../../models/pedido';
import { SolesPipe } from '../../shared/soles.pipe';
import { NOMBRE_ESTADO, fechaDe, horaDe, mensajeDeError } from '../../shared/utilidades';

// "Mis pedidos" del cliente registrado (los 20 más recientes)
@Component({
  selector: 'app-mis-pedidos',
  imports: [RouterLink, SolesPipe],
  templateUrl: './mis-pedidos.html',
  styleUrl: './mis-pedidos.scss',
})
export class MisPedidos implements OnInit {
  private pedidoService = inject(PedidoService);
  protected auth = inject(AuthService);

  protected pedidos = signal<Pedido[]>([]);
  protected cargando = signal(true);
  protected error = signal('');
  protected nombreEstado = NOMBRE_ESTADO;
  protected fechaDe = fechaDe;
  protected horaDe = horaDe;

  ngOnInit(): void {
    this.pedidoService.misPedidos().subscribe({
      next: (datos) => {
        this.pedidos.set(datos);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });
  }

  protected enCurso(p: Pedido): boolean {
    return p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO';
  }

  protected resumen(p: Pedido): string {
    return p.detalles.map((d) => `${d.cantidad} x ${d.nombreProducto}`).join(', ');
  }
}
