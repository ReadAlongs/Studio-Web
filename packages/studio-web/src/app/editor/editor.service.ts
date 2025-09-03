import { Injectable } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ReadAlongSlots } from "../ras.service";

@Injectable({
  providedIn: "root",
})
export class EditorService {
  public audioControl$ = new FormControl<File | null>(
    null,
    Validators.required,
  );
  public rasControl$ = new FormControl<Document | null>(
    null,
    Validators.required,
  );
  public audioB64Control$ = new FormControl<string | null>(
    null,
    Validators.required,
  );
  public slots: ReadAlongSlots = {
    title: $localize`Title`,
    subtitle: $localize`Subtitle`,
  };
  public uploadFormGroup = new FormGroup({
    audio: this.audioControl$,
    ras: this.rasControl$,
    audioB64: this.audioB64Control$,
  });
  temporaryBlob: Blob | undefined = undefined;
}
