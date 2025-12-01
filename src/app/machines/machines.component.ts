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

  ngOnInit() {
    this.fetchMachine();
    this.fetchGroup();
  }

  openModal(){
    this.myModal.open();
  }


  fetchMachine() {
    this.http.get(config.apiServer + '/api/machine/list').subscribe({
      next: (res: any) => {
      this.machines = (res.results || []).map((r: any) => ({
          id: r.id,
          code: r.code ,
          groupId: r.groupId,
          isActive: r.isActive,
          state: r.State,
          groupName: r.Groups?.name ?? '',
        }))

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
  }


  edit(item:any){

  }

  remove(item:any){

  }


}
