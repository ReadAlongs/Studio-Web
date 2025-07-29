import {
  AbstractControl,
  FormArray,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { validateFileType } from "../utils/utils";

// validate the total length of the input text.
export function maxInputTextLengthValidator(
  toastr: ToastrService,
  maxLengthKB: number,
): ValidatorFn {
  let currentToast: number = 0;

  return (control: AbstractControl<string | null>): ValidationErrors | null => {
    if (currentToast) {
      toastr.clear(currentToast);
      currentToast = 0;
    }

    if (!control.value) {
      return null;
    }

    if (control.value.length > maxLengthKB * 1024) {
      currentToast = toastr.error(
        $localize`Text too large. ` +
          $localize`Max size: ` +
          maxLengthKB +
          $localize` KB.` +
          $localize` Current size: ` +
          Math.ceil(control.value.length / 1024) +
          $localize` KB.`,
        $localize`Sorry!`,
        { timeOut: 15000 },
      ).toastId;
      return { maxInputTextLength: { value: control.value } };
    }

    return null;
  };
}

// Validate the user's select file against the accepted file types.
export function fileUploadTypeValidator(
  toastr: ToastrService,
  accepts: string,
  uploadType: "text" | "audio" = "text",
): ValidatorFn {
  return (control: AbstractControl<File | null>): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    if (validateFileType(control.value, accepts)) {
      return null;
    }

    toastr.error(
      uploadType === "text"
        ? $localize`The file "${control.value.name}:fileName:" is not a compatible text file.`
        : $localize`The file "${control.value.name}:fileName:" is not a compatible audio file.`,
      $localize`Sorry!`,
      { timeOut: 15000 },
    );

    return { fileUploadType: { value: control.value } };
  };
}

// Validate the file size against the imposed limits
export function textFileUploadSizeValidator(
  toastr: ToastrService,
  maxTxtSizeKB: number,
  maxRasSizeKB: number,
): ValidatorFn {
  return (control: AbstractControl<File | null>): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const file = control.value;
    const isXML = validateFileType(file, ".readalong,.xml");
    const maxSizeKB = isXML ? maxRasSizeKB : maxTxtSizeKB;
    if (file.size > maxSizeKB * 1024) {
      const fileTooBigMessage = isXML
        ? $localize`.readalong file too large. `
        : $localize`Text file too large. `;

      toastr.error(
        fileTooBigMessage + $localize`Max size: ` + maxSizeKB + $localize` KB.`,
        $localize`Sorry!`,
        { timeOut: 15000 },
      );

      return { textFileUploadSize: { value: file } };
    }

    return null;
  };
}

// Validates that a group of FormControl is valid if at least one
// control is valid.
export function orValidator(control: AbstractControl): ValidationErrors | null {
  if (control instanceof FormArray) {
    const group = control as FormArray;
    if (!group.controls.some((c) => c.valid && c.value)) {
      return { groupOr: { value: control.value } };
    }
  }

  if (control instanceof FormGroup) {
    const group = control as FormGroup;
    if (!Object.values(group.controls).some((c) => c.valid && c.value)) {
      return { groupOr: { value: control.value } };
    }
  }

  return null;
}
