# FromJS [![Build Status](https://circleci.com/gh/mattzeunert/FromJS/tree/master.svg?style=shield&circle-token=f6f134d69e7755b89c1ac418e6d3f84df593d9a1)](https://circleci.com/gh/mattzeunert/FromJS/tree/master)

FromJS is dynamic data-flow analysis tool for JavaScript code. It can tell you where each bit of content on a web page came from.

Some content might have been loaded using `fetch`, some might have been stored in `localStorage`, and some might have been hard-coded in the JavaScript code.

![](https://user-images.githubusercontent.com/1303660/41681222-dc26268e-74cb-11e8-9375-1cd2125d0511.png)

## Getting started

[**Note: Currently FromJS only works using Node 9 or below**](https://github.com/joeferner/node-http-mitm-proxy/issues/165)

Install FromJS:

Yarn: `sudo yarn global add @fromjs/cli`  
NPM: `sudo npm install -g @fromjs/cli --unsafe-perm` [(Why unsafe-perm?)](https://github.com/mattzeunert/FromJS/issues/93)

Run FromJS: `fromjs` - this will open a new Chrome browser window

By default FromJS will launch a web server on [localhost:7000](http://localhost:7000/), a proxy server on port 7001, and store the collected data in `./fromjs-session`.

Loading pages will be slow! For large apps expect it to take several minutes. It will be faster once the page's JS files are cached. Maybe try something simple like [Backbone TodoMVC](http://todomvc.com/examples/backbone/) to get started.

## fromJSInspect

Instead of using the DOM Inspector you can also use the global `fromJSInspect` function in the inspected page.

If you control the code for the inspected page you can write something like this:

```
var greeting = "Hello world!"
fromJSInspect(greeting)
```

Or you can inspect DOM elements:

```
fromJSInspect(document.querySelector("#app"))
```

## Node

Analyzing server-side code isn't currently supported, although if we can figure out how to intercept the JS before it's executed by Node it should be pretty straightforward to implement.

## How it works

Read about it [here](http://www.mattzeunert.com/2018/05/27/dynamic-dataflow-analysis-for-javascript-how-fromjs-2-works.html).

Built using [Babel](https://babeljs.io/), [node-http-mitm-proxy](https://github.com/joeferner/node-http-mitm-proxy), and [LevelDB](https://github.com/google/leveldb).

## Contribute

Check out the [Contributing.md](https://github.com/mattzeunert/FromJS/blob/master/CONTRIBUTING.md) file.

## Supported by

[![DebugBear - front-end code and performance monitoring](https://user-images.githubusercontent.com/1303660/50282301-3da7aa00-044a-11e9-9756-820b2ed01f95.png)](https://www.debugbear.com)
