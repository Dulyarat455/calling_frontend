import { Component,ViewChild,ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router,RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import config from '../../config';


@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [FormsModule,RouterModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css'
})
export class SignUpComponent {
  @ViewChild('rfidInput') rfidInput!: ElementRef;
  name: string = '';
  username: string = '';
  empNo:string = '';
  password: string = '';
  confirmPassword: string = '';
  role: string = '';
  rfId: string = '';
  isLoading = false;

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
}
