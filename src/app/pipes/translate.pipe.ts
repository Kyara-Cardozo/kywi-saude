import { Pipe, PipeTransform } from '@angular/core';
import { I18nService, Language } from '../services/i18n.service';

@Pipe({
    name: 'translate',
    standalone: true,
    pure: true
})
export class TranslatePipe implements PipeTransform {
    constructor(private i18n: I18nService) { }

    transform(key: string, lang: Language): string {
        return this.i18n.translate(key, lang);
    }
}