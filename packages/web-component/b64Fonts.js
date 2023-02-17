const fs = require('fs')
const woff2base64 = require('woff2base64')

const fonts = [{
        font: { 'MaterialIcons.woff2': fs.readFileSync('src/scss/fonts/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2') },
        options: {
            fontFamily: 'Material Icons',
            style: 'normal',
            weight: 400
        }
    },
    {
        font: { 'MaterialIconsOutlined.woff2': fs.readFileSync('src/scss/fonts/gok-H7zzDkdnRel8-DQ6KAXJ69wP1tGnf4ZGhUcel5euIg.woff2') },
        options: {
            fontFamily: 'Material Icons Outlined',
            style: 'normal',
            weight: 400
        }
    },
    {
        font: { 'Lato.woff2': fs.readFileSync('src/scss/fonts/S6uyw4BMUTPHjxAwXiWtFCfQ7A.woff2') },
        options: {
            fontFamily: 'Lato',
            style: 'normal',
            weight: 400
        }
    },
    {
        font: { 'LatoExt.woff2': fs.readFileSync('src/scss/fonts/S6uyw4BMUTPHjx4wXiWtFCc.woff2') },
        options: {
            fontFamily: 'Lato',
            style: 'normal',
            weight: 400
        }
    }
];

const fontStyle = `
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
  }
`



const css = fonts.map(x => woff2base64(x.font, x.options).woff2).join('\n');

fs.writeFileSync('../../dist/packages/web-component/dist/fonts.b64.css', css + '\n' + fontStyle);
fs.writeFileSync('../studio-web/src/assets/fonts.b64.css', css + '\n' + fontStyle);