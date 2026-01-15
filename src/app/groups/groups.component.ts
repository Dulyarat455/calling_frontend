import { Component } from '@angular/core';

import { ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router,RouterModule } from '@angular/router';
import { MyModal } from '../my-modal/my-modal.component';
import Swal from 'sweetalert2';
import config from '../../config';


type groupRow = {
  id: number;
  name: string;
  state: string;
  createdAt: string;
  updateAt: string;
};


@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [FormsModule,RouterModule,MyModal],
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.css'
})
export class GroupsComponent {
  @ViewChild(MyModal) myModal!: MyModal;

  constructor(private http: HttpClient, private router: Router) {}

  name: string = '';
  groups: groupRow[] = []
  isLoading = false;


  filteredGroups: groupRow[] = [];
  searchText: string = '';

  ngOnInit() {
    this.fetchData();
  }

  openModal() {
    // รีเซ็ตค่าในฟอร์มก่อนเปิด
    // เรียกใช้ฟังก์ชัน open() ของ child component
    this.myModal.open();
  }

  clearForm(){

  }


  fetchData() {
    this.http.get(config.apiServer + '/api/group/list').subscribe({
      next: (res: any) => {
      this.groups = (res.results || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          state: r.State,
          createdAt: r.createdAt,
          updateAt: r.updateAt
        }))
      this.filteredGroups = [...this.groups];

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
        if (!this.name) {
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
          name: this.name
        }

        this.http.post(config.apiServer + '/api/group/add', payload).subscribe({
          next: (res: any) => {
            this.isLoading = false;

            Swal.fire({
                      title: 'Add Group Success',
                      text: 'Group ถูกเพิ่มเข้าฐานข้อมูลเรียบร้อย',
                      icon: 'success',
                      timer: 1500,
                      showConfirmButton: true,
                    })
                    this.myModal.close();
                    this.fetchData();
                    this.clearForm();
          }, error: (err) => {
         this.isLoading = false;

          Swal.fire({
                     title: 'ไม่สามารถบันทึกได้',
                     text: err.error?.message,
                     icon: 'error',
          });
          },
        })
  }

  onSearch() {
    const q = this.searchText.trim().toLowerCase();
  
    if (!q) {
      this.filteredGroups = [...this.groups];
      return;
    }
  
    this.filteredGroups = this.groups.filter(g =>
      g.name.toLowerCase().includes(q)
    );
  }
  



  edit(item:any){

  }

  remove(item:any){

  }



}
