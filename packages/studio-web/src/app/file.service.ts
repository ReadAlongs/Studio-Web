import { Observable, catchError, map, of, take } from "rxjs";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ToastrService } from "ngx-toastr";

@Injectable({
  providedIn: "root",
})
export class FileService {
  constructor(private http: HttpClient, private toastr: ToastrService) {}

  returnFileFromPath$ = (url: string, responseType: string = "blob") => {
    const httpOptions: Object = { responseType };
    return this.http.get<any>(url, httpOptions).pipe(
      catchError((err: HttpErrorResponse) => {
        this.toastr.error(
          err.message,
          $localize`Hmm, the file is unreachable. Please try again later.`,
          {
            timeOut: 10000,
          }
        );
        return of(err);
      }),
      map((blob) => {
        console.log(blob);
        return blob;
      }),
      take(1)
    );
  };

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
