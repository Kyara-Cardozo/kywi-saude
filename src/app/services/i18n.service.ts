import { Injectable, signal } from '@angular/core';
import pt from '../../assets/i18n/pt.json';
import en from '../../assets/i18n/en.json';

export type Language = 'pt' | 'en';

@Injectable({
    providedIn: 'root'
})
export class I18nService {
    public currentLang = signal<Language>('pt');
    private dictionaries: Record<Language, any> = { pt, en };

    constructor() {
        const saved = localStorage.getItem('kywi_lang') as Language;
        if (saved === 'pt' || saved === 'en') {
            this.currentLang.set(saved);
        }
    }

    public setLanguage(lang: Language) {
        this.currentLang.set(lang);
        localStorage.setItem('kywi_lang', lang);
    }

    public translate(key: string, lang: Language): string {
        const dict = this.dictionaries[lang] || pt;
        const keys = key.split('.');
        let result: any = dict;

        for (const k of keys) {
            if (result && result[k] !== undefined) {
                result = result[k];
            } else {
                return key;
            }
        }
        return typeof result === 'string' ? result : key;
    }
}