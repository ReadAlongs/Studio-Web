import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class WcStylingService {
  public $wcStyleInput = new BehaviorSubject<string>("");
  public $wcStyleFonts = new BehaviorSubject<string>("");
}
