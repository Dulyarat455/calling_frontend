import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router,RouterModule } from '@angular/router';
import { MyModal } from '../my-modal/my-modal.component';
import Swal from 'sweetalert2';
import config from '../../config';


type GroupRow = {
  id: number;
  name: string;
  State: string;
  createdAt: string;
  updateAt: string;
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

type FlowJobRow ={
  id:number;
  state: string;
  status: string;
  groupId: number;
  groupName: string;
  fromNodeId: number;
  fromNodeName: string;
  toNodeId: number;
  toNodeName: string;
}

@Component({
  selector: 'app-flow-job',
  standalone: true,
  imports: [CommonModule,FormsModule,RouterModule,MyModal],
  templateUrl: './flow-job.component.html',
  styleUrl: './flow-job.component.css'
})
export class FlowJobComponent {



  @ViewChild(MyModal) myModal!: MyModal;
  constructor(private http: HttpClient, private router: Router) {}

  isLoading = false;
  groups: GroupRow[] = [];
  callNodes: CallNodeRow[] = [];
  flowJobs: FlowJobRow[] = [];
  selectedGroupId: number | null = null;
  selectedFromNodeId: number | null = null;
  selectedToNodeId: number | null = null;

  modalMode: 'create' | 'edit' = 'create';
  editingId: number | null = null;


  ngOnInit() {
    this.fetchGroup();
    this.fetchFlowJob();
  }

  openModal() {
    this.clearForm();
    this.modalMode = 'create';
    this.editingId = null;
    this.myModal.open();
  }

  fetchGroup(){
    this.http.get(config.apiServer + '/api/group/list').subscribe({
      next: (res: any) => {
        this.groups = res.results || [];
        // console.log('groups : ', this.groups);
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
  // callnode/filterByGroup

  fetchCallNodeByGroup(){
   // ถ้าไม่ได้เลือก section ไม่ต้องยิง API
   if (!this.selectedGroupId) {
    this.callNodes = [];
    this.selectedFromNodeId = null;
    this.selectedToNodeId = null;
    return;
  }

  this.http
  .post(config.apiServer + '/api/callnode/filterByGroup', {
    groupId: this.selectedGroupId,
  })
  .subscribe({
    next: (res: any) => {
      // backend ส่ง { results: [...] }
      this.callNodes = res.results || [];
      // ✅ ถ้าเป็น create ค่อย reset แต่ถ้า edit ไม่ต้อง reset
      if (this.modalMode !== 'edit') {
        this.selectedFromNodeId = null;
        this.selectedToNodeId = null;
      }
    },
    error: (err) => {
      Swal.fire({
        title: 'Error',
        text: err.message || 'Cannot load CallNodes',
        icon: 'error',
      });
    },
  });
  }


  fetchFlowJob(){
    this.http.get(config.apiServer + '/api/flowJob/list').subscribe({
      next: (res: any) => {
        this.flowJobs = res.results || [];
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

  createFlowJob(){
    if(this.isLoading) return ;

    if (this.selectedGroupId == null || this.selectedFromNodeId == null || this.selectedToNodeId == null) {
            Swal.fire({
              title: 'ตรวจสอบข้อมูล',
              text: 'กรุณาเลือก ข้อมูล ให้ครบ',
              icon: 'warning',
            });
            return;
    }

    const role = localStorage.getItem('calling_role');

    if(role !== "admin"){
      Swal.fire({
        title: 'Role not allowed',
        text: 'ไม่สามารถบันทึกข้อมูลได้',
        icon: 'warning',
      });
      return;
    }

    const payload = {
      role,
      groupId: this.selectedGroupId,
      fromNodeId: this.selectedFromNodeId,
      toNodeId: this.selectedToNodeId,
    };

    this.isLoading = true;

    this.http.post(config.apiServer + '/api/flowJob/add', payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;

        Swal.fire({
          title: 'สำเร็จ',
          text: 'Map FlowJob เรียบร้อยแล้ว',
          icon: 'success',
          timer: 1500,
        });
         // ปิด modal + เคลียร์ฟอร์ม
        this.myModal.close();
        this.clearForm();
      
         // TODO: ถ้ามี API list callNodes ให้เรียกมารีเฟรชตาราง
        this.fetchFlowJob();

       },
       error: (err) => {
         this.isLoading = false;
 
         let msg =
           err.error?.message ||
           err.message ||
           'เกิดข้อผิดพลาดในการสร้างตำแหน่ง';
 
         Swal.fire({
           title: 'ไม่สามารถบันทึกได้',
           text: msg,
           icon: 'error',
         });
       },
     });
     
  }


  clearForm(){
    this.selectedGroupId = null;
    this.selectedFromNodeId = null;
    this.selectedToNodeId = null;
    this.callNodes = [];
    this.modalMode = 'create';
    this.editingId = null;
  }


  submitFlowJob() {
    if (this.isLoading) return;
  
    if (this.selectedGroupId == null || this.selectedFromNodeId == null || this.selectedToNodeId == null) {
      Swal.fire({ title: 'ตรวจสอบข้อมูล', text: 'กรุณาเลือก ข้อมูล ให้ครบ', icon: 'warning' });
      return;
    }
  
    const role = localStorage.getItem('calling_role');
    if (role !== 'admin') {
      Swal.fire({ title: 'Role not allowed', text: 'ไม่สามารถทำรายการได้', icon: 'warning' });
      return;
    }
  
    const isEdit = this.modalMode === 'edit';
  
    const url = isEdit
      ? config.apiServer + '/api/flowJob/edit'
      : config.apiServer + '/api/flowJob/add';
  
    const payload: any = {
      role,
      groupId: this.selectedGroupId,
      fromNodeId: this.selectedFromNodeId,
      toNodeId: this.selectedToNodeId,
    };
  
    // ✅ backend edit ต้องการ flowJobId
    if (isEdit) {
      if (this.editingId == null) {
        Swal.fire({ title: 'Error', text: 'ไม่พบ id ที่จะแก้ไข', icon: 'error' });
        return;
      }
      payload.flowJobId = this.editingId; // map id -> flowJobId
    }
  
    this.isLoading = true;
  
    this.http.post(url, payload).subscribe({
      next: () => {
        this.isLoading = false;
  
        Swal.fire({
          title: 'สำเร็จ',
          text: isEdit ? 'แก้ไข FlowJob เรียบร้อย' : 'Map FlowJob เรียบร้อยแล้ว',
          icon: 'success',
          timer: 1200,
          showConfirmButton: false,
        });
  
        this.myModal.close();
        this.clearForm();
        this.fetchFlowJob();
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err?.error?.message || err?.message || 'ทำรายการไม่สำเร็จ';
        Swal.fire({ title: 'ไม่สามารถบันทึกได้', text: msg, icon: 'error' });
      },
    });
  }

  




  edit(item: FlowJobRow) {
  this.modalMode = 'edit';
  this.editingId = item.id;

  this.selectedGroupId = item.groupId;
  this.selectedFromNodeId = item.fromNodeId;
  this.selectedToNodeId = item.toNodeId;

  // ✅ โหลด callNodes ให้ dropdown มีตัวเลือกก่อน
  this.fetchCallNodeByGroup();

  this.myModal.open();
}



remove(item: FlowJobRow) {
  Swal.fire({
    title: 'ยืนยันการลบ?',
    html: `
      <div style="text-align:left">
        <div><b>Group:</b> ${item.groupName}</div>
        <div><b>From:</b> ${item.fromNodeName}</div>
        <div><b>To:</b> ${item.toNodeName}</div>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ลบ',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#dc2626',
  }).then((r) => {
    if (!r.isConfirmed) return;

    this.isLoading = true;

    this.http.post(config.apiServer + '/api/flowJob/delete', { flowJobId: item.id }).subscribe({
      next: () => {
        this.isLoading = false;

        Swal.fire({
          title: 'สำเร็จ',
          text: 'ลบ FlowJob เรียบร้อย',
          icon: 'success',
          timer: 1200,
          showConfirmButton: false,
        });

        // ✅ เอาออกจากหน้าเลย
        this.flowJobs = this.flowJobs.filter(x => x.id !== item.id);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err?.error?.message || err?.message || 'ลบไม่สำเร็จ';
        Swal.fire({ title: 'ผิดพลาด', text: msg, icon: 'error' });
      }
    });
  });
}





}
