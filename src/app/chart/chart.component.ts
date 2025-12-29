import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';


import { Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(ChartDataLabels);


type Status = 'wait' | 'pending';

type callNodeRow = {
  id: number;
  code: string;
  sectionId: number;
  sectionName: string;
  groupId: number;
  groupName: string;
  subSectionId: number;
  subSectionName: string;
  isActive: number;
  state: string;
};

type RowItem = { status: Status; toNodeName?: string | null };
type LegendItem = { label: string; value: number; color: string };

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.css',
})
export class ChartComponent implements OnChanges {
  // รับมาจาก dashboard
  @Input() lamRows: RowItem[] = [];
  @Input() genRows: RowItem[] = [];
  @Input() staRows: RowItem[] = [];
  @Input() callNodeRows: callNodeRow[] = [];

  /** ✅ สีคงที่ตาม code */
  private nodeColorMap = new Map<string, string>();
  private lastNodeKey = '';


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
    responsive: false, // เราคุม size ด้วย CSS
    cutout: '38%',     // ลด % = หนาขึ้น
    plugins: {
      legend: { display: false },
      tooltip: {
        bodyFont: { size: 12, weight: 600 },
        titleFont: { size: 12, weight: 700 },
      },

          // ✅ เพิ่มตรงนี้
      datalabels: {
        color: '#fff',
        font: { size: 16, weight: 700 },
        anchor: 'center',
        align: 'center',
        clamp: true,

        // ซ่อนชิ้นเล็กๆ กันรก (ปรับได้)
        formatter: (value, ctx) => {
          const v = Number(value ?? 0);
          if (!v) return '';
        
          const raw = ctx.chart.data.datasets?.[0]?.data ?? [];
          const nums = raw.map(x => Number(x ?? 0));     // ✅ ทำให้เป็น number[] ชัดๆ
          const total = nums.reduce((s, n) => s + n, 0); // ✅ total เป็น number แน่นอน
        
          if (total > 0 && (v / total) < 0.02) return '';
          return String(v);
        },
        
      },


    },
  };

  ngOnChanges(): void {
      const key = (this.callNodeRows || [])
      .map(x => this.normCode(x.code))
      .filter(Boolean)
      .sort()
      .join('|');

    if (key !== this.lastNodeKey) {
      this.lastNodeKey = key;
      this.buildNodeColorMap();
    }

    this.buildAll();
  }


  isEmptyChart(data: ChartData<'doughnut'>, legend: LegendItem[]): boolean {
    const raw = (data?.datasets?.[0]?.data || []) as any[];
    const nums = raw.map(x => Number(x ?? 0));
    return nums.length === 0 || nums.every(v => v === 0) || (legend?.length ?? 0) === 0;
  }
  


  // -------------------------
  // Core
  // -------------------------

  private buildAll() {
    const lamWait = this.countByToNode(this.lamRows, 'wait');
    const lamPend = this.countByToNode(this.lamRows, 'pending');
    const genWait = this.countByToNode(this.genRows, 'wait');
    const genPend = this.countByToNode(this.genRows, 'pending');
    const staWait = this.countByToNode(this.staRows, 'wait');
    const staPend = this.countByToNode(this.staRows, 'pending');

    this.applyData(lamWait, (d, l) => { this.lamWaitData = d; this.lamWaitLegend = l; });
    this.applyData(lamPend, (d, l) => { this.lamPendingData = d; this.lamPendingLegend = l; });
    this.applyData(genWait, (d, l) => { this.genWaitData = d; this.genWaitLegend = l; });
    this.applyData(genPend, (d, l) => { this.genPendingData = d; this.genPendingLegend = l; });
    this.applyData(staWait, (d, l) => { this.staWaitData = d; this.staWaitLegend = l; });
    this.applyData(staPend, (d, l) => { this.staPendingData = d; this.staPendingLegend = l; });
  }

  private countByToNode(rows: RowItem[], status: Status): Map<string, number> {
    const map = new Map<string, number>();
    (rows || [])
      .filter(r => r.status === status)
      .forEach(r => {
        const key = this.normCode(r.toNodeName) || 'UNKNOWN';
        map.set(key, (map.get(key) || 0) + 1);
      });
    return map;
  }

  private applyData(
    map: Map<string, number>,
    set: (data: ChartData<'doughnut'>, legend: LegendItem[]) => void
  ) {
    // เอา top 6 เพื่อไม่ให้ legend ยาวเกิน (กันเบี้ยว)
    const arr = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const labels = arr.map(x => x[0]);
    const values = arr.map(x => x[1]);

    // ✅ ดึงสีจาก nodeColorMap ตาม code (ถ้าไม่เจอใช้ UNKNOWN)
    const colors = labels.map(code =>
      this.nodeColorMap.get(code) || this.nodeColorMap.get('UNKNOWN') || '#94a3b8'
    );

    const data: ChartData<'doughnut'> = {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderWidth: 1,
          hoverOffset: 4,
        },
      ],
    };

    const legend: LegendItem[] = labels.map((label, i) => ({
      label,
      value: values[i],
      color: colors[i],
    }));

    set(data, legend);
  }

  // -------------------------
  // Color Map
  // -------------------------

  private buildNodeColorMap() {
    const nodes = (this.callNodeRows || [])
      .map(x => this.normCode(x.code))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b)); // ✅ sort เพื่อให้สีคงที่

    const palette = this.generatePalette(nodes.length);

    this.nodeColorMap.clear();
    nodes.forEach((code, i) => {
      this.nodeColorMap.set(code, palette[i]);
    });

    // fallback
    if (!this.nodeColorMap.has('UNKNOWN')) {
      this.nodeColorMap.set('UNKNOWN', '#94a3b8'); // slate
    }
  }

  /** normalize ให้ toNodeName และ callNodeRows.code เทียบกันได้ */
  private normCode(v?: string | null): string {
    return (v || '').trim().toUpperCase();
  }

  /** สีไดนามิกตามจำนวน node (กระจาย hue รอบวง) */
  private generatePalette(n: number): string[] {
    const out: string[] = [];
    if (n <= 0) return out;

    const saturation = 72;
    const lightness = 48;

    for (let i = 0; i < n; i++) {
      const hue = Math.round((i * 360) / n);
      out.push(`hsl(${hue} ${saturation}% ${lightness}%)`);
    }
    return out;
  }
}
