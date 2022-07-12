# ReadAlong-Studio Web

[![Build Status](https://github.com/readalongs/Studio-Web/actions/workflows/publish.yml/badge.svg?branch=main)](https://github.com/ReadAlongs/Studio-Web/actions)
[![GitHub license](https://img.shields.io/github/license/ReadAlongs/Studio-Web)](https://github.com/ReadAlongs/Studio-Web/blob/master/LICENSE)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/ReadAlongs/Studio-Web)

> Web application for audiobook alignment for Indigenous languages!

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 14.0.4. This web application is a web interface for end-to-end audio/text aligner. It is meant to be used together with the API from [ReadAlong-Studio](https://github.com/readalongs/Studio) to assemble the text required for alignment.

## Table of Contents

- [ReadAlong-Studio Web](#readalong-studio-web)
  - [Table of Contents](#table-of-contents)
  - [Background](#background)
    - [Data Sovereignty](#data-sovereignty)
  - [Install](#installing)
  - [Usage](#usage)
    - [Development](#development)
    - [Production](#production)
  - [Maintainers](#maintainers)
  - [Contributing](#contributing)
  - [Acknowledgements](#acknowledgements)
  - [License](#license)

See also: [ReadAlong-Studio documentation](https://readalong-studio.readthedocs.io/en/latest/index.html).

## Background

This web application is intended to be a graphical version of the [ReadAlong Studio command line interface](https://github.com/ReadAlongs/Studio) for creating interactive "read-alongs". 

### Data Sovereignty

We have built the tool with Indigenous data sovereignty in mind ([see here for more info](https://www.youtube.com/watch?v=fodGN4kaEcI)). As such, we are using the JavaScript version of [soundswallower](https://github.com/ReadAlongs/SoundSwallower) which runs on the users' computer without uploading audio to a server. Text data will be sent (encrypted) to the ReadAlongs API but is not stored or saved to disk on the server and is only used for creating the ReadAlong.

## Installing

You must have Node installed (v16 preferred), then run `npm install` from the repo root.

## Usage

### Development

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

### Production

Run `npm run-script build:prod` to build the project. The build artifacts will be stored in the `dist/` directory.

## Maintainers

[@roedoejet](https://github.com/roedoejet).

## Contributing

Feel free to dive in! [Open an issue](https://github.com/ReadAlongs/Studio-Web/issues/new) or submit PRs.

This repo follows the [Contributor Covenant](http://contributor-covenant.org/version/1/3/0/) Code of Conduct.

## Acknowledgements

This work would not have been possible without the many collaborators who shared their expertise and recordings, including but not limited to the Yukon Native Language Centre, the Kitigan Zibi Cultural Centre, W̱SÁNEĆ School Board, the Pirurvik Centre, Conseil de la Nation Atikamekw, Onwkawenna Kentyohkwa, Owennatekha Brian Maracle, Timothy Montler, Marie-Odile Junker, Hilaria Cruz, Nathan Thanyehténhas Brinklow, Francis Tyers, Fineen Davis, Eddie Antonio Santos, Mica Arseneau, Vasilisa Andriyanets, Christopher Cox, Bradley Ellert, Robbie Jimmerson, Shankhalika Srikanth, Sabrina Yu, Caroline Running Wolf, Michael Running Wolf, Fangyuan (Toby) Huang, Zachery Hindley, Darrel Schreiner, Luyi Xiao, Siqi Chen, Kwok Keung Chung, Koon Kit Kong, He Yang, Yuzhe Shen, Rui Wang, Zirui Wang, Xuehan Yi, and Zhenjie Zhou.

### Northeastern University collaboration

The design of the interface and CSS styling was developed by two group of students in Michael Running Wolf's Spring 2022 Foundations of Software Engineering course. We are very grateful for both groups' hard work and contributions. Group 1 developed the design that was eventually chosen for this project, as such we are grateful for the code contributions to this repository from Siqi Chen, Kwok Keung Chung, Koon Kit Kong, and He Yang.

## License

[MIT](LICENSE) © 2022 National Research Council Canada
