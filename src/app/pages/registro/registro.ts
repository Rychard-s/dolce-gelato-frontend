import { Component, inject, input, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { mensajeDeError } from '../../shared/utilidades';

// Las dos contraseñas deben ser iguales
function clavesIguales(grupo: AbstractControl): ValidationErrors | null {
  const clave = grupo.get('password')?.value;
  const repetir = grupo.get('repetir')?.value;
  return clave && repetir && clave !== repetir ? { distintas: true } : null;
}

// Registro de clientes (opcional: también se puede pedir sin cuenta)
@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: '../login/login.scss',
})
export class Registro {
  readonly volver = input<string>(); // ?volver=/pedido

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  enviando = signal(false);
  mensaje = signal('');

  form = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      telefono: ['', [Validators.required, Validators.pattern(/^9\d{8}$/)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(60)]],
      repetir: ['', Validators.required],
    },
    { validators: clavesIguales },
  );

  invalido(campo: 'nombre' | 'telefono' | 'password' | 'repetir'): boolean {
    const control = this.form.controls[campo];
    return control.invalid && control.touched;
  }

  registrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.enviando.set(true);
    this.mensaje.set('');
    this.auth.registrar({ nombre: v.nombre.trim(), telefono: v.telefono.trim(), password: v.password }).subscribe({
      next: () => this.router.navigateByUrl(this.volver() || '/'),
      error: (err) => {
        this.mensaje.set(mensajeDeError(err));
        this.enviando.set(false);
      },
    });
  }
}
