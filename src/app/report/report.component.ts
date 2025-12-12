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
  isLoading = false;

    // 🔍 state สำหรับค้นหา + filter วัน
    searchJobNo: string = '';
    startDate: string = ''; // yyyy-MM-dd
    endDate: string = '';   // yyyy-MM-dd

    

  ngOnInit() {
    this.fetchData();
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

  add() {}
  edit(item: any) {}
  remove(item: any) {}

  // 🔹 helper แปลง iso → วันที่ (dd/MM/yyyy)
  formatDate(iso?: string | null): string {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('th-TH');
  }

  // 🔹 helper แปลง iso → เวลา (HH:mm)
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

  // 🔹 helper คำนวณ Wait time = finish - start (ในรูปแบบ hh:mm)
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

    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    return `${hh}:${mm}`;
  }



    // ------------------------------------------------
  // ⭐ FILTER LOGIC
  // ------------------------------------------------
  /** ใช้ใน *ngFor แทน reportRows ตรง ๆ */
  get filteredRows(): reportRow[] {
    return this.reportRows.filter((row) => {
      return this.matchesJobSearch(row) && this.matchesDateRange(row);
    });
  }

  /** เช็คว่า row นี้ match กับ searchJobNo หรือไม่ */
  private matchesJobSearch(row: reportRow): boolean {
    const keyword = this.searchJobNo.trim();
    if (!keyword) return true;

    const jobStr = row.jobId.toString();
    return jobStr.includes(keyword);
  }

  /** filter ตามช่วงวันที่ (อ้างอิง createAt / Date From) */
  private matchesDateRange(row: reportRow): boolean {
    if (!this.startDate && !this.endDate) return true;

    const jobDate = new Date(row.createAt);
    if (isNaN(jobDate.getTime())) return false;

    if (this.startDate) {
      const start = new Date(this.startDate + 'T00:00:00');
      if (jobDate < start) return false;
    }

    if (this.endDate) {
      const end = new Date(this.endDate + 'T23:59:59');
      if (jobDate > end) return false;
    }

    return true;
  }


}
