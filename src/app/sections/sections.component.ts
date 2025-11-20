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
  
    ngOnInit() {
      this.fetchData();
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
  
  
    edit(item:any){
  
    }
  
    remove(item:any){
  
    }
}
