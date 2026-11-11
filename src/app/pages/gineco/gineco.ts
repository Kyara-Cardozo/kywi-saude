import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-gineco',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './gineco.html',
  styleUrl: './gineco.scss'
})
export class Gineco implements OnInit {
  logs = signal<any[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);

  // Controle do Modal de CRM
  showCrmModal = signal(false);
  crmInput = signal('');
  pinInput = signal('');
  crmError = signal('');
  isVerifying = signal(false);

  // Form Inputs
  date = signal<string>(new Date().toISOString().substring(0, 10));
  fibroidSize = signal<number | null>(null);
  fibroidType = signal<string>('Intramural');
  bleedingIntensity = signal<string>('Leve');
  painLevel = signal<number>(1);
  notes = signal<string>('');

  constructor(
    public supabase: SupabaseService,
    private router: Router,
    public i18n: I18nService
  ) {}

  ngOnInit() {
    this.verifyAccessPermissions();
  }

  verifyAccessPermissions() {
    // 1. Proprietária ou Médico já verificado nesta sessão -> Acesso Direto
    if (this.supabase.isOwner() || this.supabase.isDoctorVerified()) {
      this.showCrmModal.set(false);
      this.fetchGynoLogs();
    } 
    // 2. Visitante -> Abre Modal de Validação de CRM
    else if (this.supabase.isVisitor()) {
      this.showCrmModal.set(true);
      this.isLoading.set(false);
    } 
    // 3. Sem login/modo visitante -> Redireciona para o login
    else {
      this.router.navigate(['/login']);
    }
  }

  async onVerifyCrm() {
    if (!this.crmInput().trim() || !this.pinInput().trim()) {
      this.crmError.set('Informe o CRM e o PIN de acesso.');
      return;
    }

    this.isVerifying.set(true);
    this.crmError.set('');

    const isValid = await this.supabase.verifyDoctorCRM(
      this.crmInput().trim(),
      this.pinInput().trim()
    );

    this.isVerifying.set(false);

    if (isValid) {
      this.showCrmModal.set(false);
      this.fetchGynoLogs();
    } else {
      this.crmError.set('CRM ou PIN incorretos. Acesso negado.');
    }
  }

  onCancelCrmModal() {
    this.showCrmModal.set(false);
    // Redireciona para a página de Peso e Meta ao cancelar
    this.router.navigate(['/peso-meta']);
  }

  async fetchGynoLogs() {
    this.isLoading.set(true);
    const { data } = await this.supabase.getGynoLogs();
    this.isLoading.set(false);

    if (data) {
      this.logs.set(data);
    }
  }

  async onSaveGynoLog() {
    if (!this.supabase.isOwner()) {
      alert('Apenas a proprietária pode adicionar novos registros.');
      return;
    }

    if (!this.date() || !this.fibroidSize()) {
      alert('Por favor, informe a data e o tamanho do mioma.');
      return;
    }

    this.isSaving.set(true);

    const newLog = {
      date: this.date(),
      fibroid_size_mm: Number(this.fibroidSize()),
      fibroid_type: this.fibroidType(),
      bleeding_intensity: this.bleedingIntensity(),
      pain_level: Number(this.painLevel()),
      notes: this.notes() || undefined
    };

    const { error } = await this.supabase.addGynoLog(newLog);
    this.isSaving.set(false);

    if (!error) {
      this.fibroidSize.set(null);
      this.notes.set('');
      this.fetchGynoLogs();
    } else {
      alert('Erro ao salvar registro: ' + error.message);
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '--';
    const cleanDate = dateStr.split('T')[0];
    const parts = cleanDate.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
  }
}