# ReadAlongs Web App Suite

Interactive story telling embeddable into any website!

<!-- TODO: put an animated GIF here, showing it off! -->

This mono repo combines four packages:

 - A [stencil web component](packages/web-component/) for visualizing read alongs,
 - An [Angular Library](packages/ngx-web-component/) that wraps the stencil web component,
 - A [demo web application](packages/angular-demo/) to show how to use the angular library in an Angular web application.
- The [Studio-Web](packages/studio-web/) application for creating ReadAlongs

## Table of Contents

- [ReadAlongs Web App Suite](#readalongs-web-app-suite)
  - [For maintainers and developers](#for-maintainers-and-developers)
    - [Cloning](#cloning)
    - [Installing dependencies](#installing-dependencies)
    - [Serving/Development](#servingdevelopment)
    - [Testing](#testing)
    - [Build and Publish](#build--publish)
  - [Maintainers](#maintainers)
  - [Contributing](#contributing)
  - [Acknowledgements](#acknowledgements)
  - [Citing](#citing)
  - [License](#license)

## For maintainers and developers

This repo is managed using [Nx]. The biggest change between using Nx and
using npm is **you can no longer run `npm install` within packages**.
Instead, always run `npm install` from the root directory of the
repository. You also should only run commands from the root of the repo. See guides below for specific commands.

[Nx]: https://nx.dev/

### Cloning

Clone the repo:

    git clone git@github.com:ReadAlongs/Web-Component.git

### Installing dependencies

First, make sure Nx is installed:

    npm install -g nx

Then,

    cd Web-Component
    npm install

### Serving/Development

#### Web-Component

If you are only developing the web-component you can run the following to start serving the test-data:

    nx serve-test-data web-component

Then, in another terminal, run the following to serve the web-component:

    nx serve web-component

#### Studio-Web

To run Studio-Web, you first have to build the web-component:

    nx build web-component --watch

Then serve Studio-Web by running:

    nx serve studio-web

Note that you will need to also spin-up the ReadAlong-Studio API in order to have Studio-Web work properly. To do that, first clone the Python Package/API repo:

    git clone https://github.com/ReadAlongs/Studio.git
    cd Studio
    pip install -e .

then run:

    DEVELOPMENT=1 uvicorn readalongs.web_api:web_api_app --reload

If your Studio sandbox is in a sibling directory to this sandbox, and you Python environment is active, `nx serve-web-api studio-web` will run that command for you.

Studio-Web will automatically [publish](.github/workflows/publish.yml) to https://readalong-studio.mothertongues.org/ every time there is a change to `main`.

#### Understanding where the components come from when you run locally

When you run `nx serve studio-web`, that process is actually serving all the files needed
by the Studio-Web application, and it's able to import `web-component` and `ngx-web-component`,
providing them to the application as needed.

However, `web-component` requires a build in order to have the .js files generated and available
to serve or import. In the instructions above, we actually show two methods you can use:

 - `nx build web-component --watch` will only build that component, in production mode, and
   rebuild it any time you change that component's source code.

 - `nx serve web-component` goes further, serving that component, which also requires building
   it. It also watches source code for changes.  However, it produces a development build, which
   may be different from the production build.

   In this case, the web-component is being served on port 3333, but the Studio-Web app
   just ignores that and uses the copy provided by `nx serve studio-web` instead.

### Testing

#### Web-Component

In three different terminal windows:

Make sure this command is serving the web-component on port 3333 (if
it launches on a different port, you will have to kill the currently
running process using that port, whose PID you can find with `fuser -n
tcp 3333`):

    nx serve web-component

Make sure this command is serving the test data on port 5000:

    nx serve-test-data web-component

Then run:

    nx test:once web-component

#### Studio-Web

To run the unit tests for Studio-Web, first build `web-component` in one of the ways listed
above (or just `nx build web-component`) if you have not already done so, and then run:

    nx test:once studio-web

### Build & Publish

#### Web Component & Angular Wrapper

To publish the web component, first you must belong to the [@readalongs organization](https://www.npmjs.com/org/readalongs) on NPM. Then, bump the version number in both `packages/web-component/package.json` and `packages/ngx-web-component/package.json` and build both the web component and angular wrapper:

    nx build web-component
    nx build ngx-web-component

Run the prepublish step for web-component:

    nx prepublish web-component

Run the bundler for single-file html exports:

    nx bundle web-component

Then, go to the directory and publish:

    cd dist/packages/web-component && npm publish --access=public
    cd dist/packages/ngx-web-component && npm publish --access=public

## Maintainers

 - [@roedoejet](https://github.com/roedoejet)
 - [@joanise](https://github.com/joanise)
 - [@dhdaines](https://github.com/dhdaines)
 - [@deltork](https://github.com/deltork)

## Contributing

Feel free to dive in! [Open an issue](https://github.com/ReadAlongs/Web-Component/issues/new) or submit PRs.

This repo follows the [Contributor Covenant](https://contributor-covenant.org/version/1/3/0/) Code of Conduct.

## Acknowledgements

This work would not have been possible without the many collaborators who shared their expertise and recordings, including but not limited to the Yukon Native Language Centre, the Kitigan Zibi Cultural Centre, W̱SÁNEĆ School Board, the Pirurvik Centre, Conseil de la Nation Atikamekw, Onwkawenna Kentyohkwa, Owennatekha Brian Maracle, Timothy Montler, Marie-Odile Junker, Hilaria Cruz, Nathan Thanyehténhas Brinklow, Francis Tyers, Fineen Davis, Eddie Antonio Santos, Mica Arseneau, Vasilisa Andriyanets, Christopher Cox, Bradley Ellert, Robbie Jimmerson, Shankhalika Srikanth, Sabrina Yu, Caroline Running Wolf, Michael Running Wolf, Fangyuan (Toby) Huang, Zachery Hindley, Darrel Schreiner, Luyi Xiao, and the Northeastern University students.

### Northeastern University collaboration

Several groups of students in the Foundations of Software Enginering course at Northeastern University have contributed to this project, first in sprint 2022 under Michael Running Wolf and then in fall 2022 under Yvonne Coady. We are very grateful for all groups' hard work and contributions, prototypes and ideas. The students involved were: Siqi Chen, Kwok Keung Chung, Koon Kit Kong, He Yang, Yuzhe Shen, Rui Wang, Zirui Wang, Xuehan Yi, Zhenjie Zhou, Yongxiang Chen, Yun Feng, Xiaotong Guan, Mengdi Wei.

## Citing

If you use this tool, please cite it:

Littell, P., Joanis, E., Pine, A., Tessier, M., Huggins-Daines, D., & Torkornoo, D. (2022). ReadAlong Studio: Practical Zero-Shot Text-Speech Alignment for Indigenous Language Audiobooks. Proceedings of SIGUL2022 @LREC2022, 23–32.

```
@inproceedings{littellreadalong,
  title={ReadAlong Studio: Practical Zero-Shot Text-Speech Alignment for Indigenous Language Audiobooks},
  author={Littell, Patrick and Joanis, Eric and Pine, Aidan and Tessier, Marc and Huggins-Daines, David and Torkornoo, Delasie},
  year= {2022},
  booktitle = {{Proceedings of SIGUL2022 @LREC2022}},
  pages = {23-32}
}
```

# License

MIT Licensed. See [LICENSE](LICENSE) for details.
