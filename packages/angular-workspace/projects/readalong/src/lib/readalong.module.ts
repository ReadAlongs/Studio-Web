import { NgModule } from '@angular/core';

import { ReadalongComponent } from './readalong.component';
import { DIRECTIVES } from './stencil-generated';

@NgModule({
  declarations: [
    ReadalongComponent,
    ...DIRECTIVES
  ],
  imports: [
  ],
  exports: [
    ReadalongComponent,
    ...DIRECTIVES
  ]
})
export class ReadalongModule { }
