import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { PedidoService } from '../../services/pedido.service';
import { EstadoPedido, MetodoPago, Pedido } from '../../models/pedido';
import { SolesPipe } from '../../shared/soles.pipe';
import { NOMBRE_ESTADO, horaCorta, horaDe, mensajeConEstado } from '../../shared/utilidades';

const ACTUALIZAR_CADA_MS = 15000;

interface Columna {
  estado: EstadoPedido;
  pedidos: Pedido[];
}

// Panel de cocina y caja: cola de pedidos en curso (RF-07, RF-11, RF-16)
@Component({
  selector: 'app-cocina',
  imports: [SolesPipe],
  templateUrl: './cocina.html',
  styleUrl: './cocina.scss',
})
export class Cocina implements OnInit {
  private pedidoService = inject(PedidoService);

  pedidos = signal<Pedido[]>([]);
  cargando = signal(false);
  error = signal('');
  actualizado = signal('');
  ocupado = signal<number | null>(null); // id del pedido que se está actualizando

  protected nombreEstado = NOMBRE_ESTADO;
  protected horaCorta = horaCorta;
  protected horaDe = horaDe;
  protected metodos: MetodoPago[] = ['EFECTIVO', 'YAPE', 'PLIN', 'TARJETA'];

  columnas = computed<Columna[]>(() =>
    (['RECIBIDO', 'EN_PREPARACION', 'LISTO', 'EN_CAMINO'] as EstadoPedido[]).map((estado) => ({
      estado,
      pedidos: this.pedidos().filter((p) => p.estado === estado),
    })),
  );

  constructor() {
    // Refresco periódico en lugar de WebSockets
    const intervalo = setInterval(() => this.cargarPedidos(true), ACTUALIZAR_CADA_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(intervalo));
  }

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos(silencioso = false): void {
    if (!silencioso) this.cargando.set(true);
    this.pedidoService.listar().subscribe({
      next: (datos) => {
        this.pedidos.set(datos);
        this.error.set('');
        this.cargando.set(false);
        this.actualizado.set(new Date().toLocaleTimeString('es-PE'));
      },
      error: (err) => {
        this.error.set(mensajeConEstado(err));
        this.cargando.set(false);
      },
    });
  }

  // Botones para avanzar (sin "Cancelar", que va aparte)
  avances(pedido: Pedido): EstadoPedido[] {
    return pedido.estadosSiguientes.filter((e) => e !== 'CANCELADO');
  }

  puedeCancelar(pedido: Pedido): boolean {
    return pedido.estadosSiguientes.includes('CANCELADO');
  }

  textoBoton(estado: EstadoPedido): string {
    switch (estado) {
      case 'EN_PREPARACION': return 'Empezar a preparar';
      case 'LISTO': return 'Marcar como listo';
      case 'EN_CAMINO': return 'Salió con el repartidor';
      case 'ENTREGADO': return 'Marcar entregado';
      default: return NOMBRE_ESTADO[estado];
    }
  }

  avanzar(pedido: Pedido, estado: EstadoPedido): void {
    this.ejecutar(pedido, this.pedidoService.cambiarEstado(pedido.id, estado));
  }

  cancelar(pedido: Pedido): void {
    const motivo = prompt(`¿Por qué se cancela el pedido ${pedido.codigoSeguimiento}?`);
    if (motivo === null) return;
    if (!motivo.trim()) {
      this.error.set('Para cancelar un pedido escribe el motivo.');
      return;
    }
    this.ejecutar(pedido, this.pedidoService.cambiarEstado(pedido.id, 'CANCELADO', motivo.trim()));
  }

  cobrar(pedido: Pedido, metodo: MetodoPago): void {
    this.ejecutar(pedido, this.pedidoService.registrarPago(pedido.id, metodo));
  }

  // RF-16: aviso al cliente por WhatsApp con mensaje prellenado
  enlaceAviso(pedido: Pedido): string {
    const texto = pedido.estado === 'EN_CAMINO'
      ? `Hola ${pedido.nombreCliente}, tu pedido ${pedido.codigoSeguimiento} de Dolce Gelato ya va en camino.`
      : `Hola ${pedido.nombreCliente}, tu pedido ${pedido.codigoSeguimiento} de Dolce Gelato está listo para recoger.`;
    return `https://wa.me/51${pedido.telefono}?text=${encodeURIComponent(texto)}`;
  }

  private ejecutar(pedido: Pedido, peticion: ReturnType<PedidoService['cambiarEstado']>): void {
    this.ocupado.set(pedido.id);
    peticion.subscribe({
      next: () => {
        this.ocupado.set(null);
        this.cargarPedidos(true);
      },
      error: (err) => {
        this.error.set(mensajeConEstado(err));
        this.ocupado.set(null);
      },
    });
  }
}
