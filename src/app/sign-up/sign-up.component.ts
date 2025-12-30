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
  isEditMode = false;
  editingUserId: number | null = null;

  groups: GroupRow[] = [];
  sections: SectionRow[] = [];
  subSections: SubSectionRow[] = [];
  usersAll: UsersRow[] = [];  // เก็บทั้งหมด
  users: UsersRow[] = [];     // ที่โชว์จริง (table ใช้ตัวนี้)
  searchEmpNo: string = '';
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
        // this.users = res.results || [];
        this.usersAll = res.results || [];
        this.applyFilter();
        
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


    get submitText() {
      return this.isEditMode ? 'Update Member' : 'Add Member';
    }

    
    openModal() {
      // รีเซ็ตค่าในฟอร์มก่อนเปิด
      this.clearForm();
      // เรียกใช้ฟังก์ชัน open() ของ child component
      this.myModal.open();
      this.isEditMode = false;
      this.editingUserId = null;
    }

  // addMember() {
  //   // 1) validate ฝั่ง client
  //   if (!this.name || !this.empNo || !this.password || !this.rfId 
  //     || !this.role || this.selectedGroupId == null ||  this.selectedSectionId == null || this.selectedSubSectionId == null) {
  //     Swal.fire({
  //       title: 'ตรวจสอบข้อมูล',
  //       text: 'โปรดกรอกข้อมูลให้ครบถ้วน (Name, Username, Employee No., Password)',
  //       icon: 'error',
  //     });
  //     return;
  //   }


  //   this.isLoading = true;

  //   const payload = {
  //     userRole: "admin",
  //     name: this.name,
  //     empNo: this.empNo,
  //     password: this.password,
  //     role: this.role,
  //     rfId: this.rfId,
  //     groupId: Number(this.selectedGroupId),
  //     sectionId: Number(this.selectedSectionId),
  //     subSectionId: Number(this.selectedSubSectionId)
  //   };

  //   console.log("payload for edit: ",payload);
    
  //   this.http.post(config.apiServer + '/api/user/create', payload).subscribe({
  //     next: (res: any) => {
  //       this.isLoading = false;

  //       if (res.message === 'user_already_exists') {
  //         let msg = 'ข้อมูลผู้ใช้ซ้ำในระบบ';
  //         if (res.detail?.empNo) msg += '\n- Employee No. นี้ถูกใช้แล้ว';
  //         if (res.detail?.name) msg += '\n- name นี้ถูกใช้แล้ว';
  //         if (res.detail?.rfId) msg += '\n- RFID นี้ถูกใช้แล้ว';

  //         Swal.fire({
  //           title: 'ไม่สามารถสร้างผู้ใช้ได้',
  //           text: msg,
  //           icon: 'error',
  //         });
  //         return;
  //       }

  //       Swal.fire({
  //         title: 'สร้างบัญชีสำเร็จ',
  //         text: 'สามารถใช้บัญชีนี้เข้าสู่ระบบได้แล้ว',
  //         icon: 'success',
  //         timer: 1500,
  //         showConfirmButton: true,
  //       })
        
  //       this.fetchDataUser();
  //       this.myModal.close();
  //       this.clearForm();
  //     },
  //     error: (error) => {
  //       this.isLoading = false;
  //       console.error(error);

  //       const msg =
  //         error.error?.message ||
  //         error.error?.error ||
  //         'เกิดข้อผิดพลาดในการสร้างบัญชี';

  //       Swal.fire({
  //         title: 'ไม่สามารถสร้างผู้ใช้ได้',
  //         text: msg,
  //         icon: 'error',
  //       });
  //     },
  //   });

  // }

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



  addMember() {
    // validate (เหมือนเดิม)
    if (!this.name || !this.empNo || !this.password || !this.rfId || !this.role
      || this.selectedGroupId == null || this.selectedSectionId == null || this.selectedSubSectionId == null) {
      Swal.fire({
        title: 'ตรวจสอบข้อมูล',
        text: 'โปรดกรอกข้อมูลให้ครบถ้วน',
        icon: 'error',
      });
      return;
    }
  
    // ถ้าเป็น edit ต้องมี userId
    if (this.isEditMode && !this.editingUserId) {
      Swal.fire({
        title: 'Error',
        text: 'ไม่พบ userId สำหรับการแก้ไข',
        icon: 'error',
      });
      return;
    }
  
    this.isLoading = true;
  
    // payload เหมือน create ทุกอย่าง
    const payload: any = {
      name: this.name,
      empNo: this.empNo,
      password: this.password,
      role: this.role,
      rfId: this.rfId,
      groupId: Number(this.selectedGroupId),
      sectionId: Number(this.selectedSectionId),
      subSectionId: Number(this.selectedSubSectionId),
    };
  
    // เลือก url ตามโหมด
    let url = config.apiServer + '/api/user/create';
    if (this.isEditMode) {
      url = config.apiServer + '/api/user/updateOneUser';
      payload.userId = this.editingUserId;
    }
  
    this.http.post(url, payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
  
        Swal.fire({
          title: 'Success',
          text: this.isEditMode ? 'อัปเดตสมาชิกสำเร็จ' : 'เพิ่มสมาชิกสำเร็จ',
          icon: 'success',
          timer: 1200,
          showConfirmButton: true,
        });
  
        this.fetchDataUser();
        this.myModal.close();
        this.clearForm();
  
        // reset mode
        this.isEditMode = false;
        this.editingUserId = null;
      },
      error: (err) => {
        this.isLoading = false;
  
        const data = err?.error; // backend json
        const hasBlocked = Array.isArray(data?.blockedJobs) && data.blockedJobs.length > 0;
  
        if (hasBlocked) {
          // ✅ โชว์ตาราง blocked jobs + summary label ที่เปลี่ยนชื่อแล้ว
          const html = this.buildBlockedHtml(data);
  
          Swal.fire({
            title: 'Error',
            icon: 'error',
            html,
            width: 800,
            confirmButtonText: 'OK',
          });
          return;
        }
  
        // ✅ error ปกติ
        Swal.fire({
          title: 'Error',
          text: data?.message || err.message || 'เกิดข้อผิดพลาด',
          icon: 'error',
        });
      },
    });
  }
  
  
  private pad2(n: number) {
    return String(n).padStart(2, '0');
  }
  
  private formatDateTime(iso: string | null | undefined) {
    if (!iso) return { date: '-', time: '-' };
  
    const d = new Date(iso);
    // แสดงเป็นเวลาไทย
    const date = `${this.pad2(d.getDate())}/${this.pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
    const time = `${this.pad2(d.getHours())}:${this.pad2(d.getMinutes())}`;
    return { date, time };
  }
  
  private mapReason(reason: string) {
    // ถ้าใน reasons มีหลายอัน จะ join กันเอง
    if (reason === 'CREATE_BY_USER') return 'Owner job not accept';
    if (reason === 'INCHARGE') return 'Incharging';
    return reason;
  }
  
  private buildBlockedHtml(data: any) {
    const blockedJobs = data?.blockedJobs || [];
    const summary = data?.summary || {};
    console.log("blockedJobs = ",blockedJobs)
    const rowsHtml = blockedJobs.map((j: any) => {
      console.log("j.createAt modal : ",j.createAt)
      const dt = this.formatDateTime(j.createAt);
      const reasonText = (j.reasons || []).map((r: string) => this.mapReason(r)).join(', ') || '-';
  
      return `
        <tr>
          <td style="padding:6px 10px; border:1px solid #eee; text-align:left;">${j.groupName ?? '-'}</td>
          <td style="padding:6px 10px; border:1px solid #eee; text-align:center;">${dt.date}</td>
          <td style="padding:6px 10px; border:1px solid #eee; text-align:center;">${dt.time}</td>
          <td style="padding:6px 10px; border:1px solid #eee; text-align:center;">${j.machineCode ?? '-'}</td>
          <td style="padding:6px 10px; border:1px solid #eee; text-align:left;">${reasonText}</td>
          <td style="padding:6px 10px; border:1px solid #eee; text-align:left;">${j.empNo ?? '-'}</td>

        </tr>
      `;
    }).join('');
  
    // summary label เปลี่ยนชื่อ
    const summaryHtml = `
      <div style="text-align:left; margin-top:10px;">
        <div><b>Total Blocked:</b> ${summary.totalBlocked ?? blockedJobs.length}</div>
        <div><b>กำลังรอคนมารับงาน :</b> ${summary.case1 ?? 0}</div>
        <div><b>กำลังรับงานอยู่ :</b> ${summary.case2 ?? 0}</div>
      </div>
    `;
  
    const tableHtml = `
      <div style="text-align:left;">
        <div style="margin-bottom:8px;">Cannot update user because there are blocked jobs</div>
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead>
            <tr>
              <th style="padding:6px 10px; border:1px solid #eee; background:#f7f7f7; text-align:left;">Group</th>
              <th style="padding:6px 10px; border:1px solid #eee; background:#f7f7f7; text-align:center;">Date</th>
              <th style="padding:6px 10px; border:1px solid #eee; background:#f7f7f7; text-align:center;">Time</th>
              <th style="padding:6px 10px; border:1px solid #eee; background:#f7f7f7; text-align:center;">Machine</th>
              <th style="padding:6px 10px; border:1px solid #eee; background:#f7f7f7; text-align:left;">Reason</th>
              <th style="padding:6px 10px; border:1px solid #eee; background:#f7f7f7; text-align:left;">EmpNo</th>

            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `
              <tr>
                <td colspan="5" style="padding:10px; border:1px solid #eee; text-align:center;">No data</td>
              </tr>
            `}
          </tbody>
        </table>
        ${summaryHtml}
      </div>
    `;
  
    return tableHtml;
  }
  


  importExcel(file: File) {
    const fd = new FormData();
    fd.append('userRole', 'admin');
    fd.append('file', file);

     // ✅ Loading ตอนเริ่ม import
  Swal.fire({
    title: 'กำลัง Import...',
    text: 'โปรดรอสักครู่ ระบบกำลังนำเข้าข้อมูลจากไฟล์ Excel',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading(),
  });
  
    this.http.post(config.apiServer + '/api/user/importExcel', fd).subscribe({
      next: (res: any) => {
        // ✅ next ก็อาจมี errors (เพราะ backend บางทีส่ง 200)
        const errors: any[] = res?.results?.errors || [];
  
        const hasCallNode = errors.some(e => e?.message === 'callnode_not_found');
        const callNodeErrors = errors.filter(e => e?.message === 'callnode_not_found');
  
        // block ปกติจะไม่มาใน next (เพราะคุณส่ง status 400) แต่กันไว้ให้ครบ
        const hasBlocked = Array.isArray(res?.blockedJobs) && res.blockedJobs.length > 0;
  
        // ✅ ถ้ามี error อย่างน้อย 1 แบบ -> รวมแล้วโชว์
        if (hasBlocked || hasCallNode) {
           
           Swal.close();
          const html = this.buildCombinedImportErrorHtml({
            blockedData: hasBlocked ? res : null,
            callNodeErrors: hasCallNode ? callNodeErrors : [],
            results: res?.results
          });
  
          Swal.fire({
            title: 'Error',
            icon: 'error',
            html,
            width: 900,
            confirmButtonText: 'OK',
          });
  
          this.fetchDataUser();
          return;
        }
  
        // ✅ ไม่มี error
      
        Swal.close();
        Swal.fire(
          'Success',
          `Created: ${res?.results?.created || 0}\nUpdated: ${res?.results?.updated || 0}`,
          'success'
        );
        this.fetchDataUser();
      },
  
      error: (err) => {
        const data = err?.error;
  
        // ==============================
        // CASE: blocked jobs
        // ==============================
        const hasBlocked = Array.isArray(data?.blockedJobs) && data.blockedJobs.length > 0;
  
        // ==============================
        // CASE: callnode_not_found
        // ==============================
        const allErrors: any[] = data?.results?.errors || [];
        const callNodeErrors = allErrors.filter(e => e?.message === 'callnode_not_found');
        const hasCallNode = callNodeErrors.length > 0;
  
        // ✅ ถ้ามี 1 หรือ 2 เคส -> รวมแล้วโชว์ครั้งเดียว
        if (hasBlocked || hasCallNode) {
           
          Swal.close();
          const html = this.buildCombinedImportErrorHtml({
            blockedData: hasBlocked ? data : null,
            callNodeErrors: hasCallNode ? callNodeErrors : [],
            results: data?.results
          });
  
          Swal.fire({
            title: 'Error',
            icon: 'error',
            html,
            width: 900,
            confirmButtonText: 'OK',
          });
          return;
        }
  
        // fallback
        
        Swal.close();
        Swal.fire('Error', data?.message || err.message || 'Import failed', 'error');
      }
    });
  }
  
  // ✅ รวม HTML ทั้ง block + callnode (ไม่แก้ buildBlockedHtml เดิม)
  private buildCombinedImportErrorHtml(opts: {
    blockedData: any | null;
    callNodeErrors: any[];
    results?: any;
  }) {
    const { blockedData, callNodeErrors, results } = opts;
  
    const parts: string[] = [];
  
    // ---------- BLOCKED ----------
    if (blockedData) {
      const blockedHtml = this.buildBlockedHtml(blockedData);
  
      // ✅ NEW: ดึง blockedUsers (หลังบ้านส่งมา)
      const blockedUsers: any[] = blockedData?.blockedUsers || [];
  
      const blockedUsersHtml = blockedUsers.length > 0
        ? `
          <div style="
            margin-bottom:10px;
            border:1px solid #eee;
            border-radius:10px;
            overflow:hidden;
            background:#fff;
          ">
            <div style="
              padding:8px 10px;
              font-weight:700;
              background:#f7f7f7;
            ">
              Blocked Users (${blockedUsers.length})
            </div>
  
            <div style="max-height:160px; overflow:auto;">
              <table style="width:100%; border-collapse:collapse; font-size:13px;">
                <thead>
                  <tr>
                    <th style="padding:6px 10px; border:1px solid #eee; background:#fafafa; font-weight:600;">EmpNo</th>
                    <th style="padding:6px 10px; border:1px solid #eee; background:#fafafa; font-weight:600;">Name</th>
                  </tr>
                </thead>
                <tbody>
                  ${blockedUsers.map(u => `
                    <tr>
                      <td style="padding:6px 10px; border:1px solid #eee;">${u.empNo ?? '-'}</td>
                      <td style="padding:6px 10px; border:1px solid #eee;">${u.name ?? '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `
        : '';
  
      parts.push(`
        <div style="margin-bottom:14px;">
          <div style="font-weight:700; font-size:16px; margin-bottom:8px;">🚫 Blocked Jobs</div>
  
          ${blockedUsersHtml}
  
          <div style="
            max-height:320px;
            overflow:auto;
            border:1px solid #eee;
            border-radius:10px;
            padding:10px;
            background:#fff;
          ">
            ${blockedHtml}
          </div>
        </div>
      `);
    }
  
    // ---------- CALLNODE ----------
    if (callNodeErrors && callNodeErrors.length > 0) {
      const callNodeHtml = this.buildCallNodeHtml(callNodeErrors, results);
  
      parts.push(`
        <div style="margin-bottom:6px;">
          <div style="font-weight:700; font-size:16px; margin-bottom:8px;">📍 Position Not Match</div>
          ${callNodeHtml}
        </div>
      `);
    }
  
    // ---------- SUMMARY ----------
    const summary = `
      <div style="margin-top:12px; padding-top:10px; border-top:1px dashed #ddd; text-align:left;">
        <div><b>Created:</b> ${results?.created || 0}</div>
        <div><b>Updated:</b> ${results?.updated || 0}</div>
        <div><b>Failed:</b> ${results?.failed || 0}</div>
      </div>
    `;
  
    // ✅ IMPORTANT: ใส่ font ที่ wrapper ตัวเดียว (รองรับทุก section)
    return `
      <div style="
        text-align:left;
        font-family: 'Kanit','Prompt','Segoe UI',Roboto,Arial,sans-serif;
        font-size:14px;
        line-height:1.5;
        color:#333;
      ">
        ${parts.join('')}
        ${summary}
      </div>
    `;
  }
  
  // ✅ helper เดิมของคุณ (คงไว้ได้) — แต่ขอปรับนิดเดียว: ใส่ scroll ในตัวเองได้อยู่แล้ว
  private buildCallNodeHtml(callNodeErrors: any[], results?: any) {
    const rowsHtml = callNodeErrors.map(e => `
      <tr>
        <td style="padding:6px 10px; border:1px solid #eee;">${e.empNo ?? '-'}</td>
        <td style="padding:6px 10px; border:1px solid #eee;">${e.name ?? '-'}</td>
        <td style="padding:6px 10px; border:1px solid #eee;">${e.detail?.groupName ?? '-'}</td>
        <td style="padding:6px 10px; border:1px solid #eee;">${e.detail?.sectionName ?? '-'}</td>
        <td style="padding:6px 10px; border:1px solid #eee;">${e.detail?.subSectionName ?? '-'}</td>
      </tr>
    `).join('');
  
    return `
      <div style="text-align:left;">
  
        <!-- scroll container -->
        <div style="
          max-height:320px;
          overflow:auto;
          border:1px solid #eee;
          border-radius:10px;
        ">
          <table style="width:100%; border-collapse:collapse; font-size:13px;">
            <thead>
              <tr>
                <th style="padding:6px 10px; border:1px solid #eee; background:#f7f7f7;">EmpNo</th>
                <th style="padding:6px 10px; border:1px solid #eee; background:#f7f7f7;">Name</th>
                <th style="padding:6px 10px; border:1px solid #eee; background:#f7f7f7;">Group</th>
                <th style="padding:6px 10px; border:1px solid #eee; background:#f7f7f7;">Section</th>
                <th style="padding:6px 10px; border:1px solid #eee; background:#f7f7f7;">SubSection</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || `
                <tr>
                  <td colspan="5" style="padding:10px; border:1px solid #eee; text-align:center;">No data</td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
  
        <div style="margin-top:10px;">
          <div><b>Total:</b> ${callNodeErrors.length}</div>
        </div>
      </div>
    `;
  }
  
  
  
  
  onExcelSelected(event: Event) {
    const input = event.target as HTMLInputElement;
  
    if (!input.files || input.files.length === 0) return;
  
    const file = input.files[0];
  
    // optional: validate นามสกุล
    if (!file.name.endsWith('.xlsx')) {
      Swal.fire('Error', 'กรุณาเลือกไฟล์ .xlsx เท่านั้น', 'error');
      input.value = ''; // reset
      return;
    }
  
    this.importExcel(file);
  
    // reset input เพื่อเลือกไฟล์เดิมซ้ำได้
    input.value = '';
  }
  


  filterEmpNo() {
    this.applyFilter();
  }

  private applyFilter() {
    const q = (this.searchEmpNo || '').trim().toLowerCase();

    // ไม่มีคำค้น -> โชว์ทั้งหมด
    if (!q) {
      this.users = [...this.usersAll];
      return;
    }

    // filter จาก empNo, name, role, groupName, sectionName, subSectionName
    this.users = this.usersAll.filter((u) => {
      const empNo = (u.empNo || '').toLowerCase();
      const name = (u.name || '').toLowerCase();
      const role = (u.role || '').toLowerCase();
      const group = (u.groupName || '').toLowerCase();
      const section = (u.sectionName || '').toLowerCase();
      const sub = (u.subSectionName || '').toLowerCase();
      const rfid = String(u.rfId ?? '').toLowerCase();

      return (
        empNo.includes(q) ||
        name.includes(q) ||
        role.includes(q) ||
        group.includes(q) ||
        section.includes(q) ||
        sub.includes(q) ||
        rfid.includes(q)
      );
    });
  }

  clearSearch() {
    this.searchEmpNo = '';
    this.users = [...this.usersAll];
  }


  downloadExcel() {
    if (!this.users || this.users.length === 0) {
      Swal.fire('Info', 'ไม่มีข้อมูลให้ Export', 'info');
      return;
    }
    
      // ✅ แจ้งกำลังเตรียมไฟล์
  Swal.fire({
    title: 'กำลังเตรียมไฟล์...',
    text: 'โปรดรอสักครู่',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

    const payload = {
      userRole: 'admin',
      rows: this.users.map(u => ({
        empNo: u.empNo,
        name: u.name,
        role: u.role,
        rfId: u.rfId,
        status: u.status,
        groupName: u.groupName,
        sectionName: u.sectionName,
        subSectionName: u.subSectionName,
        password: u.password,
      })),
    };
  
    this.http.post(
      config.apiServer + '/api/user/exportExcelUsers',
      payload,
      { responseType: 'blob' } // ✅ รับไฟล์
    ).subscribe({
      next: (blob: Blob) => {
        // ปิด loading
        Swal.close();

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
  
        // ตั้งชื่อไฟล์ง่ายๆ
        a.download = `users-${new Date().toISOString().slice(0,10)}.xlsx`;
        a.click();
  
        window.URL.revokeObjectURL(url);


        // ✅ แจ้งโหลดสำเร็จ
        Swal.fire({
          icon: 'success',
          title: 'Download สำเร็จ',
          text: 'ระบบเริ่มดาวน์โหลดไฟล์แล้ว',
          timer: 1500,
          showConfirmButton: false,
        });

      },
      error: (err) => {
        Swal.fire('Error', err.error?.message || err.message || 'Export failed', 'error');
      }
    });
  }
  

  remove(item: UsersRow){
    if (!item?.id) return;

    Swal.fire({
      title: 'ยืนยันการลบ?',
      html: `
        <div>
          <div><b>EmpNo:</b> ${item.empNo ?? '-'}</div>
          <div><b>Name:</b> ${item.name ?? '-'}</div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#d33',
    }).then((r) => {
      if (!r.isConfirmed) return;
  
      // ✅ Loading ระหว่างลบ
      Swal.fire({
        title: 'กำลังลบ...',
        text: 'โปรดรอสักครู่',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      });
  
      const payload: any = {
        userId: item.id,
        userRole: 'admin', // ถ้าหลังบ้านเช็ค role
      };
  
      this.http.post(config.apiServer + '/api/user/deleteUser', payload).subscribe({
        next: (res: any) => {
          Swal.close();
  
          Swal.fire({
            icon: 'success',
            title: 'ลบสำเร็จ',
            text: 'ระบบทำการปิดบัญชี (accountState=delete) แล้ว',
            timer: 1400,
            showConfirmButton: false,
          });
  
          this.fetchDataUser();
        },
  
        error: (err) => {
          Swal.close();
  
          const data = err?.error;
  
          // ✅ CASE: blocked jobs (โชว์เหมือน updateOneUser)
          const hasBlocked = Array.isArray(data?.blockedJobs) && data.blockedJobs.length > 0;
          if (hasBlocked) {
            const html = this.buildBlockedHtml(data); // ✅ ใช้ของเดิม
            Swal.fire({
              title: 'Error',
              icon: 'error',
              html,
              width: 800,
              confirmButtonText: 'OK',
            });
            return;
          }
  
          // fallback error
          Swal.fire({
            title: 'Error',
            text: data?.message || err.message || 'Delete failed',
            icon: 'error',
          });
        }
      });
    });

  }


  edit(item: any){

  }
  


}
