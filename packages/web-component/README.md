![Built With Stencil](https://img.shields.io/badge/-Built%20With%20Stencil-16161d.svg?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjIuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI%2BCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI%2BCgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU%2BCjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik00MjQuNywzNzMuOWMwLDM3LjYtNTUuMSw2OC42LTkyLjcsNjguNkgxODAuNGMtMzcuOSwwLTkyLjctMzAuNy05Mi43LTY4LjZ2LTMuNmgzMzYuOVYzNzMuOXoiLz4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTQyNC43LDI5Mi4xSDE4MC40Yy0zNy42LDAtOTIuNy0zMS05Mi43LTY4LjZ2LTMuNkgzMzJjMzcuNiwwLDkyLjcsMzEsOTIuNyw2OC42VjI5Mi4xeiIvPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNDI0LjcsMTQxLjdIODcuN3YtMy42YzAtMzcuNiw1NC44LTY4LjYsOTIuNy02OC42SDMzMmMzNy45LDAsOTIuNywzMC43LDkyLjcsNjguNlYxNDEuN3oiLz4KPC9zdmc%2BCg%3D%3D&colorA=16161d&style=flat-square)

# Read-Along Web Component

This is a web component for embedding read-along, audio/text aligned content in your website or hybrid app.

## Basic use

The simplest way to use the web component is to generate a read along using the [ReadAlongs Studio web app](https://readalong-studio.mothertongues.org/).
Once you've create a readalong, you can download the Web Bundle.

You can also use the [ReadAlongs Studio CLI](https://github.com/ReadAlongs/Studio). Its `align` command will output the bundle in a folder.

Whether you're using the web app or the CLI, the bundle will contain the read-along XML file (.readalong), the other assets, and a minimal HTML index page, which you can view with `python -m http.server`, for example, or deploy on a web server.

The rest of this readme is intended for users who want to customize their readalongs or contribute to the development of this web component.

## Installation

For now, just clone the repo, make sure you have node 6+, and run `npm install` from the project root. Then you can
run `npm start` and a minimal website containing only the webcomponent will be served at `localhost:3333`. Any changes
you make to `/src` will be automatically shown in the browser.

## Properties

| Property               | Attribute                   | Description                                                                                                                                                                                                                                       | Type                         | Default        |
| ---------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | -------------- |
| `audio`                | `audio`                     | URL of the audio file                                                                                                                                                                                                                             | `string`                     | `undefined`    |
| `autoPauseAtEndOfPage` | `auto-pause-at-end-of-page` | Auto Pause at end of every page                                                                                                                                                                                                                   | `boolean`                    | `false`        |
| `cssUrl`               | `css-url`                   | Optional custom Stylesheet to override defaults                                                                                                                                                                                                   | `string`                     | `undefined`    |
| `displayTranslation`   | `display-translation`       | Show text translation on at load time                                                                                                                                                                                                             | `boolean`                    | `true`         |
| `href`                 | `href`                      | URL of the aligned text as readalong XML                                                                                                                                                                                                          | `string`                     | `undefined`    |
| `imageAssetsFolder`    | `image-assets-folder`       | Define a path for where the image assets are located This should be used instead of use-assets-folder. Defaults to 'assets/'. The empty string means that image paths will not have a prefix added to them. Use of the forward slash is optional. | `string`                     | `"assets/"`    |
| `language`             | `language`                  | Language of the interface. In 639-3 code. Options are "eng" (English), "fra" (French) or "spa" (Spanish)                                                                                                                                          | `"eng" \| "fra" \| "spa"`    | `"eng"`        |
| `mode`                 | `mode`                      | Choose mode of ReadAlong - either view (default) or edit                                                                                                                                                                                          | `"EDIT" \| "VIEW"`           | `"VIEW"`       |
| `pageScrolling`        | `page-scrolling`            | Toggles the page scrolling from horizontal to vertical. Defaults to horizontal                                                                                                                                                                    | `"horizontal" \| "vertical"` | `"horizontal"` |
| `playbackRateRange`    | `playback-rate-range`       | Control the range of the playback rate: allow speeds from 100 - playback-rate-range to 100 + playback-rate-range.                                                                                                                                 | `number`                     | `15`           |
| `scrollBehaviour`      | `scroll-behaviour`          | Select whether scrolling between pages should be "smooth" (default nicely animated, good for fast computers) or "auto" (choppy but much less compute intensive)                                                                                   | `"auto" \| "smooth"`         | `"smooth"`     |
| `svgOverlay`           | `svg-overlay`               | Overlay This is an SVG overlay to place over the progress bar                                                                                                                                                                                     | `string`                     | `undefined`    |
| `theme`                | `theme`                     | Theme to use: ['light', 'dark'] defaults to 'dark'                                                                                                                                                                                                | `string`                     | `"light"`      |
| `useAssetsFolder`      | `use-assets-folder`         | DEPRECATED Toggle the use of an assets folder. Defaults to undefined. Previously (<1.2.0) defaulted to 'true'. .readalong files should just contain base filenames not the full paths to the images.                                              | `boolean`                    | `undefined`    |

#### IMAGES

You have three options:

- put images in "assets/" and provide relative links
- provide full paths
- put them in a custom relative folder and make sure to add `image-assets-folder="path/to/images/folder"` attribute to the read-long
  component

Images can be inserted in a read-along interactively using the web app.

If you're using the CLI, images are normally inserted in a read-along by specifying them in the `config.json` file provided to `readalongs align`, which will then attempt to generate and populate the assets folder automatically.
See the [readalongs CLI user guide](https://readalong-studio.readthedocs.io/en/latest/cli-guide.html#adding-titles-images-and-do-not-align-segments-via-the-config-json-file) for details.

## Test with your site

You can either modify the `/src/index.html` or after running `npm start` you can copy out the `www/build` folder and add
the following script import in your own `index.html` page:

```html
<script
  type="module"
  src="https://unpkg.com/@readalongs/web-component@^1.4.0/dist/web-component/web-component.esm.js"
></script>
```

Then, you can add as many read-along components to your page as you like simply by adding `<read-along>`
elements with arguments for where to find your text, alignments and audio file.
These files can be generated using the
[ReadAlongs Studio web app](https://readalong-studio.mothertongues.org/)
or the
[ReadAlongs Studio CLI](https://github.com/ReadAlongs/Studio).

```html
<read-along
  href="assets/my-story.readalong"
  audio="assets/my-story.wav"
  css-url="assets/custom.css"
  image-assets-folder="assets/"
></read-along>
```

## Loading as a single file

By default, Stencil (the tool used to build this web component) uses lazy loading. However, some use cases for this web component might involve running the component as a single file, without access to the internet. A single-file script of this web component is therefore made available at https://unpkg.com/@readalongs/web-component@^1.4.0/dist/bundle.js although we recommend using the default imports using the unpkg content delivery network (cdn) described above.

## Theming

There are two themes out-of-the-box: `light` and `dark`. You set them as a property on the `<read-along>`
web component element. If you want to add your own theme, it's as easy as adding your colour palette to the `$ui-themes`
variable in `src/components/read-along-component/scss/utilities/_colors.scss`. Note you will have to rebuild the web
component from source to do this, or submit your theme as a pull-request!

```scss
$ui-themes: (
  light: (
    primary: $white,
    secondary: darken($white, 50%),
    accent: darken($white, 60%),
    text: $black,
    text--secondary: $white,
    text--accent: $white,
  ),
  dark: (
    primary: lighten($black, 30%),
    secondary: darken($white, 35%),
    accent: $white,
    text: $white,
    text--secondary: $white,
    text--accent: $black,
  ),
);
```

## Slots

Slots allow you to add custom html into specific "slots" within the web component. For example, to add an optional
header and subheader to the `<read-along>` element, you would write:

```html
<read-along>
  <span slot="read-along-header">Hello World!</span>
  <span slot="read-along-subheader">Read by I-travelled Around-the-world</span>
</read-along>
```

| Slot                   | Description            | Suggested Element |
| ---------------------- | ---------------------- | ----------------- |
| `read-along-header`    | The read along header  | `span`            |
| `read-along-subheader` | Subheader (ie authors) | `span`            |

## Page layout

By default, the pages are two column layout with images on the left and text on the right. You can force any page to one
column layout by setting the class of the page to `one-column-layout-page`
in the `.readalong` file.

```xml
<div type="page" class="one-column-layout-page">
  ...
</div>
```

The default layout auto adjusts without restrictions. To force a 40-60 split between the image and the text use
the `two-column-layout-page` class for the page.

```xml
<div type="page" class="two-column-layout-page">
  ...
</div>
```

### Hide page number

You can hide the page number for any page by specifying the class `hide-page-counter` on its `<div type="page">` element in the `.readalong` file.

## Assets folder

By defaults the image assets will be resolved to `./assets/` relative to the index.html file. You can
override this behaviour by using this attribute on the `<read-along>` element in your `.html` file: `images-assets-folder="path/to/assets"`. The web component will
resolve urls for images by prepending the specified path to image paths. Specifying `""` disables this behaviour.

## CSS customization

You can override the default style of the component. This option is best used anyone does not want to clone this project
and modify only the UI. Use the web inspector of your browser to find the classes you wish to override.

```css
/* change the font size and color of the text */
.sentence__word.theme--light {
  color: #64003c;
  font-size: 1.8rem;
}

/* change the background color of the text being read */
.sentence__word.theme--light.reading {
  background-color: #64003c;
}
```

Here is a list of minimum classes you want to override:

- .sentence\_\_word.theme--light
- .sentence\_\_word.theme--light.reading
- .sentence\_\_text.theme--light
- .sentence\_\_word.theme--dark
- .sentence\_\_word.theme--dark.reading
- .sentence\_\_text.theme--dark
- .sentence\_\_translation
- .sentence
- .paragraph
- .page\_\_container.theme--light (to set page background)

[look at this sample stylesheet for idea](../studio-web/tests/fixtures/sentence-paragr-cust-css.css)

## XML customizations

You can add classes to the xml tags in the `.readalong` XML file. When coupled with the custom css, it will produce most of the
visual effect you want in your read along. E.g. `<s class="sentence__translation">`

### Built-in translation class

The default css class provided for translations should be added to the XML `<s>` tag. Here is a sample:

```xml

<p id="t0b0d1p0">
  <s id="t0b0d1p0s0">
    <w id="t0b0d1p0s0w0">...</w>
    <w id="t0b0d1p0s0w1">...</w>
    <w id="t0b0d1p0s0w2">...</w>
  </s>
  <s id="t0b0d1p0s1" class="sentence__translation">This is a translation</s>
</p>
```

The default style:

```css
.sentence__translation {
  color: #777;
  font-style: italic;
  font-size: 95%;
}
```

## Visual alignment

You can force the visual alignment of sentences within a paragraph by adding ` class="visually_aligned"` to
the `<p>` tag of xml. Here is a sample

```xml

<p id="t0b0d1p0" class="visually_aligned">
  <s id="t0b0d1p0s0">
    <w id="t0b0d1p0s0w0">...</w>
    <w id="t0b0d1p0s0w1">...</w>
    <w id="t0b0d1p0s0w2">...</w>
  </s>
  <s id="t0b0d1p0s1" class="sentence__translation ">This is a translation</s>
</p>
```

**MIND THE GAP**:
When you visually align a paragraph please triple check the spacing and punctuation between elements because the visual
alignment is white-space sensitive

**SIDE EFFECT**: This feature disables auto-wrapping of the words in the paragraph

## For developers of the component

We use Cypress (instead of Jest+Puppeteer) to do integration/end-to-end testing.

### How to run the tests

Since this package is part of a monorepo, all the following commands must be run at the root of the monorepo, not in this directory.

First, start the two test servers, by using this command:

    npx nx run-many --targets=serve-test-data,serve --projects=web-component

Or you can run each test server separately:

    npx nx serve web-component
    npx nx serve-test-data web-component

Run the full test suite automatically using this command:

    npx nx test:once web-component

Alternatively, this command will launch Cypress so that you can run the tests **interactively**:

    npx nx test:open web-component

### Interactively testing your local copy

If you want to use your local copy of the Web Component instead of the version published at unpkg, change the two `script` lines in your HTML and set the module URL to your localhost.
See for example the unit testing file [test-data/ej-fra/index.html](test-data/ej-fra/index.html), which assumes this Stencil component is being served on port 3333, the default when running locally.
