import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import config from '../../config';

Chart.register(ChartDataLabels);

/* ---------- types ---------- */
type inchargeUser = { date: string };

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

  // ✅ ตัวเลขนาทีไว้ใช้รวม/เฉลี่ยง่าย ๆ
  totalMin: number;
  waitMin: number;
  workMin: number;
};

type LineType = 'ALL' | 'LAM' | 'GEN' | 'STA';
type TimeType = 'WAIT' | 'WORK' | 'TOTAL';

@Component({
  selector: 'app-analytics2',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './analytics2.component.html',
  styleUrl: './analytics2.component.css',
})
export class Analytics2Component implements OnInit {
  isLoading = false;

  /** raw */
  reportRows: reportRow[] = [];
  callNodeRows: callNodeRow[] = [];

  /** mapped */
  exportRows: ExportRow[] = [];
  filteredRows: ExportRow[] = [];

  /** filters (ใหญ่) */
  fromDate = ''; // yyyy-MM-dd
  toDate = '';   // yyyy-MM-dd
  selectedLine: LineType = 'ALL';
  selectedTimeType: TimeType = 'WAIT';

  /** dropdown สำหรับ part 3 */
  selectedCallTo = '';
  callToOptions: string[] = [];

  /** charts */
  // part1 avg(callTo)
  avgCallToData: ChartData<'bar'> = { labels: [], datasets: [] };
  // part2 total(sum)(callTo)
  totalCallToData: ChartData<'bar'> = { labels: [], datasets: [] };

  // part3.1 total(sum)(callFrom -> selectedCallTo)
  totalCallFromBySelectedCallToData: ChartData<'bar'> = { labels: [], datasets: [] };
  // part3.2 avg(callFrom -> selectedCallTo)
  avgCallFromBySelectedCallToData: ChartData<'bar'> = { labels: [], datasets: [] };

  /** map nodeCode -> groupId */
  private nodeGroupMap = new Map<string, number>();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.setDefaultDateRangeMonthToToday(); // ✅ วันแรกของเดือน -> วันนี้
    this.fetchAll();
  }

  /* ================= fetch ================= */

  private fetchAll() {
    this.isLoading = true;

    Promise.all([
      this.http.get<any>(config.apiServer + '/api/report/list').toPromise(),
      this.http.get<any>(config.apiServer + '/api/callnode/list').toPromise(),
    ])
      .then(([reportRes, callNodeRes]) => {
        this.reportRows = reportRes?.results || [];
        this.callNodeRows = callNodeRes?.results || [];

        this.buildNodeGroupMap();

        this.exportRows = this.reportRows.map((r) => this.mapToExportRow(r));

        this.applyBigFiltersAndBuildAll(); 
        this.isLoading = false;    
      })
      .catch((err) => {
        console.error(err);
        this.isLoading = false;
      });
  }

  /* ================= filters ================= */

  applyFilters() {
    this.applyBigFiltersAndBuildAll();
  }

  resetFilters() {
    this.setDefaultDateRangeMonthToToday();
    this.selectedLine = 'ALL';
    this.selectedTimeType = 'WAIT';
    this.selectedCallTo = '';
    this.applyBigFiltersAndBuildAll();
  }

  onSelectedCallToChange() {
    this.buildPart3();
  }

  private applyBigFiltersAndBuildAll() {
    // 1) group filter
    const gid = this.getGroupIdByLine(this.selectedLine);
    let rows = gid
      ? this.exportRows.filter((r) => r.callFromGroupId === gid && r.callToGroupId === gid)
      : [...this.exportRows];

    // 2) date filter
    rows = this.applyDateFilter(rows);

    this.filteredRows = rows;

    // 3) options for dropdown CallTo (part3)
    this.callToOptions = this.unique(rows.map((x) => x.callTo)).sort((a, b) => a.localeCompare(b));

    // ถ้ายังไม่ได้เลือก callTo ให้ default เป็นตัวแรก
    if (!this.selectedCallTo && this.callToOptions.length) {
      this.selectedCallTo = this.callToOptions[0];
    }
    if (this.selectedCallTo && !this.callToOptions.includes(this.selectedCallTo)) {
      this.selectedCallTo = this.callToOptions[0] || '';
    }

    // build all parts
    this.buildPart1();
    this.buildPart2();
    this.buildPart3();
  }

  private getGroupIdByLine(line: LineType): number | null {
    if (line === 'LAM') return 3;
    if (line === 'GEN') return 2;
    if (line === 'STA') return 4;
    return null;
  }

  /* ================= build parts ================= */

  // part 1: AVG of callTo (ตาม time type)
  private buildPart1() {
    const items = this.groupAgg(this.filteredRows, 'callTo', 'AVG', this.selectedTimeType);
    this.avgCallToData = this.buildSingleBarData(items, `avg ${this.timeTypeLabel(this.selectedTimeType)}`);
  }

  // part 2: TOTAL (SUM) of callTo (ตาม time type)
  private buildPart2() {
    const items = this.groupAgg(this.filteredRows, 'callTo', 'SUM', this.selectedTimeType);
    this.totalCallToData = this.buildSingleBarData(items, `total ${this.timeTypeLabel(this.selectedTimeType)}`);
  }

  // part 3: แยก 2 graph (SUM / AVG) ของ callFrom ที่สัมพันธ์กับ selected callTo
  private buildPart3() {
    if (!this.selectedCallTo) {
      this.totalCallFromBySelectedCallToData = { labels: [], datasets: [] };
      this.avgCallFromBySelectedCallToData = { labels: [], datasets: [] };
      return;
    }

    const rows = this.filteredRows.filter((r) => (r.callTo || '').trim() === this.selectedCallTo);

    const sumItems = this.groupAgg(rows, 'callFrom', 'SUM', this.selectedTimeType);
    const avgItems = this.groupAgg(rows, 'callFrom', 'AVG', this.selectedTimeType);

    this.totalCallFromBySelectedCallToData = this.buildSingleBarData(
      sumItems,
      `total ${this.timeTypeLabel(this.selectedTimeType)} (→ ${this.selectedCallTo})`
    );

    this.avgCallFromBySelectedCallToData = this.buildSingleBarData(
      avgItems,
      `avg ${this.timeTypeLabel(this.selectedTimeType)} (→ ${this.selectedCallTo})`
    );
  }

  /* ================= chart helpers ================= */

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 28, right: 18, left: 10, bottom: 0 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = Number(ctx.parsed?.y ?? 0);
            return this.formatMinShort(v);
          },
        },
      },
      datalabels: {
        clamp: true,
        formatter: (value: any) => {
          const v = Number(value ?? 0);
          if (!v) return '';
          return this.formatMinShort(v);
        },
        font: { weight: 800, size: 11 },
        anchor: 'end',
        align: 'end',
        offset: 2,
        color: '#0f172a',
      },
    },
    scales: {
      x: {
        ticks: { font: { size: 11, weight: 600 }, autoSkip: true, maxRotation: 0, minRotation: 0 },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (v) => this.formatMinAxis(Number(v)),
          font: { size: 11 },
        },
        grid: { color: 'rgba(15, 23, 42, 0.08)' },
      },
    },
  };

  private buildSingleBarData(items: { label: string; value: number }[], datasetLabel: string): ChartData<'bar'> {
    const top = items.slice(0, 12); // ปรับตามใจ
    return {
      labels: top.map((x) => x.label),
      datasets: [
        {
          label: datasetLabel,
          data: top.map((x) => x.value),
          borderRadius: 10,
          borderSkipped: false,
          barThickness: 64,
          categoryPercentage: 0.9,
          barPercentage: 0.95,
        },
      ],
    };
  }

  private groupAgg(
    rows: ExportRow[],
    key: 'callTo' | 'callFrom',
    mode: 'AVG' | 'SUM',
    timeType: TimeType
  ): { label: string; value: number }[] {
    const map = new Map<string, number[]>();

    for (const r of rows) {
      const k = (r[key] || 'UNKNOWN').trim();
      const v = this.pickMin(r, timeType);
      if (!Number.isFinite(v) || v <= 0) continue;

      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(v);
    }

    const items = Array.from(map.entries()).map(([label, arr]) => {
      const value = mode === 'SUM' ? this.sum(arr) : this.avg(arr);
      return { label, value };
    });

    // sort มาก -> น้อย
    items.sort((a, b) => b.value - a.value);
    return items;
  }

  private pickMin(r: ExportRow, t: TimeType): number {
    if (t === 'WAIT') return r.waitMin;
    if (t === 'WORK') return r.workMin;
    return r.totalMin;
  }

  /* ================= mapping ================= */

  private buildNodeGroupMap() {
    this.nodeGroupMap.clear();
    (this.callNodeRows || []).forEach((n) => {
      if (n.code) this.nodeGroupMap.set(this.norm(n.code), n.groupId);
    });
  }

  private mapToExportRow(r: reportRow): ExportRow {
    const fromCode = this.norm(r.fromNodeName);
    const toCode = this.norm(r.toNodeName);

    const totalTime = this.diffHHmmss(r.createAt, r.userIncharge?.date);
    const waitTime = this.diffHHmmss(r.createAt, r.pendingUser?.date);
    const workTime = this.diffHHmmss(r.pendingUser?.date, r.userIncharge?.date);

    const totalMin = this.hhmmssToMin(totalTime);
    const waitMin = this.hhmmssToMin(waitTime);
    const workMin = this.hhmmssToMin(workTime);

    return {
      createAt: r.createAt,
      callFrom: r.fromNodeName || 'UNKNOWN',
      callTo: r.toNodeName || 'UNKNOWN',
      callFromGroupId: this.nodeGroupMap.get(fromCode) ?? null,
      callToGroupId: this.nodeGroupMap.get(toCode) ?? null,
      totalTime,
      waitTime,
      workTime,
      totalMin: Number.isFinite(totalMin) ? totalMin : NaN,
      waitMin: Number.isFinite(waitMin) ? waitMin : NaN,
      workMin: Number.isFinite(workMin) ? workMin : NaN,
    };
  }

  /* ================= date helpers ================= */

  private setDefaultDateRangeMonthToToday() {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);

    this.fromDate = this.toYMDLocal(first);
    this.toDate = this.toYMDLocal(today);
  }

  private applyDateFilter(rows: ExportRow[]): ExportRow[] {
    const s = this.fromDate ? new Date(this.fromDate + 'T00:00:00').getTime() : null;
    const e = this.toDate ? new Date(this.toDate + 'T23:59:59').getTime() : null;

    return rows.filter((r) => {
      const t = new Date(r.createAt).getTime();
      if (isNaN(t)) return false;
      if (s != null && t < s) return false;
      if (e != null && t > e) return false;
      return true;
    });
  }

  private toYMDLocal(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /* ================= time utils ================= */

  private norm(v?: string | null): string {
    return (v || '').trim().toUpperCase();
  }

  private diffHHmmss(from?: string | null, to?: string | null): string {
    if (!from || !to) return '-';
    const a = new Date(from).getTime();
    const b = new Date(to).getTime();
    if (isNaN(a) || isNaN(b) || b < a) return '-';

    const s = Math.floor((b - a) / 1000);
    return `${String(Math.floor(s / 3600)).padStart(2, '0')}:` +
      `${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:` +
      `${String(s % 60).padStart(2, '0')}`;
  }

  private hhmmssToMin(v: string): number {
    if (!v || v === '-') return NaN;
    const p = v.split(':').map(Number);
    if (p.length !== 3 || p.some(isNaN)) return NaN;
    return Math.round(((p[0] * 3600 + p[1] * 60 + p[2]) / 60) * 100) / 100;
  }

  private avg(xs: number[]): number {
    const a = xs.filter(Number.isFinite);
    if (!a.length) return 0;
    return Math.round((a.reduce((s, v) => s + v, 0) / a.length) * 100) / 100;
  }

  private sum(xs: number[]): number {
    const a = xs.filter(Number.isFinite);
    if (!a.length) return 0;
    return Math.round(a.reduce((s, v) => s + v, 0) * 100) / 100;
  }

  private unique(arr: string[]): string[] {
    const s = new Set(arr.map((x) => (x || '').trim()).filter(Boolean));
    return Array.from(s);
  }

  private formatMinAxis(v: number): string {
    if (!Number.isFinite(v)) return '';
    if (v < 60) return `${Math.round(v)}m`;
    const h = Math.floor(v / 60);
    const m = Math.round(v % 60);
    if (m === 0) return `${h}h`;
    return `${h}h${m}m`;
  }

  formatMinShort(v: number): string {
    if (!Number.isFinite(v) || v <= 0) return '';
    if (v < 60) return `${Math.round(v)} min`;
    const h = Math.floor(v / 60);
    const m = Math.round(v % 60);
    return `${h} hr ${m} min`;
  }

  timeTypeLabel(t: TimeType): string {
    if (t === 'WAIT') return 'wait time';
    if (t === 'WORK') return 'work time';
    return 'total time';
  }

  // ✅ ความกว้างกราฟตามจำนวนแท่ง (เหมือนของเดิม)
  getChartWidth(labels: any[] | undefined | null): string {
    const n = labels?.length ?? 0;
    const w = Math.max(900, n * 140);
    return `${w}px`;
  }
}
