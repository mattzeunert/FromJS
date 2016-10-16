# Contributing

[Create a new issue](https://github.com/mattzeunert/FromJS/issues) if you find a bug or have a question/feature request.

If you want to contribute code, either work on an existing issue or create a new issue first. If you need any help ask in the issue or email me at matt@mostlystatic.com.

## Build FromJS

Run `npm install` to install dependencies.

Then, in two separate terminal windows, run `npm run webpack` and `npm run server`. Then go to [http://localhost:7500/demos/index.html](http://localhost:7500/demos/index.html).

### Unit / Integration Tests

`npm run test`

### E2E Tests

```
npm run webdriver-manager-update
npm run e2e-test
```
