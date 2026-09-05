import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Cita {
  _id: string;
  nombre: string;
  telefono: string;
  tipoConsulta: string;
  motivo: string;
  fecha: string;
  hora: string;
  atendida: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigCitasService {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obtenerTodas() {
    return this.http.get<Cita[]>(`${this.api}/citas`);
  }

  marcarAtendida(id: string, atendida: boolean) {
    return this.http.patch<Cita>(`${this.api}/citas/${id}/atendida`, { atendida });
  }

  eliminar(id: string) {
    return this.http.delete(`${this.api}/citas/${id}`);
  }
}