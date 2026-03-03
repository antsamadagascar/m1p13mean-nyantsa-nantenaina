import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SotckService {

  private apiUrl = 'http://localhost:5000/api/stock'; // adapter selon ton backend

  constructor(private http: HttpClient) { }
}
