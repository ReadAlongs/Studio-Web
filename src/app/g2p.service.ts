import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators'
@Injectable({
  providedIn: 'root'
})
export class G2pService {
  langsURL = "//g2p-studio.herokuapp.com/api/v1/langs?verbose=true"
  constructor(private http: HttpClient) {
  }

  getLangs$(): Observable<any> {
    return this.http.get(this.langsURL).pipe(
      map((langs: any) => langs.filter((x: any) => { return x.out_lang.endsWith('ipa') && x.out_lang !== 'eng-ipa' }))
    )
  }
}
