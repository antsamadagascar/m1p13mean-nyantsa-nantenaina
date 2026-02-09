import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type AlertType = 'success' | 'error' | 'info';

export interface AlertMessage {
  type: AlertType;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class AlertService {
  private alertSubject = new BehaviorSubject<AlertMessage | null>(null);
  public alert$: Observable<AlertMessage | null> = this.alertSubject.asObservable();

  success(message: string) { this.show('success', message); }
  error(message: string) { this.show('error', message); }
  info(message: string) { this.show('info', message); }

  private show(type: AlertType, text: string) {
    this.alertSubject.next({ type, text });

    // Supprime le message automatiquement après 3s
    setTimeout(() => this.clear(), 10000);
  }

  clear() { this.alertSubject.next(null); }
}
