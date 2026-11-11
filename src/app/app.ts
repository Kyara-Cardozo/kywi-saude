import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { I18nService, Language } from './services/i18n.service';
import { TranslatePipe } from './pipes/translate.pipe';
import { LucideAngularModule } from 'lucide-angular';
import { SupabaseService } from './services/supabase.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive,
    TranslatePipe, 
    LucideAngularModule,
    LucideAngularModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('kywi-saude');
  constructor(
    public i18n: I18nService,
    public supabase: SupabaseService,
  ) { }

  switchLang(lang: Language) {
    this.i18n.setLanguage(lang);
  }
}
