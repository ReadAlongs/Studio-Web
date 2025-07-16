import { Injectable } from "@angular/core";
import { ReadAlongSlots } from "../ras.service";
import { Subject, BehaviorSubject } from "rxjs";
import { FormBuilder, FormControl, Validators } from "@angular/forms";

export enum langMode {
  generic = "generic",
  specific = "specific",
}

export interface InputMethodType {
  audio: "mic" | "upload";
  text: "edit" | "upload";
}

@Injectable({
  providedIn: "root",
})
export class StudioService {
  slots: ReadAlongSlots = {
    title: $localize`Title`,
    subtitle: $localize`Subtitle`,
  };
  lastStepperIndex: number = 0;
  temporaryBlob: Blob | undefined = undefined;
  b64Inputs$ = new BehaviorSubject<[string, Document | null]>(["", null]);
  render$ = new BehaviorSubject<boolean>(false);
  langMode$ = new BehaviorSubject<langMode>(langMode.generic);
  langControl$ = new FormControl<string>(
    { value: "und", disabled: this.langMode$.value !== "specific" },
    Validators.required,
  );
  textControl$ = new FormControl<File | Blob | null>(null, Validators.required);
  audioControl$ = new FormControl<File | Blob | null>(
    null,
    Validators.required,
  );
  $textInput = new BehaviorSubject<string>("");
  public uploadFormGroup = this._formBuilder.group({
    lang: this.langControl$,
    text: this.textControl$,
    audio: this.audioControl$,
  });
  inputMethod: InputMethodType = {
    audio: "mic",
    text: "edit",
  };
  constructor(private _formBuilder: FormBuilder) {
    this.langMode$.subscribe((chosenLangMode) => {
      if (chosenLangMode === langMode.generic) {
        this.langControl$.disable();
      } else {
        this.langControl$.enable();
      }
    });
  }
}
