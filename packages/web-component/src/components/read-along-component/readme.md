# my-component



<!-- Auto Generated Below -->


## Properties

| Property             | Attribute             | Description                                                                                                                                                     | Type                         | Default        |
| -------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | -------------- |
| `audio`              | `audio`               | URL of the audio file                                                                                                                                           | `string`                     | `undefined`    |
| `cssUrl`             | `css-url`             | Optional custom Stylesheet to override defaults                                                                                                                 | `string`                     | `undefined`    |
| `displayTranslation` | `display-translation` | Show text translation  on at load time                                                                                                                          | `boolean`                    | `true`         |
| `href`               | `href`                | URL of the aligned text as readalong XML                                                                                                                        | `string`                     | `undefined`    |
| `language`           | `language`            | Language  of the interface. In 639-3 code Options are - "eng" for English - "fra" for French                                                                    | `"eng" \| "fra" \| "spa"`    | `"eng"`        |
| `mode`               | `mode`                | Choose mode of ReadAlong - either view (default) or edit                                                                                                        | `"EDIT" \| "VIEW"`           | `"VIEW"`       |
| `pageScrolling`      | `page-scrolling`      | Toggles the page scrolling from horizontal to vertical. Defaults to horizontal                                                                                  | `"horizontal" \| "vertical"` | `"horizontal"` |
| `playbackRateRange`  | `playback-rate-range` | Control the range of the playback rate: allow speeds from 100 - playback-rate-range to 100 + playback-rate-range.                                               | `number`                     | `15`           |
| `scrollBehaviour`    | `scroll-behaviour`    | Select whether scrolling between pages should be "smooth" (default nicely animated, good for fast computers) or "auto" (choppy but much less compute intensive) | `"auto" \| "smooth"`         | `"smooth"`     |
| `svgOverlay`         | `svg-overlay`         | Overlay This is an SVG overlay to place over the progress bar                                                                                                   | `string`                     | `undefined`    |
| `theme`              | `theme`               | Theme to use: ['light', 'dark'] defaults to 'dark'                                                                                                              | `string`                     | `"light"`      |
| `useAssetsFolder`    | `use-assets-folder`   | Toggle the use of assets folder for resolving urls. Defaults to on to maintain backwards compatibility                                                          | `boolean`                    | `true`         |


## Methods

### `changeTheme() => Promise<void>`

Change theme

#### Returns

Type: `Promise<void>`



### `getImages() => Promise<object>`

Get Images

#### Returns

Type: `Promise<object>`



### `getTranslations() => Promise<object>`

Get Translations

#### Returns

Type: `Promise<object>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
