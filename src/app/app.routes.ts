import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { crmGuard } from './guards/crm-guard';
import { Diario } from './pages/diario/diario';
import { Gineco } from './pages/gineco/gineco';
import { PesoMeta } from './pages/peso-meta/peso-meta';
import { ValidarCrm } from './pages/validar-crm/validar-crm';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'peso-meta', component: PesoMeta },
  { path: 'diario', component: Diario },
  { path: 'gineco', component: Gineco, canActivate: [crmGuard] },
  { path: 'validar-crm', component: ValidarCrm},
  { path: '**', redirectTo: 'login' }
];