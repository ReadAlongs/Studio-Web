import { NgModule } from '@angular/core';
import { defineCustomElements } from '@readalong/loader';

import { ReadAlong } from './stencil-generated/proxies';

defineCustomElements(window);

@NgModule({
  declarations: [
    ReadAlong
  ],
  imports: [
  ],
  exports: [
    ReadAlong
  ]
})
export class ReadalongModule { }
