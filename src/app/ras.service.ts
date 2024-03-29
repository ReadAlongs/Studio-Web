import { Observable } from "rxjs";

import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

import { environment } from "../environments/environment";

export interface ReadAlong {
  lexicon: { [id: string]: string };
  jsgf: string;
  text_ids: string;
  processed_xml: string;
  input?: string;
  parsed?: string;
  tokenized?: string;
  g2ped?: string;
}

export interface ReadAlongRequest {
  text?: string;
  xml?: string;
  debug?: boolean;
  text_languages: Array<string>;
}

export interface LanguageMap {
  [id: string]: string;
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
  getLangs$(): Observable<LanguageMap> {
    return this.http.get<LanguageMap>(this.baseURL + "/langs");
  }
}
