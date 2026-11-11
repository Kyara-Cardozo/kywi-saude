import { Injectable, NgZone, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vzesjwasrnhobxqdwjxw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_d3CiVK6aXFVt402B_uG1Xg_2qgaHi02';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;

    // Signals reativos para controle de permissão
    isOwner = signal<boolean>(false);
    isDoctorVerified = signal<boolean>(false);
    currentUser = signal<User | null>(null);

    constructor(private ngZone: NgZone) {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        // Ouve atualizações de sessão (login, logout, refresh de página) dentro da zona do Angular
        this.supabase.auth.onAuthStateChange((_event, session) => {
            this.updateUserState(session?.user || null);
        });
    }

    get client() {
        return this.supabase;
    }

    // Método centralizado e reativo para atualizar o estado
    private updateUserState(user: User | null) {
        this.ngZone.run(() => {
            this.currentUser.set(user);
            this.isOwner.set(!!user);
        });
    }

    // Autenticação da Proprietária
    async loginOwner(email: string, pass: string) {
        const response = await this.supabase.auth.signInWithPassword({
            email,
            password: pass
        });

        if (response.data.user) {
            this.updateUserState(response.data.user);
        }

        return response;
    }

    // Modo Visitante
    setVisitorMode() {
        this.updateUserState(null);
        this.ngZone.run(() => {
            this.isDoctorVerified.set(false);
        });
    }

    async logout() {
        await this.supabase.auth.signOut();
        this.setVisitorMode();
    }

    async verifyDoctorCRM(crm: string, pin: string): Promise<boolean> {
        const { data, error } = await this.supabase
            .from('authorized_doctors')
            .select('*')
            .eq('crm', crm.trim())
            .eq('access_pin', pin.trim())
            .single();

        if (data && !error) {
            this.ngZone.run(() => this.isDoctorVerified.set(true));
            return true;
        }
        this.ngZone.run(() => this.isDoctorVerified.set(false));
        return false;
    }

    // --- MENU 1: PESO E METAS ---
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

    // --- MENU 2: DIÁRIO ---
    async getMedicationsByDate(date: string) {
        return await this.supabase
            .from('daily_medications')
            .select('*')
            .eq('date', date)
            .order('time', { ascending: true });
    }

    async addMedication(med: { date: string; name: string; dosage?: string; time: string; taken: boolean }) {
        return await this.supabase.from('daily_medications').insert([med]);
    }

    async updateMedicationStatus(id: string, taken: boolean) {
        return await this.supabase.from('daily_medications').update({ taken }).eq('id', id);
    }

    async deleteMedication(id: string) {
        return await this.supabase.from('daily_medications').delete().eq('id', id);
    }

    async getMealsByDate(date: string) {
        return await this.supabase
            .from('daily_meals')
            .select('*')
            .eq('date', date)
            .order('time', { ascending: true });
    }

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

    async addMeal(meal: { date: string; meal_type: string; time: string; photo_url: string; notes?: string }) {
        return await this.supabase.from('daily_meals').insert([meal]);
    }

    async deleteMeal(id: string) {
        return await this.supabase.from('daily_meals').delete().eq('id', id);
    }

    // --- MENU 3: GINECO ---
    async getGynoLogs() {
        return await this.supabase
            .from('gyno_logs')
            .select('*')
            .order('date', { ascending: false });
    }

    async addGynoLog(log: {
        date: string;
        fibroid_size_mm: number;
        fibroid_type: string;
        bleeding_intensity?: string;
        pain_level?: number;
        notes?: string
    }) {
        return await this.supabase.from('gyno_logs').insert([log]);
    }
}