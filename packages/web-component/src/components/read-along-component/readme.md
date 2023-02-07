# my-component



<!-- Auto Generated Below -->


## Properties

| Property          | Attribute           | Description                                                                                            | Type                         | Default        |
| ----------------- | ------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------- | -------------- |
| `audio`           | `audio`             | The audio file                                                                                         | `string`                     | `undefined`    |
| `cssUrl`          | `css-url`           | Optional custom Stylesheet to override defaults                                                        | `string`                     | `undefined`    |
| `language`        | `language`          | Language  of the interface. In 639-3 code Options are - "eng" for English - "fra" for French           | `"eng" \| "fra"`             | `'eng'`        |
| `mode`            | `mode`              | Choose mode of ReadAlong - either view (default) or edit                                               | `"EDIT" \| "VIEW"`           | `"VIEW"`       |
| `pageScrolling`   | `page-scrolling`    | Toggles the page scrolling from horizontal to vertical. Defaults to horizontal                         | `"horizontal" \| "vertical"` | `"horizontal"` |
| `readalong`       | `readalong`         | The aligned text as readalong XML                                                                      | `string`                     | `undefined`    |
| `svgOverlay`      | `svg-overlay`       | Overlay This is an SVG overlay to place over the progress bar                                          | `string`                     | `undefined`    |
| `theme`           | `theme`             | Theme to use: ['light', 'dark'] defaults to 'dark'                                                     | `string`                     | `'light'`      |
| `useAssetsFolder` | `use-assets-folder` | Toggle the use of assets folder for resolving urls. Defaults to on to maintain backwards compatibility | `boolean`                    | `true`         |


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
