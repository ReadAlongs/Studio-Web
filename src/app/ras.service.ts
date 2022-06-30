import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment'
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class RasService {
  baseURL = environment.apiBaseURL
  constructor(private http: HttpClient) { }
  getGrammar$(body: any): Observable<any> {
    return this.http.post(this.baseURL + "/dict", body)
  }
  getReadalong$(body: any): Observable<any> {
    return this.http.post(this.baseURL + "/readalong", body)
  }
}
