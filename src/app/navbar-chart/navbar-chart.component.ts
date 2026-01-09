import { Component, ViewChild, ElementRef, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router} from '@angular/router';

import { Subscription } from 'rxjs';
import { CallSocketService } from '../services/call-socket.service';
import { RowItem } from '../lamination-panel/lamination-panel.component';
import { ChartComponent } from '../chart/chart.component';
import config from '../../config';
import Swal from 'sweetalert2';

type BuildSection = {
  waitCount: number;
  pendingCount: number;
  Rows: RowItem[];
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

@Component({
  selector: 'app-navbar-chart',
  standalone: true,
  imports: [ChartComponent],
  templateUrl: './navbar-chart.component.html',
  styleUrl: './navbar-chart.component.css'
})
export class NavbarChartComponent {

  callNodes: callNodeRow[] = []
  jobLaminations: JobRow[] = [];
  jobGenerals: JobRow[] = [];
  jobStators: JobRow[] = [];

  wsSub?: Subscription;

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

  constructor(
    private http: HttpClient, 
    private router: Router,
    private callSocket: CallSocketService,
  ) {}


  ngOnInit() {
      this.fetchCallNode();
      this.fetchJobByLam();
      this.fetchJobByGen();
      this.fetchJobBySta();

      // ✅ ฟัง event จาก websocket
    this.wsSub = this.callSocket.onJobChanged().subscribe((payload: any) => {
      this.fetchJobByGen();
      this.fetchJobByLam();
      this.fetchJobBySta();
      this.fetchCallNode();
    });


  }





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

}
