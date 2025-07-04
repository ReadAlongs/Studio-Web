import packageJson from "../../package.json";

export const environment = {
  production: true,
  apiBaseURL: "https://readalong-studio.herokuapp.com/api/v1",
  packageJson: packageJson,

  languages: [
    {
      code: "en",
      url: "https://readalong-studio.mothertongues.org/",
      title: "Start a new session in English.",
      name: "English",
    },
    {
      code: "fr",
      url: "https://readalong-studio.mothertongues.org/fr/",
      title: "Démarrer une nouvelle session en français.",
      name: "Français",
    },
    {
      code: "es",
      url: "https://readalong-studio.mothertongues.org/es/",
      title: "Iniciar una nueva sesión en español.",
      name: "Español",
    },
  ],
};
