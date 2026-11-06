import { Pipe, PipeTransform } from '@angular/core';

// Muestra montos en soles: 19 → "S/ 19.00"
@Pipe({ name: 'soles' })
export class SolesPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    return 'S/ ' + Number(valor ?? 0).toFixed(2);
  }
}
