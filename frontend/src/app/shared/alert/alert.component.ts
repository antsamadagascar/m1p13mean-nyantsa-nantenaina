import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService, AlertMessage } from '../../services/alert.service';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html'
})
export class AlertComponent implements OnInit {

  message: AlertMessage | null = null;

  constructor(private alertService: AlertService) {}

  ngOnInit(): void {
    this.alertService.alert$.subscribe((msg: AlertMessage | null) => {
      this.message = msg;
    });
  }
}
