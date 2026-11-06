import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { EstadoPedido, Seguimiento } from '../../models/pedido';
import { SolesPipe } from '../../shared/soles.pipe';
import { NOMBRE_ESTADO, horaCorta, mensajeDeError } from '../../shared/utilidades';

const ACTUALIZAR_CADA_MS = 20000;

@Component({
  selector: 'app-seguimiento',
  imports: [SolesPipe],
  templateUrl: './seguimiento.html',
  styleUrl: './seguimiento.scss',
})
export class SeguimientoPagina {
  readonly codigo = input<string>(); // opcional: /seguimiento/:codigo

  private readonly pedidos = inject(PedidoService);
  private readonly router = inject(Router);

  protected readonly datos = signal<Seguimiento | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal('');
  protected readonly horaCorta = horaCorta;
  protected readonly nombreEstado = NOMBRE_ESTADO;

  // Pasos en orden: el delivery tiene uno más ("En camino")
  protected readonly pasos = computed<EstadoPedido[]>(() =>
    this.datos()?.tipoEntrega === 'DELIVERY'
      ? ['RECIBIDO', 'EN_PREPARACION', 'LISTO', 'EN_CAMINO', 'ENTREGADO']
      : ['RECIBIDO', 'EN_PREPARACION', 'LISTO', 'ENTREGADO'],
  );
  protected readonly pasoActual = computed(() => {
    const estado = this.datos()?.estado;
    return estado ? this.pasos().indexOf(estado) : -1;
  });

  constructor() {
    // Cada vez que cambia el código de la URL, se busca el pedido
    effect(() => {
      const codigo = this.codigo();
      if (codigo) {
        this.buscar(codigo);
      }
    });

    // Se actualiza solo cada 20 segundos mientras el pedido no termine
    const intervalo = setInterval(() => {
      const actual = this.datos();
      if (actual && actual.estado !== 'ENTREGADO' && actual.estado !== 'CANCELADO') {
        this.buscar(actual.codigo, true);
      }
    }, ACTUALIZAR_CADA_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(intervalo));
  }

  protected enviar(evento: Event, valor: string): void {
    evento.preventDefault();
    const codigo = valor.trim().toUpperCase();
    if (codigo) {
      this.router.navigate(['/seguimiento', codigo]);
    }
  }

  protected descripcion(estado: EstadoPedido): string {
    const delivery = this.datos()?.tipoEntrega === 'DELIVERY';
    switch (estado) {
      case 'RECIBIDO': return 'El local recibió tu pedido.';
      case 'EN_PREPARACION': return 'Estamos preparando tu pedido.';
      case 'LISTO': return delivery ? 'Tu pedido está listo y sale pronto.' : 'Ya puedes recogerlo en tienda.';
      case 'EN_CAMINO': return 'El repartidor va en camino.';
      case 'ENTREGADO': return '¡Disfrútalo!';
      default: return '';
    }
  }

  private buscar(codigo: string, silencioso = false): void {
    if (!silencioso) {
      this.cargando.set(true);
      this.error.set('');
    }
    this.pedidos.seguimiento(codigo).subscribe({
      next: (datos) => {
        this.datos.set(datos);
        this.cargando.set(false);
      },
      error: (e) => {
        if (!silencioso) {
          this.datos.set(null);
          this.error.set(mensajeDeError(e));
        }
        this.cargando.set(false);
      },
    });
  }
}
