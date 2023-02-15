import { catchError, Observable, of } from "rxjs";
import { ToastrService } from "ngx-toastr";

import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { DictEntry } from "soundswallower";

import { environment } from "../environments/environment";

export interface ReadAlong {
  lexicon: Array<DictEntry>;
  text_ids: string;
  processed_ras: string;
  input: string | null;
  parsed: string | null;
  tokenized: string | null;
  g2ped: string | null;
}

export interface ReadAlongRequest {
  input?: string;
  type?: string;
  debug?: boolean;
  text_languages: Array<string>;
}

export interface SupportedLanguage {
  code: string;
  names: {[code: string]: string};
}

@Injectable({
  providedIn: "root",
})
export class RasService {
  baseURL = environment.apiBaseURL;
  constructor(private http: HttpClient, private toastr: ToastrService,) {}
  assembleReadalong$(body: ReadAlongRequest): Observable<ReadAlong|HttpErrorResponse> {
    return this.http.post<ReadAlong>(this.baseURL + "/assemble", body).pipe(
      catchError((err: HttpErrorResponse) => { this.toastr.error(
        err.message,
        $localize`Hmm, we can't connect to the ReadAlongs API. Please try again later.`
      ); return of(err)} )
    );
  }
  getLangs$(): Observable<Array<SupportedLanguage>|HttpErrorResponse> {
    return this.http.get<Array<SupportedLanguage>>(this.baseURL + "/langs").pipe(
      catchError((err: HttpErrorResponse) => { this.toastr.error(
        err.message,
        $localize`Hmm, we can't connect to the ReadAlongs API. Please try again later.`
      ); return of(err)} )
    );;
  }
}
