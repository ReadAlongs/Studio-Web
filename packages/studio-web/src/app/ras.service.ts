import { map, Observable } from "rxjs";

import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { type DictEntry } from "soundswallower";

import { environment } from "../environments/environment";

export interface ReadAlong {
  lexicon: Array<DictEntry>;
  text_ids: string;
  processed_ras: string;
  input: string | null;
  parsed: string | null;
  tokenized: string | null;
  g2ped: string | null;
  log: string | null;
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
  names: { [code: string]: string };
}

export interface ReadAlongSlots {
  title: string;
  subtitle: string;
}

export interface ReadAlongData {
  audio: Blob | File;
  alignedXML: Document;
}

export enum SupportedOutputs {
  eaf = "eaf",
  textgrid = "textgrid",
  srt = "srt",
  vtt = "vtt",
  html = "html",
  zip = "zip",
}

@Injectable({
  providedIn: "root",
})
export class RasService {
  private baseURL = environment.apiBaseURL;
  private http = inject(HttpClient);

  convertRasFormat$(
    body: ReadAlongFormatRequest,
    output_type: SupportedOutputs,
  ): Observable<Blob> {
    return this.http.post(
      `${this.baseURL}/convert_alignment/${output_type}`,
      body,
      { responseType: "blob" },
    );
  }

  assembleReadalong$(body: ReadAlongRequest): Observable<ReadAlong> {
    return this.http.post<ReadAlong>(`${this.baseURL}/assemble`, body).pipe(
      map((ras: ReadAlong) => {
        if (!ras.processed_ras.startsWith("<?xml")) {
          ras.processed_ras =
            `<?xml version='1.0' encoding='utf-8'?>\n` + ras.processed_ras;
        }
        return ras;
      }),
    );
  }

  getLangs$(): Observable<Array<SupportedLanguage>> {
    return this.http.get<Array<SupportedLanguage>>(`${this.baseURL}/langs`);
  }
}
