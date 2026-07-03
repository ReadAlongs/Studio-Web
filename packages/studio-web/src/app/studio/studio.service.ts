import { Injectable } from "@angular/core";
import { ReadAlongSlots } from "../ras.service";
import { BehaviorSubject } from "rxjs";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { TextRange } from "../shared/textarea-overlay/document-words";

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
  public textControl$ = new FormControl<File | Blob | null>(
    null,
    Validators.required,
  );
  public audioControl$ = new FormControl<File | Blob | null>(
    null,
    Validators.required,
  );
  public $textInput = new BehaviorSubject<string>("");
  // Character ranges of words currently flagged by a g2p alignment error,
  // for the text-input overlay to underline. Kept in sync with edits by
  // UploadComponent (cleared per-word once the flagged word is changed).
  public $textInputErrors = new BehaviorSubject<TextRange[]>([]);

  public uploadFormGroup = new FormGroup({
    lang: this.langControl$,
    text: this.textControl$,
    audio: this.audioControl$,
  });
  public inputMethod: InputMethodType = {
    audio: "mic",
    text: "edit",
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
