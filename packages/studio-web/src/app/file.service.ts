import { Observable } from "rxjs";

import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class FileService {
  constructor() {}

  readFile$(blob: Blob | File): Observable<string> {
    const reader = new FileReader();
    return Observable.create((obs: any) => {
      reader.onerror = (err) => obs.error(err);
      reader.onabort = (err) => obs.error(err);
      reader.onload = () => obs.next(reader.result);
      reader.onloadend = () => obs.complete();
      reader.readAsText(blob);
    });
  }
  readFileAsData$(blob: Blob | File): Observable<any> {
    const reader = new FileReader();
    return Observable.create((obs: any) => {
      reader.onerror = (err) => obs.error(err);
      reader.onabort = (err) => obs.error(err);
      reader.onload = () => obs.next(reader.result);
      reader.onloadend = () => obs.complete();
      reader.readAsDataURL(blob);
    });
  }
}
