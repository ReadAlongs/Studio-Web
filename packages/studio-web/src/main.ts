import { platformBrowser } from "@angular/platform-browser";
import { enableProdMode } from "@angular/core";

import { AppModule } from "./app/app.module";
import { environment } from "./environments/environment";

if (environment.production) {
  enableProdMode();
}

platformBrowser()
  .bootstrapModule(AppModule)
  .catch((err: any) => console.error(err));
