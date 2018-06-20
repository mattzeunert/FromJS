# Contributing

[Create a new issue](https://github.com/mattzeunert/FromJS/issues) if you find a bug or have a question/feature request.

## Contributing code

I'm working on FromJS 2 right now and the code isn't always very clean. Open an issue or email me if you're interested in contributing anyway.

## Build FromJS

Use `lerna bootstrap` to install dependencies.

I usually run all of these commands:

* `yarn run test-watch` for unit/integration tests
* In packages/ui `yarn run webpack-watch` for building the inspector UI
* In packages/core `yarn run webpack-watch` to build the helperFunctions (compiled result is used by Babel plugin)
* `yarn run compile-all-watch`
* `npm run cli-debug`
* `npm run cli-browser` (open browser separately so the BE/Proxy process can restart)

```
## Updating the website

To update the React demo and playground make sure `npm run server` is running, then run `npm run build-website`.

The Backbone TodoMVC demo isn't updated. It uses a pre-rendered DOM with tracking data in `data.json`, and with the current setup this can't be replicated. Either way, it would be a bunch of work to make the current setup work on mobile etc, whereas the old demo sort of does work on some phones.
```

## Architecture diagram

![](https://user-images.githubusercontent.com/1303660/41681002-35ebae24-74cb-11e8-8a2d-d2a2b8b34145.png)
