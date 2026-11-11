import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const crmGuard: CanActivateFn = (route, state) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  // Se for a dona logada ou a médica já autenticada pelo CRM, libera a página
  if (supabase.hasAccess()) {
    return true;
  }

  // Caso contrário, manda para a tela de validação do CRM
  router.navigate(['/login']);
  return false;

};