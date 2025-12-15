import { Component,ViewChild,EventEmitter, Output, Input } from '@angular/core';
import {MyModal } from '../my-modal/my-modal.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-alert-request',
  standalone: true,
  imports: [FormsModule,MyModal,CommonModule],
  templateUrl: './alert-request.component.html',
  styleUrl: './alert-request.component.css'
})
export class AlertRequestComponent {

  @ViewChild(MyModal) myModal!: MyModal;

  open(){
    this.myModal?.open();
  }

  close() {
    this.myModal?.close();
  }
  accept() {
  
    this.myModal?.close();
  }
  
}
