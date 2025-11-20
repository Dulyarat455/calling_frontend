import { Component } from '@angular/core';

import { ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router,RouterModule } from '@angular/router';
import { MyModal } from '../my-modal/my-modal.component';
import Swal from 'sweetalert2';
import config from '../../config';

type callNodeRow = {
  id: number;
  name: string;
  state: string;
  createdAt: string;
  updateAt: string;
};

@Component({
  selector: 'app-call-nodes',
  standalone: true,
  imports: [FormsModule,MyModal,RouterModule],
  templateUrl: './call-nodes.component.html',
  styleUrl: './call-nodes.component.css'
})
export class CallNodesComponent {
   @ViewChild(MyModal) myModal!: MyModal;
  
    constructor(private http: HttpClient, private router: Router) {}
  
    callNodes: callNodeRow[] = []
    isLoading = false;

    ngOnInit() {
      this.fetchData();
    }
  
    openModal() {
      // รีเซ็ตค่าในฟอร์มก่อนเปิด
      // เรียกใช้ฟังก์ชัน open() ของ child component
      this.myModal.open();
    }


    fetchData(){
      // this.http.get(config.apiServer + '/api/callnode/list').subscribe({
      //   next: (res: any) => {
      //   this.callNodes = (res.results || []).map((r: any) => ({
        
      //     }))

      //   },
      //   error: (err) => {
      //     Swal.fire({
      //       title: 'Error',
      //       text: err.message,
      //       icon: 'error',
      //     });
      //   },
      // });
    }


    
  edit(item:any){

  }

  remove(item:any){

  }



  




}
