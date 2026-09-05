import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Paciente {
  _id: string;
  nombre: string;
  correo: string;
  telefono: string;
  fechaPrimeraConsulta?: string;
  objetivo?: string;
  notasGenerales?: string;
  activo: boolean;
  createdAt: string;
}

export interface PacienteSugerido {
  nombre: string;
  correo: string;
  telefono: string;
  fechaPrimeraConsulta: string;
}

export interface Seguimiento {
  _id: string;
  pacienteId: string;
  fecha: string;
  peso: number;
  estatura?: number;
  imc?: number;
  grasaCorporal?: number;
  cintura?: number;
  cadera?: number;
  observaciones?: string;
  proximoObjetivo?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigPacientesService {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obtenerPacientes() {
    return this.http.get<Paciente[]>(`${this.api}/pacientes`);
  }

  obtenerSugeridos() {
    return this.http.get<PacienteSugerido[]>(`${this.api}/pacientes/sugeridos`);
  }

  crearPaciente(data: Partial<Paciente>) {
    return this.http.post<Paciente>(`${this.api}/pacientes`, data);
  }

  editarPaciente(id: string, data: Partial<Paciente>) {
    return this.http.put<Paciente>(`${this.api}/pacientes/${id}`, data);
  }

  eliminarPaciente(id: string) {
    return this.http.delete(`${this.api}/pacientes/${id}`);
  }

  obtenerSeguimientos(pacienteId: string) {
    return this.http.get<Seguimiento[]>(`${this.api}/pacientes/${pacienteId}/seguimientos`);
  }

  crearSeguimiento(pacienteId: string, data: Partial<Seguimiento>) {
    return this.http.post<Seguimiento>(`${this.api}/pacientes/${pacienteId}/seguimientos`, data);
  }

  eliminarSeguimiento(id: string) {
    return this.http.delete(`${this.api}/seguimientos/${id}`);
  }
}