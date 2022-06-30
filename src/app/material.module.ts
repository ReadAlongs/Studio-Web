import { NgModule } from '@angular/core';

import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

@NgModule({
    imports: [
        MatStepperModule,
        MatFormFieldModule,
        MatSlideToggleModule,
        MatButtonModule,
        MatSelectModule,
        MatIconModule
    ],
    exports: [
        MatStepperModule,
        MatFormFieldModule,
        MatSlideToggleModule,
        MatButtonModule,
        MatSelectModule,
        MatIconModule
    ]
})
export class MaterialModule { }