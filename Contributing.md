# Contributing to ReadAlong Studio-Web

Feel free to dive in! [Open an issue](https://github.com/ReadAlongs/Studio-Web/issues/new) or submit PRs.

This repo follows the [Contributor Covenant](http://contributor-covenant.org/version/1/3/0/) Code of Conduct.

This repo uses automated tools to standardize the formatting of code, text files and commits.

- The [pre-commit hook](#pre-commit-hook) automatically applies code formatting rules using `prettier`.
- [commitlint](#commitlint) is used as a commit message hook to validate that commit messages follow the convention.

When you `npm install` the project, Husky will be installed automatically and it will enable the pre-commit and commitlint hooks for you.

Note that this is a monorepo managed by Nx. Dependencies should be defined at the top level. See the main README.md for details, as well as information about spinning up development environments.

## Pre-commit hook

The ReadAlong Studio-Web team has agreed to systematically use `prettier` to
normalize formatting of code. It will be installed when you run `npm install`,
and it will get called by husky when you make a commit.

## commitlint

The team has also agreed to use [Conventional Commits](https://www.conventionalcommits.org/).
When you run `npm install`, `commitlint` is automatically installed and activated to scan your
commit messages.

Convential commits look like this:

    type(optional-scope): subject (i.e., short description)

    optional body, which is free form

    optional footer

Valid types: (these are the default, which we're using as is)

- build: commits for the build system
- chore: maintain the repo, not the code itself
- ci: commits for the continuous integration system
- docs: adding and changing documentation
- feat: adding a new feature
- fix: fixing something
- perf: improving performance
- refactor: refactor code
- revert: undo a previous change
- style: working only on code or documentation style
- test: commits for testing code

Valid scopes: the scope is optional and usually refers to which module is being changed.
The scope is note automatically validated, but it should be just one word.

Valid subject: short, free form, what the commit is about in less than 50 or 60 characters
(not strictly enforced, but it's best to keep it short).

Optional body: this is where you put all the verbose details you want about the commit, or
nothing at all if the subject already says it all. Must be separated by a blank line from
the subject. Explain what the changes are, why you're doing them, etc, as necessary.

Optional footer: separated from the body (or subject if body is empty) by a blank line,
lists reference (e.g.: use `Fixes #12` to say that the commit fixes issue 12, or `Ref #24`
to just make a link) or warns of breaking changes (e.g., `BREAKING CHANGE: explanation`).

These rules are inspired by these commit formatting guides:

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Bluejava commit guide](https://github.com/bluejava/git-commit-guide)
- [develar's commit message format](https://gist.github.com/develar/273e2eb938792cf5f86451fbac2bcd51)
- [AngularJS Git Commit Message Conventions](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y).

With commitlint enabled, your commit log messages will be checked:

- `git commit -m'fixing a bug in g2p integration'` outputs an error
- `git commit -m'fix(g2p): fixing a bug in g2p integration'` works
