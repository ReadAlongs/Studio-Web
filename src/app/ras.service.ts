import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment'
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'
@Injectable({
  providedIn: 'root'
})
export class RasService {
  baseURL = environment.apiBaseURL
  constructor(private http: HttpClient) { }
  assembleReadalong$(body: any): Observable<any> {
    return this.http.post(this.baseURL + "/assemble", body)
  }
  getLangs$(): Observable<any> {
    return this.http.get(this.baseURL + "/langs")
  }
}
