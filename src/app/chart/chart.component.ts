import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

type Status = 'wait' | 'pending';
type RowItem = { status: Status; toNodeName?: string | null };

type LegendItem = { label: string; value: number; color: string };

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.css'
})
export class ChartComponent implements OnChanges {

  // รับมาจาก dashboard
  @Input() lamRows: RowItem[] = [];
  @Input() genRows: RowItem[] = [];
  @Input() staRows: RowItem[] = [];

  lamWaitData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [] }] };
  lamPendingData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [] }] };
  genWaitData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [] }] };
  genPendingData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [] }] };
  staWaitData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [] }] };
  staPendingData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [] }] };

  lamWaitLegend: LegendItem[] = [];
  lamPendingLegend: LegendItem[] = [];
  genWaitLegend: LegendItem[] = [];
  genPendingLegend: LegendItem[] = [];
  staWaitLegend: LegendItem[] = [];
  staPendingLegend: LegendItem[] = [];

  donutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: false,            // เราคุม size ด้วย CSS
    cutout: '70%',
    plugins: {
      legend: { display: false }, // ใช้ chip legend ของเราแทน (กันเบี้ยว)
      tooltip: {
        bodyFont: { size: 12, weight: 600 },
        titleFont: { size: 12, weight: 700 },
      }
    }
  };

  ngOnChanges(): void {
    this.buildAll();
  }

  private buildAll() {
    const lamWait = this.countByToNode(this.lamRows, 'wait');
    const lamPend = this.countByToNode(this.lamRows, 'pending');
    const genWait = this.countByToNode(this.genRows, 'wait');
    const genPend = this.countByToNode(this.genRows, 'pending');
    const staWait = this.countByToNode(this.staRows, 'wait');
    const staPend = this.countByToNode(this.staRows, 'pending');

    this.applyData(lamWait, (d,l)=>{ this.lamWaitData=d; this.lamWaitLegend=l; });
    this.applyData(lamPend, (d,l)=>{ this.lamPendingData=d; this.lamPendingLegend=l; });
    this.applyData(genWait, (d,l)=>{ this.genWaitData=d; this.genWaitLegend=l; });
    this.applyData(genPend, (d,l)=>{ this.genPendingData=d; this.genPendingLegend=l; });
    this.applyData(staWait, (d,l)=>{ this.staWaitData=d; this.staWaitLegend=l; });
    this.applyData(staPend, (d,l)=>{ this.staPendingData=d; this.staPendingLegend=l; });
  }

  private countByToNode(rows: RowItem[], status: Status): Map<string, number> {
    const map = new Map<string, number>();
    rows
      .filter(r => r.status === status)
      .forEach(r => {
        const key = (r.toNodeName || 'UNKNOWN').trim();
        map.set(key, (map.get(key) || 0) + 1);
      });
    return map;
  }

  private applyData(map: Map<string, number>, set: (data: ChartData<'doughnut'>, legend: LegendItem[]) => void) {
    // เอา top 6 เพื่อไม่ให้ legend ยาวเกิน (กันเบี้ยว)
    const arr = Array.from(map.entries())
      .sort((a,b) => b[1] - a[1])
      .slice(0, 6);

    const labels = arr.map(x => x[0]);
    const values = arr.map(x => x[1]);

    const colors = this.pickColors(labels.length);

    const data: ChartData<'doughnut'> = {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 1,
        hoverOffset: 4
      }]
    };

    const legend: LegendItem[] = labels.map((label, i) => ({
      label,
      value: values[i],
      color: colors[i]
    }));

    set(data, legend);
  }

  // palette แบบโปร ไม่ hardcode ต่อ nodeName แต่เป็นชุดสีหมุน
  private pickColors(n: number): string[] {
    const palette = [
      '#2563eb', '#16a34a', '#f97316', '#ef4444', '#a855f7',
      '#06b6d4', '#84cc16', '#f59e0b', '#0ea5e9', '#64748b'
    ];
    const out: string[] = [];
    for (let i = 0; i < n; i++) out.push(palette[i % palette.length]);
    return out;
  }
}
