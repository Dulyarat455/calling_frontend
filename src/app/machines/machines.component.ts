import { Component } from '@angular/core';

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


@Component({
  selector: 'app-machines',
  standalone: true,
  imports: [FormsModule,RouterModule,MyModal],
  templateUrl: './machines.component.html',
  styleUrl: './machines.component.css'
})
export class MachinesComponent {

  @ViewChild(MyModal) myModal!: MyModal;

  constructor(private http: HttpClient, private router: Router) {}

  machines: MachineRow[] = []

  ngOnInit() {
    this.fetchData();
  }


  fetchData() {
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
        console.log("machine page : ", res.results);


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
