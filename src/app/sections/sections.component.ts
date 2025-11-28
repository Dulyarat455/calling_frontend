import { Component } from '@angular/core';


import { ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router,RouterModule } from '@angular/router';
import { MyModal } from '../my-modal/my-modal.component';
import Swal from 'sweetalert2';
import config from '../../config';

type  sectionRow = {
  id: number;
  State: string;
  name: string;
  createdAt: string;
  updateAt: string;
}

@Component({
  selector: 'app-sections',
  standalone: true,
  imports: [FormsModule,MyModal,RouterModule],
  templateUrl: './sections.component.html',
  styleUrl: './sections.component.css'
})
export class SectionsComponent {
    @ViewChild(MyModal) myModal!: MyModal;

    constructor(private http: HttpClient, private router: Router) {}
   
    sections: sectionRow[] = []
    name: string = '' ;
    isLoading = false;
  
    ngOnInit() {
      this.fetchData();
    }

    
    openModal(){
      this.myModal.open();
    }

    clearForm(){
      this.name = '';
    }
  
    fetchData(){
      this.http.get(config.apiServer + '/api/section/list').subscribe({
        next: (res: any) => {
            this.sections = (res.results || []).map((r: any) => ({
            id: r.id,
            name: r.name,
            state: r.State,
            createdAt: r.createdAt,
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

      this.http.post(config.apiServer + '/api/section/add', payload).subscribe({
        next: (res: any) => {
          this.isLoading = false;
             Swal.fire({
                  title: 'Add Section Success',
                  text: 'Section ถูกเพิ่มเข้าฐานข้อมูลเรียบร้อย',
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

        }
      })


    }



    edit(item:any){
      
    }
  
    remove(item:any){
  
    }
}
