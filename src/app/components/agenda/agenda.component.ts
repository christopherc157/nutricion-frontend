import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavComponent } from '../nav/nav.component';
import { FooterComponent } from '../footer/footer.component';
import { AgendaService, HoraDisponible } from '../../services/agenda.service';
import { VerificacionService } from '../../services/verificacion.service';
import { LoadingComponent } from '../loading/loading.component';

interface DiaCalendario {
  numero: number;
  fecha: string;
  disponible: boolean;
  esPasado: boolean;
  esHoy: boolean;
}

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavComponent, FooterComponent, LoadingComponent],
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.css'
})
export class AgendaComponent implements OnInit {

  mesActual = new Date();
  diasDisponibles: string[] = [];
  celdas: (DiaCalendario | null)[] = [];
  cargandoCalendario = true;

  nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Modal (celular) / Panel lateral (escritorio)
  mostrarModal = false;
  panelAbierto = false;
  esDesktop = typeof window !== 'undefined' && window.innerWidth >= 900;

  mostrarConfirmacionCancelar = false;
  paso: 'horas' | 'form' | 'verificacion' | 'confirmacion' = 'horas';

  fechaSeleccionada = '';
  horas: HoraDisponible[] = [];
  horaSeleccionada = '';

  tiposConsulta = [
    'Primera vez',
    'Seguimiento',
    'Evaluación nutricional',
    'Asesoría deportiva',
    'Otro'
  ];

  form = {
    nombre: '',
    telefono: '',
    correo: '',
    tipoConsulta: '',
    motivo: ''
  };

  aceptaPrivacidad = false;

  errorMessage = '';
  errorVerificacion = '';
  codigoIngresado = '';
  verificacionToken = '';
  enviandoCodigo = false;
  verificandoCodigo = false;
  cooldownReenvio = 0;
  private cooldownInterval: any;

  segundosRestantes = 0;
  private timerHold: any;

  cargando = false;
  mensajeConfirmacion = '';
  whatsappUrl = '';

  constructor(
    private agendaService: AgendaService,
    private verificacionService: VerificacionService
  ) {}

  ngOnInit() {
    this.cargarDisponibilidad();
  }

  @HostListener('window:resize')
  onResize() {
    this.esDesktop = window.innerWidth >= 900;
  }

  cargarDisponibilidad() {
    this.agendaService.obtenerDiasDisponibles().subscribe({
      next: (dias) => {
        this.diasDisponibles = dias;
        this.generarCalendario();
        this.cargandoCalendario = false;
      },
      error: () => {
        this.generarCalendario();
        this.cargandoCalendario = false;
      }
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
        disponible: this.diasDisponibles.includes(fecha),
        esPasado: fechaObj < hoy,
        esHoy: fechaObj.getTime() === hoy.getTime()
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

  get horasManana(): HoraDisponible[] {
    return this.horas.filter(h => Number(h.hora.split(':')[0]) < 12);
  }

  get horasTarde(): HoraDisponible[] {
    return this.horas.filter(h => Number(h.hora.split(':')[0]) >= 12);
  }

  cambiarMes(delta: number) {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + delta, 1);
    this.generarCalendario();
  }

  irAHoy() {
    this.mesActual = new Date();
    this.generarCalendario();
  }

  seleccionarDia(celda: DiaCalendario | null) {
    if (!celda || !celda.disponible || celda.esPasado) return;

    this.fechaSeleccionada = celda.fecha;
    this.errorMessage = '';
    this.horaSeleccionada = '';
    this.paso = 'horas';

    if (this.esDesktop) {
      this.panelAbierto = true;
    } else {
      this.mostrarModal = true;
    }

    this.agendaService.obtenerHorasDia(celda.fecha).subscribe({
      next: (horas) => this.horas = horas,
      error: () => this.horas = []
    });
  }

  seleccionarHora(hora: HoraDisponible) {
    if (!hora.disponible) return;

    this.agendaService.reservarHora(this.fechaSeleccionada, hora.hora).subscribe({
      next: (res) => {
        this.horaSeleccionada = hora.hora;
        this.paso = 'form';
        this.iniciarTemporizadorHold(res.segundosRestantes);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Esa hora ya no está disponible, elige otra';
        this.agendaService.obtenerHorasDia(this.fechaSeleccionada).subscribe({
          next: (horas) => this.horas = horas
        });
      }
    });
  }

  private iniciarTemporizadorHold(segundosIniciales: number) {
    this.segundosRestantes = segundosIniciales;
    clearInterval(this.timerHold);

    this.timerHold = setInterval(() => {
      this.segundosRestantes--;

      if (this.segundosRestantes <= 0) {
        clearInterval(this.timerHold);
        this.manejarExpiracionHold();
      }
    }, 1000);
  }

  private manejarExpiracionHold() {
    this.paso = 'horas';
    this.errorMessage = 'Se acabó el tiempo para completar tu cita. Por favor elige un horario nuevamente.';

    this.agendaService.obtenerHorasDia(this.fechaSeleccionada).subscribe({
      next: (horas) => this.horas = horas
    });
  }

  get tiempoFormateado(): string {
    const min = Math.floor(this.segundosRestantes / 60);
    const seg = this.segundosRestantes % 60;
    return `${min}:${seg.toString().padStart(2, '0')}`;
  }

  volverAHoras() {
    clearInterval(this.timerHold);
    this.agendaService.liberarHora(this.fechaSeleccionada, this.horaSeleccionada).subscribe();
    this.paso = 'horas';

    this.agendaService.obtenerHorasDia(this.fechaSeleccionada).subscribe({
      next: (horas) => this.horas = horas
    });
  }

  confirmarCita() {
    if (!this.form.nombre.trim() || !this.form.telefono.trim() || !this.form.correo.trim() || !this.form.tipoConsulta) {
      this.errorMessage = 'Por favor completa nombre, teléfono, correo y tipo de consulta';
      return;
    }

    if (!this.aceptaPrivacidad) {
      this.errorMessage = 'Debes aceptar el Aviso de Privacidad para continuar';
      return;
    }

    this.errorMessage = '';
    this.enviandoCodigo = true;

    this.verificacionService.enviarCodigo(this.form.correo.trim(), 'cita').subscribe({
      next: () => {
        this.enviandoCodigo = false;
        this.paso = 'verificacion';
        this.codigoIngresado = '';
        this.errorVerificacion = '';
        this.iniciarCooldown();
      },
      error: (err) => {
        this.enviandoCodigo = false;
        this.errorMessage = err.error?.message || 'No se pudo enviar el código, intenta de nuevo';
      }
    });
  }

  confirmarCodigo() {
    if (this.codigoIngresado.trim().length !== 6) {
      this.errorVerificacion = 'Ingresa el código de 6 dígitos';
      return;
    }

    this.errorVerificacion = '';
    this.verificandoCodigo = true;

    this.verificacionService.confirmarCodigo(this.form.correo.trim(), 'cita', this.codigoIngresado.trim()).subscribe({
      next: (res) => {
        this.verificandoCodigo = false;
        this.verificacionToken = res.token;
        this.crearCitaFinal();
      },
      error: (err) => {
        this.verificandoCodigo = false;
        this.errorVerificacion = err.error?.message || 'Código incorrecto';
      }
    });
  }

  crearCitaFinal() {
    this.cargando = true;

    this.agendaService.crearCita({
      nombre: this.form.nombre.trim(),
      telefono: this.form.telefono.trim(),
      correo: this.form.correo.trim(),
      tipoConsulta: this.form.tipoConsulta,
      motivo: this.form.motivo.trim(),
      fecha: this.fechaSeleccionada,
      hora: this.horaSeleccionada,
      verificacionToken: this.verificacionToken
    }).subscribe({
      next: (res) => {
        clearInterval(this.timerHold);
        this.mensajeConfirmacion = `Tu cita quedó agendada para el ${this.formatearFechaVisual(this.fechaSeleccionada)} a las ${this.formatearHora12(this.horaSeleccionada)}.`;
        this.whatsappUrl = res.whatsappUrl;
        this.paso = 'confirmacion';
        this.cargando = false;
        this.cargarDisponibilidad();
      },
      error: (err) => {
        clearInterval(this.timerHold);
        this.errorMessage = err.error?.message || 'Esa hora ya no está disponible, elige otra';
        this.cargando = false;
        this.paso = 'horas';

        this.agendaService.obtenerHorasDia(this.fechaSeleccionada).subscribe({
          next: (horas) => this.horas = horas
        });
      }
    });
  }

  reenviarCodigo() {
    if (this.cooldownReenvio > 0) return;

    this.enviandoCodigo = true;

    this.verificacionService.enviarCodigo(this.form.correo.trim(), 'cita').subscribe({
      next: () => {
        this.enviandoCodigo = false;
        this.errorVerificacion = '';
        this.iniciarCooldown();
      },
      error: (err) => {
        this.enviandoCodigo = false;
        this.errorVerificacion = err.error?.message || 'No se pudo reenviar el código';
      }
    });
  }

  private iniciarCooldown() {
    this.cooldownReenvio = 30;
    clearInterval(this.cooldownInterval);
    this.cooldownInterval = setInterval(() => {
      this.cooldownReenvio--;
      if (this.cooldownReenvio <= 0) clearInterval(this.cooldownInterval);
    }, 1000);
  }

  cerrarModal() {
    if ((this.paso === 'form' || this.paso === 'verificacion') && this.horaSeleccionada) {
      this.agendaService.liberarHora(this.fechaSeleccionada, this.horaSeleccionada).subscribe();
    }

    clearInterval(this.timerHold);
    this.mostrarModal = false;
    this.panelAbierto = false;
    this.form = { nombre: '', telefono: '', correo: '', tipoConsulta: '', motivo: '' };
    this.aceptaPrivacidad = false;
    this.errorMessage = '';
    this.errorVerificacion = '';
    this.codigoIngresado = '';
    this.verificacionToken = '';
    this.segundosRestantes = 0;
    clearInterval(this.cooldownInterval);
    this.cooldownReenvio = 0;
  }

  intentarCerrar() {
    if (this.paso === 'confirmacion') {
      this.cerrarModal();
      return;
    }
    this.mostrarConfirmacionCancelar = true;
  }

  confirmarCancelar() {
    this.mostrarConfirmacionCancelar = false;
    this.cerrarModal();
  }

  seguirAgendando() {
    this.mostrarConfirmacionCancelar = false;
  }
}