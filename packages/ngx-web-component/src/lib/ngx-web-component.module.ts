import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DIRECTIVES } from "../generated/directives";
import { defineCustomElements } from "@readalongs/web-component/loader";

defineCustomElements();

@NgModule({
  imports: [CommonModule],
  declarations: [...DIRECTIVES],
  exports: [...DIRECTIVES],
})
export class NgxRAWebComponentModule {}
