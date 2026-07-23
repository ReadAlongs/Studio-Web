import { Node as PMNode } from "@tiptap/pm/model";

import { Injectable } from "@angular/core";
import { ReadAlongSlots } from "../ras.service";
import { BehaviorSubject } from "rxjs";
import { FormControl, FormGroup, Validators } from "@angular/forms";

export enum langMode {
  generic = "generic",
  specific = "specific",
}

export interface InputMethodType {
  audio: "mic" | "upload";
}

@Injectable({
  providedIn: "root",
})
export class StudioService {
  public slots: ReadAlongSlots = {
    title: $localize`Title`,
    subtitle: $localize`Subtitle`,
  };
  public lastStepperIndex: number = 0;
  public temporaryBlob: Blob | undefined = undefined;
  public b64Inputs$ = new BehaviorSubject<[string, Document | null]>([
    "",
    null,
  ]);
  public render$ = new BehaviorSubject<boolean>(false);
  public langMode$ = new BehaviorSubject<langMode>(langMode.generic);
  public langControl$ = new FormControl<string>(
    { value: "und", disabled: this.langMode$.value !== "specific" },
    Validators.required,
  );
  // Holds the TipTap document directly (implementation_plan.md §1, decision
  // 1) for both typed and uploaded text, so the align request always
  // serializes from a single source of truth.
  public textControl$ = new FormControl<PMNode | null>(
    null,
    Validators.required,
  );
  public audioControl$ = new FormControl<File | Blob | null>(
    null,
    Validators.required,
  );

  public uploadFormGroup = new FormGroup({
    lang: this.langControl$,
    text: this.textControl$,
    audio: this.audioControl$,
  });
  public inputMethod: InputMethodType = {
    audio: "mic",
  };

  constructor() {
    this.langMode$.subscribe((chosenLangMode) => {
      if (chosenLangMode === langMode.generic) {
        this.langControl$.disable();
      } else {
        this.langControl$.enable();
      }
    });
  }
}
