import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class Supabase {
    private supabase: SupabaseClient;

  // Controle de Sessão Simplificado
  private isOwnerUser = false;
  private isDoctorVerifiedUser = false;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  get client() {
    return this.supabase;
  }

  // --- Autenticação & Acessos ---
  async loginOwner(email: string, pass: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password: pass });
    if (!error && data.user) {
      this.isOwnerUser = true;
    }
    return { data, error };
  }

  setVisitorMode() {
    this.isOwnerUser = false;
    this.isDoctorVerifiedUser = false;
  }

  async verifyDoctorCRM(crm: string, pin: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('authorized_doctors')
      .select('*')
      .eq('crm', crm.trim())
      .eq('access_pin', pin.trim())
      .single();

    if (data && !error) {
      this.isDoctorVerifiedUser = true;
      return true;
    }
    return false;
  }

  isOwner(): boolean {
    return this.isOwnerUser;
  }

  isDoctorVerified(): boolean {
    return this.isDoctorVerifiedUser;
  }

  // --- Menu 1: Peso e Medidas ---
  async getWeightLogs() {
    return await this.supabase
      .from('weight_logs')
      .select('*')
      .order('date', { ascending: true });
  }

  async addWeightLog(log: {
    date: string;
    weight: number;
    target_weight?: number | null;
    waist?: number | null;
    hip?: number | null;
  }) {
    return await this.supabase.from('weight_logs').insert([log]);
  }

  // --- Menu 2: Diário e Fotos ---
  async getDailyLogs() {
    return await this.supabase
      .from('daily_logs')
      .select('*')
      .order('date', { ascending: false });
  }

  async uploadPlatePhoto(file: File): Promise<string | null> {
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await this.supabase.storage
      .from('pratos-diario')
      .upload(fileName, file);

    if (error) return null;

    const { data: publicUrl } = this.supabase.storage
      .from('pratos-diario')
      .getPublicUrl(fileName);

    return publicUrl.publicUrl;
  }

  async addDailyLog(log: { date: string; medication_name?: string; medication_taken?: boolean; photo_url?: string; notes?: string }) {
    return await this.supabase.from('daily_logs').insert([log]);
  }

  // --- Menu 3: Gineco (Mioma) ---
  async getGynoLogs() {
    return await this.supabase
      .from('gyno_logs')
      .select('*')
      .order('date', { ascending: false });
  }

  async addGynoLog(log: { date: string; fibroid_size_mm: number; fibroid_type: string; bleeding_intensity?: string; pain_level?: number; notes?: string }) {
    return await this.supabase.from('gyno_logs').insert([log]);
  }
  async getMedicationsByDate(date: string) {
  return await this.supabase
    .from('daily_medications')
    .select('*')
    .eq('date', date)
    .order('time', { ascending: true });
}

// Adicionar Medicamento
async addMedication(med: { date: string; name: string; dosage?: string; time: string; taken: boolean }) {
  return await this.supabase.from('daily_medications').insert([med]);
}

// Alternar Status (Tomado / Pendente)
async updateMedicationStatus(id: string, taken: boolean) {
  return await this.supabase.from('daily_medications').update({ taken }).eq('id', id);
}

// Excluir Medicamento
async deleteMedication(id: string) {
  return await this.supabase.from('daily_medications').delete().eq('id', id);
}

// Buscar Refeições por Data
async getMealsByDate(date: string) {
  return await this.supabase
    .from('daily_meals')
    .select('*')
    .eq('date', date)
    .order('time', { ascending: true });
}

// Upload da Foto do Prato para o Supabase Storage
async uploadMealPhoto(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `meals/${fileName}`;

  const { error: uploadError } = await this.supabase.storage
    .from('meal-photos')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = this.supabase.storage
    .from('meal-photos')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// Adicionar Refeição
async addMeal(meal: { date: string; meal_type: string; time: string; photo_url: string; notes?: string }) {
  return await this.supabase.from('daily_meals').insert([meal]);
}

// Excluir Refeição
async deleteMeal(id: string) {
  return await this.supabase.from('daily_meals').delete().eq('id', id);
}
}
