import {
  Observable,
  Subscriber,
  catchError,
  from,
  lastValueFrom,
  map,
  of,
  take,
} from "rxjs";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { AudioContext, AudioBuffer } from "standardized-audio-context";

@Injectable({
  providedIn: "root",
})
export class FileService {
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);

  loadAudioBufferFromFile$(
    file: File | Blob,
    sampleRate: number,
  ): Observable<AudioBuffer> {
    const audioCtx = new AudioContext({ sampleRate });
    const audioFile = file.arrayBuffer().then((buffer: any) => {
      return audioCtx.decodeAudioData(buffer);
    });
    return from(audioFile);
  }

  returnFileFromPath$(url: string, responseType: string = "blob") {
    const httpOptions: Object = { responseType };
    return this.http.get<any>(url, httpOptions).pipe(
      catchError((err: HttpErrorResponse) => {
        this.toastr.error(
          err.message,
          $localize`Hmm, the file is unreachable. Please try again later.`,
          {
            timeOut: 10000,
          },
        );
        return of(err);
      }),
      map((blob) => {
        return blob;
      }),
      take(1),
    );
  }

  readFile$(
    blob: Blob | File | string,
    type: string = "text/plain",
  ): Observable<string> {
    if (typeof blob === "string") {
      blob = new Blob([blob], { type: type });
    }

    const reader = new FileReader();
    return new Observable((obs: Subscriber<string>) => {
      reader.onerror = (err) => obs.error(err);
      reader.onabort = (err) => obs.error(err);
      reader.onload = () => obs.next(reader.result as string);
      reader.onloadend = () => obs.complete();
      reader.readAsText(blob);
    });
  }

  // A promise based implementation of readFile$.
  readFile(
    blob: Blob | File | string,
    type: string = "text/plain",
  ): Promise<string> {
    return lastValueFrom(this.readFile$(blob, type));
  }

  readFileAsDataURL$(
    blob: Blob | File | string,
    type: string = "text/plain",
  ): Observable<string> {
    if (typeof blob === "string") {
      blob = new Blob([blob], { type: type });
    }

    const reader = new FileReader();
    return new Observable((obs: Subscriber<string>) => {
      reader.onerror = (err) => obs.error(err);
      reader.onabort = (err) => obs.error(err);
      reader.onload = () => obs.next(reader.result as string);
      reader.onloadend = () => obs.complete();
      reader.readAsDataURL(blob);
    });
  }

  // A promise based implementation of readFileAsDataURL$.
  readFileAsDataURL(
    blob: Blob | File | string,
    type: string = "text/plain",
  ): Promise<string> {
    return lastValueFrom(this.readFileAsDataURL$(blob, type));
  }
}
