import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { PedidoService } from '../../services/pedido.service';
import { EstadoPedido, MetodoPago, Pedido } from '../../models/pedido';
import { SolesPipe } from '../../shared/soles.pipe';
import { NOMBRE_ESTADO, horaCorta, horaDe, mensajeConEstado } from '../../shared/utilidades';

const ACTUALIZAR_CADA_MS = 15000;
const CLAVE_SONIDO = 'dolce-gelato-sonido-cocina';

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

  // Aviso de pedidos nuevos: sonido + mensaje + tarjeta resaltada
  sonidoActivo = signal(this.leerPreferenciaSonido());
  nuevos = signal<Set<number>>(new Set());
  avisoNuevos = signal('');
  private idsConocidos: Set<number> | null = null; // null = aún no se cargó la primera vez
  private audio: AudioContext | null = null;
  private tituloOriginal = document.title;

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
    inject(DestroyRef).onDestroy(() => {
      clearInterval(intervalo);
      document.title = this.tituloOriginal;
      this.audio?.close();
    });
  }

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos(silencioso = false): void {
    if (!silencioso) this.cargando.set(true);
    this.pedidoService.listar().subscribe({
      next: (datos) => {
        this.detectarNuevos(datos);
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

  // ===== Aviso de pedidos nuevos =====

  // Compara con los pedidos que ya se conocían. La primera carga no avisa (son los que ya estaban)
  private detectarNuevos(datos: Pedido[]): void {
    const ids = new Set(datos.map((p) => p.id));
    if (this.idsConocidos) {
      const llegaron = datos.filter((p) => p.estado === 'RECIBIDO' && !this.idsConocidos!.has(p.id));
      if (llegaron.length > 0) {
        this.nuevos.update((actual) => new Set([...actual, ...llegaron.map((p) => p.id)]));
        const codigos = llegaron.map((p) => p.codigoSeguimiento).join(', ');
        this.avisoNuevos.set(llegaron.length === 1 ? `Llegó un pedido nuevo: ${codigos}` : `Llegaron ${llegaron.length} pedidos nuevos: ${codigos}`);
        document.title = `(${this.nuevos().size}) Nuevo pedido · Cocina`;
        if (this.sonidoActivo()) this.sonar();
      }
    }
    this.idsConocidos = ids;
  }

  // El navegador solo deja reproducir sonido después de un clic: por eso hay un botón para activarlo
  alternarSonido(): void {
    const activo = !this.sonidoActivo();
    this.sonidoActivo.set(activo);
    try {
      localStorage.setItem(CLAVE_SONIDO, activo ? 'si' : 'no');
    } catch {
      // si no se puede guardar, igual funciona mientras la página esté abierta
    }
    if (activo) this.sonar(); // sonido de prueba
  }

  marcarVisto(): void {
    this.nuevos.set(new Set());
    this.avisoNuevos.set('');
    document.title = this.tituloOriginal;
  }

  // "Ding-dong" generado con Web Audio (no necesita archivo de sonido)
  private sonar(): void {
    try {
      this.audio ??= new AudioContext();
      const ctx = this.audio;
      if (ctx.state === 'suspended') void ctx.resume();
      [880, 660].forEach((frecuencia, i) => {
        const inicio = ctx.currentTime + i * 0.25;
        const oscilador = ctx.createOscillator();
        const volumen = ctx.createGain();
        oscilador.type = 'sine';
        oscilador.frequency.value = frecuencia;
        volumen.gain.setValueAtTime(0.0001, inicio);
        volumen.gain.exponentialRampToValueAtTime(0.4, inicio + 0.02);
        volumen.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.45);
        oscilador.connect(volumen).connect(ctx.destination);
        oscilador.start(inicio);
        oscilador.stop(inicio + 0.5);
      });
    } catch {
      // navegador sin Web Audio: queda el aviso visual
    }
  }

  private leerPreferenciaSonido(): boolean {
    try {
      return localStorage.getItem(CLAVE_SONIDO) === 'si';
    } catch {
      return false;
    }
  }

  // RN-11: el repartidor no lleva POS, en delivery no se cobra con tarjeta
  metodosPara(pedido: Pedido): MetodoPago[] {
    return pedido.tipoEntrega === 'DELIVERY' ? this.metodos.filter((m) => m !== 'TARJETA') : this.metodos;
  }

  textoComprobante(pedido: Pedido): string {
    if (pedido.tipoComprobante === 'FACTURA') {
      return `Factura · RUC ${pedido.documento} · ${pedido.razonSocial}`;
    }
    return pedido.documento ? `Boleta · DNI ${pedido.documento}` : 'Boleta';
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
    this.quitarNuevo(pedido.id);
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

  private quitarNuevo(id: number): void {
    if (!this.nuevos().has(id)) return;
    const quedan = new Set(this.nuevos());
    quedan.delete(id);
    this.nuevos.set(quedan);
    if (quedan.size === 0) this.marcarVisto();
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
