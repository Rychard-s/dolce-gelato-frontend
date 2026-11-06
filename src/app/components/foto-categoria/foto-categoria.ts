import { Component, computed, input, signal } from '@angular/core';
import { Linea } from '../../models/categoria';

// Foto de cada categoría. Si la imagen todavía no existe en public/img,
// muestra una ilustración con el color de la línea (no se ve roto).
const ARCHIVOS: Record<string, string> = {
  'Helados artesanales': 'helados-artesanales.jpg',
  'Helados a la carta': 'helados-a-la-carta.jpg',
  'Crepes dulces': 'crepes-dulces.jpg',
  'Crepes salados': 'crepes-salados.jpg',
  'Waffles': 'waffles.jpg',
  'Milkshakes': 'milkshakes.jpg',
  'Frappés': 'frappes.jpg',
  'Smoothies': 'smoothies.jpg',
  'Frozens': 'frozens.jpg',
  'Jugos': 'jugos.jpg',
  'Bebidas frías': 'bebidas-frias.jpg',
  'Bebidas calientes': 'bebidas-calientes.jpg',
  'Smoothie bowls': 'smoothie-bowls.jpg',
  'Helados de litro': 'helados-de-litro.jpg',
  'Hamburguesas': 'hamburguesas.jpg',
  'Sándwiches': 'sandwiches.jpg',
  'Piqueos': 'piqueos.jpg',
};

@Component({
  selector: 'app-foto-categoria',
  template: `
    @if (src() && !fallo()) {
      <img [src]="src()" alt="" loading="lazy" (error)="fallo.set(true)" />
    } @else {
      <div class="ilustracion" [class.burger]="linea() === 'BURGER'" aria-hidden="true">
        @if (linea() === 'BURGER') {
          <svg viewBox="0 0 64 64"><path d="M10 28c0-11 10-18 22-18s22 7 22 18H10Z M8 34h48v5H8z M10 43h44c0 6-5 10-11 10H21c-6 0-11-4-11-10Z" /></svg>
        } @else {
          <svg viewBox="0 0 64 64"><circle cx="32" cy="22" r="14" /><path d="M20 32h24L32 58Z" /></svg>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      overflow: hidden;
      border-radius: var(--radio-l);
      background: var(--petroleo-claro);
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .ilustracion {
      display: grid;
      place-items: center;
      width: 100%;
      height: 100%;
      min-height: 160px;
      background: var(--petroleo);
      svg { width: 34%; max-width: 120px; fill: rgba(255, 255, 255, 0.9); }
    }
    .ilustracion.burger {
      background: var(--mostaza);
      svg { fill: var(--tinta); }
    }
  `,
})
export class FotoCategoria {
  readonly nombre = input.required<string>();
  readonly linea = input<Linea>('GELATO');

  protected readonly fallo = signal(false);
  protected readonly src = computed(() => {
    const archivo = ARCHIVOS[this.nombre()];
    return archivo ? `img/${archivo}` : '';
  });
}
