import { catchError, Observable, of, take } from "rxjs";
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

export interface ReadAlongFormatRequest {
  dur: number; // the duration (in seconds) of the audio
  ras: string; // The ras XML as a string
}

export interface SupportedLanguage {
  code: string;
  names: {[code: string]: string};
}

export enum SupportedOutputs {
  eaf,
  textgrid,
  srt,
  vtt
}

@Injectable({
  providedIn: "root",
})
export class RasService {
  baseURL = environment.apiBaseURL;
  constructor(private http: HttpClient, private toastr: ToastrService,) {}

  convertRasFormat$(body: ReadAlongFormatRequest, output_type: SupportedOutputs|string): Observable<any|HttpErrorResponse> {
    return this.http.post(this.baseURL + "/convert_alignment/" + output_type, body, {responseType: 'blob'}).pipe(
      catchError((err: HttpErrorResponse) => { this.toastr.error(
        err.message,
        $localize`Hmm, we can't connect to the ReadAlongs API. Please try again later.`,
        {
          timeOut: 60000,
        }
      ); return of(err)} ),
      take(1)
    );
  }

  assembleReadalong$(body: ReadAlongRequest): Observable<ReadAlong|HttpErrorResponse> {
    return this.http.post<ReadAlong>(this.baseURL + "/assemble", body).pipe(
      catchError((err: HttpErrorResponse) => { this.toastr.error(
        err.message,
        $localize`Hmm, we can't connect to the ReadAlongs API. Please try again later.`,
        {
          timeOut: 60000,
        }
      ); return of(err)} )
    );
  }
  getLangs$(): Observable<Array<SupportedLanguage>|HttpErrorResponse> {
    return this.http.get<Array<SupportedLanguage>>(this.baseURL + "/langs").pipe(
      catchError((err: HttpErrorResponse) => { this.toastr.error(
        err.message,
        $localize`Hmm, we can't connect to the ReadAlongs API. Please try again later.`,
        {
          timeOut: 60000,
        }
      ); return of(err)} )
    );;
  }
}
