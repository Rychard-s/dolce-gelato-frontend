import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PromocionService } from '../../../services/promocion.service';
import { ProductoService } from '../../../services/producto.service';
import { Promocion, PromocionGuardar } from '../../../models/promocion';
import { Producto } from '../../../models/producto';
import { SolesPipe } from '../../../shared/soles.pipe';
import { mensajeConEstado } from '../../../shared/utilidades';

// RF-14: promociones con vigencia (CRUD)
@Component({
  selector: 'app-admin-promociones',
  imports: [ReactiveFormsModule, SolesPipe],
  templateUrl: './admin-promociones.html',
  styleUrl: '../admin-comun.scss',
})
export class AdminPromociones implements OnInit {
  private fb = inject(FormBuilder);
  private promocionService = inject(PromocionService);
  private productoService = inject(ProductoService);

  promociones = signal<Promocion[]>([]);
  productos = signal<Producto[]>([]);
  cargando = signal(false);
  error = signal('');
  mostrarFormulario = signal(false);
  editandoId = signal<number | null>(null);
  guardando = signal(false);

  form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(80)]],
    descripcion: ['', Validators.maxLength(255)],
    tipo: ['PORCENTAJE' as 'PORCENTAJE' | 'PRECIO_FIJO', Validators.required],
    valor: [10, [Validators.required, Validators.min(0.01)]],
    productoId: [0],
    fechaInicio: [this.hoy(), Validators.required],
    fechaFin: [this.hoy(30), Validators.required],
    activa: [true],
  });

  ngOnInit(): void {
    this.cargarPromociones();
    this.productoService.listar().subscribe({
      next: (datos) => this.productos.set([...datos].sort((a, b) => a.nombre.localeCompare(b.nombre))),
      error: () => this.productos.set([]),
    });
  }

  cargarPromociones(): void {
    this.cargando.set(true);
    this.promocionService.listar().subscribe({
      next: (datos) => {
        this.promociones.set(datos);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeConEstado(err));
        this.cargando.set(false);
      },
    });
  }

  nueva(): void {
    this.editandoId.set(null);
    this.form.reset();
    this.mostrarFormulario.set(true);
  }

  editar(p: Promocion): void {
    this.editandoId.set(p.id);
    this.form.setValue({
      titulo: p.titulo,
      descripcion: p.descripcion ?? '',
      tipo: p.tipo,
      valor: p.valor,
      productoId: p.producto?.id ?? 0,
      fechaInicio: p.fechaInicio,
      fechaFin: p.fechaFin,
      activa: p.activa,
    });
    this.mostrarFormulario.set(true);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const promocion: PromocionGuardar = {
      titulo: v.titulo.trim(),
      descripcion: v.descripcion.trim() || null,
      tipo: v.tipo,
      valor: Number(v.valor),
      producto: Number(v.productoId) > 0 ? { id: Number(v.productoId) } : null,
      fechaInicio: v.fechaInicio,
      fechaFin: v.fechaFin,
      activa: v.activa,
    };
    const id = this.editandoId();
    const peticion = id ? this.promocionService.actualizar(id, promocion) : this.promocionService.registrar(promocion);

    this.guardando.set(true);
    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarFormulario.set(false);
        this.error.set('');
        this.cargarPromociones();
      },
      error: (err) => {
        this.error.set(mensajeConEstado(err));
        this.guardando.set(false);
      },
    });
  }

  cambiarEstado(p: Promocion): void {
    this.promocionService.cambiarEstado(p.id, !p.activa).subscribe({
      next: () => this.cargarPromociones(),
      error: (err) => this.error.set(mensajeConEstado(err)),
    });
  }

  eliminar(p: Promocion): void {
    if (!confirm(`¿Desea eliminar la promoción "${p.titulo}"?`)) return;
    this.promocionService.eliminar(p.id).subscribe({
      next: () => this.cargarPromociones(),
      error: (err) => this.error.set(mensajeConEstado(err)),
    });
  }

  descuento(p: Promocion): string {
    return p.tipo === 'PORCENTAJE' ? `${Number(p.valor)} % de descuento` : `Precio especial S/ ${Number(p.valor).toFixed(2)}`;
  }

  private hoy(masDias = 0): string {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + masDias);
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }
}
