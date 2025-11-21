import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router,RouterModule } from '@angular/router';
import { MyModal } from '../my-modal/my-modal.component';
import Swal from 'sweetalert2';
import config from '../../config';

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

type GroupRow = {
  id: number;
  name: string;
  State: string;
  createdAt: string;
  updateAt: string;
};

type SectionRow = {
  id: number;
  name: string;
  State: string;
  createdAt: string;
  updateAt: string;
};

type SubSectionRow = {
  id: number;
  name: string;
  State: string;
  createdAt: string;
  updateAt: string;
};

@Component({
  selector: 'app-call-nodes',
  standalone: true,
  imports: [FormsModule,MyModal,RouterModule,CommonModule],
  templateUrl: './call-nodes.component.html',
  styleUrl: './call-nodes.component.css'
})
export class CallNodesComponent {
   @ViewChild(MyModal) myModal!: MyModal;
  
    constructor(private http: HttpClient, private router: Router) {}
  
    callNodes: callNodeRow[] = []
    isLoading = false;
    groups: GroupRow[] = [];
    sections: SectionRow[] = [];
    subSections: SubSectionRow[] = [];
    selectedGroupId: number | null = null;
    selectedSectionId: number | null = null;
    selectedSubSectionId: number | null = null;
    codeName = '';


    private resetForm() {
      this.codeName = '';
      this.selectedGroupId = null;
      this.selectedSectionId = null;
      this.selectedSubSectionId = null;
      this.subSections = [];
    }


    
    ngOnInit() {
       this.fetchGroup();
      this.fetchSection();
      this.fetchCallNode();
    }


  
    openModal() {
      // รีเซ็ตค่าในฟอร์มก่อนเปิด
      // เรียกใช้ฟังก์ชัน open() ของ child component
      this.codeName = '';
      this.selectedGroupId = null;
      this.selectedSectionId = null;
      this.selectedSubSectionId = null; 
      this.subSections = [];
      this.myModal.open();
    }


    fetchSection(){
      this.http.get(config.apiServer + '/api/section/list').subscribe({
        next: (res: any) => {
          this.sections = res.results || [];
          // console.log('sections : ', this.sections);
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

    fetchSubSectionBySection(){
      // ถ้าไม่ได้เลือก section ไม่ต้องยิง API
      if (!this.selectedSectionId) {
        this.subSections = [];
        this.selectedSubSectionId = null;
        return;
      }

      this.http
      .post(config.apiServer + '/api/subsection/filterBySection', {
        sectionId: this.selectedSectionId,
      })
      .subscribe({
        next: (res: any) => {
          // backend ส่ง { results: [...] }
          this.subSections = res.results || [];
          this.selectedSubSectionId = null; // เลือกใหม่ทุกครั้งที่เปลี่ยน section
        },
        error: (err) => {
          Swal.fire({
            title: 'Error',
            text: err.message || 'Cannot load Subsection',
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

    createCallNode(){
      if(this.isLoading) return ;

      const code = this.codeName?.trim();

      if (!code || !this.selectedGroupId || !this.selectedSectionId || !this.selectedSubSectionId) {
        Swal.fire({
          title: 'ตรวจสอบข้อมูล',
          text: 'กรุณากรอก Code และเลือก Group, Section, Subsection ให้ครบ',
          icon: 'warning',
        });
        return;
      }
      //get role
      const role = localStorage.getItem('calling_role');
      const payload = {
        role,
        code,
        groupId: this.selectedGroupId,
        sectionId: this.selectedSectionId,
        subSectionId: this.selectedSubSectionId,
      };

      this.isLoading = true;
      
      this.http.post(config.apiServer + '/api/callnode/add', payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;

        Swal.fire({
          title: 'สำเร็จ',
          text: 'สร้างตำแหน่งเรียบร้อยแล้ว',
          icon: 'success',
          timer: 1500,
        });
         // ปิด modal + เคลียร์ฟอร์ม
         this.myModal.close();
         this.codeName = '';
         this.selectedGroupId = null;
         this.selectedSectionId = null;
         this.selectedSubSectionId = null;
         this.subSections = [];

          //*************************************************************** */
         // TODO: ถ้ามี API list callNodes ให้เรียกมารีเฟรชตาราง
         this.fetchCallNode();

       },
       error: (err) => {
         this.isLoading = false;
 
         let msg =
           err.error?.message ||
           err.message ||
           'เกิดข้อผิดพลาดในการสร้างตำแหน่ง';
 
         if (err.error?.message === 'Position_already_exists') {
           msg = 'ตำแหน่งนี้ถูกสร้างไว้แล้ว';
         } else if (err.error?.message === 'Role_not_allowed') {
           msg = 'สิทธิ์ของคุณไม่อนุญาตให้สร้างตำแหน่งนี้';
         }
 
         Swal.fire({
           title: 'ไม่สามารถบันทึกได้',
           text: msg,
           icon: 'error',
         });
       },
     });
     

    }

    clearForm() {
      this.resetForm();
    }



    
  edit(item:any){

  }

  remove(item:any){

  }



  



}
