import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit{

  email = '';
  password = '';
  errorMessage = '';
  cargando = false;
  sesionExpirada = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    public theme: ThemeService
  ) {}

  ngOnInit() {
    this.sesionExpirada = this.route.snapshot.queryParamMap.get('sesionExpirada') === '1';
  }

  onLogin() {
    this.errorMessage = '';
    this.sesionExpirada = false;
    this.cargando = true;

    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.auth.guardarSesion(res.token, res.user);
        this.cargando = false;
        this.router.navigate(['/config']);
      },
      error: () => {
        this.errorMessage = 'Correo o contraseña incorrectos';
        this.cargando = false;
      }
    });
  }
}