import { Component, OnInit, ElementRef, ViewChild, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LucideAngularModule } from 'lucide-angular';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  Filler
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  Filler
);

@Component({
  selector: 'app-peso-meta',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './peso-meta.html',
  styleUrl: './peso-meta.scss',
})
export class PesoMeta implements OnInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  logs = signal<any[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);

  // Form Inputs
  date = signal<string>(new Date().toISOString().substring(0, 10));
  weight = signal<number | null>(null);
  height = signal<number>(1.65); // Altura padrão (m) para cálculo do IMC
  targetWeight = signal<number | null>(null);

  // Medidas Corporais (cm)
  waist = signal<number | null>(null);
  hip = signal<number | null>(null);
  bust = signal<number | null>(null);
  leftThigh = signal<number | null>(null);
  rightThigh = signal<number | null>(null);
  leftArm = signal<number | null>(null);
  rightArm = signal<number | null>(null);

  // Métricas de exibição no topo (restauradas)
  latestWeight = computed(() => {
    const list = this.logs();
    return list.length ? list[list.length - 1].weight : '--';
  });

  latestTarget = computed(() => {
    const list = this.logs();
    return list.length ? list[list.length - 1].target_weight || '--' : '--';
  });

  // IMC Calculado Dinamicamente
  calculatedImc = computed(() => {
    const w = this.weight();
    const h = this.height();
    if (!w || !h) return null;
    return Number((w / (h * h)).toFixed(1));
  });

  private chartInstance: Chart | null = null;

  constructor(
    public supabase: SupabaseService,
    public i18n: I18nService
  ) { }

  ngOnInit() {
    this.fetchLogs();
  }

  async fetchLogs() {
    this.isLoading.set(true);
    const { data } = await this.supabase.getWeightLogs();
    this.isLoading.set(false);

    if (data) {
      this.logs.set(data);
      setTimeout(() => this.renderChart(), 100);
    }
  }

  async onSave() {
    if (!this.supabase.isOwner()) {
      alert('Apenas a proprietária pode cadastrar novos valores.');
      return;
    }

    if (!this.weight() || !this.date()) {
      alert('Por favor, informe a data e o peso atual.');
      return;
    }

    this.isSaving.set(true);

    const newLog = {
      date: this.date(),
      weight: Number(this.weight()),
      target_weight: this.targetWeight() ? Number(this.targetWeight()) : undefined,
      imc: this.calculatedImc(),
      waist: this.waist() ? Number(this.waist()) : undefined,
      hip: this.hip() ? Number(this.hip()) : undefined,
      bust: this.bust() ? Number(this.bust()) : undefined,
      left_thigh: this.leftThigh() ? Number(this.leftThigh()) : undefined,
      right_thigh: this.rightThigh() ? Number(this.rightThigh()) : undefined,
      left_arm: this.leftArm() ? Number(this.leftArm()) : undefined,
      right_arm: this.rightArm() ? Number(this.rightArm()) : undefined
    };

    const { error } = await this.supabase.addWeightLog(newLog);
    this.isSaving.set(false);

    if (!error) {
      this.weight.set(null);
      this.waist.set(null);
      this.hip.set(null);
      this.bust.set(null);
      this.leftThigh.set(null);
      this.rightThigh.set(null);
      this.leftArm.set(null);
      this.rightArm.set(null);
      this.fetchLogs();
    } else {
      alert('Erro ao salvar registro: ' + error.message);
    }
  }

  renderChart() {
    if (!this.chartCanvas) return;
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const labels = this.logs().map(item => {
      const parts = item.date.split('-');
      return parts.length === 3 ? `${parts[2]}/${parts[1]}` : item.date;
    });

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Peso Real (kg)',
            data: this.logs().map(item => item.weight),
            borderColor: '#4B75FF',
            backgroundColor: 'rgba(75, 117, 255, 0.15)',
            borderWidth: 3,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#C7F000',
            pointBorderColor: '#566700',
            pointRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
  formatDate(dateStr: string): string {
  if (!dateStr) return '--';
  const cleanDate = dateStr.split('T')[0];
  const parts = cleanDate.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
}
}