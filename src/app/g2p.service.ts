import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class G2pService {
  langsURL = "//g2p-studio.herokuapp.com/api/v1/langs"
  constructor(private http: HttpClient) {
  }

  getLangs$(): Observable<any> {
    return this.http.get(this.langsURL)
  }
}
