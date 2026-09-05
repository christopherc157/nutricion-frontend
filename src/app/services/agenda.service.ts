import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface HoraDisponible {
  hora: string;
  disponible: boolean;
}

export interface CitaPayload {
  nombre: string;
  telefono: string;
  correo: string;
  tipoConsulta: string;
  motivo: string;
  fecha: string;
  hora: string;
  verificacionToken: string;
}

export interface CitaRespuesta {
  message: string;
  cita: any;
  whatsappUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class AgendaService {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obtenerDiasDisponibles() {
    return this.http.get<string[]>(`${this.api}/disponibilidad`);
  }

  obtenerHorasDia(fecha: string) {
    return this.http.get<HoraDisponible[]>(`${this.api}/disponibilidad/${fecha}`);
  }

  crearCita(data: CitaPayload) {
    return this.http.post<CitaRespuesta>(`${this.api}/citas`, data);
  }

  reservarHora(fecha: string, hora: string) {
    return this.http.post<{ ok: boolean; segundosRestantes: number }>(`${this.api}/disponibilidad/${fecha}/reservar`, { hora });
  }
  
  liberarHora(fecha: string, hora: string) {
    return this.http.post(`${this.api}/disponibilidad/${fecha}/liberar`, { hora });
  }
}