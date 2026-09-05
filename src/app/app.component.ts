import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { WhatsappFlotanteComponent } from './components/whatsapp-flotante/whatsapp-flotante.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, WhatsappFlotanteComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  mostrarWhatsapp = true;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const ruta = event.urlAfterRedirects;
        this.mostrarWhatsapp = !ruta.startsWith('/config') && !ruta.startsWith('/login');
      });
  }
}