import { Component,ViewChild,ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router,RouterModule } from '@angular/router';
import { MyModal } from '../my-modal/my-modal.component';


import Swal from 'sweetalert2';
import config from '../../config';

type UserRow = {
  empNo: string;
  name: string;
  rfid: string;
  level: string;
  section: string;
};


@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [FormsModule,RouterModule,MyModal],
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
  confirmPassword: string = '';
  role: string = '';
  rfId: string = '';
  isLoading = false;
  group: string = '';
  subGroup: string = '';

  searchEmpNo:string = '';
  // users: any[] = [];


  users: UserRow[] = [
    {
      empNo: 'LE519',
      name: 'สมชาย ใจดี',
      rfid: '9900112233',
      level: 'Admin',
      section: 'Store PC',
    },
    {
      empNo: 'LM101',
      name: 'วิศรุต ลามิเนต',
      rfid: '9900112244',
      level: 'Leader',
      section: 'Lamination',
    },
    {
      empNo: 'ST203',
      name: 'กิตติพงษ์ สเตเตอร์',
      rfid: '9900112255',
      level: 'User',
      section: 'Stator',
    },
    {
      empNo: 'RT305',
      name: 'จิรายุส โรเตอร์',
      rfid: '9900112266',
      level: 'User',
      section: 'Rotor',
    },
    {
      empNo: 'PR411',
      name: 'สุพจน์ เพรสไลน์',
      rfid: '9900112277',
      level: 'User',
      section: 'Press Line',
    },
    {
      empNo: 'STO501',
      name: 'วราภรณ์ สโตร์',
      rfid: '9900112288',
      level: 'Store',
      section: 'Store Incoming',
    },
    {
      empNo: 'QA612',
      name: 'ธนกฤต คิวซี',
      rfid: '9900112299',
      level: 'User',
      section: 'QA',
    },
    {
      empNo: 'PD720',
      name: 'สุรีย์พร ผลิต',
      rfid: '9900112200',
      level: 'Supervisor',
      section: 'Production',
    },
  ];
  

  constructor(private http: HttpClient, private router: Router) {}


  ngAfterViewInit() {
    this.focusRFIDInput();
  }

  // Helper function to focus RFID input
  private focusRFIDInput() {
    if (this.rfidInput) {
      this.rfidInput.nativeElement.focus();
    }
  }



    // Handle RFID input
    onRFIDInput(event: any) {
      const value = event.target.value;
  
      // ถ้ามีการป้อน RFID ครบ (ปกติ RFID จะมีความยาวแน่นอน เช่น 10 ตัว)
      if (value.length >= 10) {
        // ปรับตามความยาวจริงของ RFID
        
      }
    }

    openModal() {
      // รีเซ็ตค่าในฟอร์มก่อนเปิด
  
      // เรียกใช้ฟังก์ชัน open() ของ child component
      this.myModal.open();
    }

  signUp() {
    // 1) validate ฝั่ง client
    if (!this.name || !this.username || !this.empNo || !this.password) {
      Swal.fire({
        title: 'ตรวจสอบข้อมูล',
        text: 'โปรดกรอกข้อมูลให้ครบถ้วน (Name, Username, Employee No., Password)',
        icon: 'error',
      });
      return;
    }

    if (this.password !== this.confirmPassword) {
      Swal.fire({
        title: 'รหัสผ่านไม่ตรงกัน',
        text: 'กรุณาตรวจสอบ Password และ Confirm Password',
        icon: 'error',
      });
      return;
    }

    this.isLoading = true;

    const payload = {
      name: this.name,
      username: this.username,
      empNo: this.empNo,
      password: this.password,
      role: this.role,
      rfId: this.rfId
    };

    this.http.post(config.apiServer + '/api/user/create', payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;

        if (res.message === 'user_already_exists') {
          let msg = 'ข้อมูลผู้ใช้ซ้ำในระบบ';
          if (res.detail?.empNo) msg += '\n- Employee No. นี้ถูกใช้แล้ว';
          if (res.detail?.username) msg += '\n- Username นี้ถูกใช้แล้ว';
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
        }).then(() => {
          this.router.navigate(['/sign-in']); // ปรับให้ตรงกับ route จริง
        });
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

  remove(item: any){

  }

  edit(item: any){

  }

  filterEmpNo(){

  }

  clearForm(){

  }

  downloadExcel(){


  }



}
