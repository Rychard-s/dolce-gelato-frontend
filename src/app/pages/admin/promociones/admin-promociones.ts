import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PromocionService } from '../../../services/promocion.service';
import { ProductoService } from '../../../services/producto.service';
import { CategoriaService } from '../../../services/categoria.service';
import { DiaSemana, NOMBRE_DIA, Promocion, PromocionGuardar, TipoPromocion } from '../../../models/promocion';
import { Producto } from '../../../models/producto';
import { Categoria } from '../../../models/categoria';
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
  private categoriaService = inject(CategoriaService);

  promociones = signal<Promocion[]>([]);
  productos = signal<Producto[]>([]);
  categorias = signal<Categoria[]>([]);
  protected dias = Object.entries(NOMBRE_DIA) as [DiaSemana, string][];
  protected nombreDia = NOMBRE_DIA;
  cargando = signal(false);
  error = signal('');
  mostrarFormulario = signal(false);
  editandoId = signal<number | null>(null);
  guardando = signal(false);

  form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(80)]],
    descripcion: ['', Validators.maxLength(255)],
    tipo: ['PORCENTAJE' as TipoPromocion, Validators.required],
    valor: [10, [Validators.required, Validators.min(0.01)]],
    // A qué aplica: 'TODO', 'PRODUCTO' o 'CATEGORIA'
    aplicaA: ['TODO' as 'TODO' | 'PRODUCTO' | 'CATEGORIA'],
    productoId: [0],
    categoriaId: [0],
    cantidad: [2, [Validators.min(2)]],
    diaSemana: ['' as DiaSemana | ''],
    soloEnTienda: [false],
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
    this.categoriaService.listar().subscribe({
      next: (datos) => this.categorias.set(datos),
      error: () => this.categorias.set([]),
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
      aplicaA: p.producto ? 'PRODUCTO' : p.categoria ? 'CATEGORIA' : 'TODO',
      productoId: p.producto?.id ?? 0,
      categoriaId: p.categoria?.id ?? 0,
      cantidad: p.cantidad ?? 2,
      diaSemana: p.diaSemana ?? '',
      soloEnTienda: p.soloEnTienda,
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
      producto: v.aplicaA === 'PRODUCTO' && Number(v.productoId) > 0 ? { id: Number(v.productoId) } : null,
      categoria: v.aplicaA === 'CATEGORIA' && Number(v.categoriaId) > 0 ? { id: Number(v.categoriaId) } : null,
      cantidad: v.tipo === 'CANTIDAD' ? Number(v.cantidad) : null,
      diaSemana: v.diaSemana || null,
      soloEnTienda: v.soloEnTienda,
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
    switch (p.tipo) {
      case 'PORCENTAJE':
        return `${Number(p.valor)} % de descuento`;
      case 'CANTIDAD':
        return `${p.cantidad} por S/ ${Number(p.valor).toFixed(2)}`;
      default:
        return `Precio especial S/ ${Number(p.valor).toFixed(2)}`;
    }
  }

  aplicaA(p: Promocion): string {
    if (p.producto) return p.producto.nombre;
    if (p.categoria) return `Categoría ${p.categoria.nombre}`;
    return 'Todo el pedido';
  }

  private hoy(masDias = 0): string {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + masDias);
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }
}
