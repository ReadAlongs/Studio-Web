import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class UploadService {
  $currentAudio = new BehaviorSubject<Blob | File | null>(null);
  $currentText = new BehaviorSubject<Blob | File | null>(null);
  constructor() {}
}
