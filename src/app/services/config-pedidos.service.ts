import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface ItemPedido {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

export interface Pedido {
  _id: string;
  nombreCliente: string;
  telefono: string;
  metodoEntrega: string;
  direccionEnvio?: string;
  metodoPago: string;
  total: number;
  entregado: boolean;
  items: ItemPedido[];
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigPedidosService {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obtenerTodos() {
    return this.http.get<Pedido[]>(`${this.api}/pedidos`);
  }

  marcarEntregado(id: string, entregado: boolean) {
    return this.http.patch<Pedido>(`${this.api}/pedidos/${id}/entregado`, { entregado });
  }

}