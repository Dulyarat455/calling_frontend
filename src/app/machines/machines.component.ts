import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router,RouterModule } from '@angular/router';
import { MyModal } from '../my-modal/my-modal.component';


import Swal from 'sweetalert2';
import config from '../../config';
import { group, state } from '@angular/animations';


type MachineRow = {
  id: number;
  code: string;
  createdAt: number;
  state: string;
  groupId: number;
  groupName: string;
  isActive:number;

};

type GroupRow = {
  id: number;
  name: string;
  State: string;
  createdAt: string;
  updateAt: string;
};


@Component({
  selector: 'app-machines',
  standalone: true,
  imports: [FormsModule,RouterModule,MyModal,CommonModule],
  templateUrl: './machines.component.html',
  styleUrl: './machines.component.css'
})
export class MachinesComponent {

  @ViewChild(MyModal) myModal!: MyModal;

  constructor(private http: HttpClient, private router: Router) {}

  code: string = '';
  machines: MachineRow[] = [];
  isLoading = false;

  groups: GroupRow[] = [];
  selectedGroupId: number | null = null;

  isEditMode = false;
  editingMachineId: number | null = null;


  searchText: string = '';
  machinesBackup: MachineRow[] = [];


  ngOnInit() {
    this.fetchMachine();
    this.fetchGroup();
  }

  openModal(){
    if (!this.isEditMode) this.clearForm();
    this.myModal.open();
  }


  fetchMachine() {
    this.http.get(config.apiServer + '/api/machine/list').subscribe({
      next: (res: any) => {
        const rows = (res.results || []).map((r: any) => ({
          id: r.id,
          code: r.code ,
          groupId: r.groupId,
          isActive: r.isActive,
          state: r.State,
          groupName: r.Groups?.name ?? '',
        }))
        
        this.machines = rows;
        this.machinesBackup = rows;

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



  search() {
    const q = this.searchText.trim().toLowerCase();
  
    if (!q) {
      // ถ้าไม่พิมพ์อะไร → คืนค่าทั้งหมด
      this.machines = this.machinesBackup;
      return;
    }
  
    this.machines = this.machinesBackup.filter(m =>
      m.code.toLowerCase().includes(q) ||
      m.groupName.toLowerCase().includes(q)
    );
  }


  onSearchChange() {
    this.search();
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

  add(){
     // 1) validate 
            if (!this.code || this.selectedGroupId == null ) {
              Swal.fire({
                title: 'ตรวจสอบข้อมูล',
                text: 'โปรดกรอกข้อมูลให้ครบถ้วน',
                icon: 'error',
              });
              return;
            }
    
            this.isLoading = true;

            const payload = {
              role: "admin",
              code: this.code,
              groupId: this.selectedGroupId
            }

            this.http.post(config.apiServer + '/api/machine/add', payload).subscribe({
              next: (res: any) => {
                this.isLoading = false;
                   Swal.fire({
                        title: 'Add Machine Success',
                        text: 'Machine ถูกเพิ่มเข้าฐานข้อมูลเรียบร้อย',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: true,
                    })
                    this.myModal.close();
                    this.fetchMachine();
                    this.clearForm();
                
              }, error: (err) => {
                this.isLoading = false;
               
                Swal.fire({
                  title: 'ไม่สามารถบันทึกได้',
                  text: err.error?.message,
                  icon: 'error',
                });   

              }
            })
  }

  clearForm(){
    this.code = '';
    this.selectedGroupId = null;

    this.isEditMode = false;
    this.editingMachineId = null;
  }


  save() {
    if (this.isEditMode) {
      this.update();
    } else {
      this.add();
    }
  }
  


  edit(item: MachineRow) {
    this.isEditMode = true;
    this.editingMachineId = item.id;
  
    this.code = item.code;
    this.selectedGroupId = item.groupId;
  
    this.myModal.open();
  }
  

  update() {
    if (!this.code || this.selectedGroupId == null || this.editingMachineId == null) {
      Swal.fire({
        title: 'ตรวจสอบข้อมูล',
        text: 'โปรดกรอกข้อมูลให้ครบถ้วน',
        icon: 'error',
      });
      return;
    }
  
    this.isLoading = true;
  
    const payload = {
      machineId: this.editingMachineId,
      code: this.code,
      groupId: this.selectedGroupId,
    };
  
    this.http.post(config.apiServer + '/api/machine/edit', payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        Swal.fire({
          title: 'Update Success',
          text: 'แก้ไข Machine สำเร็จ',
          icon: 'success',
          timer: 1500,
          showConfirmButton: true,
        });
  
        this.myModal.close();
        this.fetchMachine();
        this.clearForm();
      },
      error: (err) => {
        this.isLoading = false;
        Swal.fire({
          title: 'ไม่สามารถแก้ไขได้',
          text: err.error?.message || err.message,
          icon: 'error',
        });
      },
    });
  }
  


  remove(item: MachineRow) {
    Swal.fire({
      title: 'ยืนยันการลบ?',
      html: `
        <div style="text-align:left;">
          <div><b>Code:</b> ${item.code}</div>
          <div><b>Group:</b> ${item.groupName}</div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#d33',
    }).then((r) => {
      if (!r.isConfirmed) return;
  
      this.isLoading = true;
  
      const payload = { machineId: item.id };
  
      this.http.post(config.apiServer + '/api/machine/delete', payload).subscribe({
        next: () => {
          this.isLoading = false;
          Swal.fire({
            title: 'Deleted',
            text: 'ลบ (soft delete) เรียบร้อย',
            icon: 'success',
            timer: 1200,
            showConfirmButton: false,
          });
          this.fetchMachine();
        },
        error: (err) => {
          this.isLoading = false;
          Swal.fire({
            title: 'ลบไม่สำเร็จ',
            text: err.error?.message || err.message,
            icon: 'error',
          });
        },
      });
    });
  }
  


}
