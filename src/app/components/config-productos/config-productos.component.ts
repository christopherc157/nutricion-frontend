import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigProductosService, Producto, CategoriaProducto } from '../../services/config-productos.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-config-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config-productos.component.html',
  styleUrl: './config-productos.component.css'
})
export class ConfigProductosComponent implements OnInit {

  productos: Producto[] = [];
  categorias: CategoriaProducto[] = [];
  mostrarModalCategorias = false;
  nuevaCategoriaNombre = '';
  categoriaEditandoId: string | null = null;
  categoriaEditandoNombre = '';
  mostrarModal = false;
  editando = false;

  mostrarConfirmacion = false;
  productoAEliminar: Producto | null = null;

  form = {
    id: '',
    nombre: '',
    descripcion: '',
    categoriaId: '',
    precio: 0,
    stock: 0,
    activo: true,
    destacado: false
  };

  archivoFoto: File | null = null;
  previewFoto = '';
  errorMessage = '';
  guardando = false;

  private backendBase = environment.apiUrl.replace('/api', '');

  constructor(private productosService: ConfigProductosService) {}

  get cantidadTotal(): number {
    return this.productos.length;
  }

  ngOnInit() {
    this.cargar();
    this.cargarCategorias();
  }
  
  cargarCategorias() {
    this.productosService.obtenerCategorias().subscribe({
      next: (data) => this.categorias = data,
      error: () => this.categorias = []
    });
  }

  cargar() {
    this.productosService.obtenerTodos().subscribe({
      next: (data) => this.productos = data,
      error: () => this.productos = []
    });
  }

  imagenUrl(p: Producto): string {
    return p.foto || '';
  }

  nuevo() {
    this.editando = false;
    this.form = { id: '', nombre: '', descripcion: '', categoriaId: '', precio: 0, stock: 0, activo: true, destacado: false };
    this.archivoFoto = null;
    this.previewFoto = '';
    this.errorMessage = '';
    this.mostrarModal = true;
  }

  editar(p: Producto) {
    this.editando = true;
    this.form = {
      id: p._id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      categoriaId: typeof p.categoriaId === 'string' ? p.categoriaId : (p.categoriaId?._id || ''),
      precio: p.precio,
      stock: p.stock,
      activo: p.activo,
      destacado: p.destacado
    };
    this.archivoFoto = null;
    this.previewFoto = this.imagenUrl(p);
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
    if (!this.form.nombre.trim() || this.form.precio <= 0) {
      this.errorMessage = 'Completa al menos el nombre y un precio válido';
      return;
    }

    this.errorMessage = '';
    this.guardando = true;

    const formData = new FormData();
    formData.append('nombre', this.form.nombre.trim());
    formData.append('descripcion', this.form.descripcion.trim());
    formData.append('precio', this.form.precio.toString());
    formData.append('stock', this.form.stock.toString());
    formData.append('activo', this.form.activo.toString());
    formData.append('destacado', this.form.destacado.toString());
    formData.append('categoriaId', this.form.categoriaId || '');

    if (this.archivoFoto) {
      formData.append('foto', this.archivoFoto);
    }

    const peticion = this.editando
      ? this.productosService.editar(this.form.id, formData)
      : this.productosService.crear(formData);

    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarModal = false;
        this.cargar();
      },
      error: () => {
        this.guardando = false;
        this.errorMessage = 'Ocurrió un error al guardar el producto';
      }
    });
  }

  confirmarEliminar(p: Producto) {
    this.productoAEliminar = p;
    this.mostrarConfirmacion = true;
  }

  eliminarConfirmado() {
    if (!this.productoAEliminar) return;

    this.productosService.eliminar(this.productoAEliminar._id).subscribe({
      next: () => {
        this.mostrarConfirmacion = false;
        this.productoAEliminar = null;
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
  
    this.productosService.crearCategoria(this.nuevaCategoriaNombre.trim()).subscribe({
      next: () => {
        this.nuevaCategoriaNombre = '';
        this.cargarCategorias();
      }
    });
  }
  
  empezarEdicionCategoria(c: CategoriaProducto) {
    this.categoriaEditandoId = c._id;
    this.categoriaEditandoNombre = c.nombre;
  }
  
  guardarEdicionCategoria() {
    if (!this.categoriaEditandoId || !this.categoriaEditandoNombre.trim()) return;
  
    this.productosService.editarCategoria(this.categoriaEditandoId, this.categoriaEditandoNombre.trim()).subscribe({
      next: () => {
        this.categoriaEditandoId = null;
        this.cargarCategorias();
        this.cargar();
      }
    });
  }
  
  eliminarCategoria(c: CategoriaProducto) {
    if (!confirm(`¿Eliminar la categoría "${c.nombre}"? Los productos que la usan quedarán sin categoría.`)) return;
  
    this.productosService.eliminarCategoria(c._id).subscribe({
      next: () => {
        this.cargarCategorias();
        this.cargar();
      }
    });
  }
  
  nombreCategoriaDe(p: Producto): string {
    if (!p.categoriaId) return 'Sin categoría';
    return typeof p.categoriaId === 'string' ? 'Sin categoría' : p.categoriaId.nombre;
  }
}