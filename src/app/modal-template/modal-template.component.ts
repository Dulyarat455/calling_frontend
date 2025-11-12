import { Component,ViewChild } from '@angular/core';
import {MyModal } from '../my-modal/my-modal.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-template',
  standalone: true,
  imports: [FormsModule,MyModal],
  templateUrl: './modal-template.component.html',
  styleUrl: './modal-template.component.css'
})
export class ModalTemplateComponent {
  @ViewChild(MyModal) myModal!: MyModal;
  name: string  = '';
  remark: string = '';

  save(){

  }

  

}
