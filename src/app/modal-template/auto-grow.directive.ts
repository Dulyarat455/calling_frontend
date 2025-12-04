import { Directive, HostListener, ElementRef, AfterViewInit, Input } from '@angular/core';

@Directive({
  selector: '[autoGrow]',
  standalone: true
})
export class AutoGrowDirective implements AfterViewInit {

  @Input() minHeight: number = 60; // ← ตั้งค่าเริ่มต้น

  constructor(private el: ElementRef<HTMLTextAreaElement>) {}

  ngAfterViewInit() {
    const textarea = this.el.nativeElement;
    textarea.style.height = this.minHeight + 'px';
  }

  @HostListener('input')
  onInput() {
    const textarea = this.el.nativeElement;
    textarea.style.height = 'auto';

    const newHeight = Math.max(textarea.scrollHeight, this.minHeight);
    textarea.style.height = newHeight + 'px';
  }
}
