import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService, AlertMessage } from '../../services/alert.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css']
})

export class AlertComponent implements OnInit, OnDestroy {

  message: AlertMessage | null = null;
  private sub!: Subscription;

  constructor(private alertService: AlertService) {}

  ngOnInit(): void {
    this.sub = this.alertService.alert$.subscribe(msg => {
      this.message = msg;
    });
  }

  close() {
    this.alertService.clear();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
