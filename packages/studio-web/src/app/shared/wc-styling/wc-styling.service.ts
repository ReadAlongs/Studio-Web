import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
@Injectable({
  providedIn: "root",
})
export class WcStylingService {
  $wcStyleInput = new BehaviorSubject<string>("");
  $wcStyleFonts = new BehaviorSubject<string>("");
}
