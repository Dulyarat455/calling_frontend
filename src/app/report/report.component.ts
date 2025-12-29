import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { MyModal } from '../my-modal/my-modal.component';
import { ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';   // ✅ เพิ่ม
import Swal from 'sweetalert2';
import config from '../../config';

type inchargeUser = {
  date: string;
  stateJobId: number;
  stateJobName: string;
  userId: number;
  userName: string;
  userEmpNo: string;
}



type reportRow = {
  jobId: number;
  groupId: number;
  groupName: string;
  machineId: number;
  machineName: string;
  fromNodeId: number;
  fromNodeName: string;
  toNodeId: number;
  toNodeName: string;
  createByUserId: number;
  createByuserName: string;
  createByuserEmpNo: string;
  createAt: string;
  jobNo: string | null ;
  userIncharge: inchargeUser | null;   // ✅ เผื่อบาง job ยังไม่ finish
  pendingUser?: inchargeUser | null;   // ✅ เพิ่ม
};


type MachineRow = {
  id: number;
  code: string;
  createdAt: number;
  state: string;
  groupId: number;
  groupName: string;
  isActive:number;

};

type CallNodeRow ={
  id:number;
  code: string;
  sectionId: number;
  sectionName: string;
  groupId: number;
  groupName: string;
  subSectionId: number;
  subSectionName: string;
  isActive: number;
  state: string;
}

type ShiftCode = 'A' | 'B' | 'C';

type ReportFilters = {
  jobNo?: string;           // optional
  startDate?: string;       // optional yyyy-MM-dd
  endDate?: string;         // optional yyyy-MM-dd
  machineId?: number | null;
  fromNodeId?: number | null;
  toNodeId?: number | null;
  shift?: ShiftCode | null; 
};


type ExportRow = {
  jobNo: string;

  dateFrom: string;      // formatDate(createAt)
  dateTo: string;        // formatDate(userIncharge?.date)

  shift: 'A' | 'B' | 'C' | '-';

  machine: string;

  callFrom: string;
  callTo: string;

  startTime: string;     // formatTime(createAt)
  finishTime: string;    // formatTime(userIncharge?.date)

  totalTime: string;     // calcTime(row,'total')
  waitTime: string;      // calcTime(row,'wait')
  workTime: string;      // calcTime(row,'work')

  callByEmpNo: string;
  callByName: string;

  inchargeEmpNo: string;
  inchargeName: string;
};


@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MyModal], // ✅ เพิ่ม CommonModule
  templateUrl: './report.component.html',
  styleUrl: './report.component.css'
})
export class ReportComponent {
  @ViewChild(MyModal) myModal!: MyModal;

  constructor(private http: HttpClient, private router: Router) {}


  reportRows: reportRow[] = [];
  callNodes: CallNodeRow[] = []
  machines: MachineRow[] = [];
  isLoading = false;

  // 🔍 state สำหรับค้นหา + filter วัน
  searchJobNo: string = '';
  startDate: string = ''; // yyyy-MM-dd
  endDate: string = '';   // yyyy-MM-dd


  draft: ReportFilters = {
    jobNo: '',
    startDate: '',
    endDate: '',
    machineId: null,
    fromNodeId: null,
    toNodeId: null,
    shift: null,
  };

   // applied = ค่าที่กดปุ่ม Filter แล้ว
  applied: ReportFilters = {};

  // ======================
  // Searchable dropdown 
  // ======================
  fromKeyword = '';
  toKeyword = '';
  machineKeyword = '';

  filteredFromNodes: CallNodeRow[] = [];
  filteredToNodes: CallNodeRow[] = [];
  filteredMachines: MachineRow[] = [];

  showFromDrop = false;
  showToDrop = false;
  showMachineDrop = false;


  // snapshot ล่าสุดที่หน้าเว็บโชว์อยู่ (ใช้ตอน export)
  lastView = {
    applied: {} as ReportFilters,
    rows: [] as reportRow[],
    updatedAt: 0
  };


  

  ngOnInit() {
    // ✅ default filter: เมื่อวาน -> วันนี้
    this.setDefaultDateRangeYesterdayToday();

    this.fetchData();
    this.fetchMachine();
    this.fetchCallNode(); 
  }

  openModal() {
    this.myModal.open();
  }

  clearForm() {}

  fetchData() {
    this.http.get(config.apiServer + '/api/report/list').subscribe({
      next: (res: any) => {
        this.reportRows = res.results || [];
        // ✅ snapshot เริ่มต้นให้ตรงกับหน้า (ยังไม่ filter)
        this.lastView = {
          applied: { ...this.applied },     
          rows: [...this.filteredRows],     
          updatedAt: Date.now()
        };

      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: err.message,
          icon: 'error',
        });
      },
    });
  }

  fetchMachine(){
    this.http.get(config.apiServer + '/api/machine/list').subscribe({
      next: (res: any) => {
        this.machines = res.results || [];
        this.filteredMachines = [...this.machines];
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: err.message,
          icon: 'error',
        });
      },
    })
  }

  fetchCallNode(){
    this.http.get(config.apiServer + '/api/callnode/list').subscribe({
      next: (res: any) => {
        this.callNodes = res.results || [];
        this.filteredFromNodes = [...this.callNodes];
        this.filteredToNodes = [...this.callNodes];
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: err.message,
          icon: 'error',
        });
      },
    })
  }



  applyFilter() {
    const f: ReportFilters = {};

    if (this.draft.jobNo?.trim()) {
      f.jobNo = this.draft.jobNo.trim();
    }

    if (this.draft.startDate) f.startDate = this.draft.startDate;
    if (this.draft.endDate) f.endDate = this.draft.endDate;

    if (this.draft.machineId != null) f.machineId = this.draft.machineId;
    if (this.draft.fromNodeId != null) f.fromNodeId = this.draft.fromNodeId;
    if (this.draft.toNodeId != null) f.toNodeId = this.draft.toNodeId;
    if (this.draft.shift != null) f.shift = this.draft.shift;


    // validate date range
    if (f.startDate && f.endDate) {
      const s = new Date(f.startDate + 'T00:00:00');
      const e = new Date(f.endDate + 'T23:59:59');
      if (s > e) {
        Swal.fire(
          'Invalid date range',
          'Start date must be before End date',
          'warning'
        );
        return;
      }
    }

    this.applied = f;

    this.lastView = {
      applied: { ...this.applied },
      rows: [...this.filteredRows],
      updatedAt: Date.now()
    };

  }


  clearFilter() {
    this.draft = {
      jobNo: '',
      startDate: '',
      endDate: '',
      machineId: null,
      fromNodeId: null,
      toNodeId: null,
      shift: null,
    };
    this.applied = {};

     // ✅ clear keyword
    this.fromKeyword = '';
    this.toKeyword = '';
    this.machineKeyword = '';

    this.showFromDrop = false;
    this.showToDrop = false;
    this.showMachineDrop = false;


    // ✅ กลับไป default เมื่อวาน-วันนี้
  this.setDefaultDateRangeYesterdayToday();

  // ✅ snapshot ให้ตรงหน้า
  this.lastView = {
    applied: { ...this.applied },
    rows: [...this.filteredRows],
    updatedAt: Date.now()
  };
  }

  get filteredRows(): reportRow[] {
    const f = this.applied;

    return this.reportRows.filter((row) => {
      // Job No
      if (f.jobNo) {
        const kw = f.jobNo.trim();
        if (!row.jobNo) return false;              // ไม่มี jobNo = ไม่เอา
        if (!row.jobNo.includes(kw)) return false; // match jobNo เท่านั้น
      }

      // Machine
      if (f.machineId != null) {
        if (row.machineId !== f.machineId) return false;
      }

      // Call From
      if (f.fromNodeId != null) {
        if (row.fromNodeId !== f.fromNodeId) return false;
      }

      // Call To
      if (f.toNodeId != null) {
        if (row.toNodeId !== f.toNodeId) return false;
      }

      // Date range
      if (f.startDate || f.endDate) {
        const jobDate = new Date(row.createAt);
        if (isNaN(jobDate.getTime())) return false;

        if (f.startDate) {
          const start = new Date(f.startDate + 'T00:00:00');
          if (jobDate < start) return false;
        }

        if (f.endDate) {
          const end = new Date(f.endDate + 'T23:59:59');
          if (jobDate > end) return false;
        }
      }

      // Shift
      if (f.shift) {
        const rowShift = this.getShift(row.createAt);
        if (rowShift !== f.shift) return false;
      }


      return true;
    });
  }


  //filter + select + blur validate (กันพิมพ์มั่ว)
  //******************************************* */

  filterFromNodes() {
    const kw = this.fromKeyword.trim().toLowerCase();
    this.filteredFromNodes = !kw
      ? [...this.callNodes]
      : this.callNodes.filter(n => (n.code || '').toLowerCase().includes(kw));
  }
  
  filterToNodes() {
    const kw = this.toKeyword.trim().toLowerCase();
    this.filteredToNodes = !kw
      ? [...this.callNodes]
      : this.callNodes.filter(n => (n.code || '').toLowerCase().includes(kw));
  }
  
  filterMachines() {
    const kw = this.machineKeyword.trim().toLowerCase();
    this.filteredMachines = !kw
      ? [...this.machines]
      : this.machines.filter(m => (m.code || '').toLowerCase().includes(kw));
  }
  
  selectFromNode(n: CallNodeRow) {
    this.fromKeyword = n.code;
    this.draft.fromNodeId = n.id;
    this.showFromDrop = false;
  }
  
  selectToNode(n: CallNodeRow) {
    this.toKeyword = n.code;
    this.draft.toNodeId = n.id;
    this.showToDrop = false;
  }
  
  selectMachine(m: MachineRow) {
    this.machineKeyword = m.code;
    this.draft.machineId = m.id;
    this.showMachineDrop = false;
  }
  
  // ✅ blur แล้วตรวจว่าพิมพ์ตรงกับของจริงใน list ไหม (ไม่ตรง = ล้าง)
  onFromBlur() {
    setTimeout(() => {
      const found = this.callNodes.find(x => x.code === this.fromKeyword);
      if (!found) {
        this.fromKeyword = '';
        this.draft.fromNodeId = null;
      }
      this.showFromDrop = false;
    }, 150);
  }
  
  onToBlur() {
    setTimeout(() => {
      const found = this.callNodes.find(x => x.code === this.toKeyword);
      if (!found) {
        this.toKeyword = '';
        this.draft.toNodeId = null;
      }
      this.showToDrop = false;
    }, 150);
  }
  
  onMachineBlur() {
    setTimeout(() => {
      const found = this.machines.find(x => x.code === this.machineKeyword);
      if (!found) {
        this.machineKeyword = '';
        this.draft.machineId = null;
      }
      this.showMachineDrop = false;
    }, 150);
  }
  
//******************************************* */

  formatDate(iso?: string | null): string {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('th-TH');
  }

  formatTime(iso?: string | null): string {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  calcWaitTime(startIso?: string | null, finishIso?: string | null): string {
    if (!startIso || !finishIso) return '-';

    const start = new Date(startIso);
    const finish = new Date(finishIso);
    if (isNaN(start.getTime()) || isNaN(finish.getTime())) return '-';

    const diffMs = finish.getTime() - start.getTime();
    if (diffMs < 0) return '-';

    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }


  private diffHHmmss(fromIso?: string | null, toIso?: string | null): string {
    if (!fromIso || !toIso) return '-';
  
    const from = new Date(fromIso);
    const to = new Date(toIso);
  
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return '-';
  
    const diffMs = to.getTime() - from.getTime();
    if (diffMs < 0) return '-';
  
    const totalSeconds = Math.floor(diffMs / 1000);
    const hh = Math.floor(totalSeconds / 3600);
    const mm = Math.floor((totalSeconds % 3600) / 60);
    const ss = totalSeconds % 60;
  
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }
  
  
  calcTime(row: reportRow, mode: 'wait' | 'work' | 'total'): string {
    const start = row.createAt;
    const pending = row.pendingUser?.date || null;      // pending ล่าสุด
    const finish = row.userIncharge?.date || null;      // finish
  
    if (mode === 'wait') {
      // Start -> Pending
      return this.diffHHmmss(start, pending);
    }
  
    if (mode === 'work') {
      // Pending -> Finish
      return this.diffHHmmss(pending, finish);
    }
  
    // total (เผื่ออยากใช้) Start -> Finish
    return this.diffHHmmss(start, finish);
  }

  getShift(createAt?: string | null): 'A' | 'B' | 'C' | '-' {
    if (!createAt) return '-';
  
    const d = new Date(createAt);
    if (isNaN(d.getTime())) return '-';
  
    const h = d.getHours();
    const m = d.getMinutes();
    const totalMin = h * 60 + m;
  
    const A_START = 7 * 60;          // 07:00
    const A_END   = 15 * 60 + 10;    // 15:10
  
    const B_START = 15 * 60;         // 15:00
    const B_END   = 23 * 60 + 10;    // 23:10
  
    const C_START = 23 * 60;         // 23:00
    const C_END   = 7 * 60 + 10;     // 07:10 (ข้ามวัน)
  
    // Shift A
    if (totalMin >= A_START && totalMin <= A_END) {
      return 'A';
    }
  
    // Shift B
    if (totalMin >= B_START && totalMin <= B_END) {
      return 'B';
    }
  
    // Shift C (ข้ามวัน)
    if (totalMin >= C_START || totalMin <= C_END) {
      return 'C';
    }
  
    return '-';
  }



  //part export Excel file ******************************

  private mapToExportRow(row: reportRow): ExportRow {
    return {
      jobNo: row.jobNo ?? '-',
  
      dateFrom: this.formatDate(row.createAt),
      dateTo: this.formatDate(row.userIncharge?.date),
  
      shift: this.getShift(row.createAt),
  
      machine: row.machineName || '-',
  
      callFrom: row.fromNodeName || '-',
      callTo: row.toNodeName || '-',
  
      startTime: this.formatTime(row.createAt),
      finishTime: this.formatTime(row.userIncharge?.date),
  
      totalTime: this.calcTime(row, 'total'),
      waitTime: this.calcTime(row, 'wait'),
      workTime: this.calcTime(row, 'work'),
  
      callByEmpNo: row.createByuserEmpNo || '-',
      callByName: row.createByuserName || '-',
  
      inchargeEmpNo: row.userIncharge?.userEmpNo || '-',
      inchargeName: row.userIncharge?.userName || '-',
    };
  }


  exportExcel() {
    if (this.isLoading) return;
  
    // ✅ snapshot ตามหน้าปัจจุบัน (applied + filteredRows)
    this.lastView = {
      applied: { ...this.applied },
      rows: [...this.filteredRows],
      updatedAt: Date.now(),
    };
  
    const viewRows = this.lastView.rows;
  
    if (!viewRows.length) {
      Swal.fire('No data', 'ไม่มีข้อมูลสำหรับ Export', 'info');
      return;
    }
  
    const exportRows: ExportRow[] = viewRows.map((r) => this.mapToExportRow(r));
  
    const payload = {
      filters: { ...this.lastView.applied }, // ✅ ใช้ applied ที่หน้าใช้อยู่จริง
      rows: exportRows,                      // ✅ flatten + calculate แล้ว
      exportedAt: new Date().toISOString(),
      count: exportRows.length,
    };
  
    this.isLoading = true;
  
    this.http
      .post(config.apiServer + '/api/report/exportExcel', payload, {
        responseType: 'blob',
        observe: 'response', // ✅ เพื่ออ่าน header (filename)
      })
      .subscribe({
        next: (resp) => {
          const blob = resp.body as Blob;
  
          // ✅ ดึงชื่อไฟล์จาก header ถ้ามี
          const cd = resp.headers.get('content-disposition') || '';
          const match = cd.match(/filename="?([^"]+)"?/i);
          const serverFileName = match?.[1];
  
          const fallbackName =
            `report-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`;
  
          const fileName = serverFileName || fallbackName;
  
          // ✅ download
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          window.URL.revokeObjectURL(url);
  
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
  
          // บางที error จะเป็น blob → แปลงเป็นข้อความก่อน (optional)
          const msg =
            err?.error?.message ||
            err?.message ||
            'Export failed';
  
          Swal.fire('Error', msg, 'error');
        },
      });
  }
  
  

  //start filter date now 
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

  const start = this.toYMDLocal(ytd);
  const end = this.toYMDLocal(today);

  // ✅ ให้ input date โชว์เลย
  this.draft.startDate = start;
  this.draft.endDate = end;

  // ✅ ให้ filter ทำงานทันที (ไม่ต้องกด search)
  this.applied = { ...this.applied, startDate: start, endDate: end };
}

  

  add() {}
  edit(item: any) {}
  remove(item: any) {}


}
