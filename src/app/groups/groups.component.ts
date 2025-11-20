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

  groups: groupRow[] = []
  isLoading = false;

  ngOnInit() {
    this.fetchData();
  }

  openModal() {
    // รีเซ็ตค่าในฟอร์มก่อนเปิด
    // เรียกใช้ฟังก์ชัน open() ของ child component
    this.myModal.open();
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
        console.log("Groups page : ", res.results);

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

  edit(item:any){

  }

  remove(item:any){

  }



}
