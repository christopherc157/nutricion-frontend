import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NavComponent } from '../nav/nav.component';
import { FooterComponent } from '../footer/footer.component';
import { InicioService, InicioConfig } from '../../services/inicio.service';
import { TiendaService, Producto } from '../../services/tienda.service';
import { environment } from '../../../environments/environment';
import { LoadingComponent } from '../loading/loading.component';

interface Servicio {
  icono: string;
  titulo: string;
  descripcion: string;
}

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterLink, NavComponent, FooterComponent, LoadingComponent],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit, OnDestroy {

  config: InicioConfig = {};
  imagenUrl = '';
  galeriaUrls: string[] = [];
  indiceActual = 0;
  private intervaloCarrusel: any;
  cargando = true;

  productosDestacados: Producto[] = [];

  servicios: Servicio[] = [
    {
      icono: 'fa-solid fa-apple-whole',
      titulo: 'Nutrición Integral',
      descripcion: 'Planes personalizados que se adaptan a tu estilo de vida, tus gustos y tus objetivos reales.'
    },
    {
      icono: 'fa-solid fa-heart-pulse',
      titulo: 'Salud Hormonal',
      descripcion: 'Acompañamiento enfocado en el equilibrio hormonal para que te sientas mejor por dentro y por fuera.'
    },
    {
      icono: 'fa-solid fa-person-running',
      titulo: 'Rendimiento Deportivo',
      descripcion: 'Estrategias de alimentación pensadas para mejorar tu energía, recuperación y desempeño físico.'
    },
    {
      icono: 'fa-solid fa-laptop',
      titulo: 'Asesoría Online',
      descripcion: 'Consultas a distancia, con el mismo seguimiento cercano que en una cita presencial.'
    }
  ];

  nombreConsultorio = 'Consultorio LN Brenda Lagunas';
  direccionCompleta = 'Calle Acapulco 11A, Colonia Morelos, Uruapan, Michoacán, CP 60050';
  mapaEmbedUrl: SafeResourceUrl;
  mapaLinkUrl = '';

  private backendBase = environment.apiUrl.replace('/api', '');

  constructor(
    private inicioService: InicioService,
    private tiendaService: TiendaService,
    private sanitizer: DomSanitizer
  ) {
    const direccionCodificada = encodeURIComponent(this.direccionCompleta);
    const urlSinSanitizar = `https://www.google.com/maps?q=${direccionCodificada}&output=embed`;

    this.mapaEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(urlSinSanitizar);
    this.mapaLinkUrl = `https://www.google.com/maps/search/?api=1&query=${direccionCodificada}`;
  }

  ngOnInit() {
    this.inicioService.obtenerConfig().subscribe({
      next: (data) => {
        this.config = data;
        this.imagenUrl = data.imagen ? `${this.backendBase}${data.imagen}` : '';
    
        this.galeriaUrls = (data.galeriaHero || []).map(img => `${this.backendBase}${img}`);
    
        if (this.galeriaUrls.length > 1) {
          this.iniciarCarrusel();
        }
    
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });

    this.tiendaService.obtenerProductos().subscribe({
      next: (data) => {
        const marcadosDestacados = data.filter(p => p.destacado);
        // Si todavía no marcaste ningún producto como destacado, mostramos los primeros 3
        // como respaldo, para que la sección nunca se vea vacía.
        this.productosDestacados = marcadosDestacados.length
          ? marcadosDestacados.slice(0, 4)
          : data.slice(0, 3);
      },
      error: () => this.productosDestacados = []
    });
  }

  imagenProducto(p: Producto): string {
    return p.foto ? `${this.backendBase}${p.foto}` : '';
  }

  private iniciarCarrusel() {
    clearInterval(this.intervaloCarrusel);
    this.intervaloCarrusel = setInterval(() => {
      this.indiceActual = (this.indiceActual + 1) % this.galeriaUrls.length;
    }, 5000);
  }
  
  irAImagen(i: number) {
    this.indiceActual = i;
    this.iniciarCarrusel(); // reinicia el conteo de 5 segundos al elegir manualmente
  }
  
  ngOnDestroy() {
    clearInterval(this.intervaloCarrusel);
  }
}