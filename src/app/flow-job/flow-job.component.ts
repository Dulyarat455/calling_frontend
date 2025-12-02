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

  ngOnInit() {
    this.fetchGroup();
    this.fetchFlowJob();
  }

  openModal() {
    this.clearForm();
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
      this.selectedFromNodeId = null; // เลือกใหม่ทุกครั้งที่เปลี่ยน group
      this.selectedToNodeId = null;
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
  }

  edit(item:any){

  }

  remove(item:any){
    
  }




}
