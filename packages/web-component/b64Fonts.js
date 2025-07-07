const fs = require("fs");
const path = require("path");
const woff2base64 = require("woff2base64");
const css = require("css");

const componentPath = "src/components";
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

async function extractIconList(srcDir) {
  const matIconRe = /<MatIcon.*?>((.|\n)+?)<\/MatIcon>/gm;
  const iconNames = new Set();
  for await (const p of walk(srcDir)) {
    const tsx = fs.readFileSync(p).toString();
    for (const icon of tsx.matchAll(matIconRe)) {
      if (!icon || icon.length < 2) {
        continue;
      }

      const iconName = icon[1].trim();
      if (!iconName.startsWith("{") && !iconName.endsWith("}")) {
        iconNames.add(iconName);
        continue;
      }

      throw (
        "MatIcon does not support JSX expressions, please " +
        `rewrite your expression: (file: ${p}) \n\n` +
        `   ${icon[0]}\n\n` +
        "using the following format: \n" +
        "   {cond ? (<MatIcon>true</MatIcon>) : (<MatIcon>false</MatIcon>)\n"
      );
    }
  }

  return Array.from(iconNames.values()).sort();
}

/**
 * Uses Google's font v2 API to fetch the CSS font-face declarations.
 *
 * Returns an array of woff2base64 font definitions.
 */
async function fontsFromGoogle(srcDir) {
  // load the list of used material-icon.
  const knownIcons = await extractIconList(srcDir);

  // fetch and parse CSS definition from Google.
  const iconUrl =
    "https://fonts.googleapis.com/css2?family=Material+Icons&family=Material+Icons+Outlined&display=swap&icon_names=" +
    knownIcons.join(",");

  const parsedCss = await fetch(iconUrl)
    .then((resp) => {
      if (resp.status === 200) {
        return resp.text();
      }
      throw `${resp.statusText}(${resp.status}): could not fetch font information from Google`;
    })
    .then((text) => css.parse(text))
    .catch((err) => console.log(err));
  if (!parsedCss) {
    return null;
  }

  const urlExtract = /url\((.+?)\)/;

  // extract the woff2base64 information from the parsed CSS
  const fonts = parsedCss.stylesheet.rules
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
    });

  return Promise.all(fonts);
}

/**
 * Generate embeddable font files for use with Studio Web.
 */
async function main() {
  const fonts = await fontsFromGoogle(componentPath);
  if (!fonts) {
    process.exit(1);
  }

  fonts.push(bcFont);
  const b64Css = fonts
    .map((x) => woff2base64(x.font, x.options).woff2)
    .join("\n");

  fs.writeFileSync(
    "../../dist/packages/web-component/dist/fonts.b64.css",
    b64Css,
  );

  fs.writeFileSync("../studio-web/src/assets/fonts.b64.css", b64Css);
}

/**
 * Validate the use of <MatIcon /> type. We currently don't support
 * JSX expression.
 */
async function validate() {
  try {
    await extractIconList(componentPath);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

const isValidate = process.argv.some((arg) => arg === "--validate");
if (isValidate) {
  validate();
} else {
  main();
}
