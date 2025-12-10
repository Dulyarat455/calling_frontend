import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LaminationPanelComponent,RowItem } from '../lamination-panel/lamination-panel.component';
import { GeneralStatorPanelComponent,Group } from '../general-stator-panel/general-stator-panel.component';
import { HttpClient } from '@angular/common/http';
import { Router} from '@angular/router';
import { Subscription } from 'rxjs';

import Swal from 'sweetalert2';
import config from '../../config';
import { CallSocketService } from '../services/call-socket.service';

export type Status = 'wait' | 'pending';
type CheckTest = {
  time: string;
  station: string;
  status: Status;
  date: string
}


type States = {
  id: number;
  stateJobId: number;
  userInchargeId: number;
  stateJobName: string; 
  userInchargeName: string;
  date: string;
}

type JobRow = {
  id: number;
  createByUserId: number;
  createByUserName: string;
  createByUserEmpNo: string;
  remark: string;
  machineId: number;
  machineName: string;
  groupId: number;
  groupName: string;
  fromNodeId: number;
  fromNodeName: string;
  toNodeId: number;
  toNodeName: string;
  states: States[];
};


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule,LaminationPanelComponent,GeneralStatorPanelComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  token: string | undefined = '';
  check: number | undefined = 0;
  roleDashboard: string | undefined = '';
  groupDashboard: string | undefined = '';
  groupDashboardId: number | null = null;
  userCallNodeId: number | null = null;

  jobLaminations: JobRow[] = [];
  jobGenerals: JobRow[] = [];
  jobStators: JobRow[] = [];

  showLamPreview = true;
  showGenPreview = true;
  showStaPreview = true;

  wsSub?: Subscription;

  checkLamNotifyWait: number = 0;
  checkLamNotifyPending: number = 0;

  checkUnAuthorizedLamNotifyWait: number = 0;
  checkUnAuthorizedLamNotifyPending: number = 0;

  checkUnAuthorizedGenNotifyWait: number = 0;
  checkUnAuthorizedGenNotifyPending: number = 0;

  checkUnAuthorizedStaNotifyWait: number = 0;
  checkUnAuthorizedStaNotifyPending: number = 0;


  constructor(
    private http: HttpClient, 
    private router: Router,
    private callSocket: CallSocketService,
  ) {}

  @ViewChild('lamScroll') lamScroll?: ElementRef<HTMLDivElement>;

  ngOnInit() {
    this.checkLamNotifyWait = 0
    this.checkLamNotifyPending = 0
    this.token = localStorage.getItem('calling_token')!;
    this.roleDashboard = localStorage.getItem('calling_role')!;
    this.groupDashboard = localStorage.getItem('calling_group')!;
    this.userCallNodeId = Number(localStorage.getItem('calling_callNodeId')!);

    //get groupId 
    const raw = localStorage.getItem('calling_groupId');
    const parsed = Number(raw);
    this.groupDashboardId = raw && !Number.isNaN(parsed) ? parsed : null;

    //callfuction
    this.fetchJobByGen();
    this.fetchJobByLam();
    this.fetchJobBySta();


    // ✅ ฟัง event จาก websocket
    this.wsSub = this.callSocket.onJobChanged().subscribe((payload: any) => {
    console.log('job:changed payload =', payload);

    const job = payload?.job;
    const afterCreatetoNodeId = job.toNodeId; 

    if(!job) {return;}

    // สมมติ backend ส่ง payload แบบ { type, job } มา
    // และ job.groupId คือ group ที่เกี่ยวข้อง
    const groupId = payload?.job?.groupId;

    // ถ้าอยาก reload แค่ Lamination groupId = 3
    if (groupId === 3) {
      this.fetchJobByLam();
    }
    //update notify wait เมื่อมี request ใหม่เข้ามา
    if(this.userCallNodeId === afterCreatetoNodeId){
      this.checkLamNotifyWait = 1;
    }
    //update notify wait ของ dashboard unAuthorized
    this.checkUnAuthorizedLamNotifyWait = 1;

  });

  }


  private clearLamNotify() {
    this.checkLamNotifyWait = 0;
    this.checkUnAuthorizedLamNotifyWait = 0;
  }


  onLamScroll() {
    const el = this.lamScroll?.nativeElement;
    if (!el) return;
  
    const atBottom =
      el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
  
    if (atBottom) {
      this.clearLamNotify();
    }
  }

  onLamClick() {
    const el = this.lamScroll?.nativeElement;
    if (!el) return;
  
    // ถ้าไม่มี scrollbar (รายการน้อย → เห็นครบทุกแถวในจอเดียว)
    const noScroll = el.scrollHeight <= el.clientHeight + 1;
  
    if (noScroll) {
      this.clearLamNotify();
    }
  }
  
  

  // part for lam
  // section1 = {
  //   waitCount: 8,
  //   pendingCount: 2,
  //   left: <RowItem[]>[
  //     { time: '7:10', station: 'C10', status: 'wait' },
  //     { time: '7:25', station: 'A6 R', status: 'pending' },
  //     { time: '8:23', station: 'A8 S', status: 'wait' },
  //     { time: '8:38', station: 'B12 S', status: 'wait' },
  //     { time: '9:15', station: 'C13', status: 'wait' },
  //   ],
  //   right: <RowItem[]>[
  //     { time: '9:20', station: 'C11', status: 'wait' },
  //     { time: '9:25', station: 'B11 S', status: 'wait' },
  //     { time: '9:30', station: 'B11 S', status: 'wait' },
  //     { time: '9:40', station: 'B11 S', status: 'pending' },
  //     { time: '9:50', station: 'B11 S', status: 'wait' },
  //   ]
  // };


  section1 = {
    waitCount: 0,
    pendingCount: 0,
    Rows: [] as RowItem[]
  };



  private buildLamSectionFromJobs() {
    // 1) แปลง JobRow -> RowItem[]
    const allRows: RowItem[] = this.jobLaminations.map(job => {
      // เอา state ล่าสุดของ job นี้ (สมมติ backend sort date desc มาแล้ว ถ้าไม่มั่นใจค่อย sort เอง)
      const latestState = job.states && job.states.length > 0
        ? job.states[0]
        : null;
  
      // เวลา: แปลงจาก ISO string เป็น HH:mm
      const timeStr = latestState
        ? new Date(latestState.date).toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        : '';
  
      // สเตตัส: map จาก stateJobName -> 'wait' | 'pending'
      // (ปรับตามจริง เช่น "Done" ทีหลังได้)
      let status: 'wait' | 'pending' = 'wait';
      if (latestState && latestState.stateJobName.toLowerCase() === 'pending') {
        status = 'pending';
      }
  
      return {
        time: timeStr,
        date: latestState
        ? new Date(latestState.date).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
        : '',
        machineName: job.machineName,   // ใช้ชื่อเครื่องเป็น station
        status,
        //add new
        jobId: job.id,
        createByUserId: job.createByUserId,
        createByUserName: job.createByUserName,
        createByUserEmpNo: job.createByUserEmpNo,
        remark: job.remark,
        machineId: job.machineId,
        groupId: job.groupId,
        groupName: job.groupName,
        fromNodeId: job.fromNodeId,
        fromNodeName: job.fromNodeName,
        toNodeId: job.toNodeId,
        toNodeName: job.toNodeName,
      };
    });
  
    //  นับยอด wait / pending
    const waitCount = allRows.filter(r => r.status === 'wait').length;
    const pendingCount = allRows.filter(r => r.status === 'pending').length;

    //  อัปเดต section1 ที่ UI ใช้อยู่
    this.section1 = {
      waitCount,
      pendingCount,
      Rows:allRows
    };
  }
  

  onUpdateRow(row: RowItem) {
    // TODO: เปิด modal / เรียก API / เปลี่ยนสถานะ ฯลฯ
    console.log('Update clicked:', row);
  }

// general stator
  groups: Group[] = [
    {
      key: 'general',
      title: 'General',
      base: 'green',
      waitCount: 8,
      pendingCount: 2,
      rows: [
        { time: '7:10', station: 'D2', status: 'wait', date:'04/12/2025' },
        { time: '7:25', station: 'A5', status: 'pending', date:'04/12/2025' },
        { time: '8:23', station: 'A3', status: 'wait', date:'04/12/2025'},
        { time: '8:38', station: 'D3', status: 'wait', date:'04/12/2025'},
        { time: '9:15', station: 'A1', status: 'wait', date:'04/12/2025' },
      ],
    },
    {
      key: 'stator',
      title: 'stator',
      base: 'blue',
      waitCount: 1,
      pendingCount: 1,
      rows: [
        { time: '9:20', station: 'B1', status: 'pending',date:'04/12/2025' },
        { time: '9:25', station: 'C5', status: 'wait', date:'04/12/2025' },
      ],
    },
  ];


  
  // get laminationPreview(): RowItem[] {
  //   const merged: RowItem[] = [
  //     ...this.section1.left,
  //     ...this.section1.right,
  //   ];
  //   // เอา 3 แถวท้ายสุด (คิดว่าเป็นเวลาล่าสุด)
  //   // return merged.slice(-3);
  //   return merged;
  // }


  // General
  get generalPreview(): CheckTest[] {
    const g = this.groups.find(gr => gr.key === 'general');
    if (!g) return [];
    return g.rows
  }

  // Stator
  get statorPreview(): CheckTest[] {
    const g = this.groups.find(gr => gr.key === 'stator');
    if (!g) return [];
    return g.rows
  }


  toggleLamPreview() {
    this.showLamPreview = !this.showLamPreview;
  }


  toggleGenPreview() {
    this.showGenPreview = !this.showGenPreview;
  }
  
  toggleStaPreview() {
    this.showStaPreview = !this.showStaPreview;
  }




  fetchJobByLam(){
    this.http
    .post(config.apiServer + '/api/job/filterByGroup', {
      groupId: 3,
    })
    .subscribe({
      next: (res: any) => {
      this.jobLaminations = res.results || [];
      this.buildLamSectionFromJobs();
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: err.message || 'Cannot load Job',
          icon: 'error',
        });
      },
    });
  }

  fetchJobByGen(){
    this.http
    .post(config.apiServer + '/api/job/filterByGroup', {
      groupId: 2,
    })
    .subscribe({
      next: (res: any) => {
        this.jobGenerals = res.results || [];
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: err.message || 'Cannot load Job',
          icon: 'error',
        });
      },
    });
  }

  fetchJobBySta(){
    this.http
    .post(config.apiServer + '/api/job/filterByGroup', {
      groupId: 4,
    })
    .subscribe({
      next: (res: any) => {
        this.jobStators = res.results || [];
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: err.message || 'Cannot load Job',
          icon: 'error',
        });
      },
    });
  }


  createJob(){
    //add job to dashboard
  }
  confirmJob(){
    // 
  }
  cancelJob(){
    //cancel
  }


  ngOnDestroy() {
    this.wsSub?.unsubscribe();
  }

}
