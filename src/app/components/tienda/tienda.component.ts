
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavComponent } from '../nav/nav.component';
import { FooterComponent } from '../footer/footer.component';
import { TiendaService, Producto, CategoriaProducto } from '../../services/tienda.service';
import { environment } from '../../../environments/environment';
import { LoadingComponent } from '../loading/loading.component';
import { VerificacionService } from '../../services/verificacion.service';


interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}
const CARRITO_STORAGE_KEY = 'carrito_tienda';

@Component({
  selector: 'app-tienda',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavComponent, FooterComponent, LoadingComponent],
  templateUrl: './tienda.component.html',
  styleUrl: './tienda.component.css'
})
export class TiendaComponent implements OnInit {

  productos: Producto[] = [];
  categorias: CategoriaProducto[] = [];
  categoriaSeleccionada: string | null = null;
  carrito: ItemCarrito[] = [];
  cargandoProductos = true;

  mostrarCarrito = false;
  mostrarConfirmacionCancelar = false;
  mostrarConfirmacionVaciar = false;
  paso: 'carrito' | 'checkout' | 'verificacion' | 'confirmacion' = 'carrito';

  metodoEntrega: 'tienda' | 'domicilio' = 'tienda';
  metodoPago: 'transferencia' | 'efectivo' = 'transferencia';
  mensajeConfirmacion = '';

  form = {
    nombre: '',
    telefono: '',
    correo: '',
    direccionEnvio: ''
  };
  aceptaPrivacidad = false;

    nombreConsultorio = 'Consultorio LN Brenda Lagunas';
    direccionConsultorio = 'Calle Acapulco 11A, Colonia Morelos, Uruapan, Michoacán, CP 60050';

    get mapaLinkConsultorio(): string {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.direccionConsultorio)}`;
    }

  errorMessage = '';
  errorVerificacion = '';
  codigoIngresado = '';
  verificacionToken = '';
  enviandoCodigo = false;
  verificandoCodigo = false;
  cooldownReenvio = 0;
  private cooldownInterval: any;
  cargando = false;
  whatsappUrl = '';

  

  // ⚠️ Reemplaza estos datos por los reales de tu cuenta bancaria
  datosBancarios = {
    banco: 'BANAMEX',
    titular: 'LN Brenda Lagunas',
    cuenta: '5204 1674 0148 7392',
    clabe: '1639203524182912810'
  };

  private backendBase = environment.apiUrl.replace('/api', '');

  constructor(private tiendaService: TiendaService,
              private verificacionService: VerificacionService
            ) {}

            ngOnInit() {
              this.tiendaService.obtenerProductos().subscribe({
                next: (data) => {
                  this.productos = data;
                  this.cargandoProductos = false;
                  this.restaurarCarritoGuardado();
                },
                error: () => {
                  this.productos = [];
                  this.cargandoProductos = false;
                }
              });
            
              this.tiendaService.obtenerCategorias().subscribe({
                next: (data) => this.categorias = data,
                error: () => this.categorias = []
              });
            }
            
  private restaurarCarritoGuardado() {
    const guardado = localStorage.getItem(CARRITO_STORAGE_KEY);
    if (!guardado) return;
  
    try {
      const items: { productoId: string; cantidad: number }[] = JSON.parse(guardado);
  
      this.carrito = items
        .map(item => {
          const producto = this.productos.find(p => p._id === item.productoId);
          if (!producto || !producto.activo) return null;
  
          // Por si el stock bajó mientras no estabas: no restauramos más de lo disponible
          const cantidadAjustada = Math.min(item.cantidad, producto.stock);
          if (cantidadAjustada <= 0) return null;
  
          return { producto, cantidad: cantidadAjustada };
        })
        .filter((item): item is ItemCarrito => item !== null);
  
      this.guardarCarritoStorage();
    } catch {
      localStorage.removeItem(CARRITO_STORAGE_KEY);
    }
  }
  
  private guardarCarritoStorage() {
    const datosSimplificados = this.carrito.map(item => ({
      productoId: item.producto._id,
      cantidad: item.cantidad
    }));
    localStorage.setItem(CARRITO_STORAGE_KEY, JSON.stringify(datosSimplificados));
  }

  imagenUrl(producto: Producto): string {
    return producto.foto ? `${this.backendBase}${producto.foto}` : '';
  }

  get productosFiltrados(): Producto[] {
    if (!this.categoriaSeleccionada) return this.productos;
  
    return this.productos.filter(p => {
      const catId = typeof p.categoriaId === 'string' ? p.categoriaId : p.categoriaId?._id;
      return catId === this.categoriaSeleccionada;
    });
  }
  
  seleccionarCategoria(id: string | null) {
    this.categoriaSeleccionada = id;
  }
  
  nombreCategoria(p: Producto): string {
    if (!p.categoriaId) return '';
    return typeof p.categoriaId === 'string' ? '' : p.categoriaId.nombre;
  }

  agregarAlCarrito(producto: Producto) {
    const item = this.carrito.find(i => i.producto._id === producto._id);
  
    if (item) {
      if (item.cantidad < producto.stock) {
        item.cantidad++;
      }
    } else {
      this.carrito.push({ producto, cantidad: 1 });
    }
  
    this.guardarCarritoStorage();
    this.paso = 'carrito';
    this.mostrarCarrito = true;
  }

  cambiarCantidad(item: ItemCarrito, delta: number) {
    const nuevaCantidad = item.cantidad + delta;
  
    if (nuevaCantidad <= 0) {
      this.carrito = this.carrito.filter(i => i !== item);
      this.guardarCarritoStorage();
      return;
    }
  
    if (nuevaCantidad > item.producto.stock) return;
  
    item.cantidad = nuevaCantidad;
    this.guardarCarritoStorage();
  }

  confirmarVaciarCarrito() {
    this.mostrarConfirmacionVaciar = true;
  }
  
  vaciarCarrito() {
    this.carrito = [];
    this.guardarCarritoStorage();
    this.mostrarConfirmacionVaciar = false;
  }
  
  cancelarVaciarCarrito() {
    this.mostrarConfirmacionVaciar = false;
  }

  get totalCarrito(): number {
    return this.carrito.reduce((acc, i) => acc + (i.producto.precio * i.cantidad), 0);
  }

  get cantidadTotal(): number {
    return this.carrito.reduce((acc, i) => acc + i.cantidad, 0);
  }

  irACheckout() {
    if (this.carrito.length === 0) return;
    this.paso = 'checkout';
  }

  volverAlCarrito() {
    this.paso = 'carrito';
  }

  confirmarPedido() {
    if (!this.form.nombre.trim() || !this.form.telefono.trim() || !this.form.correo.trim()) {
      this.errorMessage = 'Por favor completa tu nombre, teléfono y correo';
      return;
    }
  
    if (this.metodoEntrega === 'domicilio' && !this.form.direccionEnvio.trim()) {
      this.errorMessage = 'Por favor ingresa la dirección de envío';
      return;
    }
    if (!this.aceptaPrivacidad) {
      this.errorMessage = 'Debes aceptar el Aviso de Privacidad para continuar';
      return;
    }
  
    this.errorMessage = '';
    this.enviandoCodigo = true;
  
    this.verificacionService.enviarCodigo(this.form.correo.trim(), 'pedido').subscribe({
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
  
    this.verificacionService.confirmarCodigo(this.form.correo.trim(), 'pedido', this.codigoIngresado.trim()).subscribe({
      next: (res) => {
        this.verificandoCodigo = false;
        this.verificacionToken = res.token;
        this.crearPedidoFinal();
      },
      error: (err) => {
        this.verificandoCodigo = false;
        this.errorVerificacion = err.error?.message || 'Código incorrecto';
      }
    });
  }
  
  iniciarPagoMercadoPago() {
    this.cargando = true;
  
    const payload = {
      nombreCliente: this.form.nombre.trim(),
      telefono: this.form.telefono.trim(),
      correo: this.form.correo.trim(),
      metodoEntrega: this.metodoEntrega === 'tienda' ? 'Recoger en tienda' : 'Envío a domicilio',
      direccionEnvio: this.metodoEntrega === 'domicilio' ? this.form.direccionEnvio.trim() : undefined,
      verificacionToken: this.verificacionToken,
      items: this.carrito.map(i => ({
        productoId: i.producto._id,
        cantidad: i.cantidad
      }))
    };
  }
  
  crearPedidoFinal() {
    this.cargando = true;
  
    const payload = {
      nombreCliente: this.form.nombre.trim(),
      telefono: this.form.telefono.trim(),
      correo: this.form.correo.trim(),
      metodoEntrega: this.metodoEntrega === 'tienda' ? 'Recoger en tienda' : 'Envío a domicilio',
      direccionEnvio: this.metodoEntrega === 'domicilio' ? this.form.direccionEnvio.trim() : undefined,
      metodoPago: this.metodoPago === 'transferencia' ? 'Transferencia' : 'Efectivo',
      verificacionToken: this.verificacionToken,
      items: this.carrito.map(i => ({
        productoId: i.producto._id,
        cantidad: i.cantidad
      }))
    };
  
    this.tiendaService.crearPedido(payload as any).subscribe({
      next: (res) => {
        this.whatsappUrl = res.whatsappUrl;
        this.paso = 'confirmacion';
        this.cargando = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Ocurrió un error al procesar tu pedido';
        this.cargando = false;
        this.paso = 'checkout';
      }
    });
  }
  
  reenviarCodigo() {
    if (this.cooldownReenvio > 0) return;
  
    this.enviandoCodigo = true;
  
    this.verificacionService.enviarCodigo(this.form.correo.trim(), 'pedido').subscribe({
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
  
  volverAlCheckout() {
    this.paso = 'checkout';
  }
  
  private iniciarCooldown() {
    this.cooldownReenvio = 30;
    clearInterval(this.cooldownInterval);
    this.cooldownInterval = setInterval(() => {
      this.cooldownReenvio--;
      if (this.cooldownReenvio <= 0) clearInterval(this.cooldownInterval);
    }, 1000);
  }

  finalizarCompra() {
    this.carrito = [];
    this.form = { nombre: '', telefono: '', correo: '', direccionEnvio: '' };
    this.aceptaPrivacidad = false;
    this.mostrarCarrito = false;
    this.paso = 'carrito';
    this.codigoIngresado = '';
    this.verificacionToken = '';
    clearInterval(this.cooldownInterval);
    this.cooldownReenvio = 0;
    localStorage.removeItem(CARRITO_STORAGE_KEY);
  
    this.tiendaService.obtenerProductos().subscribe({
      next: (data) => this.productos = data
    });
  }

  cerrarCarrito() {
    this.mostrarCarrito = false;
  }

  intentarCerrar() {
    // En el paso "carrito" no hay nada que perder: los productos ya agregados
    // se quedan guardados aunque cierres el panel.
    if (this.paso === 'carrito') {
      this.cerrarCarrito();
      return;
    }
  
    // Al confirmar el pedido, tampoco hay nada que perder al cerrar.
    if (this.paso === 'confirmacion') {
      this.finalizarCompra();
      return;
    }
  
    // En "checkout" el cliente ya escribió nombre, teléfono, etc. — confirmamos antes.
    this.mostrarConfirmacionCancelar = true;
  }
  
  confirmarCancelarCheckout() {
    this.mostrarConfirmacionCancelar = false;
    this.paso = 'carrito';
    this.form = { nombre: '', telefono: '', correo: '', direccionEnvio: '' };
    this.aceptaPrivacidad = false;
    this.errorMessage = '';
    this.errorVerificacion = '';
    this.codigoIngresado = '';
    clearInterval(this.cooldownInterval);
    this.cooldownReenvio = 0;
  }
  
  seguirEnCheckout() {
    this.mostrarConfirmacionCancelar = false;
  }
  
  seguirComprando() {
    this.cerrarCarrito();
  }
}