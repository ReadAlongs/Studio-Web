const fs = require("fs");
const path = require("path");
const woff2base64 = require("woff2base64");
const css = require("css");

async function* walk(dir) {
  for await (const d of await fs.promises.opendir(dir)) {
    const entry = path.join(dir, d.name);
    switch (true) {
      case d.isDirectory():
        yield* walk(entry);
        break;
      case d.isFile() && d.name.toLowerCase().endsWith(".tsx"):
        yield entry;
        break;
    }
  }
}

async function extractIconList(dir) {
  const matIconRe = /<MatIcon.*?>((.|\n)+?)<\/MatIcon>/gm;
  const iconNames = new Set();
  for await (const p of walk(dir)) {
    const tsx = fs.readFileSync(p).toString();
    for (const result of tsx.matchAll(matIconRe)) {
      if (!result || result.length < 2) {
        continue;
      }

      const iconName = result[1].trim();
      if (!iconName.startsWith("{") && !iconName.endsWith("}")) {
        iconNames.add(iconName);
        continue;
      }

      throw (
        "MatIcon does not support JSX expressions, please \n" +
        "rewrite your expression in the following format: \n\n" +
        "{cond ? <MatIcon>true</MatIcon> : <MatIcon>false</MatIcon>\n"
      );
    }
  }

  return Array.from(iconNames.values()).sort();
}

async function extractFontsFromGoogle() {
  // load the list of used material-icon.
  const knownIcons = await extractIconList("src/components/");

  // fetch and parse CSS definition from Google.
  const parsedCss = await fetch(
    "https://fonts.googleapis.com/css2?family=Material+Icons&family=Material+Icons+Outlined&display=swap&icon_names=" +
      knownIcons.join(","),
  )
    .then((resp) => resp.text())
    .then((text) => css.parse(text));

  const urlExtract = /url\((.+?)\)/;

  // extract the woff2base64 information from the parsed CSS
  return Promise.all(
    parsedCss.stylesheet.rules
      .filter((r) => r.type === "font-face")
      .map((fontRule) => {
        // flatten array of declarations to a single object.
        return Object.values(fontRule.declarations)
          .filter((decl) => decl.type === "declaration")
          .reduce((acc, decl) => {
            acc[decl.property] = decl.value;
            return acc;
          }, {});
      })
      .map((font) => {
        // extract url from src field.
        const fontUrl = urlExtract.exec(font.src);
        if (!fontUrl) {
          throw `error: could not find font URL for ${font["font-family"]}`;
        }
        font.src = fontUrl[1];
        return font;
      })
      .map(async (font) => {
        // convert the object to the woff2base62 format by fetching the
        // font from google.
        let fontFamily = font["font-family"];
        if (fontFamily.startsWith("'") && fontFamily.endsWith("'")) {
          fontFamily = fontFamily.slice(1, fontFamily.length - 1);
        }

        const fontFilename = fontFamily.replaceAll(" ", "") + ".woff2";
        const fontContent = {};
        const resp = await fetch(font.src);
        fontContent[fontFilename] = Buffer.from(await resp.arrayBuffer());

        return {
          font: fontContent,
          options: {
            fontFamily: fontFamily,
            style: font["font-style"] ?? "normal",
            weight: parseInt(font["font-weight"] ?? "400"),
          },
        };
      }),
  );
}

const bcFont = {
  font: {
    "BCSans-Regular.woff2": fs.readFileSync(
      "src/scss/fonts/BCSans-Regular.woff2",
    ),
  },
  options: {
    fontFamily: "BCSans",
    style: "normal",
  },
};

extractFontsFromGoogle().then((fonts) => {
  fonts.push(bcFont);

  const b64Css = fonts
    .map((x) => woff2base64(x.font, x.options).woff2)
    .join("\n");

  fs.writeFileSync(
    "../../dist/packages/web-component/dist/fonts.b64.css",
    b64Css,
  );
  fs.writeFileSync("../studio-web/src/assets/fonts.b64.css", b64Css);
});
