import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface RecomendadosConfig {
  _id?: string;
  titulo?: string;
  descripcion?: string;
  archivoPdf?: string;
  nombreArchivoOriginal?: string;
  actualizadoEn?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RecomendadosService {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obtener() {
    return this.http.get<RecomendadosConfig>(`${this.api}/recomendados`);
  }

  guardar(formData: FormData) {
    return this.http.put<RecomendadosConfig>(`${this.api}/recomendados`, formData);
  }
}