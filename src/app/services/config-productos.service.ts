import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface CategoriaProducto {
  _id: string;
  nombre: string;
}

export interface Producto {
  _id: string;
  nombre: string;
  descripcion: string;
  categoriaId: CategoriaProducto | string | null;
  precio: number;
  stock: number;
  foto: string | null;
  activo: boolean;
  destacado: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigProductosService {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obtenerTodos() {
    return this.http.get<Producto[]>(`${this.api}/productos/todos`);
  }

  crear(formData: FormData) {
    return this.http.post<Producto>(`${this.api}/productos`, formData);
  }

  editar(id: string, formData: FormData) {
    return this.http.put<Producto>(`${this.api}/productos/${id}`, formData);
  }

  eliminar(id: string) {
    return this.http.delete(`${this.api}/productos/${id}`);
  }

  obtenerCategorias() {
    return this.http.get<CategoriaProducto[]>(`${this.api}/categorias-productos`);
  }

  crearCategoria(nombre: string) {
    return this.http.post<CategoriaProducto>(`${this.api}/categorias-productos`, { nombre });
  }

  editarCategoria(id: string, nombre: string) {
    return this.http.put<CategoriaProducto>(`${this.api}/categorias-productos/${id}`, { nombre });
  }

  eliminarCategoria(id: string) {
    return this.http.delete(`${this.api}/categorias-productos/${id}`);
  }
}