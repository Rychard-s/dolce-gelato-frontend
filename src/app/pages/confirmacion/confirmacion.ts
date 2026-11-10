import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { AuthService } from '../../services/auth.service';
import { NEGOCIO } from '../../shared/config';
import { SolesPipe } from '../../shared/soles.pipe';
import { horaCorta } from '../../shared/utilidades';

@Component({
  selector: 'app-confirmacion',
  imports: [RouterLink, SolesPipe],
  templateUrl: './confirmacion.html',
  styleUrl: './confirmacion.scss',
})
export class Confirmacion {
  readonly codigo = input.required<string>(); // viene de la URL /pedido/:codigo

  private readonly pedidos = inject(PedidoService);
  protected readonly auth = inject(AuthService);
  protected readonly copiado = signal(false);
  protected readonly horaCorta = horaCorta;
  protected readonly negocio = NEGOCIO;

  protected readonly pedido = computed(() => {
    const ultimo = this.pedidos.ultimoPedido();
    return ultimo && ultimo.codigoSeguimiento === this.codigo() ? ultimo : null;
  });

  // RF-16: mensaje de WhatsApp prellenado con el resumen del pedido
  protected readonly enlaceWhatsapp = computed(() => {
    const p = this.pedido();
    if (!p) return '';
    const lineas = [
      `Hola Dolce Gelato, acabo de hacer el pedido ${p.codigoSeguimiento}:`,
      ...p.detalles.map((d) => `${d.cantidad} x ${d.nombreProducto}`),
      `Total: S/ ${Number(p.total).toFixed(2)}`,
      p.tipoEntrega === 'DELIVERY' ? `Delivery a: ${p.direccion} (${p.referencia})` : 'Recojo en tienda',
      `A nombre de: ${p.nombreCliente}`,
      `Comprobante: ${p.tipoComprobante === 'FACTURA' ? 'Factura' : 'Boleta'}${p.documento ? ' ' + p.documento : ''}`,
    ];
    return `https://wa.me/${NEGOCIO.whatsapp}?text=${encodeURIComponent(lineas.join('\n'))}`;
  });

  protected copiarCodigo(): void {
    navigator.clipboard?.writeText(this.codigo()).then(() => {
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2000);
    });
  }
}
