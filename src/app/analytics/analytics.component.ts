import { Component, NgModule, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import config from '../../config';

Chart.register(ChartDataLabels);

/* ---------------- types ---------------- */

type inchargeUser = {
  date: string;
};

type reportRow = {
  createAt: string;
  fromNodeName: string;
  toNodeName: string;
  pendingUser?: inchargeUser | null;
  userIncharge?: inchargeUser | null;
};

type callNodeRow = {
  id: number;
  code: string;
  groupId: number;
};

type ExportRow = {
  createAt: string;
  callFrom: string;
  callTo: string;
  callFromGroupId: number | null;
  callToGroupId: number | null;
  totalTime: string;
  waitTime: string;
  workTime: string;
};

type AvgItem = {
  label: string;
  avgTotal: number;
  avgWait: number;
  avgWork: number;
};


type MatrixCell = {
  from: string;
  to: string;
  avgTotalMin: number | null; // null = no data
};

type MatrixRowView = {
  from: string;
  cells: (number | null)[];
};

type MatrixView = {
  cols: string[];        // callTo labels
  rows: MatrixRowView[]; // each callFrom row
  max: number;           // for heat intensity
};



type LineType = 'ALL' | 'LAM' | 'GEN' | 'STA';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, BaseChartDirective,FormsModule],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css'
})
export class AnalyticsComponent {

  isLoading = false;

  /** raw */
  reportRows: reportRow[] = [];
  callNodeRows: callNodeRow[] = [];

  /** mapped */
  exportRows: ExportRow[] = [];
  filteredRows: ExportRow[] = [];

  /** dropdown */
  selectedLine: LineType = 'ALL';

  /** chart */
  avgFromData: ChartData<'bar'> = { labels: [], datasets: [] };
  avgToData: ChartData<'bar'> = { labels: [], datasets: [] };

  startDate: string = ''; // yyyy-MM-dd
  endDate: string = '';   // yyyy-MM-dd


  matrix: MatrixView = { cols: [], rows: [], max: 0 };

  showDescFrom = false;
  showDescTo = false;



  chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false, // ✅ ให้คุมความสูงด้วย div ได้
    layout: { padding: { top: 28, right: 18, left: 10, bottom: 0 } },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 14,
          boxHeight: 14,
          usePointStyle: true,
          pointStyle: 'rectRounded',
          padding: 14,
          filter: (item) => item.text !== '__total__'
        }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = Number(ctx.parsed?.y ?? 0);
            return `${ctx.dataset.label}: ${this.formatMinShort(v)}`;
          }
        }
      },
      datalabels: {
        clamp: true,
        // ✅ ซ่อน label ที่เล็กมาก กันรก
        formatter: (value: any, ctx) => {
          const v = Number(value ?? 0);
          if (!v) return '';
          // ซ่อนชิ้นเล็กกว่า 2% ของแท่ง
          const ds0 = (ctx.chart.data.datasets?.[0]?.data || []) as any[];
          const ds1 = (ctx.chart.data.datasets?.[1]?.data || []) as any[];
          const i = ctx.dataIndex;
          const total = Number(ds0[i] ?? 0) + Number(ds1[i] ?? 0);
          if (total > 0 && (v / total) < 0.06) return '';
          return this.formatMinShort(v);
        },
        font: { weight: 700, size: 11 },
        anchor: 'center',
        align: 'center',
        color: '#111'
      }
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          maxRotation: 0,
          minRotation: 0,
          autoSkip: true,
          padding: 8,
          font: { size: 11, weight: 600 }
        },
        grid: { display: false }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: (v) => this.formatMinAxis(Number(v)),
          font: { size: 11 }
        },
        grid: {
          color: 'rgba(15, 23, 42, 0.08)' // slate-900 แบบจาง
        }
      }
    }
  };
  
  

  /** nodeCode -> groupId */
  private nodeGroupMap = new Map<string, number>();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.setDefaultDateRangeYesterdayToday(); // ✅ default เมื่อวาน-วันนี้
    this.fetchAll();
  }

  /* ================= fetch ================= */

  private fetchAll() {
    this.isLoading = true;

    Promise.all([
      this.http.get<any>(config.apiServer + '/api/report/list').toPromise(),
      this.http.get<any>(config.apiServer + '/api/callnode/list').toPromise()
    ])
    .then(([reportRes, callNodeRes]) => {
      this.reportRows = reportRes?.results || [];
      this.callNodeRows = callNodeRes?.results || [];

      this.buildNodeGroupMap();
      this.exportRows = this.reportRows.map(r => this.mapToExportRow(r));

      this.applyLineFilter();
      this.isLoading = false;
    })
    .catch(err => {
      console.error(err);
      this.isLoading = false;
    });
  }

  /* ================= filter ================= */

  onLineChange() {
    this.applyLineFilter();
  }

  private applyLineFilter() {
    const gid = this.getGroupIdByLine(this.selectedLine);

    // ✅ 1) filter ตาม line ก่อน
    let rows = gid
      ? this.exportRows.filter(r => r.callFromGroupId === gid && r.callToGroupId === gid)
      : [...this.exportRows];

    // ✅ 2) filter ตาม date range (ใช้ createAt ของ reportRows → ต้องส่งมาใน ExportRow ด้วย)
    rows = this.applyDateFilter(rows);

    this.filteredRows = rows;

    this.buildInsightFromRows(this.filteredRows);

    this.buildCharts();
  }

  private getGroupIdByLine(line: LineType): number | null {
    if (line === 'LAM') return 3;
    if (line === 'GEN') return 2;
    if (line === 'STA') return 4;
    return null;
  }

  /* ================= chart ================= */

  private buildCharts() {
    const byFrom = this.groupAverage(this.filteredRows, 'callFrom');
    const byTo   = this.groupAverage(this.filteredRows, 'callTo');

    this.avgFromData = this.buildStackedData(byFrom);
    this.avgToData   = this.buildStackedData(byTo);
    // ✅ สร้าง matrix จาก filteredRows
  this.matrix = this.buildMatrix(this.filteredRows);
  }

  private buildStackedData(items: AvgItem[]): ChartData<'bar'> {
    // ✅ เอาแค่ top 8 เพื่อให้สวยและอ่านง่าย
    const top = items.slice(0, 8);
  
    const labels = top.map(x => x.label);
    const wait = top.map(x => x.avgWait);
    const work = top.map(x => x.avgWork);
    const total = top.map(x => +(x.avgWait + x.avgWork).toFixed(2));
  
    return {
      labels,
      datasets: [
        // work อยู่ล่าง
        {
          label: 'work time',
          data: work,
          stack: 'time', 
          backgroundColor: '#ef4444', // แดงนุ่ม
          borderRadius: 10,
          borderSkipped: false,

            // ✅ อ้วนขึ้น
          barThickness: 70,
          categoryPercentage: 0.9,
          barPercentage: 0.95,
          datalabels: { color: '#111' }
        },
        // wait อยู่บน
        {
          label: 'wait time',
          data: wait,
          stack: 'time', 
          backgroundColor: '#fde047', // เหลืองนุ่ม
          borderRadius: 10,
          borderSkipped: false,

          barThickness: 70,
          categoryPercentage: 0.9,
          barPercentage: 0.95,
          datalabels: { color: '#111' }
        },
        // total label ด้านบน
        {
          label: '__total__',
          data: total,
          backgroundColor: 'rgba(0,0,0,0)',
          borderWidth: 0,
          stack: 'time',          // ✅ สำคัญ: ให้ผูกกับ stack เดียวกัน
          datalabels: {
            formatter: (value: any) => {
              const v = Number(value ?? 0);
              if (!v) return '';
              return this.formatMinShort(v);
            },
            anchor: 'end',        // ✅ เกาะ “ปลายแท่ง”
            align: 'end',         // ✅ วางตรงหัวแท่ง
            offset: 1,            // ✅ ชิดหัวแท่ง (ปรับ 0-3 ได้)
            clamp: true,
            color: '#0f172a',
            font: { weight: 800, size: 11 }
          }
        }
      ]
    };
  }
  
  

  private groupAverage(rows: ExportRow[], key: 'callFrom' | 'callTo'): AvgItem[] {
    const map = new Map<string, { total: number[]; wait: number[]; work: number[] }>();

    rows.forEach(r => {
      const k = r[key] || 'UNKNOWN';
      if (!map.has(k)) {
        map.set(k, { total: [], wait: [], work: [] });
      }
      const b = map.get(k)!;
      b.total.push(this.hhmmssToMin(r.totalTime));
      b.wait.push(this.hhmmssToMin(r.waitTime));
      b.work.push(this.hhmmssToMin(r.workTime));
    });

    return Array.from(map.entries())
      .map(([label, v]) => ({
        label,
        avgTotal: this.avg(v.total),
        avgWait:  this.avg(v.wait),
        avgWork:  this.avg(v.work),
      }))
      .sort((a, b) => b.avgTotal - a.avgTotal);
  }

  private avg(xs: number[]): number {
    const a = xs.filter(Number.isFinite);
    if (!a.length) return 0;
    return Math.round((a.reduce((s, v) => s + v, 0) / a.length) * 100) / 100;
  }

  /* ================= mapping ================= */

  private buildNodeGroupMap() {
    this.nodeGroupMap.clear();
    (this.callNodeRows || []).forEach(n => {
      if (n.code) {
        this.nodeGroupMap.set(this.norm(n.code), n.groupId);
      }
    });
  }

  private mapToExportRow(r: reportRow): ExportRow {
    const fromCode = this.norm(r.fromNodeName);
    const toCode   = this.norm(r.toNodeName);

    return {
      createAt: r.createAt,
      callFrom: r.fromNodeName || 'UNKNOWN',
      callTo: r.toNodeName || 'UNKNOWN',
      callFromGroupId: this.nodeGroupMap.get(fromCode) ?? null,
      callToGroupId: this.nodeGroupMap.get(toCode) ?? null,
      totalTime: this.diffHHmmss(r.createAt, r.userIncharge?.date),
      waitTime: this.diffHHmmss(r.createAt, r.pendingUser?.date),
      workTime: this.diffHHmmss(r.pendingUser?.date, r.userIncharge?.date),
    };
  }

  /* ================= utils ================= */

  private norm(v?: string | null): string {
    return (v || '').trim().toUpperCase();
  }

  private diffHHmmss(from?: string | null, to?: string | null): string {
    if (!from || !to) return '-';
    const a = new Date(from).getTime();
    const b = new Date(to).getTime();
    if (isNaN(a) || isNaN(b) || b < a) return '-';

    const s = Math.floor((b - a) / 1000);
    return `${String(Math.floor(s / 3600)).padStart(2,'0')}:` +
           `${String(Math.floor((s % 3600) / 60)).padStart(2,'0')}:` +
           `${String(s % 60).padStart(2,'0')}`;
  }

  private hhmmssToMin(v: string): number {
    if (!v || v === '-') return NaN;
    const p = v.split(':').map(Number);
    if (p.length !== 3 || p.some(isNaN)) return NaN;
    return Math.round(((p[0]*3600 + p[1]*60 + p[2]) / 60) * 100) / 100;
  }


  private formatMinAxis(v: number): string {
      if (!Number.isFinite(v)) return '';
      if (v < 60) return `${Math.round(v)}m`;

      const h = Math.floor(v / 60);
      const m = Math.round(v % 60);

      // ให้ label แกน Y สั้นๆ
      if (m === 0) return `${h}h`;
      return `${h}h${m}m`;
  }
  
  private formatMin(v: number): string {
    if (!Number.isFinite(v)) return '-';
    if (v >= 60) {
      const h = Math.floor(v / 60);
      const m = Math.round(v % 60);
      return `${h} hr ${m} min`;
    }
    return `${v.toFixed(2)} min`;
  }
  
  formatMinShort(v: number): string {
      if (!Number.isFinite(v) || v <= 0) return '';
    if (v < 60) return `${Math.round(v)} min`;

    const h = Math.floor(v / 60);
    const m = Math.round(v % 60);
    return `${h} hr ${m} min`;
  }


  private toYMDLocal(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private setDefaultDateRangeYesterdayToday() {
    const today = new Date();
    const ytd = new Date();
    ytd.setDate(today.getDate() - 1);

    this.startDate = this.toYMDLocal(ytd);
    this.endDate = this.toYMDLocal(today);
  }

  
  private applyDateFilter(rows: ExportRow[]): ExportRow[] {
    if (!this.startDate && !this.endDate) return rows;

    const s = this.startDate ? new Date(this.startDate + 'T00:00:00').getTime() : null;
    const e = this.endDate ? new Date(this.endDate + 'T23:59:59').getTime() : null;

    return rows.filter(r => {
      const t = new Date(r.createAt).getTime();
      if (isNaN(t)) return false;
      if (s != null && t < s) return false;
      if (e != null && t > e) return false;
      return true;
    });
  }


  applyDateRange() {
    // validate
    if (this.startDate && this.endDate) {
      const s = new Date(this.startDate + 'T00:00:00');
      const e = new Date(this.endDate + 'T23:59:59');
      if (s > e) {
        alert('Start date must be before End date');
        return;
      }
    }
    this.applyLineFilter();
  }

  resetFilters() {
    this.setDefaultDateRangeYesterdayToday();
    this.selectedLine = 'ALL';
    this.applyLineFilter();
  }

  // ✅ ความกว้างกราฟตามจำนวนแท่ง (px)
getChartWidth(labels: any[] | undefined | null): string {
  const n = (labels?.length ?? 0);
  // 1 แท่ง ~ 120px (ปรับได้)
  const w = Math.max(900, n * 140);
  return `${w}px`;
}


private buildMatrix(rows: ExportRow[]): MatrixView {
  // 1) หา labels
  const fromSet = new Set<string>();
  const toSet = new Set<string>();

  // 2) เก็บ list ของ total(min) ต่อ pair
  const map = new Map<string, number[]>(); // key = from|||to

  for (const r of rows) {
    const from = (r.callFrom || 'UNKNOWN').trim();
    const to = (r.callTo || 'UNKNOWN').trim();

    const totalMin = this.hhmmssToMin(r.totalTime);
    if (!Number.isFinite(totalMin)) continue;

    fromSet.add(from);
    toSet.add(to);

    const key = `${from}|||${to}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(totalMin);
  }

  const froms = Array.from(fromSet).sort((a, b) => a.localeCompare(b));
  const tos = Array.from(toSet).sort((a, b) => a.localeCompare(b));

  // ถ้าไม่มีข้อมูล
  if (!froms.length || !tos.length) {
    return { cols: [], rows: [], max: 0 };
  }

  // 3) สร้าง row view
  let max = 0;
  const rowViews: MatrixRowView[] = froms.map((from) => {
    const cells = tos.map((to) => {
      const key = `${from}|||${to}`;
      const arr = map.get(key);
      if (!arr || !arr.length) return null;
      const avg = this.avg(arr);
      if (avg > max) max = avg;
      return avg;
    });
    return { from, cells };
  });

  return { cols: tos, rows: rowViews, max };
}


formatCellMin(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return '-';
  // ใช้รูปแบบเดียวกับกราฟ
  return this.formatMinShort(v);
}


cellStyle(v: number | null): any {
  if (v == null || !Number.isFinite(v) || this.matrix.max <= 0) return {};
  const ratio = Math.min(1, Math.max(0, v / this.matrix.max)); // 0..1
  // สีเหลืองสุภาพเข้ากับ wait time แต่จาง ๆ
  const alpha = 0.08 + ratio * 0.22; // 0.08..0.30
  return { backgroundColor: `rgba(253, 224, 71, ${alpha})` };
}


insight = {
  avgWaitMin: 0,
  avgWorkMin: 0,
  avgTotalMin: 0,
  waitPct: 0,
  workPct: 0
};

// เรียกหลังจาก filter เสร็จแล้ว (filteredRows เปลี่ยน)
private buildInsightFromRows(rows: ExportRow[]) {
  const waits: number[] = [];
  const works: number[] = [];
  const totals: number[] = [];

  for (const r of rows) {
    const w = this.hhmmssToMin(r.waitTime);
    const k = this.hhmmssToMin(r.workTime);
    const t = this.hhmmssToMin(r.totalTime);

    if (Number.isFinite(w)) waits.push(w);
    if (Number.isFinite(k)) works.push(k);
    if (Number.isFinite(t)) totals.push(t);
  }

  const avgWait = this.avg(waits);
  const avgWork = this.avg(works);

  // ✅ total ใช้ avg(total) จริง ถ้ามีข้อมูล
  // ถ้าไม่มี total ให้ fallback เป็น avgWait+avgWork
  const avgTotal = totals.length ? this.avg(totals) : +(avgWait + avgWork).toFixed(2);

  const sum = avgWait + avgWork;
  const waitPct = sum > 0 ? Math.round((avgWait / sum) * 100) : 0;
  const workPct = sum > 0 ? 100 - waitPct : 0;

  this.insight = {
    avgWaitMin: avgWait,
    avgWorkMin: avgWork,
    avgTotalMin: avgTotal,
    waitPct,
    workPct
  };
}


}
