# How to contribute

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md).
By participating in this project you agree to abide by its terms.

## Creating an Issue

Before you create a new Issue:

If your problem is with the `Endpoint` types, it's possible that the problem lies with [GitHub's OpenAPI spec for api.github.com](https://github.com/github/rest-api-description/tree/main/descriptions/api.github.com). Please file an issue there if that is the case.

If GitHub's OpenAPI spec looks correct, it's possible that the transpilation from OpenAPI spec to TypeScript has a bug. Please compare the spec to the generated types at https://github.com/octokit/openapi-types.ts/blob/main/src/generated/types.ts, and if you see a problem, file an issue there.

Otherwise:

1. Please make sure there is no [open issue](https://github.com/octokit/types.ts/issues?utf8=%E2%9C%93&q=is%3Aissue) yet.
2. If it is a bug report, include a code snippet to reproduce the issue
3. If it is a feature request, please share the motivation for the new feature, what alternatives you tried, and how you would implement it.

## Setup the repository locally

First, fork the repository.

Setup the repository locally. Replace `<your account name>` with the name of the account you forked to.

```shell
git clone https://github.com/<your account name>/types.ts.git
cd types.ts
npm install
```

Run the tests before making changes to make sure the local setup is working as expected

```shell
npm test
```

## Submitting the Pull Request

- Create a new branch locally.
- Make your changes in that branch to your fork repository
- Submit a pull request from your topic branch to the main branch on the `octokit/types.ts` repository.
- Be sure to tag any issues your pull request is taking care of / contributing to. Adding "Closes #123" to a pull request description will automatically close the issue once the pull request is merged in.

## Merging the Pull Request & releasing a new version

Releases are automated using [semantic-release](https://github.com/semantic-release/semantic-release).
The following commit message conventions determine which version is released:

1. `fix: ...` or `fix(scope name): ...` prefix in subject: bumps fix version, e.g. `1.2.3` → `1.2.4`
2. `feat: ...` or `feat(scope name): ...` prefix in subject: bumps feature version, e.g. `1.2.3` → `1.3.0`
3. `BREAKING CHANGE:` in body: bumps breaking version, e.g. `1.2.3` → `2.0.0`

Only one version number is bumped at a time, the highest version change trumps the others.
Besides publishing a new version to npm, semantic-release also creates a git tag and release
on GitHub, generates changelogs from the commit messages and puts them into the release notes.

If the pull request looks good but does not follow the commit conventions, use the <kbd>Squash & merge</kbd> button.
