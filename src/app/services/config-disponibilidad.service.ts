import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface HoraConfig {
  hora: string;
  disponible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigDisponibilidadService {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obtenerDias() {
    return this.http.get<string[]>(`${this.api}/disponibilidad`);
  }

  obtenerHorasDia(fecha: string) {
    return this.http.get<HoraConfig[]>(`${this.api}/disponibilidad/${fecha}`);
  }

  guardarDia(fecha: string, horas: HoraConfig[]) {
    return this.http.post(`${this.api}/disponibilidad`, { fecha, horas });
  }

  eliminarDia(fecha: string) {
    return this.http.delete(`${this.api}/disponibilidad/${fecha}`);
  }
}