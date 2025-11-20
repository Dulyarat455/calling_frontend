import { Component } from '@angular/core';

import { ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router,RouterModule } from '@angular/router';
import { MyModal } from '../my-modal/my-modal.component';
import Swal from 'sweetalert2';
import config from '../../config';


type subSectionRow = {
  id: number;
  name: string;
  state: string;
  createdAt: string;
  updateAt: string;
};

@Component({
  selector: 'app-sub-section',
  standalone: true,
  imports: [FormsModule,RouterModule,MyModal],
  templateUrl: './sub-section.component.html',
  styleUrl: './sub-section.component.css'
})
export class SubSectionComponent {
  @ViewChild(MyModal) myModal!: MyModal;
  
    constructor(private http: HttpClient, private router: Router) {}
  
    subSections: subSectionRow[] = []
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
      this.http.get(config.apiServer + '/api/subsection/list').subscribe({
        next: (res: any) => {
        this.subSections = (res.results || []).map((r: any) => ({
            id: r.id,
            name: r.name,
            state: r.State,
            createdAt: r.createAt, 
            updateAt: r.updateAt
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

    edit(item:any){

    }

    remove(item:any){

    }



}
