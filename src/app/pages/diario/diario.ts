import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LucideAngularModule } from 'lucide-angular';
import { SupabaseService } from '../../services/supabase.service';

export interface Medication {
  id?: string;
  date?: string;
  name: string;
  dosage: string;
  time: string;
  taken: boolean;
}

export interface MealLog {
  id?: string;
  date?: string;
  meal_type: string;
  time: string;
  photo_url: string;
  notes?: string;
}

@Component({
  selector: 'app-diario',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LucideAngularModule],
  templateUrl: './diario.html',
  styleUrl: './diario.scss'
})
export class Diario implements OnInit {
  selectedDate = signal<string>(new Date().toISOString().substring(0, 10));
  isLoading = signal(false);
  isSavingMed = signal(false);
  isSavingMeal = signal(false);

  // Campos do Medicamento
  medName = signal('');
  medDosage = signal('');
  medTime = signal('08:00');

  // Campos da Refeição
  mealType = signal('Café da Manhã');
  mealTime = signal('08:30');
  mealNotes = signal('');
  selectedFile = signal<File | null>(null);
  mealPhotoPreview = signal<string | null>(null);

  // Listas reais (iniciam zeradas)
  medications = signal<Medication[]>([]);
  meals = signal<MealLog[]>([]);

  constructor(
    public supabase: SupabaseService,
    public i18n: I18nService
  ) {}

  ngOnInit() {
    this.fetchDailyData();
  }

  // Carrega medicamentos e refeições da data selecionada
  async fetchDailyData() {
    this.isLoading.set(true);
    const date = this.selectedDate();

    const [medsRes, mealsRes] = await Promise.all([
      this.supabase.getMedicationsByDate(date),
      this.supabase.getMealsByDate(date)
    ]);

    this.isLoading.set(false);

    if (medsRes.data) {
      this.medications.set(medsRes.data);
    }
    if (mealsRes.data) {
      this.meals.set(mealsRes.data);
    }
  }

  // Alternar o status de tomado / pendente
  async toggleMedication(med: Medication) {
    if (!this.supabase.isOwner() || !med.id) return;

    const newStatus = !med.taken;
    
    // Atualização otimista na tela
    this.medications.update(list =>
      list.map(m => m.id === med.id ? { ...m, taken: newStatus } : m)
    );

    const { error } = await this.supabase.updateMedicationStatus(med.id, newStatus);
    if (error) {
      this.fetchDailyData(); // Reverte em caso de erro no servidor
    }
  }

  // Cadastrar Medicamento
  async onAddMedication() {
    if (!this.supabase.isOwner()) return;
    if (!this.medName() || !this.medTime()) return;

    this.isSavingMed.set(true);
    const newMed = {
      date: this.selectedDate(),
      name: this.medName(),
      dosage: this.medDosage(),
      time: this.medTime(),
      taken: false
    };

    const { error } = await this.supabase.addMedication(newMed);
    this.isSavingMed.set(false);

    if (!error) {
      this.medName.set('');
      this.medDosage.set('');
      this.fetchDailyData();
    } else {
      alert('Erro ao salvar medicamento.');
    }
  }

  // Excluir Medicamento
  async deleteMedication(id?: string, event?: Event) {
    if (event) event.stopPropagation();
    if (!this.supabase.isOwner() || !id) return;

    const { error } = await this.supabase.deleteMedication(id);
    if (!error) {
      this.fetchDailyData();
    }
  }

  // Selecionar arquivo de imagem
  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile.set(file);
      const reader = new FileReader();
      reader.onload = () => {
        this.mealPhotoPreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  // Cadastrar Refeição com Upload de Imagem
  async onAddMeal() {
    if (!this.supabase.isOwner()) return;
    if (!this.selectedFile()) {
      alert('Por favor, escolha uma foto do prato.');
      return;
    }

    this.isSavingMeal.set(true);

    try {
      let photoUrl = '';
      try {
        photoUrl = await this.supabase.uploadMealPhoto(this.selectedFile()!);
      } catch (err) {
        // Fallback em Base64 caso o bucket ainda não tenha sido configurado
        photoUrl = this.mealPhotoPreview() || '';
      }

      const newMeal = {
        date: this.selectedDate(),
        meal_type: this.mealType(),
        time: this.mealTime(),
        photo_url: photoUrl,
        notes: this.mealNotes()
      };

      const { error } = await this.supabase.addMeal(newMeal);

      if (!error) {
        this.mealNotes.set('');
        this.mealPhotoPreview.set(null);
        this.selectedFile.set(null);
        this.fetchDailyData();
      } else {
        alert('Erro ao salvar refeição.');
      }
    } catch (err) {
      alert('Erro ao realizar upload da foto.');
    } finally {
      this.isSavingMeal.set(false);
    }
  }

  // Excluir Refeição
  async removeMeal(id?: string) {
    if (!this.supabase.isOwner() || !id) return;
    const { error } = await this.supabase.deleteMeal(id);
    if (!error) {
      this.fetchDailyData();
    }
  }
}