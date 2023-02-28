import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { StudioComponent } from "./studio/studio.component";
import { ErrorPageComponent } from "./error-page/error-page.component";

const routes: Routes = [
  {
    path: "",
    component: StudioComponent,
  },
  {
    path: "error",
    component: ErrorPageComponent,
  },
  {
    path: "**",
    component: ErrorPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
