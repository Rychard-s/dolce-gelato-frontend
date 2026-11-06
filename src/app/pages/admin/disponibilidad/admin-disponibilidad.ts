import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SaborService } from '../../../services/sabor.service';
import { ToppingService } from '../../../services/topping.service';
import { Sabor } from '../../../models/sabor';
import { Topping } from '../../../models/topping';
import { SolesPipe } from '../../../shared/soles.pipe';
import { mensajeConEstado } from '../../../shared/utilidades';

// RF-08: marcar sabores y toppings como agotados o disponibles, y agregar nuevos
@Component({
  selector: 'app-admin-disponibilidad',
  imports: [ReactiveFormsModule, SolesPipe],
  templateUrl: './admin-disponibilidad.html',
  styleUrls: ['../admin-comun.scss', './admin-disponibilidad.scss'],
})
export class AdminDisponibilidad implements OnInit {
  private fb = inject(FormBuilder);
  private saborService = inject(SaborService);
  private toppingService = inject(ToppingService);

  sabores = signal<Sabor[]>([]);
  toppings = signal<Topping[]>([]);
  error = signal('');

  liquidos = computed(() => this.toppings().filter((t) => t.tipo === 'LIQUIDO'));
  solidos = computed(() => this.toppings().filter((t) => t.tipo === 'SOLIDO'));
  agotados = computed(
    () => this.sabores().filter((s) => !s.disponible).length + this.toppings().filter((t) => !t.disponible).length,
  );

  formSabor = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(60)]],
  });

  formTopping = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(60)]],
    tipo: ['LIQUIDO' as 'LIQUIDO' | 'SOLIDO', Validators.required],
    precioExtra: [3, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.saborService.listar().subscribe({
      next: (datos) => this.sabores.set(datos),
      error: (err) => this.error.set(mensajeConEstado(err)),
    });
    this.toppingService.listar().subscribe({
      next: (datos) => this.toppings.set(datos),
      error: (err) => this.error.set(mensajeConEstado(err)),
    });
  }

  alternarSabor(sabor: Sabor): void {
    this.saborService.cambiarDisponibilidad(sabor.id!, !sabor.disponible).subscribe({
      next: (actualizado) => this.sabores.update((lista) => lista.map((s) => (s.id === actualizado.id ? actualizado : s))),
      error: (err) => this.error.set(mensajeConEstado(err)),
    });
  }

  alternarTopping(topping: Topping): void {
    this.toppingService.cambiarDisponibilidad(topping.id!, !topping.disponible).subscribe({
      next: (actualizado) => this.toppings.update((lista) => lista.map((t) => (t.id === actualizado.id ? actualizado : t))),
      error: (err) => this.error.set(mensajeConEstado(err)),
    });
  }

  registrarSabor(): void {
    if (this.formSabor.invalid) {
      this.formSabor.markAllAsTouched();
      return;
    }
    this.saborService.registrar({ nombre: this.formSabor.getRawValue().nombre.trim(), disponible: true }).subscribe({
      next: () => {
        this.formSabor.reset();
        this.error.set('');
        this.cargar();
      },
      error: (err) => this.error.set(mensajeConEstado(err)),
    });
  }

  registrarTopping(): void {
    if (this.formTopping.invalid) {
      this.formTopping.markAllAsTouched();
      return;
    }
    const v = this.formTopping.getRawValue();
    this.toppingService.registrar({ nombre: v.nombre.trim(), tipo: v.tipo, precioExtra: Number(v.precioExtra), disponible: true }).subscribe({
      next: () => {
        this.formTopping.reset();
        this.error.set('');
        this.cargar();
      },
      error: (err) => this.error.set(mensajeConEstado(err)),
    });
  }

  eliminarSabor(sabor: Sabor): void {
    if (!confirm(`¿Desea eliminar el sabor "${sabor.nombre}"?`)) return;
    this.saborService.eliminar(sabor.id!).subscribe({
      next: () => this.cargar(),
      error: (err) => this.error.set(mensajeConEstado(err)),
    });
  }

  eliminarTopping(topping: Topping): void {
    if (!confirm(`¿Desea eliminar el topping "${topping.nombre}"?`)) return;
    this.toppingService.eliminar(topping.id!).subscribe({
      next: () => this.cargar(),
      error: (err) => this.error.set(mensajeConEstado(err)),
    });
  }
}
