import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface InicioConfig {
  titulo?: string;
  subtitulo?: string;
  descripcion?: string;
  imagen?: string;
  galeriaHero?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class InicioService {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obtenerConfig() {
    return this.http.get<InicioConfig>(`${this.api}/inicio`);
  }
}