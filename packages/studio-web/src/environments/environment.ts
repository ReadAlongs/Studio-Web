// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
import packageJson from "../../package.json";

export const environment = {
  production: false,
  apiBaseURL: "http://localhost:8000/api/v1",
  packageJson: packageJson,

  languages: [
    {
      code: "en",
      url: "http://localhost:4200/",
      title: "Start a new session in English.",
      name: "English",
    },
    {
      code: "fr",
      url: "http://localhost:4203/",
      title: "Démarrer une nouvelle session en français.",
      name: "Français",
    },
    {
      code: "es",
      url: "http://localhost:4204/",
      title: "Iniciar una nueva sesión en español.",
      name: "Español",
    },
  ],
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
