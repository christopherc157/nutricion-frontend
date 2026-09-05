import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigPedidosService, Pedido } from '../../services/config-pedidos.service';

@Component({
  selector: 'app-config-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config-pedidos.component.html',
  styleUrl: './config-pedidos.component.css'
})
export class ConfigPedidosComponent implements OnInit {

  pedidos: Pedido[] = [];
  filtro = '';
  soloPendientes = false;
  pedidoExpandido: string | null = null;

  constructor(private pedidosService: ConfigPedidosService) {}

  ngOnInit() {
    this.pedidosService.obtenerTodos().subscribe({
      next: (data) => this.pedidos = data,
      error: () => this.pedidos = []
    });
  }

  get pedidosFiltrados(): Pedido[] {
    let resultado = this.pedidos;
  
    if (this.soloPendientes) {
      resultado = resultado.filter(p => !p.entregado);
    }
  
    if (this.filtro.trim()) {
      const texto = this.filtro.toLowerCase();
      resultado = resultado.filter(p =>
        p.nombreCliente.toLowerCase().includes(texto) ||
        p.telefono.includes(texto)
      );
    }
  
    return resultado;
  }
  
  get cantidadPendientes(): number {
    return this.pedidos.filter(p => !p.entregado).length;
  }

  get cantidadTotal(): number {
    return this.pedidos.length;
  }

  get totalVentas(): number {
    return this.pedidos.reduce((acc, p) => acc + p.total, 0);
  }

  toggleExpandir(id: string) {
    this.pedidoExpandido = this.pedidoExpandido === id ? null : id;
  }

  toggleEntregado(pedido: Pedido, event: Event) {
    event.stopPropagation(); // para que no se expanda/contraiga la tarjeta al tocar el botón
  
    const nuevoEstado = !pedido.entregado;
  
    this.pedidosService.marcarEntregado(pedido._id, nuevoEstado).subscribe({
      next: () => pedido.entregado = nuevoEstado
    });
  }

  private esMismoDia(fecha1: Date, fecha2: Date): boolean {
    return fecha1.toDateString() === fecha2.toDateString();
  }
  
  get gruposPedidos(): { label: string; icono: string; pedidos: Pedido[] }[] {
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);
  
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - 6);
  
    const grupoHoy: Pedido[] = [];
    const grupoAyer: Pedido[] = [];
    const grupoSemana: Pedido[] = [];
    const grupoAnteriores: Pedido[] = [];
  
    for (const p of this.pedidosFiltrados) {
      const fecha = new Date(p.createdAt);
  
      if (this.esMismoDia(fecha, hoy)) {
        grupoHoy.push(p);
      } else if (this.esMismoDia(fecha, ayer)) {
        grupoAyer.push(p);
      } else if (fecha >= inicioSemana) {
        grupoSemana.push(p);
      } else {
        grupoAnteriores.push(p);
      }
    }
  
    const grupos: { label: string; icono: string; pedidos: Pedido[] }[] = [];
  
    if (grupoHoy.length) grupos.push({ label: 'Hoy', icono: 'fa-solid fa-star', pedidos: grupoHoy });
    if (grupoAyer.length) grupos.push({ label: 'Ayer', icono: 'fa-solid fa-calendar-day', pedidos: grupoAyer });
    if (grupoSemana.length) grupos.push({ label: 'Esta semana', icono: 'fa-solid fa-calendar-week', pedidos: grupoSemana });
    if (grupoAnteriores.length) grupos.push({ label: 'Anteriores', icono: 'fa-solid fa-box-archive', pedidos: grupoAnteriores });
  
    return grupos;
  }
}