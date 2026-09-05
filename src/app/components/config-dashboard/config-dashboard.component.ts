import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConfigCitasService, Cita } from '../../services/config-citas.service';
import { ConfigPedidosService, Pedido } from '../../services/config-pedidos.service';
import { ConfigProductosService, Producto } from '../../services/config-productos.service';

const STOCK_MINIMO = 5;

@Component({
  selector: 'app-config-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './config-dashboard.component.html',
  styleUrl: './config-dashboard.component.css'
})
export class ConfigDashboardComponent implements OnInit {

  citasHoy: Cita[] = [];
  citasPendientesTotal = 0;
  ventasDelMes = 0;
  pedidosDelMes = 0;
  productosStockBajo: Producto[] = [];

  cargando = true;

  constructor(
    private citasService: ConfigCitasService,
    private pedidosService: ConfigPedidosService,
    private productosService: ConfigProductosService
  ) {}

  ngOnInit() {
    this.citasService.obtenerTodas().subscribe({
      next: (citas) => {
        const hoy = this.hoyComoTexto();
        this.citasHoy = citas
          .filter(c => c.fecha === hoy)
          .sort((a, b) => a.hora.localeCompare(b.hora));

        this.citasPendientesTotal = citas.filter(c => !c.atendida).length;
      }
    });

    this.pedidosService.obtenerTodos().subscribe({
      next: (pedidos) => {
        const delMes = this.filtrarDelMesActual(pedidos);
        this.ventasDelMes = delMes.reduce((acc, p) => acc + p.total, 0);
        this.pedidosDelMes = delMes.length;
      }
    });

    this.productosService.obtenerTodos().subscribe({
      next: (productos) => {
        this.productosStockBajo = productos.filter(p => p.activo && p.stock <= STOCK_MINIMO);
        this.cargando = false;
      },
      error: () => this.cargando = false
    });
  }

  private hoyComoTexto(): string {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
    const dia = hoy.getDate().toString().padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private filtrarDelMesActual(pedidos: Pedido[]): Pedido[] {
    const hoy = new Date();
    return pedidos.filter(p => {
      const fecha = new Date(p.createdAt);
      return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
    });
  }

  formatearHora12(hora: string): string {
    const [h, m] = hora.split(':').map(Number);
    const periodo = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${periodo}`;
  }
}