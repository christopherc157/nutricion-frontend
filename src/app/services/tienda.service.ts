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

export interface ItemPedido {
  productoId: string;
  cantidad: number;
}

export interface PedidoPayload {
  nombreCliente: string;
  telefono: string;
  correo: string;
  metodoEntrega: string;
  direccionEnvio?: string;
  metodoPago: string;
  verificacionToken: string;
  items: ItemPedido[];
}

export interface PedidoRespuesta {
  message: string;
  pedido: any;
  whatsappUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class TiendaService {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obtenerProductos() {
    return this.http.get<Producto[]>(`${this.api}/productos`);
  }

  crearPedido(data: PedidoPayload) {
    return this.http.post<PedidoRespuesta>(`${this.api}/pedidos`, data);
  }

  obtenerCategorias() {
    return this.http.get<CategoriaProducto[]>(`${this.api}/categorias-productos`);
  }
  
}