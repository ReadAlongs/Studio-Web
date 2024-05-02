import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { StudioComponent } from "./studio/studio.component";
import { ErrorPageComponent } from "./error-page/error-page.component";
import { EditorComponent } from "./editor/editor.component";

const routes: Routes = [
  {
    path: "",
    pathMatch: "full",
    component: StudioComponent,
  },
  {
    path: "editor",
    component: EditorComponent,
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
  imports: [RouterModule.forRoot(routes, { useHash: false })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
