import { ConfigDashboardComponent } from './components/config-dashboard/config-dashboard.component';
import { Routes } from '@angular/router';
import { InicioComponent } from './components/inicio/inicio.component';
import { AgendaComponent } from './components/agenda/agenda.component';
import { TiendaComponent } from './components/tienda/tienda.component';
import { LoginComponent } from './components/login/login.component';
import { ConfigComponent } from './components/config/config.component';
import { ConfigProductosComponent } from './components/config-productos/config-productos.component';
import { ConfigDisponibilidadComponent } from './components/config-disponibilidad/config-disponibilidad.component';
import { ConfigInicioComponent } from './components/config-inicio/config-inicio.component';
import { ConfigPedidosComponent } from './components/config-pedidos/config-pedidos.component';
import { ConfigCitasComponent } from './components/config-citas/config-citas.component';
import { authGuard } from './guards/auth.guard';
import { ConfigPacientesComponent } from './components/config-pacientes/config-pacientes.component';
import { ConfigPacienteDetalleComponent } from './components/config-paciente-detalle/config-paciente-detalle.component';
import { PrivacidadComponent } from './components/privacidad/privacidad.component';
import { RecetasComponent } from './components/recetas/recetas.component';
import { ConfigRecetasComponent } from './components/config-recetas/config-recetas.component';
import { ProductosRecomendadosComponent } from './components/productos-recomendados/productos-recomendados.component';
import { ConfigRecomendadosComponent } from './components/config-recomendados/config-recomendados.component';

export const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'agenda', component: AgendaComponent },
  { path: 'tienda', component: TiendaComponent },
  { path: 'privacidad', component: PrivacidadComponent },
  { path: 'login', component: LoginComponent },
  { path: 'recetas', component: RecetasComponent },
  { path: 'productos-recomendados', component: ProductosRecomendadosComponent },
  {
    path: 'config',
    component: ConfigComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: ConfigDashboardComponent },
      { path: 'productos', component: ConfigProductosComponent },
      { path: 'disponibilidad', component: ConfigDisponibilidadComponent },
      { path: 'inicio', component: ConfigInicioComponent },
      { path: 'pedidos', component: ConfigPedidosComponent },
      { path: 'citas', component: ConfigCitasComponent },
      { path: 'pacientes', component: ConfigPacientesComponent },
      { path: 'pacientes/:id', component: ConfigPacienteDetalleComponent },
      { path: 'recetas', component: ConfigRecetasComponent },
      { path: 'recomendados', component: ConfigRecomendadosComponent },
    ]
  },
  { path: '**', redirectTo: '' }
];