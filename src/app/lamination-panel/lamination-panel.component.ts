import { Component, EventEmitter, Input, Output, ViewChild, SimpleChanges, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalTemplateComponent } from '../modal-template/modal-template.component';
import { HttpClient } from '@angular/common/http';
import { Router} from '@angular/router';

// import { AlertRequestComponent } from '../alert-request/alert-request.component';
import Swal from 'sweetalert2';
import config from '../../config';


export type Status = 'wait' | 'pending';
export interface RowItem {
  time: string;
  status: Status;
  date: string; 
  //addnew
  jobId:number;
  createByUserId: number;
  createByUserName: string;
  createByUserEmpNo: string;
  userInchargeId: number | null;
  userInchargeName: string | null; 
  userInchargeEmpNo: string | null;
  userInchargeDate: string | null;
  remark: string;
  machineId: number;
  machineName: string;
  groupId: number;
  groupName: string;
  fromNodeId: number;
  fromNodeName: string;
  toNodeId: number;
  toNodeName: string;
  priority: string;
  jobNo: string | null;
  createAt: string | null;
}


export interface LaminationGroup {
  title?: string;   // ชื่อหัวการ์ด (แถบสีดำ)
  header?: string;  // ชื่อแถบเขียว ("Lamination")
  waitCount: number;
  pendingCount: number;
  Rows: RowItem[]
}


//at modal form
type GroupRow = {
  id: number;
  name: string;
  State: string;
  createdAt: string;
  updateAt: string;
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


type JobAction = 'accept' | 'cancel' | 'confirm';

type ActionUI = {
  title: string;
  confirmText: string;
  confirmColor: string;
  cancelText: string;
  icon: 'question' | 'warning' | 'info';
  successText: string;
};


@Component({
  selector: 'app-lamination-panel',
  standalone: true,
  imports: [CommonModule,ModalTemplateComponent],
  templateUrl: './lamination-panel.component.html',
  styleUrl: './lamination-panel.component.css'
})
export class LaminationPanelComponent {
  @Input() laminationData!: LaminationGroup;
  @Input() checkNotifyWait: number = 0;
  @Input() checkNotifyPending: number = 0;
  
  @Output() notifyWaitCleared = new EventEmitter<void>();
  @Output() notifyPendingCleared = new EventEmitter<void>();

  @ViewChild('assignJobModal') modal!: ModalTemplateComponent;
  @ViewChild('lamScrolPanel') lamScroll?: ElementRef<HTMLDivElement>;

  constructor(private http: HttpClient, private router: Router) {}
  //user current
  modalName: string = "Lamination AssignJob";
  userRole: string = "";
  userName: string = "";
  userId: number | null = null; 
  sectionId: number | null = null;
  sectionName: string = "";
  empNo: string = "";
  subSectionId: number | null = null;
  subSectionName: string = "";
  groupId: number | null = null;
  groupName: string = "";
  valueUserCallNodeId: number | null = null;
  valueUserCallNodeName: string = "";

  //at modal form
  machines: MachineRow[] = [];
  groups: GroupRow[] = [];
  callNodes: CallNodeRow[] = []; 
  filterByGroupFromNodecallNodes: CallNodeRow[] = [];

  selectedGroupId: number | null = null;
  selectedMachineId: number | null = null;
  selectedToCallNodeId: number | null = null;
  remarkJobValue: string = "";
  priorityValue: string = "";
  isLoading = false;


  ngOnInit() {
    this.userName = localStorage.getItem('calling_name')!;
    this.userRole = localStorage.getItem('calling_role')!;
    this.empNo = localStorage.getItem('calling_empNo')!;
    this.userId = parseInt(localStorage.getItem('calling_id')!);
    this.sectionId = parseInt(localStorage.getItem("calling_sectionId")!);
    this.sectionName = localStorage.getItem("calling_section")!;
    this.subSectionId = parseInt(localStorage.getItem("calling_subSectionId")!);
    this.subSectionName = localStorage.getItem("calling_subSection")!;
    this.groupId = parseInt(localStorage.getItem("calling_groupId")!);
    this.groupName = localStorage.getItem("calling_group")!;
    this.valueUserCallNodeName = localStorage.getItem("calling_callNodeCode")!;

    this.fetchGroup();
    this.fetchMachineByGroup();
    this.fetchCallNodeByGroup();
    this.fetchCallNodeFollowUser();
    
  }

  // length for limit remark
  readonly REMARK_MAX_LENGTH = 18;

  isLongRemark(remark?: string | null): boolean {
    return (remark ?? '').length > this.REMARK_MAX_LENGTH;
  }


  //for action button 
  private readonly ACTION_UI: { [K in JobAction]: ActionUI } = {
    accept: {
      title: 'ยืนยันการ Accept?',
      confirmText: 'Accept',
      confirmColor: '#12d32f',
      cancelText: 'ยกเลิก',
      icon: 'question',
      successText: 'Accept เรียบร้อย',
     
    },
    cancel: {
      title: 'ยืนยันการ Cancel?',
      confirmText: 'Cancel',
      confirmColor: '#eb1207',
      cancelText: 'กลับ',
      icon: 'warning',
      successText: 'Cancel เรียบร้อย',
    },
    confirm: {
      title: 'ยืนยันการ Confirm?',
      confirmText: 'Confirm',
      confirmColor: '#463df1',
      cancelText: 'ยกเลิก',
      icon: 'info',
      successText: 'Confirm เรียบร้อย',
    },
  };

  jobActionLoading = false;

  async onJobAction(item: RowItem, action: JobAction) {
    if (this.jobActionLoading) return;
  
    const ui = this.ACTION_UI[action];
  
    const result = await Swal.fire({
      title: ui.title,
      html: `
        <div>
          <div><b>Machine:</b> ${item.machineName}</div>
          <div><b>To:</b> ${item.toNodeName}</div>
          <div><b>Status:</b> ${item.status}</div>
          ${item.remark ? `<div><b>Remark:</b> ${item.remark}</div>` : ''}
        </div>
      `,
      icon: ui.icon,
      showCancelButton: true,
      confirmButtonText: ui.confirmText,
      cancelButtonText: ui.cancelText,
      confirmButtonColor: ui.confirmColor,
     
    });
  
    if (!result.isConfirmed) return;
  
    // ✅ กัน userId / nodeId null
    if (this.userId == null || this.valueUserCallNodeId == null) {
      Swal.fire({ title: 'Error', text: 'ไม่พบ userId/nodeId', icon: 'error' });
      return;
    }
  
    this.jobActionLoading = true;
  
    // ✅ payload ส่งไปหลังบ้าน (ปรับตาม API จริงของคุณ)
    const payload = {
      jobId: item.jobId,
      action, // 'accept' | 'cancel' | 'confirm'
      userId: this.userId,
    };
  
    this.http.post(config.apiServer + '/api/job/updateJob', payload).subscribe({
      next: () => {
        this.jobActionLoading = false;
        Swal.fire({
          title: 'สำเร็จ',
          text: ui.successText,
          icon: 'success',
          timer: 1200,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        this.jobActionLoading = false;
        Swal.fire({
          title: 'ผิดพลาด',
          text: err?.error?.message || err.message || 'ทำรายการไม่สำเร็จ',
          icon: 'error',
        });
      },
    });
  }
  
  
  onLamScroll() {
    const el = this.lamScroll?.nativeElement;
    if (!el) return;
  
    const atBottom =  el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    
  
    if (atBottom) {
      this.notifyWaitCleared.emit(); // ✅ ให้ parent เคลียร์
      this.notifyPendingCleared.emit();
    }
  }


  onLamClick() {
    const el = this.lamScroll?.nativeElement;
    if (!el) return;
      this.notifyWaitCleared.emit(); // ✅ ให้ parent เคลียร์
      this.notifyPendingCleared.emit();
  }


  fetchGroup(){
    this.http.get(config.apiServer + '/api/group/list').subscribe({
      next: (res: any) => {
        this.groups = res.results || [];
     
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

  fetchMachineByGroup(){
    this.http
      .post(config.apiServer + '/api/machine/filterByGroup', {
        groupId: this.groupId,
      })
      .subscribe({
        next: (res: any) => {
          this.machines = (res.results || []).map((r: any) => ({
            id: r.id,
            code: r.code ,
            groupId: r.groupId,
            isActive: r.isActive,
            state: r.State,
            groupName: r.Groups?.name ?? '',
          }))
          this.selectedMachineId = null; // เลือกใหม่ทุกครั้งที่เปลี่ยน Group
        },
        error: (err) => {
          Swal.fire({
            title: 'Error',
            text: err.message || 'Cannot load Machines',
            icon: 'error',
          });
        },
      });
  }

  fetchCallNodeByGroup(){
    this.http
    .post(config.apiServer + '/api/callnode/filterByGroup', {
      groupId: this.groupId,
    })
    .subscribe({
      next: (res: any) => {
        this.callNodes = res.results || [];
        this.selectedToCallNodeId = null; 
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: err.message || 'Cannot load Node',
          icon: 'error',
        });
      },
    });
  }

  fetchCallNodeFollowUser(){
    this.http
    .post(config.apiServer + '/api/callnode/filterTriParam', {
      groupId: this.groupId,
      sectionId: this.sectionId,
      subSectionId: this.subSectionId
    })
    .subscribe({
      next: (res: any) => {
      this.valueUserCallNodeId = res.row.id;
      this.applyUserFilterAndRecount();
      this.fetchCallNodeByGroupFromNode();
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: err.message || 'Cannot load Node',
          icon: 'error',
        });
      },
    });
  }

  fetchCallNodeByGroupFromNode(){
    this.http
    .post(config.apiServer + '/api/callnode/filterByGroupFromNode',{
      groupId: this.groupId,
      fromNodeId: this.valueUserCallNodeId  //***must call fetchCallNodeFollowUser success before use this value*/
    })
    .subscribe({
      next: (res: any) => {
        this.filterByGroupFromNodecallNodes =  res.results || [] ;
        },
        error: (err) => {
          Swal.fire({
            title: 'Error',
            text: err.message || 'Cannot load Node',
            icon: 'error',
          });
        },
    })
  }


  openModal(item?: RowItem) {
    this.modal.open('create');
  }


  onSaved(data: any) {
     if(this.isLoading) return ;
      console.log(`onSaved :  remark: ${this.remarkJobValue} 
        groupId: ${this.groupId} selectedToCallNodeId ${this.selectedToCallNodeId} 
        selectedMachineId: ${this.selectedMachineId} userId: ${this.userId}    
        `
        
      )
     if ( this.groupId == null || this.selectedToCallNodeId == null || this.selectedMachineId == null
        || this.userId == null || this.valueUserCallNodeId == null
     ){
            Swal.fire({
              title: 'ตรวจสอบข้อมูล',
              text: 'กรุณากรอก ข้อมูลให้ครบ',
              icon: 'warning',
            });
            return;
      }

      const payload = {
        groupId: this.groupId,
        machineId: this.selectedMachineId,
        fromNodeId: this.valueUserCallNodeId,
        toNodeId: this.selectedToCallNodeId,
        userId: this.userId,
        remark: this.remarkJobValue,
        priority: this.priorityValue,
      };

      this.isLoading = true;

      this.http.post(config.apiServer + '/api/job/create', payload).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          
          Swal.fire({
            title: 'สำเร็จ',
            text: 'Assign Job Success',
            icon: 'success',
            timer: 1500,
          });
           // ปิด modal + เคลียร์ฟอร์ม
           this.modal.close();

          // เคลียร์ค่าใน parent ถ้าต้องการ
          this.selectedMachineId = null;
          this.selectedToCallNodeId = null;
          this.remarkJobValue = '';
  
      
          //  this.fetchCallNode();
  
         },
         error: (err) => {
           this.isLoading = false;
   
           let msg =
             err.error?.message ||
             err.message ||
             'เกิดข้อผิดพลาดในการสร้าง Assign Job';

   
           Swal.fire({
             title: 'ไม่สามารถ Assign Job',
             text: msg,
             icon: 'error',
           });
         },
       });

    console.log('บันทึกข้อมูลแล้ว:', data);

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
  

  onMachineSelected(machineId: number) {
    this.selectedMachineId = machineId;
    console.log('Selected machine:', machineId);
  }

  onCallNodeToSelected(callNodeId: number) {
    this.selectedToCallNodeId = callNodeId;
    console.log("selected callNode:",callNodeId);
  }

  onRemarkValue(remarkValue: string){
     this.remarkJobValue = remarkValue;
     console.log("input remark:", remarkValue); 
  }

  onPriorityValue(priorityValue: string){
     this.priorityValue = priorityValue;
     console.log(priorityValue);
  }
  

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
  

  private isOverMinutes(iso?: string | null, minutes = 5): boolean {
    if (!iso) return false;
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return false;
    return (Date.now() - t) >= minutes * 60 * 1000;
  }
  
  isJobLate(item: RowItem): boolean {
    return this.isOverMinutes(item.createAt, 5);
  }
  


  private originalRows: RowItem[] = [];


  private applyUserFilterAndRecount() {
    if (this.userRole !== 'user') return;
    if (!this.laminationData) return;
  
    // ต้องมีอย่างน้อย 1 อย่างเพื่อ filter ได้
    const nodeId = this.valueUserCallNodeId;
    const uid = this.userId;
  
    if (!nodeId && !uid) return;
  
    // 1) filter เฉพาะงานของ user (OR condition)
    let rows = this.originalRows.filter(r =>
      (nodeId != null && r.toNodeId === nodeId) ||
      (uid != null && r.createByUserId === uid)
    );
  
    // 2) sort (urgent ก่อน + เก่าก่อน)
    rows.sort((a, b) => {
      const aUrgent = (a.priority || '').toLowerCase() === 'urgent';
      const bUrgent = (b.priority || '').toLowerCase() === 'urgent';
      if (aUrgent !== bUrgent) return aUrgent ? -1 : 1;
  
      const aMs = this.toMs(a.date, a.time);
      const bMs = this.toMs(b.date, b.time);
      return aMs - bMs;
    });
  
    // 3) recount ใหม่เฉพาะ user
    this.laminationData.waitCount = rows.filter(r => r.status === 'wait').length;
    this.laminationData.pendingCount = rows.filter(r => r.status === 'pending').length;
  
    // 4) update rows
    this.laminationData.Rows = rows;
  }
  

  ngOnChanges(changes: SimpleChanges) {
    if (changes['laminationData']?.currentValue) {
      // เก็บข้อมูลต้นฉบับจาก parent
      this.originalRows = [...(this.laminationData?.Rows || [])];
      // ใช้เฉพาะ role user
      this.applyUserFilterAndRecount();
    }
  }
  
  

}
