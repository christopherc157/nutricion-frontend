import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecomendadosService, RecomendadosConfig } from '../../services/recomendados.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-config-recomendados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config-recomendados.component.html',
  styleUrl: './config-recomendados.component.css'
})
export class ConfigRecomendadosComponent implements OnInit {

  form = {
    titulo: 'Productos Recomendados',
    descripcion: ''
  };

  archivoPdf: File | null = null;
  nombreArchivoActual = '';
  pdfUrlActual = '';
  fechaActualizacion = '';

  guardando = false;
  mensajeExito = '';
  errorMessage = '';

  private backendBase = environment.apiUrl.replace('/api', '');

  constructor(private recomendadosService: RecomendadosService) {}

  ngOnInit() {
    this.recomendadosService.obtener().subscribe({
      next: (data) => {
        this.form.titulo = data.titulo || 'Productos Recomendados';
        this.form.descripcion = data.descripcion || '';
        this.nombreArchivoActual = data.nombreArchivoOriginal || '';
        this.pdfUrlActual = data.archivoPdf || '';
        this.fechaActualizacion = data.actualizadoEn
          ? new Date(data.actualizadoEn).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
          : '';
      },
      error: () => {}
    });
  }

  onPdfSeleccionado(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const archivo = input.files[0];

      if (archivo.type !== 'application/pdf') {
        this.errorMessage = 'Solo se permiten archivos PDF';
        return;
      }

      this.archivoPdf = archivo;
      this.errorMessage = '';
    }
  }

  guardar() {
    this.errorMessage = '';
    this.mensajeExito = '';
    this.guardando = true;

    const formData = new FormData();
    formData.append('titulo', this.form.titulo.trim());
    formData.append('descripcion', this.form.descripcion.trim());

    if (this.archivoPdf) {
      formData.append('pdf', this.archivoPdf);
    }

    this.recomendadosService.guardar(formData).subscribe({
      next: (data) => {
        this.guardando = false;
        this.mensajeExito = 'Los cambios se guardaron correctamente';
        this.archivoPdf = null;
        this.nombreArchivoActual = data.nombreArchivoOriginal || this.nombreArchivoActual;
        this.pdfUrlActual = data.archivoPdf || this.pdfUrlActual;

        setTimeout(() => this.mensajeExito = '', 3000);
      },
      error: (err) => {
        this.guardando = false;
        this.errorMessage = err.error?.message || 'Ocurrió un error al guardar';
      }
    });
  }
}