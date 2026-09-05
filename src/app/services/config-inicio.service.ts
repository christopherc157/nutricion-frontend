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
export class ConfigInicioService {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obtener() {
    return this.http.get<InicioConfig>(`${this.api}/inicio`);
  }

  guardar(formData: FormData) {
    return this.http.put<InicioConfig>(`${this.api}/inicio`, formData);
  }
  subirImagenesGaleria(imagenes: File[]) {
    const formData = new FormData();
    imagenes.forEach(img => formData.append('imagenes', img));
    return this.http.post<InicioConfig>(`${this.api}/inicio/galeria`, formData);
  }

  eliminarImagenGaleria(url: string) {
    return this.http.request<InicioConfig>('delete', `${this.api}/inicio/galeria`, { body: { url } });
  }
}