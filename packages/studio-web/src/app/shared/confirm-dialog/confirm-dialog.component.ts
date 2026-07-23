import { Component, inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
}

@Component({
  selector: "app-confirm-dialog",
  templateUrl: "./confirm-dialog.component.html",
  standalone: false,
})
export class ConfirmDialogComponent {
  protected dialogRef = inject(MatDialogRef<ConfirmDialogComponent, boolean>);
  protected data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
