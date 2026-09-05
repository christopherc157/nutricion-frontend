import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VerificacionService {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  enviarCodigo(email: string, proposito: 'cita' | 'pedido') {
    return this.http.post<{ message: string }>(`${this.api}/verificacion/enviar`, { email, proposito });
  }

  confirmarCodigo(email: string, proposito: 'cita' | 'pedido', codigo: string) {
    return this.http.post<{ verificado: boolean; token: string }>(`${this.api}/verificacion/confirmar`, { email, proposito, codigo });
  }
}