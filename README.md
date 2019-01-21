# FromJS [![Build Status](https://circleci.com/gh/mattzeunert/FromJS/tree/master.svg?style=shield&circle-token=f6f134d69e7755b89c1ac418e6d3f84df593d9a1)](https://circleci.com/gh/mattzeunert/FromJS/tree/master)

FromJS is an experiental dynamic data-flow analysis tool for front-end JavaScript. It can tell you where each bit of content on a web page came from.

For example, some content might have been loaded using `fetch`, some might have been stored in `localStorage`, and some might have been hard-coded in the JavaScript code.

![](https://user-images.githubusercontent.com/1303660/50536171-80a00680-0b49-11e9-92a5-69ee2185ce0c.gif)

## Getting started

[**Note: Currently FromJS only works with Node 9 or below**](https://github.com/joeferner/node-http-mitm-proxy/issues/165)

Install with `npm install -g @fromjs/cli` and then run `fromjs`. This will open a new Chrome browser window.

By default FromJS will launch a web server on [localhost:7000](http://localhost:7000/), a proxy server on port 7001, and store the collected data in `./fromjs-session`.

Loading pages will be slow! For large apps expect it to take several minutes. Maybe try something simple like [Backbone TodoMVC](http://todomvc.com/examples/backbone/) to get started.

## fromJSInspect

Instead of using the visual DOM Inspector you can also use the global `fromJSInspect` function in the inspected page.

If you control the code for the inspected page you can write something like this:

```
var greeting = "Hello world!"
fromJSInspect(greeting)
```

Or you can inspect DOM elements:

```
fromJSInspect(document.querySelector("#app"))
```

## How it works

Read about it [here](http://www.mattzeunert.com/2018/05/27/dynamic-dataflow-analysis-for-javascript-how-fromjs-2-works.html), or watch [this video](https://www.youtube.com/watch?v=HmuadtxtBS4&feature=youtu.be).

## Made by

<p align="center">
<a href="https://www.debugbear.com/?utm_source=fromjs&utm_campaign=readme"><img style="height: 300px" src="https://user-images.githubusercontent.com/1303660/50536017-e68b8e80-0b47-11e9-85b6-25f3334e58de.png"/></a>
</p>
