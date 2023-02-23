import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { StudioComponent } from "./studio/studio.component";
import { Missing404Component } from "./missing404/missing404.component";
import { FatalErrorComponent } from "./fatal-error/fatal-error.component";

const routes: Routes = [
  {
    path: "",
    component: StudioComponent,
  },
  {
    path: "error",
    component: FatalErrorComponent,
  },
  {
    path: "**",
    component: Missing404Component,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
