import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AlertComponent } from './shared/alert/alert.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AlertComponent],
  template: `
    <app-alert></app-alert>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {}
