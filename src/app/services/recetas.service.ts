import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface CategoriaReceta {
  _id: string;
  nombre: string;
}

export interface Receta {
  _id: string;
  nombre: string;
  descripcion: string;
  categoriaId: CategoriaReceta | string | null;
  ingredientes: string[];
  pasos: string[];
  foto: string | null;
  tiempoPreparacion: string;
  porciones: string;
  sumaCalificaciones: number;
  cantidadCalificaciones: number;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RecetasService {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Público
  obtenerRecetas() {
    return this.http.get<Receta[]>(`${this.api}/recetas`);
  }

  obtenerDetalle(id: string) {
    return this.http.get<Receta>(`${this.api}/recetas/${id}`);
  }

  calificar(id: string, puntuacion: number) {
    return this.http.post<Receta>(`${this.api}/recetas/${id}/calificar`, { puntuacion });
  }

  obtenerCategorias() {
    return this.http.get<CategoriaReceta[]>(`${this.api}/categorias-recetas`);
  }

  // Admin
  obtenerTodas() {
    return this.http.get<Receta[]>(`${this.api}/recetas-admin/todas`);
  }

  crear(formData: FormData) {
    return this.http.post<Receta>(`${this.api}/recetas-admin`, formData);
  }

  editar(id: string, formData: FormData) {
    return this.http.put<Receta>(`${this.api}/recetas-admin/${id}`, formData);
  }

  eliminar(id: string) {
    return this.http.delete(`${this.api}/recetas-admin/${id}`);
  }

  crearCategoria(nombre: string) {
    return this.http.post<CategoriaReceta>(`${this.api}/categorias-recetas`, { nombre });
  }

  editarCategoria(id: string, nombre: string) {
    return this.http.put<CategoriaReceta>(`${this.api}/categorias-recetas/${id}`, { nombre });
  }

  eliminarCategoria(id: string) {
    return this.http.delete(`${this.api}/categorias-recetas/${id}`);
  }
}