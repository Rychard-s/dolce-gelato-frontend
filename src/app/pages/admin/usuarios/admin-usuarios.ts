import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioService } from '../../../services/usuario.service';
import { Rol, Usuario, UsuarioGuardar } from '../../../models/usuario';
import { mensajeConEstado } from '../../../shared/utilidades';

// Usuarios del sistema interno: administrador y cocina (CRUD)
@Component({
  selector: 'app-admin-usuarios',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-usuarios.html',
  styleUrl: '../admin-comun.scss',
})
export class AdminUsuarios implements OnInit {
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);

  usuarios = signal<Usuario[]>([]);
  cargando = signal(false);
  error = signal('');
  mostrarFormulario = signal(false);
  editandoId = signal<number | null>(null);

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-zA-Z0-9._]+$/)]],
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    password: ['', [Validators.minLength(6)]],
    rol: ['COCINA' as Rol, Validators.required],
    activo: [true],
  });

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando.set(true);
    this.usuarioService.listar().subscribe({
      next: (datos) => {
        this.usuarios.set(datos);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeConEstado(err));
        this.cargando.set(false);
      },
    });
  }

  nuevo(): void {
    this.editandoId.set(null);
    this.form.reset();
    this.mostrarFormulario.set(true);
  }

  editar(u: Usuario): void {
    this.editandoId.set(u.id);
    this.form.setValue({ username: u.username, nombre: u.nombre, password: '', rol: u.rol, activo: u.activo });
    this.mostrarFormulario.set(true);
  }

  guardar(): void {
    const v = this.form.getRawValue();
    const id = this.editandoId();
    if (this.form.invalid || (!id && !v.password)) {
      this.form.markAllAsTouched();
      if (!id && !v.password) this.error.set('La contraseña es obligatoria al crear un usuario.');
      return;
    }
    const usuario: UsuarioGuardar = {
      username: v.username.trim(),
      nombre: v.nombre.trim(),
      password: v.password || null,
      rol: v.rol,
      activo: v.activo,
    };
    const peticion = id ? this.usuarioService.actualizar(id, usuario) : this.usuarioService.registrar(usuario);
    peticion.subscribe({
      next: () => {
        this.mostrarFormulario.set(false);
        this.error.set('');
        this.cargarUsuarios();
      },
      error: (err) => this.error.set(mensajeConEstado(err)),
    });
  }

  eliminar(u: Usuario): void {
    if (!confirm(`¿Desea eliminar al usuario "${u.username}"?`)) return;
    this.usuarioService.eliminar(u.id).subscribe({
      next: () => this.cargarUsuarios(),
      error: (err) => this.error.set(mensajeConEstado(err)),
    });
  }
}
