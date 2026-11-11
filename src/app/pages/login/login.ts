import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { I18nService } from '../../services/i18n.service';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LucideAngularModule, Lock, Eye, AlertCircle, Info } from 'lucide-angular';
import { SupabaseService } from '../../services/supabase.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    TranslatePipe,
    LucideAngularModule,
    FormsModule
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
    private supabase: SupabaseService,
    private router: Router,
    public i18n: I18nService
  ) { }

  setTab(tab: 'owner' | 'visitor') {
    this.activeTab.set(tab);
    this.errorMessage.set('');
  }

  async onLoginOwner() {
    if (!this.email() || !this.password()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { data, error } = await this.supabase.loginOwner(this.email(), this.password());
    this.isLoading.set(false);

    if (error) {
      this.errorMessage.set('E-mail ou senha incorretos.');
    } else if (data.user) {
      // O Signal isOwner já foi atualizado para true reativamente!
      this.router.navigate(['/peso-meta']);
    }
  }

  onAccessAsVisitor() {
    this.supabase.setVisitorMode();
    this.router.navigate(['/peso-meta']);
  }

}