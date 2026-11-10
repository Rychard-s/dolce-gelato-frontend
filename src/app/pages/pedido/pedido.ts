import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CarritoService, ItemCarrito } from '../../services/carrito.service';
import { ZonaEntregaService } from '../../services/zona-entrega.service';
import { PedidoService } from '../../services/pedido.service';
import { AuthService } from '../../services/auth.service';
import { NEGOCIO } from '../../shared/config';
import { PedidoRequest, TipoComprobante, TipoEntrega } from '../../models/pedido';
import { ZonaEntrega } from '../../models/zona-entrega';
import { SolesPipe } from '../../shared/soles.pipe';
import { MONTO_BOLETA_CON_DNI, aMinutos, horaCorta, mensajeDeError, minutosAhora } from '../../shared/utilidades';

@Component({
  selector: 'app-pedido',
  imports: [RouterLink, ReactiveFormsModule, SolesPipe],
  templateUrl: './pedido.html',
  styleUrl: './pedido.scss',
})
export class Pedido implements OnInit {
  protected carrito = inject(CarritoService);
  private fb = inject(FormBuilder);
  private zonaService = inject(ZonaEntregaService);
  private pedidoService = inject(PedidoService);
  private router = inject(Router);
  protected auth = inject(AuthService);

  protected negocio = NEGOCIO;

  // Formulario reactivo con los datos del cliente
  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    telefono: ['', [Validators.required, Validators.pattern(/^9\d{8}$/)]],
    zonaId: [0],
    direccion: ['', Validators.maxLength(150)],
    referencia: ['', Validators.maxLength(150)],
    hora: [''],
    documento: [''], // DNI (boleta) o RUC (factura)
    razonSocial: ['', Validators.maxLength(120)],
  });
  private valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  // Opciones con botones (fuera del formulario)
  protected tipoEntrega = signal<TipoEntrega>('RECOJO');
  protected programar = signal(false);
  protected comprobante = signal<TipoComprobante>('BOLETA');
  protected readonly montoBoletaConDni = MONTO_BOLETA_CON_DNI;

  protected zonas = signal<ZonaEntrega[]>([]);
  protected intentoEnviar = signal(false);
  protected enviando = signal(false);
  protected errorServidor = signal('');

  protected esDelivery = computed(() => this.tipoEntrega() === 'DELIVERY');
  protected zona = computed(() => this.zonas().find((z) => z.id === Number(this.valores().zonaId)) ?? null);
  protected envio = computed(() => (this.esDelivery() ? (this.zona()?.costoEnvio ?? 0) : 0));
  protected totalEstimado = computed(() => this.carrito.subtotal() + this.envio());
  protected esFactura = computed(() => this.comprobante() === 'FACTURA');
  // SUNAT: desde S/ 700 la boleta lleva DNI. Se usa el total sin descuento; el backend valida con el total final
  protected dniObligatorio = computed(() => !this.esFactura() && this.totalEstimado() >= MONTO_BOLETA_CON_DNI);

  // RN-07: productos que no se pueden enviar por delivery
  protected noAptos = computed(() =>
    this.esDelivery() ? this.carrito.items().filter((i) => !i.producto.aptoDelivery) : [],
  );

  // Si hay productos que abren más tarde (ej. burgers), la hora mínima es la de apertura
  protected horaMinima = computed(() => {
    const ahora = minutosAhora();
    let minima: string | null = null;
    for (const item of this.carrito.items()) {
      const inicio = item.producto.horaInicio;
      if (ahora < aMinutos(inicio) && (!minima || aMinutos(inicio) > aMinutos(minima))) {
        minima = horaCorta(inicio);
      }
    }
    return minima;
  });
  protected debeProgramar = computed(() => this.horaMinima() !== null);
  protected usaHora = computed(() => this.programar() || this.debeProgramar());

  // Validaciones que dependen de varias cosas a la vez (el backend vuelve a validar todo)
  protected errores = computed(() => {
    const v = this.valores();
    const lista: string[] = [];
    if (!v.nombre || v.nombre.trim().length < 2) lista.push('Escribe tu nombre.');
    if (!/^9\d{8}$/.test(v.telefono ?? '')) lista.push('El celular debe tener 9 dígitos y empezar con 9.');
    if (this.esDelivery()) {
      if (!this.zona()) lista.push('Elige tu zona de delivery.');
      if (!v.direccion?.trim()) lista.push('Escribe la dirección de entrega.');
      if (!v.referencia?.trim()) lista.push('Escribe una referencia para encontrar tu casa.');
      if (this.noAptos().length > 0) lista.push('Quita los productos que son solo para recoger, o elige recojo en tienda.');
      const zona = this.zona();
      if (zona && this.carrito.subtotal() < zona.pedidoMinimo) {
        lista.push(`El pedido mínimo para delivery a ${zona.nombre} es S/ ${Number(zona.pedidoMinimo).toFixed(2)}.`);
      }
    }
    const documento = (v.documento ?? '').trim();
    if (this.esFactura()) {
      if (!/^(10|15|17|20)\d{9}$/.test(documento)) lista.push('El RUC debe tener 11 dígitos y empezar con 10, 15, 17 o 20.');
      if (!v.razonSocial?.trim()) lista.push('Escribe la razón social para la factura.');
    } else if (documento && !/^\d{8}$/.test(documento)) {
      lista.push('El DNI debe tener 8 dígitos.');
    } else if (!documento && this.dniObligatorio()) {
      lista.push(`Para boletas desde S/ ${MONTO_BOLETA_CON_DNI} escribe tu DNI.`);
    }
    if (this.usaHora()) {
      const hora = v.hora ?? '';
      if (!hora) {
        lista.push('Elige la hora a la que quieres tu pedido.');
      } else if (this.horaMinima() && aMinutos(hora) < aMinutos(this.horaMinima()!)) {
        lista.push(`Algunos productos están disponibles desde las ${this.horaMinima()}. Elige esa hora o una más tarde.`);
      } else if (aMinutos(hora) <= minutosAhora()) {
        lista.push('La hora elegida ya pasó.');
      }
    }
    return lista;
  });

  ngOnInit(): void {
    // Cliente con cuenta: sus datos se llenan solos (su usuario es su celular)
    const sesion = this.auth.sesion();
    if (sesion && this.auth.esCliente()) {
      this.form.patchValue({ nombre: sesion.nombre, telefono: sesion.username });
    }
    this.zonaService.listar(true).subscribe({ next: (z) => this.zonas.set(z), error: () => this.zonas.set([]) });
    if (this.debeProgramar()) {
      this.programar.set(true);
      this.form.controls.hora.setValue(this.horaMinima()!);
    }
  }

  protected invalido(campo: 'nombre' | 'telefono'): boolean {
    const control = this.form.controls[campo];
    return control.invalid && (control.touched || this.intentoEnviar());
  }

  // Al cambiar de boleta a factura (o al revés) se limpia el documento: DNI y RUC no son intercambiables
  protected cambiarComprobante(tipo: TipoComprobante): void {
    if (tipo !== this.comprobante()) {
      this.comprobante.set(tipo);
      this.form.controls.documento.setValue('');
    }
  }

  protected detalleItem(item: ItemCarrito): string {
    const partes: string[] = [];
    if (item.sabores.length) partes.push(item.sabores.map((s) => s.nombre).join(', '));
    if (item.toppings.length) {
      partes.push(item.toppings.map((t) => t.topping.nombre + (t.extra ? ' (extra)' : '')).join(', '));
    }
    if (item.opciones.length) partes.push(item.opciones.map((o) => o.nombre).join(', '));
    return partes.join(' · ');
  }

  guardar(): void {
    this.intentoEnviar.set(true);
    this.form.markAllAsTouched();
    this.errorServidor.set('');
    if (this.errores().length > 0 || this.carrito.items().length === 0) {
      return;
    }

    const v = this.form.getRawValue();
    const pedido: PedidoRequest = {
      nombreCliente: v.nombre.trim(),
      telefono: v.telefono.trim(),
      tipoEntrega: this.tipoEntrega(),
      direccion: this.esDelivery() ? v.direccion.trim() : null,
      referencia: this.esDelivery() ? v.referencia.trim() : null,
      zonaId: this.esDelivery() ? Number(v.zonaId) : null,
      horaSolicitada: this.usaHora() ? v.hora : null,
      tipoComprobante: this.comprobante(),
      documento: v.documento.trim() || null,
      razonSocial: this.esFactura() ? v.razonSocial.trim() : null,
      items: this.carrito.paraEnviar(),
    };

    this.enviando.set(true);
    this.pedidoService.registrar(pedido).subscribe({
      next: (creado) => {
        this.carrito.vaciar();
        this.router.navigate(['/pedido', creado.codigoSeguimiento]);
      },
      error: (err) => {
        this.errorServidor.set(mensajeDeError(err));
        this.enviando.set(false);
      },
    });
  }
}
