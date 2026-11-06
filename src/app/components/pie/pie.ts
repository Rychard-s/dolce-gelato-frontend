import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NEGOCIO } from '../../shared/config';

@Component({
  selector: 'app-pie',
  imports: [RouterLink],
  templateUrl: './pie.html',
  styleUrl: './pie.scss',
})
export class Pie {
  protected readonly negocio = NEGOCIO;
  protected readonly anio = new Date().getFullYear();
}
