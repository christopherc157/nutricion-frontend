import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavComponent } from '../nav/nav.component';
import { FooterComponent } from '../footer/footer.component';
import { LoadingComponent } from '../loading/loading.component';
import { RecomendadosService, RecomendadosConfig } from '../../services/recomendados.service';
import { environment } from '../../../environments/environment';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.js';

@Component({
  selector: 'app-productos-recomendados',
  standalone: true,
  imports: [CommonModule, NavComponent, FooterComponent, LoadingComponent],
  templateUrl: './productos-recomendados.component.html',
  styleUrl: './productos-recomendados.component.css'
})
export class ProductosRecomendadosComponent implements OnInit {

  config: RecomendadosConfig = {};
  pdfUrl = '';

  paginasImagenes: string[] = [];
  paginaActual = 0;

  cargando = true;
  procesandoPaginas = false;
  errorCarga = '';

  private backendBase = environment.apiUrl.replace('/api', '');

  constructor(private recomendadosService: RecomendadosService) {}

  ngOnInit() {
    this.recomendadosService.obtener().subscribe({
      next: (data) => {
        this.config = data;
        this.cargando = false;

        if (data.archivoPdf) {
          this.pdfUrl = `${this.backendBase}${data.archivoPdf}`;
          this.procesarPdf();
        }
      },
      error: () => this.cargando = false
    });
  }

  private async procesarPdf() {
    this.procesandoPaginas = true;
    this.errorCarga = '';

    try {
      const documento = await pdfjsLib.getDocument(this.pdfUrl).promise;
      const imagenes: string[] = [];

      for (let numeroPagina = 1; numeroPagina <= documento.numPages; numeroPagina++) {
        const pagina = await documento.getPage(numeroPagina);
        const viewport = pagina.getViewport({ scale: 2 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const contexto = canvas.getContext('2d')!;

        await pagina.render({ canvasContext: contexto, viewport }).promise;
        imagenes.push(canvas.toDataURL('image/jpeg', 0.92));
      }

      this.paginasImagenes = imagenes;
      this.paginaActual = 0;
    } catch (error) {
      console.error(error);
      this.errorCarga = 'No se pudo procesar el documento. Intenta descargarlo directamente.';
    } finally {
      this.procesandoPaginas = false;
    }
  }

  irAPagina(i: number) {
    this.paginaActual = i;
  }

  paginaAnterior() {
    if (this.paginaActual > 0) this.paginaActual--;
  }

  paginaSiguiente() {
    if (this.paginaActual < this.paginasImagenes.length - 1) this.paginaActual++;
  }
}