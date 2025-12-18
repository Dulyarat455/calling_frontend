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
  userIncharge: inchargeUser | null;   // ✅ เผื่อบาง job ยังไม่ finish
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


type ReportFilters = {
  jobNo?: string;           // optional
  startDate?: string;       // optional yyyy-MM-dd
  endDate?: string;         // optional yyyy-MM-dd
  machineId?: number | null;
  fromNodeId?: number | null;
  toNodeId?: number | null;
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

  

  ngOnInit() {
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
  }


  clearFilter() {
    this.draft = {
      jobNo: '',
      startDate: '',
      endDate: '',
      machineId: null,
      fromNodeId: null,
      toNodeId: null,
    };
    this.applied = {};

     // ✅ clear keyword
    this.fromKeyword = '';
    this.toKeyword = '';
    this.machineKeyword = '';

    this.showFromDrop = false;
    this.showToDrop = false;
    this.showMachineDrop = false;
  }

  get filteredRows(): reportRow[] {
    const f = this.applied;

    return this.reportRows.filter((row) => {
      // Job No
      if (f.jobNo) {
        if (!row.jobId.toString().includes(f.jobNo)) return false;
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

  add() {}
  edit(item: any) {}
  remove(item: any) {}

  

}
