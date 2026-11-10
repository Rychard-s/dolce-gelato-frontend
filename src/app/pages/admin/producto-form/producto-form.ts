import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductoService } from '../../../services/producto.service';
import { CategoriaService } from '../../../services/categoria.service';
import { Categoria } from '../../../models/categoria';
import { ProductoGuardar } from '../../../models/producto';
import { horaCorta, mensajeConEstado } from '../../../shared/utilidades';

// Formulario para registrar y actualizar productos
@Component({
  selector: 'app-producto-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './producto-form.html',
  styleUrl: '../admin-comun.scss',
})
export class ProductoForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);

  id?: number;
  editando = false;
  categorias = signal<Categoria[]>([]);
  guardando = signal(false);
  mensaje = signal('');

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    descripcion: ['', Validators.maxLength(255)],
    precio: [0, [Validators.required, Validators.min(0.01)]],
    categoriaId: [0, [Validators.required, Validators.min(1)]],
    horaInicio: ['10:00', Validators.required],
    horaFin: ['22:00', Validators.required],
    cantidadSabores: [0, [Validators.min(0), Validators.max(3)]],
    saboresMinimos: [0, [Validators.min(0), Validators.max(3)]],
    toppingsLiquidos: [0, [Validators.min(0), Validators.max(3)]],
    toppingsSolidos: [0, [Validators.min(0), Validators.max(3)]],
    aptoDelivery: [true],
    activo: [true],
  });

  ngOnInit(): void {
    this.categoriaService.listar().subscribe({
      next: (datos) => this.categorias.set(datos),
      error: (err) => this.mensaje.set(mensajeConEstado(err)),
    });

    const valor = this.route.snapshot.paramMap.get('id');
    if (valor) {
      this.id = Number(valor);
      this.editando = true;
      this.productoService.buscarPorId(this.id).subscribe({
        next: (p) =>
          this.form.patchValue({
            nombre: p.nombre,
            descripcion: p.descripcion ?? '',
            precio: p.precio,
            categoriaId: p.categoria.id,
            horaInicio: horaCorta(p.horaInicio),
            horaFin: horaCorta(p.horaFin),
            cantidadSabores: p.cantidadSabores,
            saboresMinimos: p.saboresMinimos,
            toppingsLiquidos: p.toppingsLiquidos,
            toppingsSolidos: p.toppingsSolidos,
            aptoDelivery: p.aptoDelivery,
            activo: p.activo,
          }),
        error: (err) => this.mensaje.set(`No se pudo cargar. ${mensajeConEstado(err)}`),
      });
    }
  }

  invalido(campo: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[campo];
    return control.invalid && control.touched;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const producto: ProductoGuardar = {
      nombre: v.nombre.trim(),
      descripcion: v.descripcion.trim() || null,
      precio: Number(v.precio),
      categoria: { id: Number(v.categoriaId) },
      horaInicio: v.horaInicio,
      horaFin: v.horaFin,
      cantidadSabores: Number(v.cantidadSabores),
      saboresMinimos: Number(v.saboresMinimos),
      toppingsLiquidos: Number(v.toppingsLiquidos),
      toppingsSolidos: Number(v.toppingsSolidos),
      aptoDelivery: v.aptoDelivery,
      activo: v.activo,
    };

    this.guardando.set(true);
    this.mensaje.set('');
    const peticion = this.editando && this.id
      ? this.productoService.actualizar(this.id, producto)
      : this.productoService.registrar(producto);

    peticion.subscribe({
      next: () => this.router.navigate(['/admin/productos']),
      error: (err) => {
        this.mensaje.set(mensajeConEstado(err));
        this.guardando.set(false);
      },
    });
  }
}
