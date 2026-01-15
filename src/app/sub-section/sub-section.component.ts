import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  createAt: string;
  updateAt: string;
  section: string;
  sectionId: number;
};

type SectionRow = {
  id: number;
  name: string;
  State: string;
  createdAt: string;
  updateAt: string;
};


@Component({
  selector: 'app-sub-section',
  standalone: true,
  imports: [FormsModule,RouterModule,MyModal,CommonModule],
  templateUrl: './sub-section.component.html',
  styleUrl: './sub-section.component.css'
})
export class SubSectionComponent {
  @ViewChild(MyModal) myModal!: MyModal;
  
    constructor(private http: HttpClient, private router: Router) {}
  
    subSections: subSectionRow[] = []
    isLoading = false;

    name: string = '';
    sections: SectionRow[] = [];
    selectedSectionId: number | null = null;

    searchText: string = '';
    filteredSubSections: subSectionRow[] = [];



    ngOnInit() {
      this.fetchData();
      this.fetchSection();
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
            createAt: r.createAt, 
            updateAt: r.updateAt,
            section: r.section,
            sectionId: r.sectionId
          }))

          this.filteredSubSections = [...this.subSections];
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
      if (!this.name || this.selectedSectionId == null) {
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
      name: this.name,
      sectionId: this.selectedSectionId
    }

    this.http.post(config.apiServer + '/api/subsection/add', payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
           Swal.fire({
                title: 'Add SubSection Success',
                text: 'SubSection ถูกเพิ่มเข้าฐานข้อมูลเรียบร้อย',
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

    clearForm(){
      this.name = ''
      this.selectedSectionId = null
    }

    onSearch() {
      const q = this.searchText.trim().toLowerCase();
  
      if (!q) {
        this.filteredSubSections = [...this.subSections];
        return;
      }
  
      this.filteredSubSections = this.subSections.filter((x) =>
        x.name.toLowerCase().includes(q) ||
        x.section.toLowerCase().includes(q)
      );
    }
    

    edit(item:any){

    }

    remove(item:any){

    }



}
