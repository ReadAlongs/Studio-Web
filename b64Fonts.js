const fs = require('fs')
const woff2base64 = require('woff2base64')

cssTemplate = `
.material-icons {
  font-family: 'Material Icons';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
}

.material-icons-outlined {
  font-family: 'Material Icons Outlined';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
}`

const fonts = {
    'Material Icons': fs.readFileSync('www/build/assets/fonts/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2'),
    'Material Icons Outlined': fs.readFileSync('www/build/assets/fonts/gok-H7zzDkdnRel8-DQ6KAXJ69wP1tGnf4ZGhUcel5euIg.woff2'),
    'Lato': fs.readFileSync('www/build/assets/fonts/S6uyw4BMUTPHjx4wXiWtFCc.woff2'),
    'Lato Extension': fs.readFileSync('www/build/assets/fonts/S6uyw4BMUTPHjxAwXiWtFCfQ7A.woff2')
        // ...
};
const options = {
    fontFamily: 'Material Icons Outlined'
};

const materialIcons = woff2base64({ 'flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2': fs.readFileSync('www/build/assets/fonts/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2') }, {
    fontFamily: 'Material Icons'
})
const materialIconsOutlined = woff2base64({ 'gok-H7zzDkdnRel8-DQ6KAXJ69wP1tGnf4ZGhUcel5euIg.woff2': fs.readFileSync('www/build/assets/fonts/gok-H7zzDkdnRel8-DQ6KAXJ69wP1tGnf4ZGhUcel5euIg.woff2') }, {
    fontFamily: 'Material Icons Outlined'
})
const latoLatin = woff2base64({ 'S6uyw4BMUTPHjx4wXiWtFCc.woff2': fs.readFileSync('www/build/assets/fonts/S6uyw4BMUTPHjx4wXiWtFCc.woff2') }, {
    fontFamily: 'Lato'
})
const latoLatinExt = woff2base64({ 'S6uyw4BMUTPHjxAwXiWtFCfQ7A.woff2': fs.readFileSync('www/build/assets/fonts/S6uyw4BMUTPHjxAwXiWtFCfQ7A.woff2') }, {
    fontFamily: 'Lato'
})


fs.writeFileSync('dist/fonts.b64.css', materialIcons.woff2.concat(materialIconsOutlined.woff2, latoLatin.woff2, latoLatinExt.woff2, cssTemplate));