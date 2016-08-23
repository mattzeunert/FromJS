# FromJS

Understand JavaScript apps. See the code for responsible for every character on the screen.

[fromjs.com](http://www.fromjs.com/)

![](https://cloud.githubusercontent.com/assets/1303660/17478187/e9b9b2bc-5d61-11e6-8645-b89574767bf4.png)

## Chrome Extension

I'm working on it.

## Install From NPM

`npm install -g fromjs-cli`, then run `fromjs` in the command line and open [localhost:7500](http://localhost:7500/).

Then open a static HTML file from there.

## Development

Run `npm run webpack` and `npm run server` to start, then go to [http://localhost:7500/demos/index.html](http://localhost:7500/demos/index.html).

### Unit / Integration Tests

`npm run test`

### E2E Tests

```
npm install -g protractor
webdriver-manager start
protractor e2e/conf.js
```
