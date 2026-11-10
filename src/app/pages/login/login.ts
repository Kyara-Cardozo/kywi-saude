import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { I18nService } from '../../services/i18n.service';
import { Supabase } from '../../services/supabase';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LucideAngularModule, Lock, Eye, AlertCircle, Info } from 'lucide-angular';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    TranslatePipe,
    LucideAngularModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  activeTab = signal<'owner' | 'visitor'>('owner');
  email = signal('');
  password = signal('');
  errorMessage = signal('');
  isLoading = signal(false);

  constructor(
    private supabase: Supabase,
    private router: Router,
    public i18n: I18nService
  ) { }

  setTab(tab: 'owner' | 'visitor') {
    this.activeTab.set(tab);
    this.errorMessage.set('');
  }

  async onLoginOwner() {
    if (!this.email() || !this.password()) {
      this.errorMessage.set('Preencha e-mail e senha para acessar.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { data, error } = await this.supabase.loginOwner(this.email(), this.password());
    this.isLoading.set(false);

    if (error) {
      this.errorMessage.set(error.message || 'Erro ao realizar login.');
    } else if (data.user) {
      this.router.navigate(['/peso-meta']);
    }
  }

  onAccessAsVisitor() {
    this.supabase.setVisitorMode();
    this.router.navigate(['/peso-meta']);
  }
}