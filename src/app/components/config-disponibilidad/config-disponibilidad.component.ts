import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigDisponibilidadService, HoraConfig } from '../../services/config-disponibilidad.service';

interface DiaCalendario {
  numero: number;
  fecha: string;
  habilitado: boolean;
  esPasado: boolean;
}

@Component({
  selector: 'app-config-disponibilidad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config-disponibilidad.component.html',
  styleUrl: './config-disponibilidad.component.css'
})
export class ConfigDisponibilidadComponent implements OnInit {

  mesActual = new Date();
  diasHabilitados: string[] = [];
  celdas: (DiaCalendario | null)[] = [];

  nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Modal de edición de un día
  mostrarModal = false;
  fechaSeleccionada = '';
  horas: HoraConfig[] = [];

  // Generador rápido de horarios
  horaInicio = '09:00';
  horaFin = '18:00';
  intervaloMin = 60;

  guardando = false;

  constructor(private disponibilidadService: ConfigDisponibilidadService) {}

  ngOnInit() {
    this.cargarDias();
  }

  cargarDias() {
    this.disponibilidadService.obtenerDias().subscribe({
      next: (dias) => {
        this.diasHabilitados = dias;
        this.generarCalendario();
      },
      error: () => this.generarCalendario()
    });
  }

  generarCalendario() {
    const anio = this.mesActual.getFullYear();
    const mes = this.mesActual.getMonth();

    const primerDiaSemana = new Date(anio, mes, 1).getDay();
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const celdas: (DiaCalendario | null)[] = [];

    for (let i = 0; i < primerDiaSemana; i++) {
      celdas.push(null);
    }

    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = this.formatearFecha(anio, mes, dia);
      const fechaObj = new Date(anio, mes, dia);

      celdas.push({
        numero: dia,
        fecha,
        habilitado: this.diasHabilitados.includes(fecha),
        esPasado: fechaObj < hoy
      });
    }

    this.celdas = celdas;
  }

  formatearFecha(anio: number, mes: number, dia: number): string {
    const m = (mes + 1).toString().padStart(2, '0');
    const d = dia.toString().padStart(2, '0');
    return `${anio}-${m}-${d}`;
  }
  
  formatearFechaVisual(fecha: string): string {
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}-${mes}-${anio}`;
  }
  
  formatearHora12(hora: string): string {
    const [h, m] = hora.split(':').map(Number);
    const periodo = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${periodo}`;
  }

  cambiarMes(delta: number) {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + delta, 1);
    this.generarCalendario();
  }

  abrirDia(celda: DiaCalendario | null) {
    if (!celda || celda.esPasado) return;

    this.fechaSeleccionada = celda.fecha;
    this.mostrarModal = true;

    if (celda.habilitado) {
      this.disponibilidadService.obtenerHorasDia(celda.fecha).subscribe({
        next: (horas) => this.horas = horas,
        error: () => this.horas = []
      });
    } else {
      this.horas = [];
    }
  }

  generarHoras() {
    const [hI, mI] = this.horaInicio.split(':').map(Number);
    const [hF, mF] = this.horaFin.split(':').map(Number);
  
    const inicioMin = hI * 60 + mI;
    const finMin = hF * 60 + mF;
  
    // Copiamos lo que ya había, para no perderlo
    const horasCombinadas = [...this.horas];
  
    for (let t = inicioMin; t < finMin; t += this.intervaloMin) {
      const h = Math.floor(t / 60).toString().padStart(2, '0');
      const m = (t % 60).toString().padStart(2, '0');
      const horaTexto = `${h}:${m}`;
  
      // Si esa hora ya existe (venía de antes, o de otra tanda del generador), no la duplicamos ni la pisamos
      const yaExiste = horasCombinadas.some(x => x.hora === horaTexto);
      if (!yaExiste) {
        horasCombinadas.push({ hora: horaTexto, disponible: true });
      }
    }
  
    // Ordenamos por hora para que la lista se vea prolija (11:00, 12:00, 14:00...) en vez de mezclada
    horasCombinadas.sort((a, b) => a.hora.localeCompare(b.hora));
  
    this.horas = horasCombinadas;
  }

  toggleHora(hora: HoraConfig) {
    hora.disponible = !hora.disponible;
  }

  quitarHora(hora: HoraConfig) {
    this.horas = this.horas.filter(h => h !== hora);
  }

  guardarDia() {
    this.guardando = true;

    this.disponibilidadService.guardarDia(this.fechaSeleccionada, this.horas).subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarModal = false;
        this.cargarDias();
      },
      error: () => this.guardando = false
    });
  }

  eliminarDia() {
    if (!confirm('¿Deshabilitar completamente este día? Se perderán todos sus horarios.')) return;

    this.disponibilidadService.eliminarDia(this.fechaSeleccionada).subscribe({
      next: () => {
        this.mostrarModal = false;
        this.cargarDias();
      }
    });
  }
}