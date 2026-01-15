import { Component, EventEmitter, Input, ViewChild, Output, SimpleChanges, ElementRef,  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalTemplateComponent } from '../modal-template/modal-template.component';
 
import { HttpClient } from '@angular/common/http';
import { Router} from '@angular/router';


import Swal from 'sweetalert2';
import config from '../../config';


type Status = 'wait' | 'pending';

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
    jobNo: string | null
    createAt: string | null;
}



export interface GroupPanel {
  waitCount: number;
  pendingCount: number;
  Rows: RowItem[];
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
  selector: 'app-general-stator-panel',
  standalone: true,
  imports: [CommonModule,ModalTemplateComponent],
  templateUrl: './general-stator-panel.component.html',
  styleUrls: ['./general-stator-panel.component.css'],
})
export class GeneralStatorPanelComponent {
   @Input() general!: GroupPanel;
   @Input() stator!: GroupPanel;

   @Input() checkGenNotifyWait: number = 0;
   @Input() checkStaNotifyWait: number = 0;

   @Input() checkGenNotifyPending: number = 0;
   @Input() checkStaNotifyPending: number = 0;


   @Output() notifyGenWaitCleared = new EventEmitter<void>();
   @Output() notifyStaWaitCleared = new EventEmitter<void>();

   @Output() notifyGenPendingCleared = new EventEmitter<void>();
   @Output() notifyStaPendingCleared = new EventEmitter<void>();

  
   @ViewChild('assignJobModal') modal!: ModalTemplateComponent;
   @ViewChild('generalScrolPanel') genScroll?: ElementRef<HTMLDivElement>;
   @ViewChild('statorScrolPanel') staScroll?: ElementRef<HTMLDivElement>;

   
    constructor(private http: HttpClient, private router: Router) {}
    //user current
    modalName: string = "Lamination AssignJob"
    userName: string = "";
    userId: number | null = null; 
    sectionId: number | null = null;
    sectionName: string = "";
    empNo: string = "";
    userRole : string = "";
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
      this.empNo = localStorage.getItem('calling_empNo')!;
      this.userRole = localStorage.getItem('calling_role')!;
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

      // console.log("general : ",this.general);
      
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

  // clear notify
  private clearNotify(panel: 'general' | 'stator') {
    if (panel === 'general') {
      this.notifyGenWaitCleared.emit();
      this.notifyGenPendingCleared.emit();
    } else {
      this.notifyStaWaitCleared.emit();
      this.notifyStaPendingCleared.emit();
    }
  }
  


  private handleScrollClear(el: HTMLDivElement | undefined, panel: 'general' | 'stator') {
    if (!el) return;

    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    if (atBottom) this.clearNotify(panel);
  }

 private handleClickClear(el: HTMLDivElement | undefined, panel: 'general' | 'stator') {
    if (!el) return;

    // const noScroll = el.scrollHeight <= el.clientHeight + 1;
    // if (noScroll) this.clearNotify(panel);
    this.clearNotify(panel)
  }

  onGenScroll() {
    this.handleScrollClear(this.genScroll?.nativeElement, 'general');
  }
  onGenClick() {
    this.handleClickClear(this.genScroll?.nativeElement, 'general');
  }
  
  onStaScroll() {
    this.handleScrollClear(this.staScroll?.nativeElement, 'stator');
  }
  onStaClick() {
    this.handleClickClear(this.staScroll?.nativeElement, 'stator');
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
      this.fetchCallNodeByGroupFromNode();

      this.applyUserFilterAndRecountPanel('general');
      this.applyUserFilterAndRecountPanel('stator');
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
  

  
//******************* sort follow urgent ******************** */

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
    return this.isOverMinutes(item.createAt, 20);
  }



  private originalGeneralRows: RowItem[] = [];
  private originalStatorRows: RowItem[] = [];

  private applyUserFilterAndRecountPanel(panelKey: 'general' | 'stator') {
    // ใช้เฉพาะ role user
    const role = localStorage.getItem('calling_role') || '';
    if (role !== 'user') return;
  
    const nodeId = this.valueUserCallNodeId;
    const uid = this.userId;
  
    if (!nodeId && !uid) return;
  
    const panel = panelKey === 'general' ? this.general : this.stator;
    if (!panel) return;
  
    // เลือก original ตาม panel
    const src =
      panelKey === 'general'
        ? this.originalGeneralRows
        : this.originalStatorRows;
  
    // ถ้ายังไม่เคยเก็บ original ให้เก็บครั้งแรก
    if (!src.length && panel.Rows?.length) {
      if (panelKey === 'general') this.originalGeneralRows = [...panel.Rows];
      else this.originalStatorRows = [...panel.Rows];
    }
  
    const base =
      panelKey === 'general'
        ? this.originalGeneralRows
        : this.originalStatorRows;
  
    // 1) filter (OR)
    let rows = (base || []).filter(r =>
      (nodeId != null && r.toNodeId === nodeId) ||
      (uid != null && r.createByUserId === uid) ||
      (this.sectionName === 'PC' && r.toNodeId === 9 )
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
    panel.waitCount = rows.filter(r => r.status === 'wait').length;
    panel.pendingCount = rows.filter(r => r.status === 'pending').length;
  
    // 4) อัปเดต rows
    panel.Rows = rows;
  }
  





ngOnChanges(changes: SimpleChanges) {

  if (changes['general']?.currentValue) {
    // เก็บ original ครั้งแรก/ทุกครั้งที่ parent ส่งมาใหม่
    this.originalGeneralRows = [...(this.general?.Rows || [])];

    // role user → filter + recount + sort ใหม่
    this.applyUserFilterAndRecountPanel('general');
  }

  if (changes['stator']?.currentValue) {
    this.originalStatorRows = [...(this.stator?.Rows || [])];

    this.applyUserFilterAndRecountPanel('stator');
  }


}




onDeleteJob(panelKey: 'general' | 'stator', item: RowItem, ev?: Event) {
  ev?.stopPropagation(); // กัน click ไปโดน onGenClick/onStaClick

  const panel = panelKey === 'general' ? this.general : this.stator;
  if (!panel) return;

  Swal.fire({
    title: 'ยืนยันการลบ Job?',
    html: `
      <div style="text-align:left">
       
        <div><b>Area:</b> ${item.machineName ?? '-'}</div>
        <div><b>To:</b> ${item.toNodeName ?? '-'}</div>
        ${item.remark ? `<div><b>Remark:</b> ${item.remark}</div>` : ''}
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ลบ',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#dc2626',
  }).then((r) => {
    if (!r.isConfirmed) return;

    if (item?.jobId == null) {
      Swal.fire({ title: 'Error', text: 'ไม่พบ jobId', icon: 'error' });
      return;
    }

    this.http.post(config.apiServer + '/api/job/delete', { jobId: item.jobId }).subscribe({
      next: () => {
        Swal.fire({
          title: 'สำเร็จ',
          text: 'ลบ Job เรียบร้อย',
          icon: 'success',
          timer: 1200,
          showConfirmButton: false,
        });

        // ✅ 1) ลบออกจาก panel ที่แสดงอยู่
        panel.Rows = (panel.Rows || []).filter(x => x.jobId !== item.jobId);
        panel.waitCount = panel.Rows.filter(x => x.status === 'wait').length;
        panel.pendingCount = panel.Rows.filter(x => x.status === 'pending').length;

        // ✅ 2) ลบออกจาก original ด้วย (กันมันเด้งกลับตอน filter/recount)
        if (panelKey === 'general') {
          this.originalGeneralRows = (this.originalGeneralRows || []).filter(x => x.jobId !== item.jobId);
        } else {
          this.originalStatorRows = (this.originalStatorRows || []).filter(x => x.jobId !== item.jobId);
        }

        // ✅ 3) ถ้า role user มีการ filter/recount → เรียกซ้ำให้ตรง logic เดิม
        this.applyUserFilterAndRecountPanel(panelKey);
      },
      error: (err) => {
        Swal.fire({
          title: 'ผิดพลาด',
          text: err?.error?.message || err.message || 'ลบไม่สำเร็จ',
          icon: 'error',
        });
      },
    });
  });
}




  
}
