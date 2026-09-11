import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavComponent } from '../nav/nav.component';
import { FooterComponent } from '../footer/footer.component';
import { LoadingComponent } from '../loading/loading.component';
import { RecetasService, Receta, CategoriaReceta } from '../../services/recetas.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-recetas',
  standalone: true,
  imports: [CommonModule, NavComponent, FooterComponent, LoadingComponent],
  templateUrl: './recetas.component.html',
  styleUrl: './recetas.component.css'
})
export class RecetasComponent implements OnInit {

  recetas: Receta[] = [];
  categorias: CategoriaReceta[] = [];
  categoriaSeleccionada: string | null = null;
  cargando = true;

  recetaSeleccionada: Receta | null = null;
  mostrarModal = false;
  yaCalificoActual = false;
  puntuacionHover = 0;
  enviandoCalificacion = false;

  private backendBase = environment.apiUrl.replace('/api', '');

  constructor(private recetasService: RecetasService) {}

  ngOnInit() {
    this.recetasService.obtenerRecetas().subscribe({
      next: (data) => {
        this.recetas = data;
        this.cargando = false;
      },
      error: () => this.cargando = false
    });
  
    this.recetasService.obtenerCategorias().subscribe({
      next: (data) => this.categorias = data,
      error: () => this.categorias = []
    });
  }

  imagenUrl(r: Receta): string {
    return r.foto || '';
  }

  get recetasFiltradas(): Receta[] {
    if (!this.categoriaSeleccionada) return this.recetas;
  
    return this.recetas.filter(r => {
      const catId = typeof r.categoriaId === 'string' ? r.categoriaId : r.categoriaId?._id;
      return catId === this.categoriaSeleccionada;
    });
  }
  
  seleccionarCategoria(id: string | null) {
    this.categoriaSeleccionada = id;
  }
  
  nombreCategoria(r: Receta): string {
    if (!r.categoriaId) return '';
    return typeof r.categoriaId === 'string' ? '' : r.categoriaId.nombre;
  }

  promedio(r: Receta): number {
    if (!r.cantidadCalificaciones) return 0;
    return r.sumaCalificaciones / r.cantidadCalificaciones;
  }

  estrellasLlenas(r: Receta): number[] {
    return Array(Math.round(this.promedio(r))).fill(0);
  }

  estrellasVacias(r: Receta): number[] {
    return Array(5 - Math.round(this.promedio(r))).fill(0);
  }

  abrirDetalle(r: Receta) {
    this.recetaSeleccionada = r;
    this.mostrarModal = true;
    this.puntuacionHover = 0;
    this.yaCalificoActual = localStorage.getItem(`receta_calificada_${r._id}`) === 'true';
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.recetaSeleccionada = null;
  }

  calificar(puntuacion: number) {
    if (!this.recetaSeleccionada || this.yaCalificoActual || this.enviandoCalificacion) return;

    this.enviandoCalificacion = true;

    this.recetasService.calificar(this.recetaSeleccionada._id, puntuacion).subscribe({
      next: (recetaActualizada) => {
        this.enviandoCalificacion = false;
        this.yaCalificoActual = true;
        localStorage.setItem(`receta_calificada_${this.recetaSeleccionada!._id}`, 'true');

        // Actualizamos también la tarjeta en la lista, sin recargar todo
        const idx = this.recetas.findIndex(r => r._id === recetaActualizada._id);
        if (idx !== -1) this.recetas[idx] = recetaActualizada;
        this.recetaSeleccionada = recetaActualizada;
      },
      error: () => this.enviandoCalificacion = false
    });
  }
}