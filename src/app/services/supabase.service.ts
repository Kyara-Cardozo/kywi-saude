import { computed, Injectable, NgZone, signal } from '@angular/core';
import { Router } from '@angular/router';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { async } from 'rxjs';

const SUPABASE_URL = 'https://vzesjwasrnhobxqdwjxw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_d3CiVK6aXFVt402B_uG1Xg_2qgaHi02';

export interface WeightLogPayload {
    date: string;
    weight: number;
    target_weight?: number | null;
    imc?: number | null;
    waist?: number | null;
    hip?: number | null;
    bust?: number | null;
    left_thigh?: number | null;
    right_thigh?: number | null;
    left_arm?: number | null;
    right_arm?: number | null;
}

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;

    // Signals reativos para controle de permissão
    isOwner = signal<boolean>(false);
    isVisitor = signal<boolean>(false);
    isDoctorVerified = signal<boolean>(false);
    currentUser = signal<User | null>(null);
    hasAccess = computed(() => this.isOwner() || this.isVisitor());


    constructor(
        private ngZone: NgZone,
        private router: Router
    ) {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        // Monitora a sessão do Supabase
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
            if (user) {
                this.isVisitor.set(false);
            }
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
        this.ngZone.run(() => {
            this.isOwner.set(false);
            this.isVisitor.set(true);
            this.isDoctorVerified.set(false);
            this.currentUser.set(null);
        });
    }

    async logout() {
        await this.supabase.auth.signOut();
        this.ngZone.run(() => {
            this.isOwner.set(false);
            this.isVisitor.set(false);
            this.isDoctorVerified.set(false);
            this.currentUser.set(null);
            this.router.navigate(['/login']);
        });
    }

    // Em src/app/services/supabase.service.ts
    async verifyDoctorCRM(crm: string, pin: string): Promise<boolean> {
        try {
            const { data, error } = await this.supabase
                .from('authorized_doctors')
                .select('*')
                .ilike('crm', crm.trim()) // ilike ignora maiúsculas/minúsculas (ex: "367056-ba" funciona como "367056-BA")
                .eq('access_pin', pin.trim())
                .maybeSingle();

            if (data && !error) {
                this.ngZone.run(() => this.isDoctorVerified.set(true));
                return true;
            }
        } catch (err) {
            console.error('Erro na verificação do CRM:', err);
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

    async addWeightLog(log: any) {
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