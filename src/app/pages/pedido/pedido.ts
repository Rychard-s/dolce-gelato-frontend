import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CarritoService, ItemCarrito } from '../../services/carrito.service';
import { ZonaEntregaService } from '../../services/zona-entrega.service';
import { PedidoService } from '../../services/pedido.service';
import { NEGOCIO } from '../../shared/config';
import { PedidoRequest, TipoEntrega } from '../../models/pedido';
import { ZonaEntrega } from '../../models/zona-entrega';
import { SolesPipe } from '../../shared/soles.pipe';
import { aMinutos, horaCorta, mensajeDeError, minutosAhora } from '../../shared/utilidades';

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

  protected negocio = NEGOCIO;

  // Formulario reactivo con los datos del cliente
  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    telefono: ['', [Validators.required, Validators.pattern(/^9\d{8}$/)]],
    zonaId: [0],
    direccion: ['', Validators.maxLength(150)],
    referencia: ['', Validators.maxLength(150)],
    hora: [''],
  });
  private valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  // Opciones con botones (fuera del formulario)
  protected tipoEntrega = signal<TipoEntrega>('RECOJO');
  protected programar = signal(false);

  protected zonas = signal<ZonaEntrega[]>([]);
  protected intentoEnviar = signal(false);
  protected enviando = signal(false);
  protected errorServidor = signal('');

  protected esDelivery = computed(() => this.tipoEntrega() === 'DELIVERY');
  protected zona = computed(() => this.zonas().find((z) => z.id === Number(this.valores().zonaId)) ?? null);
  protected envio = computed(() => (this.esDelivery() ? (this.zona()?.costoEnvio ?? 0) : 0));
  protected totalEstimado = computed(() => this.carrito.subtotal() + this.envio());

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
