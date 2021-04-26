![Built With Stencil](https://img.shields.io/badge/-Built%20With%20Stencil-16161d.svg?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjIuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI%2BCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI%2BCgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU%2BCjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik00MjQuNywzNzMuOWMwLDM3LjYtNTUuMSw2OC42LTkyLjcsNjguNkgxODAuNGMtMzcuOSwwLTkyLjctMzAuNy05Mi43LTY4LjZ2LTMuNmgzMzYuOVYzNzMuOXoiLz4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTQyNC43LDI5Mi4xSDE4MC40Yy0zNy42LDAtOTIuNy0zMS05Mi43LTY4LjZ2LTMuNkgzMzJjMzcuNiwwLDkyLjcsMzEsOTIuNyw2OC42VjI5Mi4xeiIvPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNDI0LjcsMTQxLjdIODcuN3YtMy42YzAtMzcuNiw1NC44LTY4LjYsOTIuNy02OC42SDMzMmMzNy45LDAsOTIuNywzMC43LDkyLjcsNjguNlYxNDEuN3oiLz4KPC9zdmc%2BCg%3D%3D&colorA=16161d&style=flat-square)

# Read-Along Web Component

This is a web component for embedding read-along, audio/text aligned content in your website or hybrid app.

## Installation

For now, just clone the repo, make sure you have node 6+, and run `npm install` from the project root. Then you can run `npm start` and a minimal website containing only the webcomponent will be served at `localhost:3333`. Any changes you make to `/src` will be automatically shown in the browser.

## Properties

| Property    | Attribute   | Description           | Type     | Default     |
| ----------- | ----------- | --------------------- | -------- | ----------- |
| `alignment` | `alignment` | The alignment as SMIL | `string` | `undefined` |
| `audio`     | `audio`     | The audio file        | `string` | `undefined` |
| `text`      | `text`      | The text as TEI       | `string` | `undefined` |
| `theme`     | `theme`     | The colour theme      | `string` | `light`     |
| `css_url`   | `css_url`   | An optional external style sheet to override styling | `string` | `undefined` |


## Test with your site

You can either modify the `/src/index.html` or after running `npm start` you can copy out the `www/build` folder and add the following script import in your own `index.html` page: 

```html 
    <script crossorigin="anonymous"   type="module" src='https://unpkg.com/@roedoejet/readalong@latest/dist/read-along/read-along.esm.js'></script>
    <script crossorigin="anonymous"   nomodule src='https://unpkg.com/@roedoejet/readalong@latest/dist/read-along/read-along.js'></script>
```

Then, you can add as many read-along components to your page as you like simply by adding `<read-along></read-along>` elements with arguments for where to find your text, alignments and audio file. These files can be generated using _________ service located here: ____________.

```html
<read-along text="assets/s2.xml" alignment="assets/s2.smil" audio="assets/s2.wav" css_url="assets/custom.css"></read-along>
```

## Theming

There are two themes out-of-the-box: `light` and `dark`. You set them as a property on the `<read-along></read-along>` web component. If you want to add your own theme, it's as easy as adding your colour palette to the `$ui-themes` variable in `src/components/read-along-component/scss/utilities/_colors.scss`. Note you will have to rebuild the web component from source to do this, or submit your theme as a pull-request!

```scss
$ui-themes: (
    light: (
        primary:             $white,
        secondary:           darken($white, 50%),
        accent:              darken($white, 60%),
        text:                $black,
        text--secondary:     $white,
        text--accent:        $white,
    ),
    dark: (
        primary:             lighten($black, 30%),
        secondary:           darken($white, 35%),
        accent:              $white,
        text:                $white,
        text--secondary:     $white,
        text--accent:        $black
    )
);
```

## Slots

Slots allow you to add custom html into specific "slots" within the web component. For example, to add an optional header to the `<read-along></read-along` component, you would write:

```html
<read-along>
  <span slot="read-along-header">Hello World!</span>
</read-along>
```

| Slot                    | Description           | Suggested Element |
| ----------------------- | --------------------- | ----------------- |
| `read-along-header`     | The read along header | `span`              |
| `read-along-subheader`  | Subheader (ie authors)| `span`              |

## Page layout
By default, the pages are two column layout with image on the left and text on the left.
You force any page to one column layout by setting the class of the page to ```one-column-layout-page``` 
```xml
<div type="page" class="one-column-layout-page">
...
</div>
```
### Hide page number
You hide the page number for any page by specifying the class ```hide-page-counter``` 

## CSS customization 
You can override the default style of the component. This option is best used anyone does not want to clone this project and modify only the UI.
Use the web inspector of your browser to find the classes you wish to override
```css
/* change the font size and color of the text */
.sentence__word.theme--light {
  color:#64003c;
  font-size:1.8rem;
}
/* change the background color of the text being read */
.sentence__word.theme--light.reading {
  background-color: #64003c;
}
```
Here is a list of classes you want to override:
 * .sentence__word.theme--light
 * .sentence__word.theme--light.reading
 * .sentence__text.theme--light
 * .sentence__translation
 * .sentence
 * .paragraph
 * .page__container.theme--light (to set page background)
## XML customizations
You can add classes to the xml tags in the text XML file. 
When coupled with the custom css, it will produce most of the visual effect you want in your read along.
e.g. ``` <s class="sentence__translation ">```

### Built-in translation class
The default css class provided for translations should be added to the XML ```<s>``` tag. It styled as 
```
     color: #777;
     font-style: italic;
     font-size: 95%;
```
Here is a sample 
```xml
<p id="t0b0d1p0">
  <s id="t0b0d1p0s0"><w id="t0b0d1p0s0w0">...</w> <w id="t0b0d1p0s0w1">...</w> <w id="t0b0d1p0s0w2">...</w></s>
  <s  id="t0b0d1p0s1" class="sentence__translation">This is a translation</s>
</p>
```

## Visual alignment
You can force the visual alignment of sentences within a paragraph by adding ``` class="visually_aligned"``` to the ```<p>``` tag of xml.
Here is a sample 
```xml
<p id="t0b0d1p0" class="visually_aligned">
  <s id="t0b0d1p0s0"><w id="t0b0d1p0s0w0">...</w> <w id="t0b0d1p0s0w1">...</w> <w id="t0b0d1p0s0w2">...</w></s>
  <s  id="t0b0d1p0s1" class="sentence__translation ">This is a translation</s>
</p>
```
**MIND THE GAP**:
When you visually align a paragraph please triple check the spacing and punctuation between elements 
because the visual alignment is white-space sensitive

**SIDE EFFECT**: This feature disables auto-wrapping of the words in the paragraph


