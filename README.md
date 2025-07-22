# ReadAlongs Web App Suite

[![Publish Status](https://github.com/readalongs/Studio-Web/actions/workflows/release.yml/badge.svg)](https://github.com/ReadAlongs/Studio-Web/actions)
[![Test Status](https://github.com/readalongs/Studio-Web/actions/workflows/end-to-end-tests.yml/badge.svg?branch=main)](https://github.com/ReadAlongs/Studio-Web/actions)
[![GitHub license](https://img.shields.io/badge/Licence-MIT-green)](https://github.com/ReadAlongs/Studio-Web/blob/main/LICENSE)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg)](https://github.com/ReadAlongs/Studio-Web)
[![web-component release](https://img.shields.io/npm/v/@readalongs/web-component)](https://www.npmjs.com/package/@readalongs/web-component)
[![ngx-web-component release](https://img.shields.io/npm/v/@readalongs/ngx-web-component)](https://www.npmjs.com/package/@readalongs/ngx-web-component)

Interactive story telling embeddable into any website!

<!-- TODO: put an animated GIF here, showing it off! -->

This mono repo, formerly called Web-Component, now called Studio-Web, combines four packages:

- A [stencil web component](packages/web-component/) for visualizing read alongs,
- An [Angular Library](packages/ngx-web-component/) that wraps the stencil web component,
- A [demo web application](packages/angular-demo/) to show how to use the angular library in an Angular web application.
- The [Studio-Web](packages/studio-web/) application for creating ReadAlongs

## Table of Contents

- [ReadAlongs Web App Suite](#readalongs-web-app-suite)
  - [Table of Contents](#table-of-contents)
  - [TL;DR Spinning up the Studio Web App locally](#tldr-spinning-up-the-studio-web-app-locally)
  - [For maintainers and developers](#for-maintainers-and-developers)
    - [Cloning](#cloning)
    - [Installing dependencies](#installing-dependencies)
    - [Serving/Development](#servingdevelopment)
      - [Web-Component](#web-component)
      - [Studio-Web](#studio-web)
      - [Understanding where the components come from when you run locally](#understanding-where-the-components-come-from-when-you-run-locally)
    - [Testing](#testing)
      - [TL;DR](#tldr)
      - [Web-Component](#web-component-1)
      - [Studio-Web](#studio-web-1)
        - [End-to-End tests](#end-to-end-tests)
    - [Internationalization (i18n) and localization (l10n)](#internationalization-i18n-and-localization-l10n)
    - [Build \& Publish the Web Component](#build--publish-the-web-component)
      - [Preparing to publish the Web Component \& Angular Wrapper](#preparing-to-publish-the-web-component--angular-wrapper)
      - [Web Component \& Angular Wrapper - via a tag push](#web-component--angular-wrapper---via-a-tag-push)
      - [Web Component \& Angular Wrapper - manually - please don't do this!](#web-component--angular-wrapper---manually---please-dont-do-this)
    - [Build \& Deploy the Studio-Web app](#build--deploy-the-studio-web-app)
      - [Automated Deployment](#automated-deployment)
      - [Build Studio-Web and deploy it somewhere else](#build-studio-web-and-deploy-it-somewhere-else)
  - [Maintainers](#maintainers)
  - [Contributing](#contributing)
  - [Acknowledgements](#acknowledgements)
    - [Northeastern University collaboration](#northeastern-university-collaboration)
  - [Citing](#citing)
- [License](#license)

## TL;DR Spinning up the Studio Web App locally

Here is the quick recipe to spin up the ReadAlongs Studio Web app locally.

```
# Clone and install the Studio CLI in a Python environment and make sure it's activated:
git clone https://github.com/ReadAlongs/Studio.git
cd Studio
# First create a python environment with conda or venv, activate it, and then run:
pip install -e .
cd ..

# Clone and install the Studio-Web monorepo:
git clone https://github.com/ReadAlongs/Studio-Web.git
cd Studio-Web
npm install

# Run all the servers
npx nx run-many --targets=serve-test-data,serve-web-api,serve,serve-fr,serve-es --projects=web-component,studio-web --parallel 6
```

After about a minute -- be patient -- six different servers will have started, and you will be able to access the ReadAlongs Studio Web App at these links:

- In English: http://localhost:4200
- In French: http://localhost:4203
- In Spanish: http://localhost:4204

These additional servers are only for testing or indirect use by the web app, not for interactive use:

- The Web Component: http://localhost:3333
- Test data for the Web Component: http://localhost:8941/ej-fra/
- The Studio Web API: http://localhost:8000/api/v1/docs

For more details, keep reading.

## For maintainers and developers

This repo is managed using [Nx]. The biggest change between using Nx and
using npm is **you can no longer run `npm install` within packages**.
Instead, always run `npm install` from the root directory of the
repository. You also should only run commands from the root of the repo. See guides below for specific commands.

[Nx]: https://nx.dev/

### Cloning

Clone the repo:

    git clone git@github.com:ReadAlongs/Studio-Web.git

### Installing dependencies

Use `npm` to install all dependencies:

    cd Studio-Web
    npm install

### Serving/Development

#### Web-Component

If you are only developing the web-component you can run the following to start serving the test-data:

    npx nx serve-test-data web-component

Then, in another terminal, run the following to serve the web-component:

    npx nx dev-build web-component

Alternatively run together as:

    npx nx dev web-component

#### Studio-Web

To run Studio-Web, you first have to build the web-component:

    npx nx build web-component --watch

Then serve Studio-Web by running (on port 4200 by default, use `--port=nnnn` to override):

    npx nx serve studio-web

Ou en français:

    npx nx serve studio-web --configuration=development-fr

There are separate production and development serving configurations
for each interface language defined in `packages/studio-web/project.json`, so you may for instance also use
`development-en`, `production-en`, `development-es`, `production-es`, `production-fr`, etc for
`--configuration` above. Note that these configurations are _only_
for the `serve` command. To build for deployment, see
[below](#studio-web-2).

We have also defined targets `serve-fr` and `serve-es` in `project.json` so that you can launch the dev configs for all three supported languages at once with:

    npx nx run-many --targets=serve,serve-fr,serve-es --projects=studio-web

Note that you will need to also spin-up the ReadAlong-Studio API in order to have Studio-Web work properly. To do that, first clone the Python Package/API repo:

    git clone https://github.com/ReadAlongs/Studio.git
    cd Studio
    pip install -e .

then run:

    DEVELOPMENT=1 uvicorn readalongs.web_api:web_api_app --reload

If your Studio sandbox is in a sibling directory to this sandbox, and you Python environment is active, `npx nx serve-web-api studio-web` will run that command for you.

Alternatively run together as:

    npx nx run-many --targets=serve-test-data,serve-web-api,serve,serve-fr,serve-es --projects=web-component,studio-web --parallel 6

Studio-Web will automatically [deploy](.github/workflows/deploy.yml) to https://readalong-studio.mothertongues.org/ every time there is a push to `deploy`.
Each push to `main` will deploy a [dev preview](.github/workflows/dev-preview.yml) at https://readalong-studio.mothertongues.org/dev/.

#### Understanding where the components come from when you run locally

When you run `npx nx serve studio-web`, that process is actually serving all the files needed
by the Studio-Web application, and it's able to import `web-component` and `ngx-web-component`,
providing them to the application as needed.

However, `web-component` requires a build in order to have the .js files generated and available
to serve or import. In the instructions above, we actually show two methods you can use:

- `npx nx build web-component --watch` will only build that component, in production mode, and
  rebuild it any time you change that component's source code.

- `npx nx serve web-component` goes further, serving that component, which also requires building
  it. It also watches source code for changes. However, it produces a development build, which
  may be different from the production build.

  In this case, the web-component is being served on port 3333, but the Studio-Web app
  just ignores that and uses the copy provided by `npx nx serve studio-web` instead.

### Testing

#### TL;DR

    npm install
    npx nx run-many --targets=serve-test-data,serve,test:once --projects=web-component
    # Ctrl-C once "✔ All specs passed!  01:01  34  34" appears (34 specs as of writing)
    npx playwright install --with-deps firefox chromium webkit
    npx nx run-many --targets=serve-test-data,serve-web-api,serve,serve-fr,serve-es --projects=web-component,studio-web --parallel 6
    npx nx e2e studio-web
    #Expect "47 passed (4.6m)" (47 tests as of writing)
    npx nx test:once studio-web
    # Expect "TOTAL: 25 SUCCESS" (25 tests as of writing)
    npx nx extract-i18n studio-web
    # Expect "Successfully ran...",
    git diff -w
    # Expect to see no changes to i18n/messages.json (except the missing final newline)
    npx nx check-l10n studio-web
    # Expect "Successfully ran..."

#### Web-Component

In three different terminal windows:

Make sure this command is serving the web-component on port 3333 (if
it launches on a different port, you will have to kill the currently
running process using that port, whose PID you can find with `fuser -n
tcp 3333`):

    npx nx serve web-component

Make sure this command is serving the test data on port 8941:

    npx nx serve-test-data web-component

Then run:

    npx nx test:once web-component

Alternatively run together as:

    npx nx run-many --targets=serve-test-data,serve,test:once --projects=web-component

#### Studio-Web

To run the unit tests for Studio-Web, first build `web-component` in one of the ways listed
above (or just `npx nx build web-component`) if you have not already done so, and then
run:

    npx nx test:once studio-web

##### End-to-End tests

To run the end-to-end tests for Studio-Web, please check the following:

- Ensure that you have built the `web-component` (run `npx nx build web-component`)
- Check that `studio-cli` is installed and running (run `npx nx serve-web-api studio-web`)
- Confirm that `studio-web` is up and running (run `npx nx run-many --targets=serve,serve-fr,serve-es --projects=studio-web --parallel 3`). Your browser must be able to load `http://localhost:4200/` before you proceed.
- Verify that `playwright` is installed and configured (run `npx playwright install --with-deps firefox chromium webkit`)

Alternatively run together as:

    npx playwright install --with-deps firefox chromium webkit &&  npx nx run-many --targets=serve-test-data,serve-web-api,serve,serve-fr,serve-es --projects=web-component,studio-web --parallel 6

Once you have confirmed that everything is online and working run:
`npx nx e2e studio-web` and wait for the report.

**PS**: If you want to run a spec interactively you can run `npx nx e2e-ui studio-web` to get playwright interactive user interface.

### Internationalization (i18n) and localization (l10n)

`studio-web` is localized in French and Spanish. When you add new strings that need localizing,
you can extract them with

    npx nx build web-component  # (if not done before)
    npx nx extract-i18n studio-web

This will update `packages/studio-web/src/i18n/messages.json` with the English strings.
Add or correct their translations in `messages.es.json` and `messages.fr.json`.
(See `packages/studio-web/extract-i18n-lang.ts` for partial automation of that task.)

    npx tsx packages/studio-web/extract-i18n-lang.ts --help

Finally, run this check to confirm all the required strings are present in each language:

    npx nx check-l10n studio-web

### Build & Publish the Web Component

#### Preparing to publish the Web Component & Angular Wrapper

Publication to npmjs is mostly automated via the tag-triggered `release.yml` CI workflow, but first you have to update the repo with the new version number in multiple places:

- Update the version number for web-component and ngx-web-component in [packages/web-component/package.json](packages/web-component/package.json) and [packages/ngx-web-component/package.json](packages/ngx-web-component/package.json).
- Nx does not manage dependencies among projects for us, so update the version in `peerDependencies` for `@readalongs/web-component` in [packages/ngx-web-component/package.json](packages/ngx-web-component/package.json).
- Update `singleFileBundleVersion` in [packages/studio-web/package.json](packages/studio-web/package.json).
- All the versions above should be exactly in sync!
- Run `npm install` to reflect the version changes in `package-lock.json`.
- Run `npx nx build web-component` and `npx nx bundle web-component` to refresh the bundle for studio-web.
- Commit all those changes.
- Tag the final commit that is ready to publish with the new version number, e.g., `git tag -a -m'v1.3.0' v1.3.0`.

#### Web Component & Angular Wrapper - via a tag push

The publication of the web component and its angular wrapper has been automated in the `release.yml` CI workflow. The workflow will be triggered when you push the tag vX.Y.Z tag created above.

#### Post publication step

After publishing a new web component version, please update the two `readalongs/text/bundle.*`
files and the versions in the two bundle URLs listed in `readalongs/text/make_package.py` in
[ReadAlongs/Studio](/ReadAlongs/Studio).

#### Web Component & Angular Wrapper - manually - please don't do this!

**WARNING**: only use this process if the release workflow is broken.

To publish the web component, first you must belong to the
[@readalongs organization](https://www.npmjs.com/org/readalongs) on
NPM. Then, apply all the version bump and `npm install` steps above,
and build both the web component and angular wrapper:

    npx nx build web-component
    npx nx build ngx-web-component

Run the bundler for single-file html exports:

    npx nx bundle web-component

Alternatively run together as:

    npx nx run-many --targets=build,bundle --projects=web-component,ngx-web-component --parallel 1

Then, go to the dist directories and publish (but we mean it, **don't do this**):

    cd dist/packages/web-component && npm publish --access=public
    cd dist/packages/ngx-web-component && npm publish --access=public

Then you also have to make sure to tag the repo with the new version and create a matching GitHub release, but expect errors since pushing the tag will trigger the automated workflow to do all this again!

### Build & Deploy the Studio-Web app

#### Automated Deployment

Live deployment of the Studio-Web app to https://readalong-studio.mothertongues.org/ has been automated in the `deploy.yml` CI workflow, and is triggered by a push to the `deploy` branch.

Process:

- Make sure the version to deploy is up-to-date on the `main` branch and test it on our [dev preview page](https://readalong-studio.mothertongues.org/dev/).
- [Submit a PR from `main` to `deploy`](https://github.com/ReadAlongs/Studio-Web/compare/deploy...main?expand=1).
- Get it reviewed and approved.
- Do a **fast-forward merge** using the Git CLI. Do not merge from the GitHub UI, as we want the `deploy` branch to point to the same commit as the `main` branch when we deploy. If you're not sure how to do this, ask for help.

#### Build Studio-Web and deploy it somewhere else

To build the web application in the currently deployed configuration
(English interface in the root and French under `/fr`, and Spanish under `/es`), run:

    npx nx build studio-web --configuration=production
    npx nx build studio-web --configuration=production --localize=fr --deleteOutputPath=false
    npx nx build studio-web --configuration=production --localize=es --deleteOutputPath=false

To build with each interface language in its own directory, run:

    npx nx build studio-web --configuration=production --localize=en --localize=fr --localize=es

This will create a complete website under `dist/packages/studio-web/`
which you can deploy in whatever fashion you like to your server
(e.g., using [rsync](https://rsync.samba.org/), scp, sfpt, WinSCP, etc).
Note that the production build expects to talk to the ReadAlongs API at
[https://readalong-studio.herokuapp.com/api/v1](https://readalong-studio.herokuapp.com/api/v1/docs),
so if you have deployed the API elsewhere, you must:

- make sure you set the `ORIGIN` environment variable when deploying
  the ReadAlongs API to the base URL of your `studio-web` instance
- modify `packages/studio-web/src/environments/environment.prod.ts` in
  your `studio-web` instance to point to the URL where you have
  deployed the ReadAlongs API (and rebuild, obviously)
- note that the meta tags and default [Plausible Analytics](https://plausible.io/sites) are set up to inspect the location of the site. Your meta tags will be set to `window.location.href` and your analytics ID will be set to `window.location.host` by default.

## Maintainers

- [@roedoejet](https://github.com/roedoejet)
- [@joanise](https://github.com/joanise)
- [@dhdaines](https://github.com/dhdaines)
- [@deltork](https://github.com/deltork)

## Contributing

Please read [Contributing.md](Contributing.md).

## Acknowledgements

This work would not have been possible without the many collaborators who shared their expertise and recordings, including but not limited to the Yukon Native Language Centre, the Kitigan Zibi Cultural Centre, W̱SÁNEĆ School Board, the Pirurvik Centre, Conseil de la Nation Atikamekw, Onwkawenna Kentyohkwa, Owennatekha Brian Maracle, Timothy Montler, Marie-Odile Junker, Hilaria Cruz, Nathan Thanyehténhas Brinklow, Francis Tyers, Fineen Davis, Eddie Antonio Santos, Mica Arseneau, Vasilisa Andriyanets, Christopher Cox, Bradley Ellert, Robbie Jimmerson, Shankhalika Srikanth, Sabrina Yu, Caroline Running Wolf, Michael Running Wolf, Fangyuan (Toby) Huang, Zachery Hindley, Darrel Schreiner, Luyi Xiao, and the Northeastern University students.

### Northeastern University collaboration

Several groups of students in the Foundations of Software Enginering course at Northeastern University have contributed to this project, first in spring 2022 under Michael Running Wolf and then in fall 2022 under Yvonne Coady. We are very grateful for all groups' hard work and contributions, prototypes and ideas. The students involved were: Siqi Chen, Kwok Keung Chung, Koon Kit Kong, He Yang, Yuzhe Shen, Rui Wang, Zirui Wang, Xuehan Yi, Zhenjie Zhou, Yongxiang Chen, Yun Feng, Xiaotong Guan, Mengdi Wei.

## Citing

If you use this tool, please cite it:

Aidan Pine, David Huggins-Daines, Eric Joanis, Patrick Littell, Marc Tessier, Delasie Torkornoo, Rebecca Knowles, Roland Kuhn, and Delaney Lothian. 2023. ReadAlong Studio Web Interface for Digital Interactive Storytelling. In Proceedings of the 18th Workshop on Innovative Use of NLP for Building Educational Applications (BEA 2023), pages 163–172, Toronto, Canada. Association for Computational Linguistics.

```
@inproceedings{pine-etal-2023-readalong,
    title = "{R}ead{A}long Studio Web Interface for Digital Interactive Storytelling",
    author = "Pine, Aidan  and  Huggins-Daines, David  and  Joanis, Eric  and  Littell, Patrick  and  Tessier, Marc  and  Torkornoo, Delasie  and  Knowles, Rebecca  and  Kuhn, Roland  and  Lothian, Delaney",
    editor = {Kochmar, Ekaterina  and  Burstein, Jill  and  Horbach, Andrea  and  Laarmann-Quante, Ronja  and  Madnani, Nitin  and  Tack, Ana{\"\i}s  and  Yaneva, Victoria  and  Yuan, Zheng  and  Zesch, Torsten},
    booktitle = "Proceedings of the 18th Workshop on Innovative Use of NLP for Building Educational Applications (BEA 2023)",
    month = jul,
    year = "2023",
    address = "Toronto, Canada",
    publisher = "Association for Computational Linguistics",
    url = "https://aclanthology.org/2023.bea-1.14",
    doi = "10.18653/v1/2023.bea-1.14",
    pages = "163--172",
    abstract = "We develop an interactive web-based user interface for performing textspeech alignment and creating digital interactive read-along audio books that highlight words as they are spoken and allow users to replay individual words when clicked. We build on an existing Python library for zero-shot multilingual textspeech alignment (Littell et al., 2022), extend it by exposing its functionality through a RESTful API, and rewrite the underlying speech recognition engine to run in the browser. The ReadAlong Studio Web App is open-source, user-friendly, prioritizes privacy and data sovereignty, allows for a variety of standard export formats, and is designed to work for the majority of the world{'}s languages.",
}
```

Littell, P., Joanis, E., Pine, A., Tessier, M., Huggins-Daines, D., & Torkornoo, D. (2022). ReadAlong Studio: Practical Zero-Shot Text-Speech Alignment for Indigenous Language Audiobooks. Proceedings of SIGUL2022 @LREC2022, 23–32.

```
@inproceedings{Littell_ReadAlong_Studio_Practical_2022,
author = {Littell, Patrick and Joanis, Eric and Pine, Aidan and Tessier, Marc and Huggins-Daines, David and Torkornoo, Delasie},
booktitle = {Proceedings of SIGUL2022 @LREC2022},
title = {{ReadAlong Studio: Practical Zero-Shot Text-Speech Alignment for Indigenous Language Audiobooks}},
year = {2022},
month = {6},
pages = {23--32},
publisher = {European Language Resources Assiciation (ELRA)},
url = {https://aclanthology.org/2022.sigul-1.4}
}
```

# License

MIT Licensed. See [LICENSE](LICENSE) for details.
