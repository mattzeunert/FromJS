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

The E2E tests require a few background processes. It can be useful to keep them running during development and then:

```
npm run e2e-test-background-processes
```

Then run the tests in a new terminal tab:

```
npm run protractor
```

## Updating the website

To update the React demo and playground make sure `npm run server` is running, then run `npm run build-website`.

The Backbone TodoMVC demo isn't updated. It uses a pre-rendered DOM with tracking data in `data.json`, and with the current setup this can't be replicated. Either way, it would be a bunch of work to make the current setup work on mobile etc, whereas the old demo sort of does work on some phones.
