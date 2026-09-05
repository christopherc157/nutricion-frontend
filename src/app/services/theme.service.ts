import { Injectable } from '@angular/core';

const THEME_STORAGE_KEY = 'tema_preferido';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  modoOscuro = false;

  constructor() {
    const guardado = localStorage.getItem(THEME_STORAGE_KEY);

    if (guardado) {
      this.modoOscuro = guardado === 'dark';
    } else {
      // Si nunca eligió, respetamos la preferencia del sistema operativo
      this.modoOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    this.aplicarTema();
  }

  toggleTema() {
    this.modoOscuro = !this.modoOscuro;
    localStorage.setItem(THEME_STORAGE_KEY, this.modoOscuro ? 'dark' : 'light');
    this.aplicarTema();
  }

  private aplicarTema() {
    document.body.classList.toggle('dark-theme', this.modoOscuro);
  }
}