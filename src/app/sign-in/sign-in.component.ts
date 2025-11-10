import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import config from '../../config';
import Swal from 'sweetalert2';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css',
})
export class SignInComponent {
  @ViewChild('rfidInput') rfidInput!: ElementRef;

  token: string | undefined = '';
  username: string = '';
  password: string = '';
  empNo: string = '';
  rfid: string = '';
  isLoading: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    
    //localstorage ให้เปลี่ยนชื่อ token ทุกจุดตาม Project ที่ทำ

    if (localStorage.getItem('angular_token')) 
      {
      this.token = localStorage.getItem('calling_token')!;
      this.empNo = localStorage.getItem('calling_empNo')!;
    } else {
      this.token = undefined;
      this.empNo = '';
    }
  }

  ngAfterViewInit() {
    this.focusRFIDInput();
  }

  // Helper function to focus RFID input
  private focusRFIDInput() {
    if (this.rfidInput) {
      this.rfidInput.nativeElement.focus();
    }
  }

  // Reset login state
  private resetLoginState() {
    this.isLoading = false;
    this.focusRFIDInput();
    if (this.rfidInput) {
      this.rfidInput.nativeElement.value = '';
    }
  }

  // Handle RFID input
  onRFIDInput(event: any) {
    const value = event.target.value;

    // ถ้ามีการป้อน RFID ครบ (ปกติ RFID จะมีความยาวแน่นอน เช่น 10 ตัว)
    if (value.length >= 10) {
      // ปรับตามความยาวจริงของ RFID
      this.signInWithRFID(value);
    }
  }

  // RFID Login
  async signInWithRFID(rfidValue: string) {
    if (this.isLoading) return;

    try {
      this.isLoading = true;

      const payload = {
        rfid: rfidValue,
      };

      this.http
        .post(config.apiServer + '/api/user/signin-rfid', payload)
        .subscribe({
          next: (res: any) => {
            // ตรวจสอบ unauthorized message
            if (res.message === 'unauthorized') {
              this.resetLoginState();
              Swal.fire({
                title: 'ไม่สามารถเข้าสู่ระบบได้',
                text: 'ไม่มีสิทธิ์ในการเข้าถึง',
                icon: 'error',
                timer: 2000,
              });
              return;
            }

            // if (res.token) {
            //   // Save user data
            //   this.token = res.token;
            //   localStorage.setItem('angular_token', res.token);
            //   localStorage.setItem('angular_name', res.name);
            //   localStorage.setItem('angular_id', res.id);
            //   localStorage.setItem('angular_empNo', res.empNo);
            this.authService.login(res);
            // Show success message
            Swal.fire({
              title: 'เข้าสู่ระบบสำเร็จ',
              text: `ยินดีต้อนรับ ${res.name}`,
              icon: 'success',
              timer: 1500,
              showConfirmButton: true,
            }).then(() => {
              // location.reload();
              this.router.navigate(['/']);
              this.token = localStorage.getItem('calling_token')!;
              this.empNo = localStorage.getItem('calling_empNo')!;
            });
            // }
          },
          error: (error) => {
            console.error('RFID Login Error:', error);

            // ตรวจสอบ error message
            const errorMessage =
              error.error?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';

            if (error.error?.message === 'unauthorized') {
              this.resetLoginState();
              Swal.fire({
                title: 'ไม่สามารถเข้าสู่ระบบได้',
                text: 'ไม่มีสิทธิ์ในการเข้าถึง',
                icon: 'error',
                timer: 2000,
              });
              return;
            }

            // แสดง error อื่นๆ
            Swal.fire({
              title: 'ไม่สามารถเข้าสู่ระบบได้',
              text: errorMessage,
              icon: 'error',
              timer: 2000,
            });

            this.resetLoginState();
          },
          complete: () => {
            // ไม่ต้อง reset loading state ที่นี่
            // เพราะจะถูก handle ใน next หรือ error แล้ว
          },
        });
    } catch (error: any) {
      this.resetLoginState();
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: error.message,
        icon: 'error',
      });
    }
  }

  // Regular login
  signIn() {
    if (this.empNo == '' || this.password == '') {
      Swal.fire({
        title: 'ตรวจสอบข้อมูล',
        text: 'โปรดกรอก username หรือ password ด้วย',
        icon: 'error',
      });
      return;
    }

    this.isLoading = true;
    const payload = {
      empNo: this.empNo,
      password: this.password,
    };

    try {
      this.http.post(config.apiServer + '/api/user/signin', payload).subscribe({
        next: (res: any) => {
          if (res.message === 'unauthorized') {
            this.isLoading = false;
            Swal.fire({
              title: 'ไม่สามารถเข้าสู่ระบบได้',
              text: 'ไม่มีสิทธิ์ในการเข้าถึง',
              icon: 'error',
              timer: 2000,
            });
            return;
          }

          this.authService.login(res);

          Swal.fire({
            title: 'เข้าสู่ระบบสำเร็จ',
            text: `ยินดีต้อนรับ ${res.name}`,
            icon: 'success',
            timer: 1500,
            showConfirmButton: true,
          }).then(() => {
            // location.reload();
            // window.location.reload();
            this.token = localStorage.getItem('calling_token')!;
            this.empNo = localStorage.getItem('calling_empNo')!;
            this.router.navigate(['/dashboard']);
          });
        },
        error: (error) => {
          this.isLoading = false;
          const errorMessage =
            error.error?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';

          if (error.error?.message === 'unauthorized') {
            Swal.fire({
              title: 'ไม่สามารถเข้าสู่ระบบได้',
              text: 'ไม่มีสิทธิ์ในการเข้าถึง',
              icon: 'error',
              timer: 2000,
            });
            return;
          }

          Swal.fire({
            title: 'ตรวจสอบข้อมูล',
            text: errorMessage,
            icon: 'error',
          });
        },
        complete: () => {
          this.isLoading = false;
        },
      });
    } catch (e: any) {
      this.isLoading = false;
      Swal.fire({
        title: 'error',
        text: e.message,
        icon: 'error',
      });
    }
  }

  // Clear all inputs
  clearInputs(type: 'rfid' | 'employee' | 'all' = 'all') {
    if (type === 'rfid' || type === 'all') {
      if (this.rfidInput) {
        this.rfidInput.nativeElement.value = '';
      }
      this.rfid = '';
      this.focusRFIDInput();
    }

    if (type === 'employee' || type === 'all') {
      this.empNo = '';
      this.password = '';
    }
  }
}






//landing page for condition else in sig-in.html
// <div class="welcome-screen">
//     <div class="welcome-header">
//       <i class="fas fa-check-circle welcome-icon mb-3"></i>
//       <h4 class="mb-4">Welcome to PRESS-LPB</h4>
//     </div>

//     <!-- @if(empNo == 'LC115'){} -->
//     <!-- Inventory Management Section -->
//     <div class="section-container mt-4">
//       <h5 class="section-title">Inventory Management</h5>
//       <div class="menu-grid">
//         <!-- Input Production -->
//         <a class="menu-item" [routerLink]="['/input-production']">
//           <div class="menu-icon ">
//             <i class="fas fa-boxes"></i>
//           </div>
//           <span class="menu-label">Input Production</span>
//         </a>

//         <!-- Move Part -->
//         <a class="menu-item" [routerLink]="['/move-by-wos']">
//           <div class="menu-icon ">
//             <i class="fas fa-route"></i>
//           </div>
//           <span class="menu-label">Move Part</span>
//         </a>
//         <!-- Close WOS -->
//         <a class="menu-item" [routerLink]="['/close-wos']">
//           <div class="menu-icon">
//             <i class="fas fa-clipboard-check"></i>
//           </div>
//           <span class="menu-label">Close WOS</span>
//         </a>

//         <!-- Shipment -->
//         <a class="menu-item" [routerLink]="['/shipment']">
//           <div class="menu-icon">
//             <i class="fas fa-truck"></i>
//           </div>
//           <span class="menu-label">Shipment</span>
//         </a>

//         <!-- Hold/Reject -->
//         <a class="menu-item" [routerLink]="['/hold-by-wos']">
//           <div class="menu-icon ">
//             <i class="fas fa-store-slash"></i>
//           </div>
//           <span class="menu-label">Hold/Reject</span>
//         </a>

//         <!-- Inventory Report -->
//         <a class="menu-item" [routerLink]="['/inventory-report']">
//           <div class="menu-icon ">
//             <i class="fas fa-warehouse"></i>
//           </div>
//           <span class="menu-label">Inventory Report</span>
//         </a>

//         <!-- Production Output Report -->
//         <a class="menu-item" [routerLink]="['/machine-output']">
//           <div class="menu-icon ">
//             <i class="fas fa-chart-bar"></i>
//           </div>
//           <span class="menu-label">Production Output</span>
//         </a>
//       </div>
//     </div>


//     <!-- Scrap Management Section -->
//     <div class="section-container">
//       <h5 class="section-title">Scrap Management</h5>
//       <div class="menu-grid">
//         <!-- Dashboard -->
//         <a class="menu-item" [routerLink]="['/dashboard']">
//           <div class="menu-icon">
//             <i class="fas fa-chart-line"></i>
//           </div>
//           <span class="menu-label">Dashboard</span>
//         </a>

//         <!-- Input Scrap -->
//         <a class="menu-item" [routerLink]="['/input-scrap']">
//           <div class="menu-icon">
//             <i class="fa fa-edit"></i>
//           </div>
//           <span class="menu-label">Input Scrap</span>
//         </a>

//         <!-- Scrap Report -->
//         <a class="menu-item" [routerLink]="['/scrap-report']">
//           <div class="menu-icon">
//             <i class="fas fa-file-alt"></i>
//           </div>
//           <span class="menu-label">Scrap Report</span>
//         </a>

//         <!-- Empty slot for future menu item -->
//         <a class="menu-item" href="https://forms.gle/B9g8bHywYfvYLAqW6"target="_blank" rel="noopener noreferrer">
//           <div class="menu-icon">
//             <i class="fas fa-eraser"></i>
//           </div>
//           <span class="menu-label">Request Delete scrap</span>
//         </a>
//       </div>
//     </div>
//   </div>