import packageJson from "../../package.json";

export const environment = {
  production: true,
  apiBaseURL: "https://readalong-studio.herokuapp.com/api/v1",
  packageJson: packageJson,

  languages: {
    en: "https://readalong-studio.mothertongues.org/",
    fr: "https://readalong-studio.mothertongues.org/fr/",
    es: "https://readalong-studio.mothertongues.org/es/",
  },
};
