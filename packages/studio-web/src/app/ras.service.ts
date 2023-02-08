import { Observable } from "rxjs";

import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { DictEntry } from "soundswallower";

import { environment } from "../environments/environment";

export interface ReadAlong {
  lexicon: Array<DictEntry>;
  text_ids: string;
  processed_ras: string;
  input?: string;
  parsed?: string;
  tokenized?: string;
  g2ped?: string;
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
  constructor(private http: HttpClient) {}
  assembleReadalong$(body: ReadAlongRequest): Observable<ReadAlong> {
    return this.http.post<ReadAlong>(this.baseURL + "/assemble", body);
  }
  getLangs$(): Observable<Array<SupportedLanguage>> {
    return this.http.get<Array<SupportedLanguage>>(this.baseURL + "/langs");
  }
}
