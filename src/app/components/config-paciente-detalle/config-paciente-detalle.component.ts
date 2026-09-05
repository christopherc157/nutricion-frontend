import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfigPacientesService, Paciente, Seguimiento } from '../../services/config-pacientes.service';

@Component({
  selector: 'app-config-paciente-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './config-paciente-detalle.component.html',
  styleUrl: './config-paciente-detalle.component.css'
})
export class ConfigPacienteDetalleComponent implements OnInit {

  pacienteId!: string;
  paciente: Paciente | null = null;
  seguimientos: Seguimiento[] = [];

  mostrarModal = false;
  guardando = false;
  errorMessage = '';

  mostrarConfirmacion = false;
  seguimientoAEliminar: Seguimiento | null = null;

  form = {
    fecha: '',
    peso: null as number | null,
    estatura: null as number | null,
    grasaCorporal: null as number | null,
    cintura: null as number | null,
    cadera: null as number | null,
    observaciones: '',
    proximoObjetivo: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pacientesService: ConfigPacientesService
  ) {}

  ngOnInit() {
    this.pacienteId = this.route.snapshot.paramMap.get('id')!;
    this.cargarPaciente();
    this.cargarSeguimientos();
  }

  cargarPaciente() {
    this.pacientesService.obtenerPacientes().subscribe({
      next: (data) => {
        this.paciente = data.find(p => p._id === this.pacienteId) || null;
      }
    });
  }

  cargarSeguimientos() {
    this.pacientesService.obtenerSeguimientos(this.pacienteId).subscribe({
      next: (data) => this.seguimientos = data,
      error: () => this.seguimientos = []
    });
  }

  get ultimoSeguimiento(): Seguimiento | null {
    return this.seguimientos.length ? this.seguimientos[this.seguimientos.length - 1] : null;
  }

  get primerSeguimiento(): Seguimiento | null {
    return this.seguimientos.length ? this.seguimientos[0] : null;
  }

  get diferenciaPeso(): number | null {
    if (!this.primerSeguimiento || !this.ultimoSeguimiento || this.seguimientos.length < 2) return null;
    return Number((this.ultimoSeguimiento.peso - this.primerSeguimiento.peso).toFixed(1));
  }

  // Genera los puntos de la gráfica de peso como un string de coordenadas SVG
  get puntosGrafica(): string {
    if (this.seguimientos.length < 2) return '';

    const pesos = this.seguimientos.map(s => s.peso);
    const min = Math.min(...pesos);
    const max = Math.max(...pesos);
    const rango = max - min || 1;

    const anchoTotal = 100;
    const paso = anchoTotal / (this.seguimientos.length - 1);

    return this.seguimientos
      .map((s, i) => {
        const x = i * paso;
        // invertimos el eje Y porque en SVG "0" es arriba, no abajo
        const y = 100 - ((s.peso - min) / rango) * 80 - 10;
        return `${x},${y}`;
      })
      .join(' ');
  }

  abrirNuevoSeguimiento() {
    const hoy = new Date().toISOString().substring(0, 10);
    this.form = {
      fecha: hoy,
      peso: this.ultimoSeguimiento?.peso ?? null,
      estatura: this.ultimoSeguimiento?.estatura ?? null,
      grasaCorporal: null,
      cintura: null,
      cadera: null,
      observaciones: '',
      proximoObjetivo: ''
    };
    this.errorMessage = '';
    this.mostrarModal = true;
  }

  guardarSeguimiento() {
    if (!this.form.fecha || !this.form.peso) {
      this.errorMessage = 'La fecha y el peso son obligatorios';
      return;
    }

    this.errorMessage = '';
    this.guardando = true;

    this.pacientesService.crearSeguimiento(this.pacienteId, this.form as any).subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarModal = false;
        this.cargarSeguimientos();
      },
      error: (err) => {
        this.guardando = false;
        this.errorMessage = err.error?.message || 'Error al guardar el registro';
      }
    });
  }

  confirmarEliminar(s: Seguimiento) {
    this.seguimientoAEliminar = s;
    this.mostrarConfirmacion = true;
  }

  eliminarConfirmado() {
    if (!this.seguimientoAEliminar) return;

    this.pacientesService.eliminarSeguimiento(this.seguimientoAEliminar._id).subscribe({
      next: () => {
        this.mostrarConfirmacion = false;
        this.seguimientoAEliminar = null;
        this.cargarSeguimientos();
      }
    });
  }

  eliminarPaciente() {
    if (!confirm('¿Eliminar este paciente? Se borrará también todo su historial de seguimiento. Esta acción no se puede deshacer.')) return;

    this.pacientesService.eliminarPaciente(this.pacienteId).subscribe({
      next: () => this.router.navigate(['/config/pacientes'])
    });
  }
}