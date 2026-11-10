import { Component, ElementRef, OnInit, computed, effect, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductoService } from '../../services/producto.service';
import { PromocionService } from '../../services/promocion.service';
import { Categoria, Linea } from '../../models/categoria';
import { Producto } from '../../models/producto';
import { NOMBRE_DIA, Promocion } from '../../models/promocion';
import { SolesPipe } from '../../shared/soles.pipe';
import { aMinutos, horaCorta, mensajeDeError, minutosAhora, momentoActual } from '../../shared/utilidades';
import { ArmarProducto } from '../../components/armar-producto/armar-producto';
import { FotoCategoria } from '../../components/foto-categoria/foto-categoria';

interface GrupoCarta {
  categoria: Categoria;
  productos: Producto[];
}

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, SolesPipe, ArmarProducto, FotoCategoria],
  templateUrl: './inicio.html',
  styleUrls: ['./inicio-portada.scss', './inicio-indice.scss', './inicio.scss'],
  host: { '(window:scroll)': 'alHacerScroll()' },
})
export class Inicio implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly promocionService = inject(PromocionService);

  // De noche (18:30 a 22:00) la portada cambia a Dolce Burger
  protected readonly momento = momentoActual();
  protected readonly esNoche = this.momento === 'ambos';

  protected readonly carta = signal<Producto[]>([]);
  protected readonly promociones = signal<Promocion[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal('');

  protected readonly linea = signal<Linea>(this.esNoche ? 'BURGER' : 'GELATO');
  protected readonly productoArmando = signal<Producto | null>(null);

  // Categoría que se está viendo al bajar por la carta (se resalta en el índice)
  private readonly categoriaActiva = signal<number | null>(null);
  protected readonly activa = computed(() => this.categoriaActiva() ?? this.grupos()[0]?.categoria.id ?? null);
  private readonly atajos = viewChild<ElementRef<HTMLElement>>('atajos');
  private marcoPendiente = false;
  protected readonly aviso = signal('');
  private temporizadorAviso?: ReturnType<typeof setTimeout>;

  // Carta agrupada por categoría (solo la línea elegida)
  protected readonly grupos = computed<GrupoCarta[]>(() => {
    const mapa = new Map<number, GrupoCarta>();
    for (const producto of this.carta()) {
      if (producto.categoria.linea !== this.linea()) continue;
      const grupo = mapa.get(producto.categoria.id) ?? { categoria: producto.categoria, productos: [] };
      grupo.productos.push(producto);
      mapa.set(producto.categoria.id, grupo);
    }
    return [...mapa.values()].sort((a, b) => a.categoria.orden - b.categoria.orden);
  });

  protected readonly estado = computed(() => {
    switch (this.momento) {
      case 'antes':
        return { abierto: false, texto: 'Abrimos hoy a las 10:00. Ya puedes programar tu pedido.' };
      case 'gelato':
        return { abierto: true, texto: 'Gelato abierto hasta las 22:00. Dolce Burger abre a las 18:30.' };
      case 'ambos':
        return { abierto: true, texto: 'Gelato y Dolce Burger abiertos hasta las 22:00.' };
      default:
        return { abierto: false, texto: 'Cerramos por hoy. Te esperamos mañana desde las 10:00.' };
    }
  });

  constructor() {
    // Al cambiar entre Dolce Gelato y Dolce Burger, el índice vuelve a la primera categoría
    effect(() => {
      this.linea();
      this.categoriaActiva.set(null);
    });
  }

  ngOnInit(): void {
    this.productoService.carta().subscribe({
      next: (productos) => {
        this.carta.set(productos);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
    this.promocionService.vigentes().subscribe({
      next: (promos) => this.promociones.set(promos),
      error: () => this.promociones.set([]),
    });
  }

  // Se puede pedir si está disponible ahora, o si abre más tarde hoy (se programa la hora)
  protected sePuedePedir(producto: Producto): boolean {
    return producto.disponibleAhora || minutosAhora() < aMinutos(producto.horaInicio);
  }

  protected avisoHorario(producto: Producto): string {
    if (producto.disponibleAhora) return '';
    if (this.sePuedePedir(producto)) return `Desde las ${horaCorta(producto.horaInicio)}. Puedes programarlo.`;
    return `Disponible de ${horaCorta(producto.horaInicio)} a ${horaCorta(producto.horaFin)}`;
  }

  protected etiquetaPromo(promo: Promocion): string {
    switch (promo.tipo) {
      case 'PORCENTAJE':
        return Number(promo.valor) === 50 && promo.soloEnTienda ? '2x1' : `-${Number(promo.valor)}%`;
      case 'CANTIDAD':
        return `${promo.cantidad} x S/ ${Number(promo.valor)}`;
      default:
        return `S/ ${Number(promo.valor)}`;
    }
  }

  // "Hoy, martes" para las promociones semanales
  protected diaPromo(promo: Promocion): string {
    return promo.diaSemana ? `Hoy, ${NOMBRE_DIA[promo.diaSemana].toLowerCase()}` : '';
  }

  protected pedirPromo(promo: Promocion): void {
    if (promo.producto) {
      const enCarta = this.carta().find((p) => p.id === promo.producto!.id);
      if (enCarta && this.sePuedePedir(enCarta)) {
        this.linea.set(enCarta.categoria.linea);
        this.productoArmando.set(enCarta);
        return;
      }
    }
    if (promo.categoria) {
      this.linea.set(promo.categoria.linea);
      setTimeout(() => this.irACategoria(promo.categoria!.id));
      return;
    }
    document.getElementById('carta')?.scrollIntoView();
  }

  protected irACategoria(id: number): void {
    document.getElementById(`categoria-${id}`)?.scrollIntoView();
    this.categoriaActiva.set(id);
    this.centrarAtajo(id);
  }

  // Al hacer scroll se marca la categoría visible (una vez por cuadro de animación, para no recalcular de más)
  protected alHacerScroll(): void {
    if (this.marcoPendiente) return;
    this.marcoPendiente = true;
    requestAnimationFrame(() => {
      this.marcoPendiente = false;
      this.actualizarActiva();
    });
  }

  private actualizarActiva(): void {
    const grupos = this.grupos();
    if (grupos.length === 0) return;
    // Una categoría se marca cuando su título pasa el primer tercio de la pantalla
    const limite = Math.max(window.innerWidth < 1000 ? 170 : 130, window.innerHeight * 0.3);
    let actual = grupos[0].categoria.id;
    for (const grupo of grupos) {
      const seccion = document.getElementById(`categoria-${grupo.categoria.id}`);
      if (seccion && seccion.getBoundingClientRect().top - limite <= 0) {
        actual = grupo.categoria.id;
      }
    }
    if (actual !== this.activa()) {
      this.categoriaActiva.set(actual);
      this.centrarAtajo(actual);
    }
  }

  // En celular la barra se desliza sola para que la categoría marcada quede a la vista
  private centrarAtajo(id: number): void {
    const barra = this.atajos()?.nativeElement;
    const boton = barra?.querySelector<HTMLElement>(`[data-id="${id}"]`);
    if (!barra || !boton) return;
    if (barra.scrollWidth > barra.clientWidth) {
      barra.scrollTo({ left: boton.offsetLeft - barra.clientWidth / 2 + boton.offsetWidth / 2, behavior: 'smooth' });
    } else if (barra.scrollHeight > barra.clientHeight) {
      barra.scrollTo({ top: boton.offsetTop - barra.clientHeight / 2, behavior: 'smooth' });
    }
  }

  protected mostrarAviso(nombre: string): void {
    this.aviso.set(`${nombre} se agregó a tu pedido`);
    clearTimeout(this.temporizadorAviso);
    this.temporizadorAviso = setTimeout(() => this.aviso.set(''), 3500);
  }
}
