import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DetallePedidoService } from '../../../services/detalle-pedido.service';
import { PedidoService } from '../../../services/pedido.service';
import { EstadoPedido, MetodoPago, Pagina, Pedido, ProductoVendido, ReporteVentas } from '../../../models/pedido';
import { SolesPipe } from '../../../shared/soles.pipe';
import { NOMBRE_ESTADO, fechaDe, fechaIso, horaDe, mensajeConEstado } from '../../../shared/utilidades';

type Periodo = 'HOY' | 'SEMANA' | 'MES' | 'RANGO';

const TAMANIO_PAGINA = 10;

// RF-17: reportes de ventas por rango de fechas (JPQL en el backend) + historial paginado
@Component({
  selector: 'app-admin-reportes',
  imports: [SolesPipe],
  templateUrl: './admin-reportes.html',
  styleUrls: ['../admin-comun.scss', './admin-reportes.scss'],
})
export class AdminReportes implements OnInit {
  private detalleService = inject(DetallePedidoService);
  private pedidoService = inject(PedidoService);

  // Filtro de fechas
  periodo = signal<Periodo>('HOY');
  desde = signal(fechaIso(new Date()));
  hasta = signal(fechaIso(new Date()));

  // Datos
  reporte = signal<ReporteVentas | null>(null);
  masVendidos = signal<ProductoVendido[]>([]);
  historial = signal<Pagina<Pedido> | null>(null);
  pagina = signal(0);
  estadoFiltro = signal<EstadoPedido | ''>('');
  cargando = signal(false);
  error = signal('');

  protected nombreEstado = NOMBRE_ESTADO;
  protected horaDe = horaDe;
  protected fechaDe = fechaDe;
  protected estados: EstadoPedido[] = ['ENTREGADO', 'CANCELADO', 'RECIBIDO', 'EN_PREPARACION', 'LISTO', 'EN_CAMINO'];

  maximoVendido = computed(() => Math.max(1, ...this.masVendidos().map((p) => p.cantidad)));
  maximoDia = computed(() => Math.max(1, ...(this.reporte()?.porDia ?? []).map((d) => Number(d.monto))));
  cobrado = computed(() =>
    (this.reporte()?.porMetodoPago ?? []).filter((m) => m.metodoPago !== null).reduce((s, m) => s + Number(m.monto), 0),
  );

  ngOnInit(): void {
    this.cargar();
  }

  elegirPeriodo(periodo: Periodo): void {
    this.periodo.set(periodo);
    const hoy = new Date();
    if (periodo === 'HOY') {
      this.desde.set(fechaIso(hoy));
    } else if (periodo === 'SEMANA') {
      const inicio = new Date(hoy);
      inicio.setDate(hoy.getDate() - 6);
      this.desde.set(fechaIso(inicio));
    } else if (periodo === 'MES') {
      this.desde.set(fechaIso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)));
    }
    if (periodo !== 'RANGO') {
      this.hasta.set(fechaIso(hoy));
      this.pagina.set(0);
      this.cargar();
    }
  }

  aplicarRango(desde: string, hasta: string): void {
    if (!desde || !hasta) {
      this.error.set('Elige las dos fechas.');
      return;
    }
    this.desde.set(desde);
    this.hasta.set(hasta);
    this.pagina.set(0);
    this.cargar();
  }

  filtrarEstado(valor: string): void {
    this.estadoFiltro.set(valor as EstadoPedido | '');
    this.pagina.set(0);
    this.cargarHistorial();
  }

  irAPagina(pagina: number): void {
    this.pagina.set(pagina);
    this.cargarHistorial();
  }

  cargar(): void {
    this.error.set('');
    this.cargando.set(true);
    this.pedidoService.reporte(this.desde(), this.hasta()).subscribe({
      next: (datos) => {
        this.reporte.set(datos);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeConEstado(err));
        this.reporte.set(null);
        this.cargando.set(false);
      },
    });
    this.detalleService.masVendidos(this.desde(), this.hasta()).subscribe({
      next: (datos) => this.masVendidos.set(datos.slice(0, 10)),
      error: () => this.masVendidos.set([]),
    });
    this.cargarHistorial();
  }

  private cargarHistorial(): void {
    const estado = this.estadoFiltro() || undefined;
    this.pedidoService.historial(this.desde(), this.hasta(), this.pagina(), TAMANIO_PAGINA, estado).subscribe({
      next: (datos) => this.historial.set(datos),
      error: (err) => this.error.set(mensajeConEstado(err)),
    });
  }

  nombreMetodo(metodo: MetodoPago | null): string {
    return metodo ?? 'Sin registrar';
  }

  anchoVendido(cantidad: number): string {
    return `${(cantidad / this.maximoVendido()) * 100}%`;
  }

  anchoDia(monto: number): string {
    return `${(Number(monto) / this.maximoDia()) * 100}%`;
  }
}
