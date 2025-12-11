import { Component,ViewChild,ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router,RouterModule } from '@angular/router';
import { MyModal } from '../my-modal/my-modal.component';


import Swal from 'sweetalert2';
import config from '../../config';
import { group } from '@angular/animations';


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

type UsersRow = {
  id: number;
  name: string;
  password: string;
  empNo: string;
  role: string;
  rfId: number;
  status: string;
  accountState: string;
  groupId: number;
  groupName: string;
  sectionId: number;
  sectionName: string;
  subSectionId: number;
  subSectionName: string;
}


@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [FormsModule,RouterModule,MyModal,CommonModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css'
})
export class SignUpComponent {
  @ViewChild('rfidInput') rfidInput!: ElementRef;
  @ViewChild(MyModal) myModal!: MyModal;

  name: string = '';
  username: string = '';
  empNo:string = '';
  password: string = '';
  role: string = '';
  rfId: string = '';
  isLoading = false;
  searchEmpNo: string = '';
  isEditMode = false;
  editingUserId: number | null = null;


  groups: GroupRow[] = [];
  sections: SectionRow[] = [];
  subSections: SubSectionRow[] = [];
  users: UsersRow[] = [];
  selectedGroupId: number | null = null;
  selectedSectionId: number | null = null;
  selectedSubSectionId: number | null = null;


  constructor(private http: HttpClient, private router: Router) {}



  ngOnInit() {
   this.fetchGroup();
   this.fetchSection();
   this.fetchDataUser();
   
 }


  ngAfterViewInit() {
    // this.focusRFIDInput();

    const modalEl = document.getElementById('modalSignUp');

    if (modalEl) {
      modalEl.addEventListener('shown.bs.modal', () => {
        this.focusRFIDInput();
      });
    }

  }

  // Helper function to focus RFID input
  private focusRFIDInput() {
    if (this.rfidInput) {
      this.rfidInput.nativeElement.focus();
    }
  }


  fetchDataUser(){
    this.http.get(config.apiServer + '/api/user/list').subscribe({
      next: (res: any) => {
        this.users = res.results || [];
        
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

   fetchSubSectionByGroupSection(){
       // ถ้าไม่ได้เลือก section ไม่ต้องยิง API
       if (!this.selectedSectionId && !this.selectedGroupId) {
        this.subSections = [];
        this.selectedSubSectionId = null;
        this.selectedGroupId = null;
        return;
      }

      this.http
      .post(config.apiServer + '/api/subsection/filterByGroupSubSection', {
        sectionId: this.selectedSectionId,
        groupId: this.selectedGroupId
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


   fetchSectionByGroup(){
      // ถ้าไม่ได้เลือก section ไม่ต้องยิง API
      if (!this.selectedGroupId) {
        this.sections = [];
        this.selectedSectionId = null;
        return;
      } 

    this.http
    .post(config.apiServer + '/api/section/filterByGroup', {
        groupId: this.selectedGroupId
    })
    .subscribe({
      next: (res: any) => {
        // backend ส่ง { results: [...] }
        this.sections = res.results || [];
        this.selectedSectionId = null; // เลือกใหม่ทุกครั้งที่เปลี่ยน section
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: err.message || 'Cannot load Section',
          icon: 'error',
        });
      },
    });


   }


    // Handle RFID input
    onRFIDInput(event: any) {
      const value = event.target.value;
  
      // ถ้ามีการป้อน RFID ครบ (ปกติ RFID จะมีความยาวแน่นอน เช่น 10 ตัว)
      if (value.length >= 10) {
        // ปรับตามความยาวจริงของ RFID
        
      }
    }
    
    clearForm(){
      this.name = '';
      this.empNo = '';
      this.password = '';
      this.role = '';
      this.rfId = '';
      this.selectedGroupId = null;
      this.selectedSectionId = null;
      this.selectedSubSectionId = null;
      this.subSections = [];
    }

    openModal() {
      // รีเซ็ตค่าในฟอร์มก่อนเปิด
      this.clearForm();
      // เรียกใช้ฟังก์ชัน open() ของ child component
      this.myModal.open();
      this.isEditMode = false;
      this.editingUserId = null;
    }

  addMember() {
    // 1) validate ฝั่ง client
    if (!this.name || !this.empNo || !this.password || !this.rfId 
      || !this.role || this.selectedGroupId == null ||  this.selectedSectionId == null || this.selectedSubSectionId == null) {
      Swal.fire({
        title: 'ตรวจสอบข้อมูล',
        text: 'โปรดกรอกข้อมูลให้ครบถ้วน (Name, Username, Employee No., Password)',
        icon: 'error',
      });
      return;
    }

    this.isLoading = true;

    const payload = {
      userRole: "admin",
      name: this.name,
      empNo: this.empNo,
      password: this.password,
      role: this.role,
      rfId: this.rfId,
      groupId: Number(this.selectedGroupId),
      sectionId: Number(this.selectedSectionId),
      subSectionId: Number(this.selectedSubSectionId)
    };

    this.http.post(config.apiServer + '/api/user/create', payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;

        if (res.message === 'user_already_exists') {
          let msg = 'ข้อมูลผู้ใช้ซ้ำในระบบ';
          if (res.detail?.empNo) msg += '\n- Employee No. นี้ถูกใช้แล้ว';
          if (res.detail?.name) msg += '\n- name นี้ถูกใช้แล้ว';
          if (res.detail?.rfId) msg += '\n- RFID นี้ถูกใช้แล้ว';

          Swal.fire({
            title: 'ไม่สามารถสร้างผู้ใช้ได้',
            text: msg,
            icon: 'error',
          });
          return;
        }

        Swal.fire({
          title: 'สร้างบัญชีสำเร็จ',
          text: 'สามารถใช้บัญชีนี้เข้าสู่ระบบได้แล้ว',
          icon: 'success',
          timer: 1500,
          showConfirmButton: true,
        })
        
        this.fetchDataUser();
        this.myModal.close();
        this.clearForm();
      },
      error: (error) => {
        this.isLoading = false;
        console.error(error);

        const msg =
          error.error?.message ||
          error.error?.error ||
          'เกิดข้อผิดพลาดในการสร้างบัญชี';

        Swal.fire({
          title: 'ไม่สามารถสร้างผู้ใช้ได้',
          text: msg,
          icon: 'error',
        });
      },
    });
  }

  onEditClick(item: UsersRow) {
    // เข้าโหมด edit
    this.isEditMode = true;
    this.editingUserId = item.id;
  
    // เติมฟิลด์พื้นฐาน
    this.name = item.name;
    this.empNo = item.empNo;
    this.password = item.password;            // ปกติไม่ preload password
    this.role = item.role;
    this.rfId = String(item.rfId ?? '');
  
    // group / section / subSection จาก row
    this.selectedGroupId = item.groupId || null;
    this.selectedSectionId = null;
    this.selectedSubSectionId = null;
  
    // 1) โหลด Section ตาม group ของ user ก่อน
    this.http
      .post(config.apiServer + '/api/section/filterByGroup', {
        groupId: item.groupId,
      })
      .subscribe({
        next: (res: any) => {
          this.sections = res.results || [];
  
          // set section ที่ user เคยอยู่
          this.selectedSectionId = item.sectionId || null;
  
          if (!this.selectedSectionId) {
            // ถ้า user ไม่มี section ก็เปิด modal ได้เลย
            this.myModal.open();
            return;
          }
  
          // 2) โหลด SubSection ตาม section ของ user
          this.http
            .post(config.apiServer + '/api/subsection/filterBySection', {
              sectionId: this.selectedSectionId,
            })
            .subscribe({
              next: (res2: any) => {
                this.subSections = res2.results || [];
                this.selectedSubSectionId = item.subSectionId || null;
  
                // ทุกอย่างพร้อมแล้ว → เปิด modal
                this.myModal.open();
  
                // โฟกัส RFID ถ้าต้องการ
                setTimeout(() => this.focusRFIDInput(), 100);
              },
              error: (err) => {
                Swal.fire({
                  title: 'Error',
                  text: err.message || 'Cannot load Subsection',
                  icon: 'error',
                });
              },
            });
        },
        error: (err) => {
          Swal.fire({
            title: 'Error',
            text: err.message || 'Cannot load Section',
            icon: 'error',
          });
        },
      });
  }
  

  remove(item: any){

  }
  edit(item: any){

  }
  filterEmpNo(){

  }
  downloadExcel(){

  }



}
