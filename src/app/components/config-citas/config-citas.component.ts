import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigCitasService, Cita } from '../../services/config-citas.service';

@Component({
  selector: 'app-config-citas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config-citas.component.html',
  styleUrl: './config-citas.component.css'
})
export class ConfigCitasComponent implements OnInit {

  citas: Cita[] = [];
  filtro = '';
  soloPendientes = false;

  mostrarConfirmacion = false;
  citaAEliminar: Cita | null = null;

  constructor(private citasService: ConfigCitasService) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.citasService.obtenerTodas().subscribe({
      next: (data) => this.citas = data,
      error: () => this.citas = []
    });
  }

  get citasFiltradas(): Cita[] {
    let resultado = this.citas;
  
    if (this.soloPendientes) {
      resultado = resultado.filter(c => !c.atendida);
    }
  
    if (this.filtro.trim()) {
      const texto = this.filtro.toLowerCase();
      resultado = resultado.filter(c =>
        c.nombre.toLowerCase().includes(texto) ||
        c.telefono.includes(texto) ||
        c.tipoConsulta.toLowerCase().includes(texto)
      );
    }
  
    return resultado;
  }

  private formatoFechaHoy(): string {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
    const dia = hoy.getDate().toString().padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }
  
  get gruposCitas(): { label: string; icono: string; citas: Cita[] }[] {
    const hoyStr = this.formatoFechaHoy();
  
    const hoy: Cita[] = [];
    const proximas: Cita[] = [];
    const pasadas: Cita[] = [];
  
    for (const c of this.citasFiltradas) {
      if (c.fecha === hoyStr) {
        hoy.push(c);
      } else if (this.esProxima(c.fecha)) {
        proximas.push(c);
      } else {
        pasadas.push(c);
      }
    }
  
    proximas.sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
    pasadas.sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
  
    const grupos: { label: string; icono: string; citas: Cita[] }[] = [];
  
    if (hoy.length) grupos.push({ label: 'Hoy', icono: 'fa-solid fa-star', citas: hoy });
    if (proximas.length) grupos.push({ label: 'Próximas', icono: 'fa-solid fa-calendar-days', citas: proximas });
    if (pasadas.length) grupos.push({ label: 'Pasadas', icono: 'fa-solid fa-clock-rotate-left', citas: pasadas });
  
    return grupos;
  }
  
  get cantidadPendientes(): number {
    return this.citas.filter(c => !c.atendida).length;
  }

  get cantidadTotal(): number {
    return this.citas.length;
  }

  esProxima(fecha: string): boolean {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return new Date(fecha) >= hoy;
  }

  formatearHora12(hora: string): string {
    const [h, m] = hora.split(':').map(Number);
    const periodo = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${periodo}`;
  }

  confirmarEliminar(cita: Cita) {
    this.citaAEliminar = cita;
    this.mostrarConfirmacion = true;
  }

  toggleAtendida(cita: Cita) {
    const nuevoEstado = !cita.atendida;
  
    this.citasService.marcarAtendida(cita._id, nuevoEstado).subscribe({
      next: () => cita.atendida = nuevoEstado
    });
  }

  eliminarConfirmado() {
    if (!this.citaAEliminar) return;

    this.citasService.eliminar(this.citaAEliminar._id).subscribe({
      next: () => {
        this.mostrarConfirmacion = false;
        this.citaAEliminar = null;
        this.cargar();
      }
    });
  }
}