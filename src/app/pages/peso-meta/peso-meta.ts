import { Component, computed, ElementRef, OnInit, signal, ViewChild } from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { Supabase } from '../../services/supabase';
import { Chart, registerables } from 'chart.js';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-peso-meta',
  imports: [LucideAngularModule, TranslatePipe],
  templateUrl: './peso-meta.html',
  styleUrl: './peso-meta.scss',
})
export class PesoMeta implements OnInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  logs = signal<any[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);

  // Form inputs
  date = signal<string>(new Date().toISOString().substring(0, 10));
  weight = signal<number | null>(null);
  targetWeight = signal<number | null>(null);
  waist = signal<number | null>(null);
  hip = signal<number | null>(null);

  // Métricas mais recentes
  latestWeight = computed(() => {
    const list = this.logs();
    return list.length ? list[list.length - 1].weight : '--';
  });

  latestTarget = computed(() => {
    const list = this.logs();
    return list.length ? list[list.length - 1].target_weight || '--' : '--';
  });

  private chartInstance: Chart | null = null;

  constructor(
    public supabase: Supabase,
    public i18n: I18nService
  ) { }

  ngOnInit() {
    this.fetchLogs();
  }

  async fetchLogs() {
    this.isLoading.set(true);
    const { data, error } = await this.supabase.getWeightLogs();
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
      waist: this.waist() ? Number(this.waist()) : undefined,
      hip: this.hip() ? Number(this.hip()) : undefined
    };

    const { error } = await this.supabase.addWeightLog(newLog);
    this.isSaving.set(false);

    if (!error) {
      this.weight.set(null);
      this.waist.set(null);
      this.hip.set(null);
      this.fetchLogs();
    } else {
      alert('Erro ao salvar registro.');
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

    const weightData = this.logs().map(item => item.weight);
    const targetData = this.logs().map(item => item.target_weight);

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Peso Real (kg)',
            data: weightData,
            borderColor: '#4B75FF',
            backgroundColor: 'rgba(75, 117, 255, 0.15)',
            borderWidth: 3,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#C7F000',
            pointBorderColor: '#566700',
            pointRadius: 6,
            pointHoverRadius: 9
          },
          {
            label: 'Meta (kg)',
            data: targetData,
            borderColor: '#FF94DB',
            borderWidth: 25,
            borderDash: [6, 6],
            fill: false,
            tension: 0,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: { family: 'Inter', size: 12, weight: 'bold' },
              color: '#566700',
              usePointStyle: true
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(75, 117, 255, 0.08)' },
            ticks: { color: '#566700', font: { weight: 'bold' } }
          },
          y: {
            grid: { color: 'rgba(75, 117, 255, 0.08)' },
            ticks: { color: '#566700', font: { weight: 'bold' } }
          }
        }
      }
    });
  }
}
