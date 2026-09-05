import { Component } from '@angular/core';

@Component({
  selector: 'app-whatsapp-flotante',
  standalone: true,
  imports: [],
  templateUrl: './whatsapp-flotante.component.html',
  styleUrl: './whatsapp-flotante.component.css'
})
export class WhatsappFlotanteComponent {


  numero = '5214521030156';
  mensaje = 'Hola, tengo una duda sobre sus servicios';

  get whatsappUrl(): string {
    return `https://wa.me/${this.numero}?text=${encodeURIComponent(this.mensaje)}`;
  }
}