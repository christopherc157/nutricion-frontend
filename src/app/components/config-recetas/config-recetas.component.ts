import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecetasService, Receta, CategoriaReceta } from '../../services/recetas.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-config-recetas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config-recetas.component.html',
  styleUrl: './config-recetas.component.css'
})
export class ConfigRecetasComponent implements OnInit {

  recetas: Receta[] = [];
  categorias: CategoriaReceta[] = [];

  mostrarModalCategorias = false;
  nuevaCategoriaNombre = '';
  categoriaEditandoId: string | null = null;
  categoriaEditandoNombre = '';

  mostrarModal = false;
  editando = false;
  guardando = false;
  errorMessage = '';

  mostrarConfirmacion = false;
  recetaAEliminar: Receta | null = null;

  form = {
    id: '',
    nombre: '',
    descripcion: '',
    categoriaId: '',
    tiempoPreparacion: '',
    porciones: '',
    activo: true
  };

  ingredientesTexto = '';
  pasosTexto = '';
  archivoFoto: File | null = null;
  previewFoto = '';

  private backendBase = environment.apiUrl.replace('/api', '');

  constructor(private recetasService: RecetasService) {}

  ngOnInit() {
    this.cargar();
    this.cargarCategorias();
  }
  
  cargarCategorias() {
    this.recetasService.obtenerCategorias().subscribe({
      next: (data) => this.categorias = data,
      error: () => this.categorias = []
    });
  }

  cargar() {
    this.recetasService.obtenerTodas().subscribe({
      next: (data) => this.recetas = data,
      error: () => this.recetas = []
    });
  }

  imagenUrl(r: Receta): string {
    return r.foto ? `${this.backendBase}${r.foto}` : '';
  }

  promedio(r: Receta): string {
    if (!r.cantidadCalificaciones) return 'Sin calificar';
    return (r.sumaCalificaciones / r.cantidadCalificaciones).toFixed(1) + ' / 5';
  }

  nuevo() {
    this.editando = false;
    this.form = { id: '', nombre: '', descripcion: '', categoriaId: '', tiempoPreparacion: '', porciones: '', activo: true };
    this.ingredientesTexto = '';
    this.pasosTexto = '';
    this.archivoFoto = null;
    this.previewFoto = '';
    this.errorMessage = '';
    this.mostrarModal = true;
  }

  editar(r: Receta) {
    this.editando = true;
    this.form = {
      id: r._id,
      nombre: r.nombre,
      descripcion: r.descripcion,
      categoriaId: typeof r.categoriaId === 'string' ? r.categoriaId : (r.categoriaId?._id || ''),
      tiempoPreparacion: r.tiempoPreparacion,
      porciones: r.porciones,
      activo: r.activo
    };
    this.ingredientesTexto = (r.ingredientes || []).join('\n');
    this.pasosTexto = (r.pasos || []).join('\n');
    this.archivoFoto = null;
    this.previewFoto = this.imagenUrl(r);
    this.errorMessage = '';
    this.mostrarModal = true;
  }

  onFotoSeleccionada(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.archivoFoto = input.files[0];
      this.previewFoto = URL.createObjectURL(this.archivoFoto);
    }
  }

  guardar() {
    if (!this.form.nombre.trim()) {
      this.errorMessage = 'El nombre es obligatorio';
      return;
    }

    this.errorMessage = '';
    this.guardando = true;

    const ingredientes = this.ingredientesTexto.split('\n').map(l => l.trim()).filter(l => l);
    const pasos = this.pasosTexto.split('\n').map(l => l.trim()).filter(l => l);

    const formData = new FormData();
    formData.append('nombre', this.form.nombre.trim());
    formData.append('descripcion', this.form.descripcion.trim());
    formData.append('categoriaId', this.form.categoriaId || '');
    formData.append('tiempoPreparacion', this.form.tiempoPreparacion.trim());
    formData.append('porciones', this.form.porciones.trim());
    formData.append('ingredientes', JSON.stringify(ingredientes));
    formData.append('pasos', JSON.stringify(pasos));
    formData.append('activo', this.form.activo.toString());

    if (this.archivoFoto) {
      formData.append('foto', this.archivoFoto);
    }

    const peticion = this.editando
      ? this.recetasService.editar(this.form.id, formData)
      : this.recetasService.crear(formData);

    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarModal = false;
        this.cargar();
      },
      error: () => {
        this.guardando = false;
        this.errorMessage = 'Ocurrió un error al guardar la receta';
      }
    });
  }

  confirmarEliminar(r: Receta) {
    this.recetaAEliminar = r;
    this.mostrarConfirmacion = true;
  }

  eliminarConfirmado() {
    if (!this.recetaAEliminar) return;

    this.recetasService.eliminar(this.recetaAEliminar._id).subscribe({
      next: () => {
        this.mostrarConfirmacion = false;
        this.recetaAEliminar = null;
        this.cargar();
      }
    });
  }

  abrirGestionCategorias() {
    this.mostrarModalCategorias = true;
    this.nuevaCategoriaNombre = '';
    this.categoriaEditandoId = null;
  }
  
  crearCategoria() {
    if (!this.nuevaCategoriaNombre.trim()) return;
  
    this.recetasService.crearCategoria(this.nuevaCategoriaNombre.trim()).subscribe({
      next: () => {
        this.nuevaCategoriaNombre = '';
        this.cargarCategorias();
      }
    });
  }
  
  empezarEdicionCategoria(c: CategoriaReceta) {
    this.categoriaEditandoId = c._id;
    this.categoriaEditandoNombre = c.nombre;
  }
  
  guardarEdicionCategoria() {
    if (!this.categoriaEditandoId || !this.categoriaEditandoNombre.trim()) return;
  
    this.recetasService.editarCategoria(this.categoriaEditandoId, this.categoriaEditandoNombre.trim()).subscribe({
      next: () => {
        this.categoriaEditandoId = null;
        this.cargarCategorias();
        this.cargar(); // por si alguna receta mostraba el nombre viejo
      }
    });
  }
  
  eliminarCategoria(c: CategoriaReceta) {
    if (!confirm(`¿Eliminar la categoría "${c.nombre}"? Las recetas que la usan quedarán sin categoría.`)) return;
  
    this.recetasService.eliminarCategoria(c._id).subscribe({
      next: () => {
        this.cargarCategorias();
        this.cargar();
      }
    });
  }
  
  nombreCategoriaDe(r: Receta): string {
    if (!r.categoriaId) return 'Sin categoría';
    return typeof r.categoriaId === 'string' ? 'Sin categoría' : r.categoriaId.nombre;
  }
}