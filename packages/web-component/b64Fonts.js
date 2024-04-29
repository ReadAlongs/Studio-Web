const fs = require("fs");
const woff2base64 = require("woff2base64");

const fonts = [
  {
    font: {
      "MaterialIcons.woff2": fs.readFileSync(
        "src/scss/fonts/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2",
      ),
    },
    options: {
      fontFamily: "Material Icons",
      style: "normal",
      weight: 400,
    },
  },
  {
    font: {
      "MaterialIconsOutlined.woff2": fs.readFileSync(
        "src/scss/fonts/gok-H7zzDkdnRel8-DQ6KAXJ69wP1tGnf4ZGhUcel5euIg.woff2",
      ),
    },
    options: {
      fontFamily: "Material Icons Outlined",
      style: "normal",
      weight: 400,
    },
  },
  {
    font: {
      "BCSans-Regular.woff2": fs.readFileSync(
        "src/scss/fonts/BCSans-Regular.woff2",
      ),
    },
    options: {
      fontFamily: "BCSans",
      style: "normal",
    },
  },
];

const css = fonts.map((x) => woff2base64(x.font, x.options).woff2).join("\n");
fs.writeFileSync("../../dist/packages/web-component/dist/fonts.b64.css", css);
fs.writeFileSync("../studio-web/src/assets/fonts.b64.css", css);
