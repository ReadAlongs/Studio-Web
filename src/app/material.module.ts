import { NgModule } from '@angular/core';

import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@NgModule({
    imports: [
        MatStepperModule,
        MatFormFieldModule,
        MatSlideToggleModule,
        MatButtonModule,
        MatSelectModule,
        MatIconModule,
        MatProgressBarModule
    ],
    exports: [
        MatStepperModule,
        MatFormFieldModule,
        MatSlideToggleModule,
        MatButtonModule,
        MatSelectModule,
        MatIconModule,
        MatProgressBarModule
    ]
})
export class MaterialModule { }