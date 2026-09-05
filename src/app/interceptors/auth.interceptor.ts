import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const authService = inject(AuthService);

  const clon = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(clon).pipe(
    catchError((error) => {
      // Si el backend rechaza el token (vencido o inválido) en un endpoint protegido,
      // cerramos la sesión automáticamente en vez de dejar al usuario colgado.
      if (error.status === 401 && token) {
        authService.cerrarPorSesionExpirada();
      }
      return throwError(() => error);
    })
  );
};