import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ZonaEntregaService } from '../../../services/zona-entrega.service';
import { ZonaEntrega } from '../../../models/zona-entrega';
import { SolesPipe } from '../../../shared/soles.pipe';
import { mensajeConEstado } from '../../../shared/utilidades';

// RF-12: zonas de delivery y costo de envío (CRUD)
@Component({
  selector: 'app-admin-zonas',
  imports: [ReactiveFormsModule, SolesPipe],
  templateUrl: './admin-zonas.html',
  styleUrl: '../admin-comun.scss',
})
export class AdminZonas implements OnInit {
  private fb = inject(FormBuilder);
  private zonaService = inject(ZonaEntregaService);

  zonas = signal<ZonaEntrega[]>([]);
  cargando = signal(false);
  error = signal('');
  mostrarFormulario = signal(false);
  editandoId = signal<number | null>(null);

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(60)]],
    costoEnvio: [5, [Validators.required, Validators.min(0)]],
    pedidoMinimo: [0, [Validators.required, Validators.min(0)]],
    activa: [true],
  });

  ngOnInit(): void {
    this.cargarZonas();
  }

  cargarZonas(): void {
    this.cargando.set(true);
    this.zonaService.listar().subscribe({
      next: (datos) => {
        this.zonas.set(datos);
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

  editar(zona: ZonaEntrega): void {
    this.editandoId.set(zona.id!);
    this.form.setValue({
      nombre: zona.nombre,
      costoEnvio: zona.costoEnvio,
      pedidoMinimo: zona.pedidoMinimo,
      activa: zona.activa,
    });
    this.mostrarFormulario.set(true);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const zona: ZonaEntrega = {
      nombre: v.nombre.trim(),
      costoEnvio: Number(v.costoEnvio),
      pedidoMinimo: Number(v.pedidoMinimo),
      activa: v.activa,
    };
    const id = this.editandoId();
    const peticion = id ? this.zonaService.actualizar(id, zona) : this.zonaService.registrar(zona);
    peticion.subscribe({
      next: () => {
        this.mostrarFormulario.set(false);
        this.error.set('');
        this.cargarZonas();
      },
      error: (err) => this.error.set(mensajeConEstado(err)),
    });
  }

  cambiarEstado(zona: ZonaEntrega): void {
    this.zonaService.cambiarEstado(zona.id!, !zona.activa).subscribe({
      next: () => this.cargarZonas(),
      error: (err) => this.error.set(mensajeConEstado(err)),
    });
  }

  eliminar(zona: ZonaEntrega): void {
    if (!confirm(`¿Desea eliminar la zona "${zona.nombre}"?`)) return;
    this.zonaService.eliminar(zona.id!).subscribe({
      next: () => this.cargarZonas(),
      error: (err) => this.error.set(mensajeConEstado(err)),
    });
  }
}
