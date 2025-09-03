import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class UploadService {
  public $currentAudio = new BehaviorSubject<Blob | File | null>(null);
  public $currentText = new BehaviorSubject<Blob | File | null>(null);
  constructor() {}
}
