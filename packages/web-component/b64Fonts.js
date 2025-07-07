const fs = require("fs");
const path = require("path");
const woff2base64 = require("woff2base64");
const css = require("css");

const componentPath = "src/";
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
  const allowedExtensions = [".tsx", ".jsx", ".ts", ".js", ".html"];

  const test = await fs.promises.opendir(dir);
  for await (const d of test) {
    const entry = path.join(dir, d.name);
    const fileName = d.name.toLowerCase();
    switch (true) {
      case d.isDirectory():
        yield* walk(entry);
        break;
      case d.isFile() &&
        allowedExtensions.some((ext) => fileName.endsWith(ext)):
        yield entry;
        break;
    }
  }
}

// Refuses instances of material-icons and material-icons-outlined.
async function invalidateUsesOfMaterialIconClass(srcDir) {
  const errors = [];
  for await (const p of walk(srcDir)) {
    if (p.indexOf("mat-icon") >= 0) {
      continue;
    }

    const fileErrors = Array.from(
      fs.readFileSync(p).toString().split("\n").entries(),
    )
      .filter(([row, line]) => line.indexOf("material-icons") >= 0)
      .map(([row, line]) => {
        return { file: p, lineNumber: row + 1, line: line };
      });
    errors.push(...fileErrors);
  }

  return errors;
}

// Extracts the material icon symbols used by the read along component. Returns
// a sorted list of icon names.
//
// Throws an exception if JSX expressions are used in <MatIcon /> elements.
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
 *
 * Verify there are no additional uses of class="material-icon".
 */
async function validate() {
  let exitCode = 0;

  // Verify there are no JSX expression inside of <MatIcon /> elements.
  try {
    await extractIconList(componentPath);
  } catch (err) {
    console.log(err);
    exitCode = 1;
  }

  // refuse all instances of material-icons or material-icons-outlined.
  const errors = await invalidateUsesOfMaterialIconClass(componentPath);
  if (errors.length > 0) {
    exitCode = 1;
    console.log(
      "error: detected usage of material-icons or material-icons-outlined. Please" +
        " replace these with the <MatIcon /> component:\n",
    );
    errors.forEach((err) => {
      console.log(`${err.file}:${err.lineNumber} - ${err.line.trim()}`);
    });
  }

  process.exit(exitCode);
}

const isValidate = process.argv.some((arg) => arg === "--validate");
if (isValidate) {
  validate();
} else {
  main();
}
