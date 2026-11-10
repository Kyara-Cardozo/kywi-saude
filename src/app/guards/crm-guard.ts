import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Supabase } from '../services/supabase';

export const crmGuard: CanActivateFn = (route, state) => {
const supabase = inject(Supabase);
  const router = inject(Router);

  // Se for a dona logada ou a médica já autenticada pelo CRM, libera a página
  if (supabase.isOwner() || supabase.isDoctorVerified()) {
    return true;
  }

  // Caso contrário, manda para a tela de validação do CRM
  router.navigate(['/validar-crm']);
  return false;
};