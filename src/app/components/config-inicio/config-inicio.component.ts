import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigInicioService } from '../../services/config-inicio.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-config-inicio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config-inicio.component.html',
  styleUrl: './config-inicio.component.css'
})
export class ConfigInicioComponent implements OnInit {

  form = {
    titulo: '',
    subtitulo: '',
    descripcion: ''
  };

  archivoImagen: File | null = null;
  previewImagen = '';

  guardando = false;
  mensajeExito = '';
  errorMessage = '';

  galeriaHero: string[] = [];
  archivosNuevos: File[] = [];
  previewsNuevos: string[] = [];
  subiendoGaleria = false;

  private backendBase = environment.apiUrl.replace('/api', '');

  constructor(private inicioService: ConfigInicioService) {}

  ngOnInit() {
    this.inicioService.obtener().subscribe({
      next: (data) => {
        this.form.titulo = data.titulo || '';
        this.form.subtitulo = data.subtitulo || '';
        this.form.descripcion = data.descripcion || '';
        this.previewImagen = data.imagen ? `${this.backendBase}${data.imagen}` : '';
        this.galeriaHero = data.galeriaHero || [];
      },
      error: () => {}
    });
  }

  onImagenSeleccionada(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.archivoImagen = input.files[0];
      this.previewImagen = URL.createObjectURL(this.archivoImagen);
    }
  }

  onImagenesGaleriaSeleccionadas(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
  
    this.archivosNuevos = Array.from(input.files);
    this.previewsNuevos = this.archivosNuevos.map(f => URL.createObjectURL(f));
  }
  
  subirGaleria() {
    if (!this.archivosNuevos.length) return;
  
    this.subiendoGaleria = true;
  
    this.inicioService.subirImagenesGaleria(this.archivosNuevos).subscribe({
      next: (config) => {
        this.galeriaHero = config.galeriaHero || [];
        this.archivosNuevos = [];
        this.previewsNuevos = [];
        this.subiendoGaleria = false;
      },
      error: () => {
        this.subiendoGaleria = false;
      }
    });
  }
  
  eliminarDeGaleria(url: string) {
    this.inicioService.eliminarImagenGaleria(url).subscribe({
      next: (config) => {
        this.galeriaHero = config.galeriaHero || [];
      }
    });
  }
  
  imagenGaleriaUrl(url: string): string {
    return `${this.backendBase}${url}`;
  }

  guardar() {
    if (!this.form.titulo.trim()) {
      this.errorMessage = 'El título no puede quedar vacío';
      return;
    }

    this.errorMessage = '';
    this.mensajeExito = '';
    this.guardando = true;

    const formData = new FormData();
    formData.append('titulo', this.form.titulo.trim());
    formData.append('subtitulo', this.form.subtitulo.trim());
    formData.append('descripcion', this.form.descripcion.trim());

    if (this.archivoImagen) {
      formData.append('imagen', this.archivoImagen);
    }

    this.inicioService.guardar(formData).subscribe({
      next: () => {
        this.guardando = false;
        this.mensajeExito = 'Los cambios se guardaron correctamente';
        this.archivoImagen = null;

        setTimeout(() => this.mensajeExito = '', 3000);
      },
      error: () => {
        this.guardando = false;
        this.errorMessage = 'Ocurrió un error al guardar los cambios';
      }
    });
  }
}