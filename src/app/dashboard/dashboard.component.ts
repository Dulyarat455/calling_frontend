import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LaminationPanelComponent,RowItem } from '../lamination-panel/lamination-panel.component';
import { GeneralStatorPanelComponent,GroupPanel, RowItem as GSRowItem,  } from '../general-stator-panel/general-stator-panel.component';
import { HttpClient } from '@angular/common/http';
import { Router} from '@angular/router';
import { Subscription } from 'rxjs';

import Swal from 'sweetalert2';
import config from '../../config';
import { CallSocketService } from '../services/call-socket.service';

export type Status = 'wait' | 'pending';


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
  priority: string;
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


  buildLamination = {
    waitCount: 0,
    pendingCount: 0,
    Rows: [] as RowItem[]
  };

  buildGeneral = {
    waitCount: 0,
    pendingCount: 0,
    Rows: [] as RowItem[]
  }

  buildStator = {
    waitCount: 0,
    pendingCount: 0,
    Rows: [] as RowItem[]
  }



  // general stator
  // ✅ General panel (dummy)
  generalGroup: GroupPanel = {
    title: 'General',
    waitCount: 7,
    pendingCount: 1,
    rows: <GSRowItem[]>[
      { time: '07:10', station: 'D2', status: 'wait', date: '05/12/2025',toNodeName: 'PC_STORE_GEN'},
      { time: '07:25', station: 'A5', status: 'pending', date: '05/12/2025',toNodeName: 'PC_STORE_GEN' },
      { time: '08:23', station: 'A3', status: 'wait', date: '05/12/2025', toNodeName: 'PC_STORE_GEN' },
      { time: '08:38', station: 'D3', status: 'wait', date: '05/12/2025', toNodeName: 'PC_STORE_GEN' },
      { time: '09:15', station: 'A1', status: 'wait', date: '05/12/2025', toNodeName: 'PC_STORE_GEN' },
      { time: '09:15', station: 'A1', status: 'wait', date: '05/12/2025', toNodeName: 'PC_STORE_GEN' },
      { time: '09:15', station: 'A1', status: 'wait', date: '05/12/2025', toNodeName: 'PC_STORE_GEN' },
    ],
  };

  // ✅ Stator panel (dummy)
  statorGroup: GroupPanel = {
    title: 'Stator',
    waitCount: 1,
    pendingCount: 1,
    rows: <GSRowItem[]>[
      { time: '09:20', station: 'B1', status: 'pending', date: '05/12/2025',toNodeName: 'PD_STA' },
      { time: '09:25', station: 'C5', status: 'wait', date: '05/12/2025',toNodeName: 'PC_STORE_STA' },
    ],
  };



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
        priority: job.priority
      };
    });
    //  นับยอด wait / pending
    const waitCount = allRows.filter(r => r.status === 'wait').length;
    const pendingCount = allRows.filter(r => r.status === 'pending').length;

    //  อัปเดต section1 ที่ UI ใช้อยู่
    this.buildLamination = {
      waitCount,
      pendingCount,
      Rows:allRows
    };
  }


  private  buildGenStaFromJobs(groupType: string){
      let rowTemp = []
      if(groupType === "General"){
        rowTemp = this.jobGenerals
      }
      if(groupType === "Stator"){
        rowTemp = this.jobLaminations
      }


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
          priority: job.priority
        };
      });

       //  นับยอด wait / pending
    const waitCount = allRows.filter(r => r.status === 'wait').length;
    const pendingCount = allRows.filter(r => r.status === 'pending').length;
    
  }
  

  onUpdateRow(row: RowItem) {
    // TODO: เปิด modal / เรียก API / เปลี่ยนสถานะ ฯลฯ
    console.log('Update clicked:', row);
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
        this.buildGenStaFromJobs("General");
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
        this.buildGenStaFromJobs("Stator");
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
