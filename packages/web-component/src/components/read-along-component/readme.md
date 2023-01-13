# my-component



<!-- Auto Generated Below -->


## Properties

| Property             | Attribute                | Description                                                                                          | Type                         | Default        |
| -------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------- | ---------------------------- | -------------- |
| `alignment`          | `alignment`              | The alignment as SMIL                                                                                | `string`                     | `undefined`    |
| `audio`              | `audio`                  | The audio file                                                                                       | `string`                     | `undefined`    |
| `autoPauseEndOfPage` | `auto-pause-end-of-page` | Pause when at the end of a page                                                                      | `boolean`                    | `false`        |
| `cssUrl`             | `css-url`                | Optional custom Stylesheet to override defaults                                                      | `string`                     | `undefined`    |
| `displayTranslation` | `display-translation`    | Show text translation  on at load time                                                               | `boolean`                    | `true`         |
| `language`           | `language`               | Language  of the interface. In 639-3 code Options are - "eng" for English - "fra" for French         | `"eng" \| "fra"`             | `'eng'`        |
| `limitPlayBackRate`  | `limit-play-back-rate`   | Limit play back rate to 85%-110% range (with less pitch distortion)                                  | `boolean`                    | `false`        |
| `mode`               | `mode`                   | Choose mode of ReadAlong - either view (default) or edit                                             | `"EDIT" \| "VIEW"`           | `"VIEW"`       |
| `pageScrolling`      | `page-scrolling`         | Toggles the page scrolling from horizontal to vertical. Defaults to horizontal                       | `"horizontal" \| "vertical"` | `"horizontal"` |
| `scrollBehavior`     | `scroll-behavior`        |                                                                                                      | `"auto" \| "smooth"`         | `"smooth"`     |
| `svgOverlay`         | `svg-overlay`            | Overlay This is an SVG overlay to place over the progress bar                                        | `string`                     | `undefined`    |
| `text`               | `text`                   | The text as TEI                                                                                      | `string`                     | `undefined`    |
| `theme`              | `theme`                  | Theme to use: ['light', 'dark'] defaults to 'dark'                                                   | `string`                     | `'light'`      |
| `timeoutAtEndOfPage` | `timeout-at-end-of-page` | Pause timeout when at the end of a page                                                              | `number`                     | `0`            |
| `useAssetsFolder`    | `use-assets-folder`      | Toggle the use of assets folder for resolving urls. Defaults: on to maintain backwards compatibility | `boolean`                    | `true`         |


## Methods

### `changeTheme() => Promise<void>`

Change theme

#### Returns

Type: `Promise<void>`



### `getImages() => Promise<object>`

Get Images

#### Returns

Type: `Promise<object>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
