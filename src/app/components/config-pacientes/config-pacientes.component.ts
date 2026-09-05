import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfigPacientesService, Paciente, PacienteSugerido } from '../../services/config-pacientes.service';

@Component({
  selector: 'app-config-pacientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './config-pacientes.component.html',
  styleUrl: './config-pacientes.component.css'
})
export class ConfigPacientesComponent implements OnInit {

  pacientes: Paciente[] = [];
  sugeridos: PacienteSugerido[] = [];
  filtro = '';

  mostrarModal = false;
  guardando = false;
  errorMessage = '';

  form = {
    nombre: '',
    correo: '',
    telefono: '',
    fechaPrimeraConsulta: '',
    objetivo: ''
  };

  constructor(private pacientesService: ConfigPacientesService) {}

  ngOnInit() {
    this.cargarPacientes();
    this.cargarSugeridos();
  }

  cargarPacientes() {
    this.pacientesService.obtenerPacientes().subscribe({
      next: (data) => this.pacientes = data,
      error: () => this.pacientes = []
    });
  }

  cargarSugeridos() {
    this.pacientesService.obtenerSugeridos().subscribe({
      next: (data) => this.sugeridos = data,
      error: () => this.sugeridos = []
    });
  }

  get pacientesFiltrados(): Paciente[] {
    if (!this.filtro.trim()) return this.pacientes;

    const texto = this.filtro.toLowerCase();
    return this.pacientes.filter(p =>
      p.nombre.toLowerCase().includes(texto) ||
      p.correo.toLowerCase().includes(texto) ||
      p.telefono.includes(texto)
    );
  }

  abrirNuevo() {
    this.form = { nombre: '', correo: '', telefono: '', fechaPrimeraConsulta: '', objetivo: '' };
    this.errorMessage = '';
    this.mostrarModal = true;
  }

  convertirSugerido(s: PacienteSugerido) {
    this.form = {
      nombre: s.nombre,
      correo: s.correo,
      telefono: s.telefono,
      fechaPrimeraConsulta: s.fechaPrimeraConsulta,
      objetivo: ''
    };
    this.errorMessage = '';
    this.mostrarModal = true;
  }

  guardar() {
    if (!this.form.nombre.trim() || !this.form.correo.trim() || !this.form.telefono.trim()) {
      this.errorMessage = 'Nombre, correo y teléfono son obligatorios';
      return;
    }

    this.errorMessage = '';
    this.guardando = true;

    this.pacientesService.crearPaciente(this.form).subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarModal = false;
        this.cargarPacientes();
        this.cargarSugeridos();
      },
      error: (err) => {
        this.guardando = false;
        this.errorMessage = err.error?.message || 'Error al crear el paciente';
      }
    });
  }
}