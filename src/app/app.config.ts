import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import {
  LucideAngularModule,
  Scale,
  BookOpen,
  Heart,
  LogIn,
  Lock,
  Eye,
  AlertCircle,
  Info,
  Target,
  TrendingUp,
  Plus,
  Calendar,
  Ruler,
  Trash2,
  Camera,
  CheckCircle2,
  Clock,
  Pill,
  Upload,
  Utensils
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(
      LucideAngularModule.pick({
        Scale, 
        BookOpen, 
        Heart, 
        LogIn, 
        Lock, 
        Eye, 
        AlertCircle, 
        Info,
        Target, 
        TrendingUp, 
        Plus, 
        Calendar, 
        Ruler, 
        Trash2,
        Pill, 
        Utensils,
        Camera, 
        Clock, 
        CheckCircle2, 
        Upload, 
      })
    )
  ]
};