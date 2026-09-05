import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

interface Usuario {
  id: string;
  email: string;
  role: string;
}

const DURACION_SESION_MS = 30 * 60 * 1000; // 30 minutos

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private api = environment.apiUrl;
  private timeoutId: any;

  constructor(private http: HttpClient, private router: Router) {
    // Si la app arranca (o se recarga la página) con una sesión ya guardada,
    // retomamos el conteo desde donde había quedado.
    if (this.estaLogueado()) {
      this.iniciarTemporizadorSesion();
    }
  }

  login(email: string, password: string) {
    return this.http.post<any>(`${this.api}/login`, { email, password });
  }

  guardarSesion(token: string, usuario: Usuario) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    localStorage.setItem('loginTime', Date.now().toString());
    this.iniciarTemporizadorSesion();
  }

  obtenerToken(): string | null {
    return localStorage.getItem('token');
  }

  obtenerUsuario(): Usuario | null {
    const data = localStorage.getItem('usuario');
    return data ? JSON.parse(data) : null;
  }

  estaLogueado(): boolean {
    return !!this.obtenerToken();
  }

  logout() {
    clearTimeout(this.timeoutId);
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('loginTime');
    this.router.navigate(['/login']);
  }

  private iniciarTemporizadorSesion() {
    clearTimeout(this.timeoutId);

    const loginTime = Number(localStorage.getItem('loginTime'));
    if (!loginTime) return;

    const tiempoTranscurrido = Date.now() - loginTime;
    const tiempoRestante = DURACION_SESION_MS - tiempoTranscurrido;

    if (tiempoRestante <= 0) {
      this.cerrarPorSesionExpirada();
      return;
    }

    this.timeoutId = setTimeout(() => this.cerrarPorSesionExpirada(), tiempoRestante);
  }

  cerrarPorSesionExpirada() {
    clearTimeout(this.timeoutId);
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('loginTime');
  
    // Solo redirigimos si esta pestaña en particular está dentro del panel de
    // administración. Si es una pestaña de un cliente navegando el sitio público
    // (Inicio, Agenda, Tienda), no tiene sentido mandarla al login — esa pestaña
    // nunca necesitó estar autenticada.
    if (this.router.url.startsWith('/config')) {
      this.router.navigate(['/login'], { queryParams: { sesionExpirada: '1' } });
    }
  }
}