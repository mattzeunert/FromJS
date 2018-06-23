# FromJS [![Build Status](https://circleci.com/gh/mattzeunert/FromJS/tree/master.svg?style=shield&circle-token=f6f134d69e7755b89c1ac418e6d3f84df593d9a1)](https://circleci.com/gh/mattzeunert/FromJS/tree/master)

FromJS is dynamic dataflow analysis tool. You can use it to discover code and understand JavaScript apps.

FromJS is in currently. If you find any issues (you probably will) please report them on Github.

This is how you use it: open any web page, select an element with the DOM inspector, then view the source of the inspected data. The screenshot below shows the the todo item was loaded from localStorage:

![](https://user-images.githubusercontent.com/1303660/41681222-dc26268e-74cb-11e8-9375-1cd2125d0511.png)

## Getting started

Install FromJS:

Yarn: `sudo yarn global add @fromjs/cli`  
NPM: `sudo npm install -g @fromjs/cli --unsafe-perm` [(Why unsafe-perm?)](https://github.com/mattzeunert/FromJS/issues/93)

Run FromJS: `fromjs` - this will open a Chrome browser window

By default this will launch a web server on [localhost:7000](http://localhost:7000/), a proxy server on port 7001, and store the collected data in `./fromjs-session`.

Loading pages will be slow! For large apps expect it to take several minutes. It will be faster once the page's JS files are cached. Maybe try something simple like [Backbone TodoMVC](http://todomvc.com/examples/backbone/) to get started.

## The page inspector UI

* explain dataflow concept / what the steps mean
* can select characters
* view argument list

## fromJSInspect

Instead of using the DOM Inspector you can also use the global `fromJSInspect` function in the inspected page.

If you control the code for the inspected page you can write something like this:

```
var greeting = "Hello world!"
fromJSInspect(greeting)
```

You can also inspect DOM elements:

```
fromJSInspect(document.querySelector("#app"))
```

## Node

Node isn't currently supported, although if we can figure out how to intercept the JS before it's executed by Node it should be pretty straightforward to implement.

## How it works

Read about it [here](http://www.mattzeunert.com/2018/05/27/dynamic-dataflow-analysis-for-javascript-how-fromjs-2-works.html).

Key libraries used:

* [Babel](https://babeljs.io/)
* [node-http-mitm-proxy](https://github.com/joeferner/node-http-mitm-proxy)
* [LevelDB](https://github.com/google/leveldb)

## Contribute

Check out the [Contributing.md](https://github.com/mattzeunert/FromJS/blob/master/CONTRIBUTING.md) file.
