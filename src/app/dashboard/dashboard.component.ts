import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LaminationPanelComponent,RowItem } from '../lamination-panel/lamination-panel.component';
import { GeneralStatorPanelComponent,GroupPanel, RowItem as GSRowItem,  } from '../general-stator-panel/general-stator-panel.component';
import { HttpClient } from '@angular/common/http';
import { Router} from '@angular/router';
import { Subscription } from 'rxjs';

import { ModalTemplateComponent } from '../modal-template/modal-template.component';
import { AlertRequestComponent } from '../alert-request/alert-request.component';
import Swal from 'sweetalert2';
import config from '../../config';
import { CallSocketService } from '../services/call-socket.service';
import { ChartComponent } from '../chart/chart.component';
import { group } from '@angular/animations';

export type Status = 'wait' | 'pending';


type States = {
  id: number;
  stateJobId: number;
  userInchargeId: number;
  stateJobName: string; 
  userInchargeName: string;
  userInchargeEmpNo: string;
  date: string;
}

type JobRow = {
  id: number;
  createByUserId: number;
  createByUserName: string;
  createByUserEmpNo: string;
  userInchargeId: number | null;
  userInchargeName: string | null;
  userInchargeEmpNo: string | null;
  createAt: string;
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
  jobNo: string | null
};


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

type BuildSection = {
  waitCount: number;
  pendingCount: number;
  Rows: RowItem[];
};


 type PanelKey = 'lam' | 'gen' | 'sta';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule,LaminationPanelComponent,GeneralStatorPanelComponent,AlertRequestComponent,ChartComponent,ModalTemplateComponent],
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

  callNodes: callNodeRow[] = []

  checkLamNotifyWait: number = 0;
  checkLamNotifyPending: number = 0;

  checkGenNotifyWait: number = 0;
  checkGenNotifyPending: number = 0;

  checkStaNotifyWait: number = 0;
  checkStaNotifyPending: number = 0;

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
  @ViewChild('genScroll') genScroll?: ElementRef<HTMLDivElement>;
  @ViewChild('staScroll') staScroll?: ElementRef<HTMLDivElement>;
  @ViewChild('alertRequestModal') modalAlert!: AlertRequestComponent;
   @ViewChild('assignJobModal') modal!: ModalTemplateComponent;

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
    this.fetchCallNode();


    // ✅ ฟัง event จาก websocket
    this.wsSub = this.callSocket.onJobChanged().subscribe((payload: any) => {
    console.log('job:changed payload =', payload);
    const type = payload?.type as 'create' | 'update' | undefined;
    const job = payload?.job;
    const afterCreatetoNodeId = job.toNodeId; 
    const groupId = payload?.job?.groupId;

    if(type === 'create'){
        if(!job) {return;}

        if (groupId === 3) {
          this.fetchJobByLam();
           //update notify wait ของ dashboard unAuthorized
          this.checkUnAuthorizedLamNotifyWait = 1;
        }

        if (groupId === 2){
          this.fetchJobByGen();
          this.checkUnAuthorizedGenNotifyWait = 1;
        }

        if(groupId === 4){
          this.fetchJobBySta();
          this.checkUnAuthorizedStaNotifyWait = 1;
        }

        //update notify wait เมื่อมี request ใหม่เข้ามา
        // check node ตัวเองกับ node ใน job ใหม่
        if(this.userCallNodeId === afterCreatetoNodeId){
          if(groupId === 3){
            this.checkLamNotifyWait = 1;
          }
          if(groupId === 2){
            this.checkGenNotifyWait = 1;
          }
          if(groupId === 4){
            this.checkStaNotifyWait = 1;
          }
          //call alert modal | new request
          this.openModalAlert();
        }
       
       
    }
    if(type === 'update'){
        if(!job) {return;}
        const jobStatus = payload?.timeStateJob?.stateJobId;
        if (groupId === 3) {
          this.fetchJobByLam();
        }
        if(groupId === 2){
          this.fetchJobByGen();
        }
        if(groupId === 4){
          this.fetchJobBySta();
        }


        if(jobStatus === 2){
          //pending
          if(this.userCallNodeId === afterCreatetoNodeId ){
            if(groupId === 3){
              this.checkLamNotifyPending = 1;
            }
            if(groupId === 2){
              this.checkGenNotifyPending = 1;
            }
            if(groupId === 4){
              this.checkStaNotifyPending = 1;
            }
          }
          if(groupId === 3){
            this.checkUnAuthorizedLamNotifyPending = 1;
          }
          if(groupId === 2){
            this.checkUnAuthorizedGenNotifyPending = 1;
          }
          if(groupId === 4){
            this.checkUnAuthorizedStaNotifyPending = 1;
          }
      }
      if(jobStatus === 1){
        //back to wait
        if(this.userCallNodeId === afterCreatetoNodeId ){
          if(groupId === 3){
          this.checkLamNotifyWait = 1;
          }
          if(groupId === 2){
          this.checkGenNotifyWait = 1;
          }
          if(groupId === 4){
          this.checkStaNotifyWait = 1;
          }
          //call alert modal | new request
          this.openModalAlert();
        }

        if(groupId === 3){
          this.checkUnAuthorizedLamNotifyWait = 1;
        }
        if(groupId === 2){
          this.checkUnAuthorizedGenNotifyWait = 1;
        }
        if(groupId === 4){
          this.checkUnAuthorizedStaNotifyWait = 1;
        }
      }
    }
  });

  }

  openModalAlert(){
   
    this.modalAlert?.open()
  }

  private clearNotify(panel: PanelKey) {
    if (panel === 'lam') {
      this.checkLamNotifyWait = 0;
      this.checkLamNotifyPending = 0;
      this.checkUnAuthorizedLamNotifyWait = 0;
      this.checkUnAuthorizedLamNotifyPending = 0;
    }
  
    if (panel === 'gen') {
      this.checkGenNotifyWait = 0;
      this.checkGenNotifyPending = 0;
      this.checkUnAuthorizedGenNotifyWait = 0;
      this.checkUnAuthorizedGenNotifyPending = 0;
    }
  
    if (panel === 'sta') {
      this.checkStaNotifyWait = 0;
      this.checkStaNotifyPending = 0;
      this.checkUnAuthorizedStaNotifyWait = 0;
      this.checkUnAuthorizedStaNotifyPending = 0;
    }
  }
  
  private handleScrollClear(panel: PanelKey, el?: HTMLDivElement ) {
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    if (atBottom) this.clearNotify(panel);
  }
  
  private handleClickClear(panel: PanelKey) {
    // ✅ คลิกเมื่อไหร่ก็ clear ได้เลย
    this.clearNotify(panel);
  }
  

  onLamScroll() {
    this.handleScrollClear('lam', this.lamScroll?.nativeElement);
  }
  
  onGenScroll() {
    this.handleScrollClear('gen', this.genScroll?.nativeElement);
  }
  
  onStaScroll() {
    this.handleScrollClear('sta', this.staScroll?.nativeElement);
  }
  

  onLamClick() { this.handleClickClear('lam'); }
  onGenClick() { this.handleClickClear('gen'); }
  onStaClick() { this.handleClickClear('sta'); }





  private buildLamSectionFromJobs() {
    const allRows: RowItem[] = this.jobLaminations.map(job => {
  
      // ✅ ใช้ createAt แทน state.date
      const createdAt = job.createAt
        ? new Date(job.createAt)
        : null;
  
      // เวลา HH:mm
      const timeStr = createdAt
        ? createdAt.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        : '';
  
      // วันที่ dd/MM/yyyy
      const dateStr = createdAt
        ? createdAt.toLocaleDateString('th-TH', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        : '';
  
      // status (ยังใช้ latestState เพื่อบอก wait / pending)
      const latestState =
        job.states && job.states.length > 0 ? job.states[0] : null;
  
      let status: 'wait' | 'pending' = 'wait';
      if (
        latestState &&
        latestState.stateJobName.toLowerCase() === 'pending'
      ) {
        status = 'pending';
      }


      const incharge = 
      status === 'pending'
        ? {
            userInchargeId: latestState?.userInchargeId ?? null,
            userInchargeName: latestState?.userInchargeName ?? null,
            userInchargeEmpNo: latestState?.userInchargeEmpNo ?? null,
            userInchargeDate: latestState?.date ?? null,
          
          }
        : {
            userInchargeId: null,
            userInchargeName: null,
            userInchargeEmpNo: null,
            userInchargeDate: null,
          };

  
      return {
        time: timeStr,
        date: dateStr,
        machineName: job.machineName,
        status,
  
        // --- fields เดิม ---
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
        priority: job.priority,
        jobNo: job.jobNo,
        createAt: createdAt ? createdAt.toISOString() : null,

        ...incharge,
      };
    });
  
    const waitCount = allRows.filter(r => r.status === 'wait').length;
    const pendingCount = allRows.filter(r => r.status === 'pending').length;
  
    this.buildLamination = {
      waitCount,
      pendingCount,
      Rows: allRows,
    };
  }
  

  private  buildGenStaFromJobs(groupType: string){
    let rowTemp: JobRow[] = []; 
      if(groupType === "General"){
        rowTemp = this.jobGenerals
      }
      if(groupType === "Stator"){
        rowTemp = this.jobStators
      }

      const allRows: RowItem[] = rowTemp.map(job => {
        // เอา state ล่าสุดของ job นี้ (สมมติ backend sort date desc มาแล้ว ถ้าไม่มั่นใจค่อย sort เอง)
        const latestState = job.states && job.states.length > 0
          ? job.states[0]
          : null;


        // ✅ ใช้ createAt แทน state.date
        const createdAt = job.createAt
        ? new Date(job.createAt)
        : null;


      // เวลา HH:mm
      const timeStr = createdAt
      ? createdAt.toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      : '';


      // วันที่ dd/MM/yyyy
      const dateStr = createdAt
        ? createdAt.toLocaleDateString('th-TH', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        : '';

        let status: 'wait' | 'pending' = 'wait';
        if (latestState && latestState.stateJobName.toLowerCase() === 'pending') {
          status = 'pending';
        }

        const incharge = 
        status === 'pending'
          ? {
              userInchargeId: latestState?.userInchargeId ?? null,
              userInchargeName: latestState?.userInchargeName ?? null,
              userInchargeEmpNo: latestState?.userInchargeEmpNo ?? null,
              userInchargeDate: latestState?.date ?? null,
            }
          : {
              userInchargeId: null,
              userInchargeName: null,
              userInchargeEmpNo: null,
              userInchargeDate: null,
            };
    
        return {
          time: timeStr,
          date: dateStr,
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
          priority: job.priority,
          jobNo: job.jobNo,
          createAt: createdAt ? createdAt.toISOString() : null,

          ...incharge,
        };
      });

       //  นับยอด wait / pending
    const waitCount = allRows.filter(r => r.status === 'wait').length;
    const pendingCount = allRows.filter(r => r.status === 'pending').length;

    if(groupType === "General"){
      this.buildGeneral = {
        waitCount,
        pendingCount,
        Rows: allRows,
      };
    }
    if(groupType === "Stator"){
      this.buildStator = {
        waitCount,
        pendingCount,
        Rows: allRows,
      };
    }
    
  }
  
  // onUpdateRow(row: RowItem) {
  //   // TODO: เปิด modal / เรียก API / เปลี่ยนสถานะ ฯลฯ
  //   console.log('Update clicked:', row);
  // }


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
      this.sortSectionRows(this.buildLamination);
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
        this.sortSectionRows(this.buildGeneral);
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
        this.sortSectionRows(this.buildStator);
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


  fetchCallNode(){
    this.http.get(config.apiServer + '/api/callnode/list').subscribe({
      next: (res: any) => {
        this.callNodes = res.results || [];
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


  //sort data follow urgent status

  private toMs(dateStr?: string, timeStr?: string): number {
    if (!dateStr) return 0;
  
    // รองรับทั้ง dd/MM/yyyy และ dd-MM-yyyy
    const normalized = dateStr.replace(/-/g, '/').trim();
    const parts = normalized.split('/'); // [dd, MM, yyyy] หรือ [yyyy, MM, dd] ก็ได้
    let d: number, m: number, y: number;
  
    if (parts[0].length === 4) {
      // yyyy/MM/dd
      y = Number(parts[0]);
      m = Number(parts[1]);
      d = Number(parts[2]);
    } else {
      // dd/MM/yyyy
      d = Number(parts[0]);
      m = Number(parts[1]);
      y = Number(parts[2]);
    }
  
    const [hh, mm] = (timeStr || '00:00').split(':').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0);
  
    return isNaN(dt.getTime()) ? 0 : dt.getTime();
  }



  private sortSectionRows(section: BuildSection) {
    if (!section?.Rows) return;
  
    section.Rows = [...section.Rows].sort((a, b) => {
      const aUrgent = (a.priority || '').toLowerCase() === 'urgent';
      const bUrgent = (b.priority || '').toLowerCase() === 'urgent';
  
      // 1) urgent มาก่อน
      if (aUrgent !== bUrgent) return aUrgent ? -1 : 1;
  
      // 2) เก่าก่อนอยู่บน (สร้างก่อน)
      const aMs = this.toMs(a.date, a.time);
      const bMs = this.toMs(b.date, b.time);
  
      return aMs - bMs;
    });
  }



  onDetail(item: RowItem) {
    this.modal.open('detail', undefined, {
      createByUserName: item.createByUserName,
      createByUserEmpNo: item.createByUserEmpNo,
      groupName: item.groupName,
      machineName: item.machineName,
      fromNodeName: item.fromNodeName,
      toNodeName: item.toNodeName,
      remark: item.remark,
      priority: item.priority as any,
      userInchargeId: item.userInchargeId ?? undefined  ,
      userInchargeName: item.userInchargeName ?? undefined,
      userInchargeEmpNo: item.userInchargeEmpNo ?? undefined
    });
  }


  private isOverMinutes(iso?: string | null, minutes = 5): boolean {
    if (!iso) return false;
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return false;
    return (Date.now() - t) >= minutes * 60 * 1000;
  }
  
  isJobLate(item: RowItem): boolean {
    return this.isOverMinutes(item.createAt, 5);
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
