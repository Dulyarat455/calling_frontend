import { Component } from '@angular/core';

import { ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router,RouterModule } from '@angular/router';
import { MyModal } from '../my-modal/my-modal.component';
import Swal from 'sweetalert2';
import config from '../../config';

type  userSectionRow = {
  id: number;
  userId: number;
  section: string;
       
}



@Component({
  selector: 'app-user-section',
  standalone: true,
  imports: [FormsModule,MyModal],
  templateUrl: './user-section.component.html',
  styleUrl: './user-section.component.css'
})
export class UserSectionComponent {
  @ViewChild(MyModal) myModal!: MyModal;
 
  userSections: userSectionRow[] = []

  ngOnInit() {
    this.fetchData();
  }

  fetchData(){
      
  }


  edit(item:any){

  }

  remove(item:any){

  }

}
