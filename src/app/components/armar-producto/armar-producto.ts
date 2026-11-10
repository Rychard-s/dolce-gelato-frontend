import {
  AfterViewInit, Component, ElementRef, computed, inject, input, output, signal, viewChild,
} from '@angular/core';
import { SaborService } from '../../services/sabor.service';
import { ToppingService } from '../../services/topping.service';
import { OpcionService } from '../../services/opcion.service';
import { CarritoService, ToppingElegido } from '../../services/carrito.service';
import { Opcion } from '../../models/opcion';
import { Producto } from '../../models/producto';
import { Sabor } from '../../models/sabor';
import { Topping } from '../../models/topping';
import { SolesPipe } from '../../shared/soles.pipe';
import { mensajeDeError } from '../../shared/utilidades';

interface GrupoOpciones {
  nombre: string;
  obligatorio: boolean;
  maxElegir: number;
  opciones: Opcion[];
}

// Ventana para personalizar un producto: sabores (RN-02), toppings (RN-03) y opciones (RN-04)
@Component({
  selector: 'app-armar-producto',
  imports: [SolesPipe],
  templateUrl: './armar-producto.html',
  styleUrl: './armar-producto.scss',
})
export class ArmarProducto implements AfterViewInit {
  readonly producto = input.required<Producto>();
  readonly cerrar = output<void>();
  readonly agregado = output<string>();

  private readonly saborService = inject(SaborService);
  private readonly toppingService = inject(ToppingService);
  private readonly opcionService = inject(OpcionService);
  private readonly carrito = inject(CarritoService);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  protected readonly cargando = signal(true);
  protected readonly error = signal('');

  protected readonly sabores = signal<Sabor[]>([]);
  protected readonly toppings = signal<Topping[]>([]);
  protected readonly opciones = signal<Opcion[]>([]);

  protected readonly saboresElegidos = signal<Sabor[]>([]);
  protected readonly toppingsElegidos = signal<Topping[]>([]); // en el orden en que se eligen
  protected readonly opcionesElegidas = signal<Opcion[]>([]);
  protected readonly cantidad = signal(1);

  protected readonly llevaToppings = computed(
    () => this.producto().toppingsLiquidos + this.producto().toppingsSolidos > 0,
  );
  protected readonly liquidos = computed(() => this.toppings().filter((t) => t.tipo === 'LIQUIDO'));
  protected readonly solidos = computed(() => this.toppings().filter((t) => t.tipo === 'SOLIDO'));

  protected readonly grupos = computed<GrupoOpciones[]>(() => {
    const mapa = new Map<string, GrupoOpciones>();
    for (const opcion of this.opciones()) {
      const grupo = mapa.get(opcion.grupo) ?? {
        nombre: opcion.grupo,
        obligatorio: opcion.obligatorio,
        maxElegir: opcion.maxElegir,
        opciones: [],
      };
      grupo.opciones.push(opcion);
      mapa.set(opcion.grupo, grupo);
    }
    return [...mapa.values()];
  });

  // RN-03: los primeros toppings de cada tipo están incluidos; los siguientes son extra
  protected readonly toppingsConExtra = computed<ToppingElegido[]>(() => {
    let liquidos = 0;
    let solidos = 0;
    return this.toppingsElegidos().map((topping) => {
      const extra = topping.tipo === 'LIQUIDO'
        ? ++liquidos > this.producto().toppingsLiquidos
        : ++solidos > this.producto().toppingsSolidos;
      return { topping, extra };
    });
  });

  protected readonly costoExtras = computed(() =>
    this.toppingsConExtra().filter((t) => t.extra).reduce((suma, t) => suma + t.topping.precioExtra, 0),
  );
  protected readonly precioUnitario = computed(() => this.producto().precio + this.costoExtras());
  protected readonly total = computed(() => this.precioUnitario() * this.cantidad());

  // RN-02: rango de sabores (ej. helado 2 sabores: 2 a 2; helado de litro: 1 a 3)
  protected readonly maxSabores = computed(() => this.producto().cantidadSabores);
  protected readonly minSabores = computed(() =>
    Math.min(this.producto().saboresMinimos || this.producto().cantidadSabores, this.producto().cantidadSabores),
  );
  protected readonly textoSabores = computed(() => {
    const elegidos = this.saboresElegidos().length;
    return this.minSabores() === this.maxSabores()
      ? `${elegidos} de ${this.maxSabores()}`
      : `${elegidos} (de ${this.minSabores()} a ${this.maxSabores()})`;
  });

  // Lo que falta elegir antes de poder agregar
  protected readonly faltantes = computed(() => {
    const lista: string[] = [];
    const minimo = this.minSabores();
    const elegidos = this.saboresElegidos().length;
    if (elegidos < minimo) {
      const faltan = minimo - elegidos;
      lista.push(`Elige ${faltan} ${faltan === 1 ? 'sabor más' : 'sabores más'}`);
    }
    for (const grupo of this.grupos()) {
      const cuenta = this.cuentaEnGrupo(grupo.nombre);
      if (grupo.obligatorio && cuenta < grupo.maxElegir) {
        lista.push(`Elige ${grupo.maxElegir - cuenta} en ${grupo.nombre}`);
      }
    }
    return lista;
  });

  ngAfterViewInit(): void {
    this.dialogo().nativeElement.showModal();
    this.cargarOpciones();
  }

  // ---------- Sabores ----------

  protected saborElegido(sabor: Sabor): boolean {
    return this.saboresElegidos().some((s) => s.id === sabor.id);
  }

  protected alternarSabor(sabor: Sabor): void {
    const limite = this.producto().cantidadSabores;
    this.saboresElegidos.update((lista) => {
      if (lista.some((s) => s.id === sabor.id)) {
        return lista.filter((s) => s.id !== sabor.id);
      }
      if (limite === 1) {
        return [sabor]; // con un solo sabor, elegir otro lo reemplaza
      }
      return lista.length < limite ? [...lista, sabor] : lista;
    });
  }

  // ---------- Toppings ----------

  protected toppingElegido(topping: Topping): boolean {
    return this.toppingsElegidos().some((t) => t.id === topping.id);
  }

  protected esExtra(topping: Topping): boolean {
    return this.toppingsConExtra().some((t) => t.topping.id === topping.id && t.extra);
  }

  protected alternarTopping(topping: Topping): void {
    this.toppingsElegidos.update((lista) =>
      lista.some((t) => t.id === topping.id) ? lista.filter((t) => t.id !== topping.id) : [...lista, topping],
    );
  }

  // ---------- Opciones ----------

  protected opcionElegida(opcion: Opcion): boolean {
    return this.opcionesElegidas().some((o) => o.id === opcion.id);
  }

  protected alternarOpcion(opcion: Opcion, grupo: GrupoOpciones): void {
    this.opcionesElegidas.update((lista) => {
      if (lista.some((o) => o.id === opcion.id)) {
        return lista.filter((o) => o.id !== opcion.id);
      }
      if (grupo.maxElegir === 1) {
        return [...lista.filter((o) => o.grupo !== grupo.nombre), opcion]; // reemplaza dentro del grupo
      }
      return this.cuentaEnGrupo(grupo.nombre) < grupo.maxElegir ? [...lista, opcion] : lista;
    });
  }

  protected indicacion(grupo: GrupoOpciones): string {
    if (grupo.obligatorio) {
      return grupo.maxElegir === 1 ? 'Elige 1' : `Elige ${grupo.maxElegir}`;
    }
    return `Opcional, hasta ${grupo.maxElegir}`;
  }

  // ---------- Cantidad y confirmar ----------

  protected cambiarCantidad(delta: number): void {
    this.cantidad.update((c) => Math.min(20, Math.max(1, c + delta)));
  }

  protected agregar(): void {
    if (this.faltantes().length > 0) {
      return;
    }
    this.carrito.agregar({
      producto: this.producto(),
      cantidad: this.cantidad(),
      sabores: this.saboresElegidos(),
      toppings: this.toppingsConExtra(),
      opciones: this.opcionesElegidas(),
      precioUnitario: this.precioUnitario(),
    });
    this.agregado.emit(this.producto().nombre);
    this.cerrarVentana();
  }

  // Al cerrar (botón, Escape o clic afuera) el <dialog> dispara "close" y avisamos al padre
  protected cerrarVentana(): void {
    this.dialogo().nativeElement.close();
  }

  // Clic fuera de la ventana (en el fondo oscuro) la cierra
  protected clicEnFondo(evento: MouseEvent): void {
    if (evento.target === this.dialogo().nativeElement) {
      this.cerrarVentana();
    }
  }

  private cuentaEnGrupo(nombreGrupo: string): number {
    return this.opcionesElegidas().filter((o) => o.grupo === nombreGrupo).length;
  }

  private cargarOpciones(): void {
    const producto = this.producto();
    let pendientes = 1 + (producto.cantidadSabores > 0 ? 1 : 0) + (this.llevaToppings() ? 1 : 0);
    const terminar = () => {
      pendientes--;
      if (pendientes === 0) {
        this.cargando.set(false);
      }
    };
    const fallar = (e: unknown) => {
      this.error.set(mensajeDeError(e));
      this.cargando.set(false);
    };

    this.opcionService.listarPorProducto(producto.id, true).subscribe({ next: (o) => { this.opciones.set(o); terminar(); }, error: fallar });
    if (producto.cantidadSabores > 0) {
      this.saborService.listar(true).subscribe({ next: (s) => { this.sabores.set(s); terminar(); }, error: fallar });
    }
    if (this.llevaToppings()) {
      this.toppingService.listar(true).subscribe({ next: (t) => { this.toppings.set(t); terminar(); }, error: fallar });
    }
  }
}
