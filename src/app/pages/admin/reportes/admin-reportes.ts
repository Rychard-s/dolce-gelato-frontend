import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DetallePedidoService } from '../../../services/detalle-pedido.service';
import { PedidoService } from '../../../services/pedido.service';
import { Pedido, ProductoVendido } from '../../../models/pedido';
import { SolesPipe } from '../../../shared/soles.pipe';
import { horaDe, mensajeConEstado } from '../../../shared/utilidades';

// RF-17: reportes simples
@Component({
  selector: 'app-admin-reportes',
  imports: [SolesPipe],
  templateUrl: './admin-reportes.html',
  styleUrls: ['../admin-comun.scss', './admin-reportes.scss'],
})
export class AdminReportes implements OnInit {
  private detalleService = inject(DetallePedidoService);
  private pedidoService = inject(PedidoService);

  masVendidos = signal<ProductoVendido[]>([]);
  entregados = signal<Pedido[]>([]);
  cancelados = signal<Pedido[]>([]);
  error = signal('');
  protected horaDe = horaDe;

  maximo = computed(() => Math.max(1, ...this.masVendidos().map((p) => p.cantidad)));
  totalVendido = computed(() => this.entregados().reduce((suma, p) => suma + Number(p.total), 0));
  porTipo = computed(() => ({
    recojo: this.entregados().filter((p) => p.tipoEntrega === 'RECOJO').length,
    delivery: this.entregados().filter((p) => p.tipoEntrega === 'DELIVERY').length,
  }));

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.detalleService.masVendidos().subscribe({
      next: (datos) => this.masVendidos.set(datos.slice(0, 10)),
      error: (err) => this.error.set(mensajeConEstado(err)),
    });
    this.pedidoService.listar('ENTREGADO').subscribe({
      next: (datos) => this.entregados.set(datos),
      error: (err) => this.error.set(mensajeConEstado(err)),
    });
    this.pedidoService.listar('CANCELADO').subscribe({
      next: (datos) => this.cancelados.set(datos),
      error: (err) => this.error.set(mensajeConEstado(err)),
    });
  }

  ancho(cantidad: number): string {
    return `${(cantidad / this.maximo()) * 100}%`;
  }
}
