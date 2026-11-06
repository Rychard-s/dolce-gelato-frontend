import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { mensajeDeError } from '../../shared/utilidades';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  // Parámetros de la URL: ?volver=/admin  y  ?expirada=1
  readonly volver = input<string>();
  readonly expirada = input<string>();

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  ingresando = signal(false);
  mensaje = signal('');

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  ingresar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.ingresando.set(true);
    this.mensaje.set('');
    this.auth.login(this.form.getRawValue()).subscribe({
      next: (sesion) => {
        const destino = this.volver() || (sesion.rol === 'ADMIN' ? '/admin' : '/cocina');
        this.router.navigateByUrl(destino);
      },
      error: (err) => {
        this.mensaje.set(mensajeDeError(err));
        this.ingresando.set(false);
      },
    });
  }
}
