

//
// Generated on Tue Dec 16 2014 12:13:47 GMT+0100 (CET) by Charlie Robbins, Paolo Fragomeni & the Contributors (Using Codesurgeon).
// Version 1.2.6
//

(function (exports) {

  /*
   * browser.js: Browser specific functionality for director.
   *
   * (C) 2011, Charlie Robbins, Paolo Fragomeni, & the Contributors.
   * MIT LICENSE
   *
   */

  var dloc = document.location;

  function dlocHashEmpty() {
    // Non-IE browsers return '' when the address bar shows '#'; Director's logic
    // assumes both mean empty.
    return f__useValue((f__setCachedValue(f__tripleEqual(dloc.hash, f__StringLiteral(''))), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__tripleEqual(dloc.hash, f__StringLiteral('#'));
  }

  var listener = f__makeObject([['ObjectProperty', f__StringLiteral('mode'), f__StringLiteral('modern')], ['ObjectProperty', f__StringLiteral('hash'), dloc.hash], ['ObjectProperty', f__StringLiteral('history'), false], ['ObjectProperty', f__StringLiteral('check'), function () {
    var h = dloc.hash;
    if (f__useValue(f__notDoubleEqual(h, this.hash))) {
      f__assign(this, f__StringLiteral('hash'), h);
      this.onHashChanged();
    }
  }], ['ObjectProperty', f__StringLiteral('fire'), function () {
    if (f__useValue(f__tripleEqual(this.mode, f__StringLiteral('modern')))) {
      f__useValue(f__tripleEqual(this.history, true)) ? window.onpopstate() : window.onhashchange();
    } else {
      this.onHashChanged();
    }
  }], ['ObjectProperty', f__StringLiteral('init'), function (fn, history) {
    var self = this;
    f__assign(this, f__StringLiteral('history'), history);

    if (f__useValue(f__not(Router.listeners))) {
      f__assign(Router, f__StringLiteral('listeners'), []);
    }

    function onchange(onChangeEvent) {
      for (var i = 0, l = Router.listeners.length; f__useValue(i < l); i++) {
        Router.listeners[i](onChangeEvent);
      }
    }

    //note IE8 is being counted as 'modern' because it has the hashchange event
    if (f__useValue(f__useValue((f__setCachedValue(f__StringLiteral('onhashchange') in window), f__useValue(f__getCachedValue()))) ? f__useValue((f__setCachedValue(f__tripleEqual(document.documentMode, undefined)), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : document.documentMode > 7 : f__getCachedValue())) {
      // At least for now HTML5 history is available for 'modern' browsers only
      if (f__useValue(f__tripleEqual(this.history, true))) {
        // There is an old bug in Chrome that causes onpopstate to fire even
        // upon initial page load. Since the handler is run manually in init(),
        // this would cause Chrome to run it twise. Currently the only
        // workaround seems to be to set the handler after the initial page load
        // http://code.google.com/p/chromium/issues/detail?id=63040
        setTimeout(function () {
          f__assign(window, f__StringLiteral('onpopstate'), onchange);
        }, 500);
      } else {
        f__assign(window, f__StringLiteral('onhashchange'), onchange);
      }
      f__assign(this, f__StringLiteral('mode'), f__StringLiteral('modern'));
    } else {
      //
      // IE support, based on a concept by Erik Arvidson ...
      //
      var frame = document.createElement(f__StringLiteral('iframe'));
      f__assign(frame, f__StringLiteral('id'), f__StringLiteral('state-frame'));
      f__assign(frame.style, f__StringLiteral('display'), f__StringLiteral('none'));
      document.body.appendChild(frame);
      this.writeFrame(f__StringLiteral(''));

      if (f__useValue(f__useValue((f__setCachedValue(f__StringLiteral('onpropertychange') in document), f__useValue(f__getCachedValue()))) ? f__StringLiteral('attachEvent') in document : f__getCachedValue())) {
        document.attachEvent(f__StringLiteral('onpropertychange'), function () {
          if (f__useValue(f__tripleEqual(event.propertyName, f__StringLiteral('location')))) {
            self.check();
          }
        });
      }

      window.setInterval(function () {
        self.check();
      }, 50);

      f__assign(this, f__StringLiteral('onHashChanged'), onchange);
      f__assign(this, f__StringLiteral('mode'), f__StringLiteral('legacy'));
    }

    Router.listeners.push(fn);

    return this.mode;
  }], ['ObjectProperty', f__StringLiteral('destroy'), function (fn) {
    if (f__useValue(f__useValue((f__setCachedValue(f__not(Router)), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__not(Router.listeners))) {
      return;
    }

    var listeners = Router.listeners;

    for (var i = f__subtract(listeners.length, 1); f__useValue(i >= 0); i--) {
      if (f__useValue(f__tripleEqual(listeners[i], fn))) {
        listeners.splice(i, 1);
      }
    }
  }], ['ObjectProperty', f__StringLiteral('setHash'), function (s) {
    // Mozilla always adds an entry to the history
    if (f__useValue(f__tripleEqual(this.mode, f__StringLiteral('legacy')))) {
      this.writeFrame(s);
    }

    if (f__useValue(f__tripleEqual(this.history, true))) {
      window.history.pushState(f__makeObject([]), document.title, s);
      // Fire an onpopstate event manually since pushing does not obviously
      // trigger the pop event.
      this.fire();
    } else {
      f__assign(dloc, f__StringLiteral('hash'), f__useValue(f__tripleEqual(s[0], f__StringLiteral('/'))) ? s : f__add(f__StringLiteral('/'), s));
    }
    return this;
  }], ['ObjectProperty', f__StringLiteral('writeFrame'), function (s) {
    // IE support...
    var f = document.getElementById(f__StringLiteral('state-frame'));
    var d = f__useValue((f__setCachedValue(f.contentDocument), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f.contentWindow.document;
    d.open();
    d.write(f__add(f__add(f__StringLiteral('<script>_hash = \''), s), f__StringLiteral('\'; onload = parent.listener.syncHash;<script>')));
    d.close();
  }], ['ObjectProperty', f__StringLiteral('syncHash'), function () {
    // IE support...
    var s = this._hash;
    if (f__useValue(f__notDoubleEqual(s, dloc.hash))) {
      f__assign(dloc, f__StringLiteral('hash'), s);
    }
    return this;
  }], ['ObjectProperty', f__StringLiteral('onHashChanged'), function () {}]]);

  var Router = f__assign(exports, f__StringLiteral('Router'), function (routes) {
    if (f__useValue(f__not(this instanceof Router))) return new Router(routes);

    f__assign(this, f__StringLiteral('params'), f__makeObject([]));
    f__assign(this, f__StringLiteral('routes'), f__makeObject([]));
    f__assign(this, f__StringLiteral('methods'), [f__StringLiteral('on'), f__StringLiteral('once'), f__StringLiteral('after'), f__StringLiteral('before')]);
    f__assign(this, f__StringLiteral('scope'), []);
    f__assign(this, f__StringLiteral('_methods'), f__makeObject([]));

    f__assign(this, f__StringLiteral('_insert'), this.insert);
    f__assign(this, f__StringLiteral('insert'), this.insertEx);

    f__assign(this, f__StringLiteral('historySupport'), f__notDoubleEqual(f__useValue(f__notDoubleEqual(window.history, null)) ? window.history.pushState : null, null));

    this.configure();
    this.mount(f__useValue((f__setCachedValue(routes), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__makeObject([]));
  });

  f__assign(Router.prototype, f__StringLiteral('init'), function (r) {
    var self = this,
        routeTo;
    f__assign(this, f__StringLiteral('handler'), function (onChangeEvent) {
      var newURL = f__useValue((f__setCachedValue(f__useValue((f__setCachedValue(onChangeEvent), f__useValue(f__getCachedValue()))) ? onChangeEvent.newURL : f__getCachedValue()), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : window.location.hash;
      var url = f__useValue(f__tripleEqual(self.history, true)) ? self.getPath() : newURL.replace(/.*#/, f__StringLiteral(''));
      self.dispatch(f__StringLiteral('on'), f__useValue(f__tripleEqual(url.charAt(0), f__StringLiteral('/'))) ? url : f__add(f__StringLiteral('/'), url));
    });

    listener.init(this.handler, this.history);

    if (f__useValue(f__tripleEqual(this.history, false))) {
      if (f__useValue(f__useValue((f__setCachedValue(dlocHashEmpty()), f__useValue(f__getCachedValue()))) ? r : f__getCachedValue())) {
        f__assign(dloc, f__StringLiteral('hash'), r);
      } else if (f__useValue(f__not(dlocHashEmpty()))) {
        self.dispatch(f__StringLiteral('on'), f__add(f__StringLiteral('/'), dloc.hash.replace(/^(#\/|#|\/)/, f__StringLiteral(''))));
      }
    } else {
      if (f__useValue(this.convert_hash_in_init)) {
        // Use hash as route
        routeTo = f__useValue(f__useValue((f__setCachedValue(dlocHashEmpty()), f__useValue(f__getCachedValue()))) ? r : f__getCachedValue()) ? r : f__useValue(f__not(dlocHashEmpty())) ? dloc.hash.replace(/^#/, f__StringLiteral('')) : null;
        if (f__useValue(routeTo)) {
          window.history.replaceState(f__makeObject([]), document.title, routeTo);
        }
      } else {
        // Use canonical url
        routeTo = this.getPath();
      }

      // Router has been initialized, but due to the chrome bug it will not
      // yet actually route HTML5 history state changes. Thus, decide if should route.
      if (f__useValue(f__useValue((f__setCachedValue(routeTo), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__tripleEqual(this.run_in_init, true))) {
        this.handler();
      }
    }

    return this;
  });

  f__assign(Router.prototype, f__StringLiteral('explode'), function () {
    var v = f__useValue(f__tripleEqual(this.history, true)) ? this.getPath() : dloc.hash;
    if (f__useValue(f__tripleEqual(v.charAt(1), f__StringLiteral('/')))) {
      v = v.slice(1);
    }
    return v.slice(1, v.length).split(f__StringLiteral('/'));
  });

  f__assign(Router.prototype, f__StringLiteral('setRoute'), function (i, v, val) {
    var url = this.explode();

    if (f__useValue(f__useValue((f__setCachedValue(f__tripleEqual(f__useValue(typeof i === 'undefined') ? 'undefined' : f__typeof(i), f__StringLiteral('number'))), f__useValue(f__getCachedValue()))) ? f__tripleEqual(f__useValue(typeof v === 'undefined') ? 'undefined' : f__typeof(v), f__StringLiteral('string')) : f__getCachedValue())) {
      f__assign(url, i, v);
    } else if (f__useValue(f__tripleEqual(f__useValue(typeof val === 'undefined') ? 'undefined' : f__typeof(val), f__StringLiteral('string')))) {
      url.splice(i, v, s);
    } else {
      url = [i];
    }

    listener.setHash(url.join(f__StringLiteral('/')));
    return url;
  });

  //
  // ### function insertEx(method, path, route, parent)
  // #### @method {string} Method to insert the specific `route`.
  // #### @path {Array} Parsed path to insert the `route` at.
  // #### @route {Array|function} Route handlers to insert.
  // #### @parent {Object} **Optional** Parent "routes" to insert into.
  // insert a callback that will only occur once per the matched route.
  //
  f__assign(Router.prototype, f__StringLiteral('insertEx'), function (method, path, route, parent) {
    if (f__useValue(f__tripleEqual(method, f__StringLiteral('once')))) {
      method = f__StringLiteral('on');
      route = function (route) {
        var once = false;
        return function () {
          if (f__useValue(once)) return;
          once = true;
          return route.apply(this, arguments);
        };
      }(route);
    }
    return this._insert(method, path, route, parent);
  });

  f__assign(Router.prototype, f__StringLiteral('getRoute'), function (v) {
    var ret = v;

    if (f__useValue(f__tripleEqual(f__useValue(typeof v === 'undefined') ? 'undefined' : f__typeof(v), f__StringLiteral('number')))) {
      ret = this.explode()[v];
    } else if (f__useValue(f__tripleEqual(f__useValue(typeof v === 'undefined') ? 'undefined' : f__typeof(v), f__StringLiteral('string')))) {
      var h = this.explode();
      ret = h.indexOf(v);
    } else {
      ret = this.explode();
    }

    return ret;
  });

  f__assign(Router.prototype, f__StringLiteral('destroy'), function () {
    listener.destroy(this.handler);
    return this;
  });

  f__assign(Router.prototype, f__StringLiteral('getPath'), function () {
    var path = window.location.pathname;
    if (f__useValue(f__notTripleEqual(path.substr(0, 1), f__StringLiteral('/')))) {
      path = f__add(f__StringLiteral('/'), path);
    }
    return path;
  });
  function _every(arr, iterator) {
    for (var i = 0; f__useValue(i < arr.length); i = f__add(i, 1)) {
      if (f__useValue(f__tripleEqual(iterator(arr[i], i, arr), false))) {
        return;
      }
    }
  }

  function _flatten(arr) {
    var flat = [];
    for (var i = 0, n = arr.length; f__useValue(i < n); i++) {
      flat = flat.concat(arr[i]);
    }
    return flat;
  }

  function _asyncEverySeries(arr, iterator, callback) {
    if (f__useValue(f__not(arr.length))) {
      return callback();
    }
    var completed = 0;
    (function iterate() {
      iterator(arr[completed], function (err) {
        if (f__useValue(f__useValue((f__setCachedValue(err), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__tripleEqual(err, false))) {
          callback(err);
          callback = function () {};
        } else {
          completed = f__add(completed, 1);
          if (f__useValue(f__tripleEqual(completed, arr.length))) {
            callback();
          } else {
            iterate();
          }
        }
      });
    })();
  }

  function paramifyString(str, params, mod) {
    mod = str;
    for (var __fromJSForIn4622 in f__getForInLoopKeyObject(params)) {
      var param;param = f__getTrackedPropertyName(params, __fromJSForIn4622);

      if (f__useValue(params.hasOwnProperty(param))) {
        var param;param = f__getTrackedPropertyName(params, __fromJSForIn4622);

        mod = params[param](str);
        if (f__useValue(f__notTripleEqual(mod, str))) {
          var param;param = f__getTrackedPropertyName(params, __fromJSForIn4622);

          break;
        }
      }
    }
    return f__useValue(f__tripleEqual(mod, str)) ? f__StringLiteral('([._a-zA-Z0-9-%()]+)') : mod;
  }

  function regifyString(str, params) {
    var matches,
        last = 0,
        out = f__StringLiteral('');
    while (f__useValue(matches = str.substr(last).match(/[^\w\d\- %@&]*\*[^\w\d\- %@&]*/))) {
      last = f__add(matches.index, matches[0].length);
      f__assign(matches, 0, matches[0].replace(/^\*/, f__StringLiteral('([_.()!\\ %@&a-zA-Z0-9-]+)')));
      out = f__add(out, f__add(str.substr(0, matches.index), matches[0]));
    }
    str = out = f__add(out, str.substr(last));
    var captures = str.match(/:([^\/]+)/ig),
        capture,
        length;
    if (f__useValue(captures)) {
      length = captures.length;
      for (var i = 0; f__useValue(i < length); i++) {
        capture = captures[i];
        if (f__useValue(f__tripleEqual(capture.slice(0, 2), f__StringLiteral('::')))) {
          str = capture.slice(1);
        } else {
          str = str.replace(capture, paramifyString(capture, params));
        }
      }
    }
    return str;
  }

  function terminator(routes, delimiter, start, stop) {
    var last = 0,
        left = 0,
        right = 0,
        start = f__getToString(f__useValue((f__setCachedValue(start), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__StringLiteral('('))(),
        stop = f__getToString(f__useValue((f__setCachedValue(stop), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__StringLiteral(')'))(),
        i;
    for (i = 0; f__useValue(i < routes.length); i++) {
      var chunk = routes[i];
      if (f__useValue(f__useValue((f__setCachedValue(f__useValue((f__setCachedValue(chunk.indexOf(start, last) > chunk.indexOf(stop, last)), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__useValue((f__setCachedValue(~chunk.indexOf(start, last)), f__useValue(f__getCachedValue()))) ? f__not(~chunk.indexOf(stop, last)) : f__getCachedValue()), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__useValue((f__setCachedValue(f__not(~chunk.indexOf(start, last))), f__useValue(f__getCachedValue()))) ? ~chunk.indexOf(stop, last) : f__getCachedValue())) {
        left = chunk.indexOf(start, last);
        right = chunk.indexOf(stop, last);
        if (f__useValue(f__useValue((f__setCachedValue(f__useValue((f__setCachedValue(~left), f__useValue(f__getCachedValue()))) ? f__not(~right) : f__getCachedValue()), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__useValue((f__setCachedValue(f__not(~left)), f__useValue(f__getCachedValue()))) ? ~right : f__getCachedValue())) {
          var tmp = routes.slice(0, f__add(f__useValue((f__setCachedValue(i), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : 1, 1)).join(delimiter);
          routes = [tmp].concat(routes.slice(f__add(f__useValue((f__setCachedValue(i), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : 1, 1)));
        }
        last = f__add(f__useValue(right > left) ? right : left, 1);
        i = 0;
      } else {
        last = 0;
      }
    }
    return routes;
  }

  var QUERY_SEPARATOR = /\?.*/;

  f__assign(Router.prototype, f__StringLiteral('configure'), function (options) {
    options = f__useValue((f__setCachedValue(options), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__makeObject([]);
    for (var i = 0; f__useValue(i < this.methods.length); i++) {
      f__assign(this._methods, this.methods[i], true);
    }
    f__assign(this, f__StringLiteral('recurse'), f__useValue((f__setCachedValue(f__useValue((f__setCachedValue(options.recurse), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : this.recurse), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : false);
    f__assign(this, f__StringLiteral('async'), f__useValue((f__setCachedValue(options.async), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : false);
    f__assign(this, f__StringLiteral('delimiter'), f__useValue((f__setCachedValue(options.delimiter), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__StringLiteral('/'));
    f__assign(this, f__StringLiteral('strict'), f__useValue(f__tripleEqual(f__useValue(typeof options.strict === 'undefined') ? 'undefined' : f__typeof(options.strict), f__StringLiteral('undefined'))) ? true : options.strict);
    f__assign(this, f__StringLiteral('notfound'), options.notfound);
    f__assign(this, f__StringLiteral('resource'), options.resource);
    f__assign(this, f__StringLiteral('history'), f__useValue((f__setCachedValue(f__useValue((f__setCachedValue(options.html5history), f__useValue(f__getCachedValue()))) ? this.historySupport : f__getCachedValue()), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : false);
    f__assign(this, f__StringLiteral('run_in_init'), f__useValue((f__setCachedValue(f__tripleEqual(this.history, true)), f__useValue(f__getCachedValue()))) ? f__notTripleEqual(options.run_handler_in_init, false) : f__getCachedValue());
    f__assign(this, f__StringLiteral('convert_hash_in_init'), f__useValue((f__setCachedValue(f__tripleEqual(this.history, true)), f__useValue(f__getCachedValue()))) ? f__notTripleEqual(options.convert_hash_in_init, false) : f__getCachedValue());
    f__assign(this, f__StringLiteral('every'), f__makeObject([['ObjectProperty', f__StringLiteral('after'), f__useValue((f__setCachedValue(options.after), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : null], ['ObjectProperty', f__StringLiteral('before'), f__useValue((f__setCachedValue(options.before), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : null], ['ObjectProperty', f__StringLiteral('on'), f__useValue((f__setCachedValue(options.on), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : null]]));
    return this;
  });

  f__assign(Router.prototype, f__StringLiteral('param'), function (token, matcher) {
    if (f__useValue(f__notTripleEqual(token[0], f__StringLiteral(':')))) {
      token = f__add(f__StringLiteral(':'), token);
    }
    var compiled = new RegExp(token, f__StringLiteral('g'));
    f__assign(this.params, token, function (str) {
      return str.replace(compiled, f__useValue((f__setCachedValue(matcher.source), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : matcher);
    });
    return this;
  });

  f__assign(Router.prototype, f__StringLiteral('on'), f__assign(Router.prototype, f__StringLiteral('route'), function (method, path, route) {
    var self = this;
    if (f__useValue(f__useValue((f__setCachedValue(f__not(route)), f__useValue(f__getCachedValue()))) ? f__doubleEqual(f__useValue(typeof path === 'undefined') ? 'undefined' : f__typeof(path), f__StringLiteral('function')) : f__getCachedValue())) {
      route = path;
      path = method;
      method = f__StringLiteral('on');
    }
    if (f__useValue(Array.isArray(path))) {
      return path.forEach(function (p) {
        self.on(method, p, route);
      });
    }
    if (f__useValue(path.source)) {
      path = path.source.replace(/\\\//ig, f__StringLiteral('/'));
    }
    if (f__useValue(Array.isArray(method))) {
      return method.forEach(function (m) {
        self.on(m.toLowerCase(), path, route);
      });
    }
    path = path.split(new RegExp(this.delimiter));
    path = terminator(path, this.delimiter);
    this.insert(method, this.scope.concat(path), route);
  }));

  f__assign(Router.prototype, f__StringLiteral('path'), function (path, routesFn) {
    var self = this,
        length = this.scope.length;
    if (f__useValue(path.source)) {
      path = path.source.replace(/\\\//ig, f__StringLiteral('/'));
    }
    path = path.split(new RegExp(this.delimiter));
    path = terminator(path, this.delimiter);
    f__assign(this, f__StringLiteral('scope'), this.scope.concat(path));
    routesFn.call(this, this);
    this.scope.splice(length, path.length);
  });

  f__assign(Router.prototype, f__StringLiteral('dispatch'), function (method, path, callback) {
    var self = this,
        fns = this.traverse(method, path.replace(QUERY_SEPARATOR, f__StringLiteral('')), this.routes, f__StringLiteral('')),
        invoked = this._invoked,
        after;
    f__assign(this, f__StringLiteral('_invoked'), true);
    if (f__useValue(f__useValue((f__setCachedValue(f__not(fns)), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__tripleEqual(fns.length, 0))) {
      f__assign(this, f__StringLiteral('last'), []);
      if (f__useValue(f__tripleEqual(f__useValue(typeof this.notfound === 'undefined') ? 'undefined' : f__typeof(this.notfound), f__StringLiteral('function')))) {
        this.invoke([this.notfound], f__makeObject([['ObjectProperty', f__StringLiteral('method'), method], ['ObjectProperty', f__StringLiteral('path'), path]]), callback);
      }
      return false;
    }
    if (f__useValue(f__tripleEqual(this.recurse, f__StringLiteral('forward')))) {
      fns = fns.reverse();
    }
    function updateAndInvoke() {
      f__assign(self, f__StringLiteral('last'), fns.after);
      self.invoke(self.runlist(fns), self, callback);
    }
    after = f__useValue(f__useValue((f__setCachedValue(this.every), f__useValue(f__getCachedValue()))) ? this.every.after : f__getCachedValue()) ? [this.every.after].concat(this.last) : [this.last];
    if (f__useValue(f__useValue((f__setCachedValue(f__useValue((f__setCachedValue(after), f__useValue(f__getCachedValue()))) ? after.length > 0 : f__getCachedValue()), f__useValue(f__getCachedValue()))) ? invoked : f__getCachedValue())) {
      if (f__useValue(this.async)) {
        this.invoke(after, this, updateAndInvoke);
      } else {
        this.invoke(after, this);
        updateAndInvoke();
      }
      return true;
    }
    updateAndInvoke();
    return true;
  });

  f__assign(Router.prototype, f__StringLiteral('invoke'), function (fns, thisArg, callback) {
    var self = this;
    var apply;
    if (f__useValue(this.async)) {
      apply = function (fn, next) {
        if (f__useValue(Array.isArray(fn))) {
          return _asyncEverySeries(fn, apply, next);
        } else if (f__useValue(f__doubleEqual(f__useValue(typeof fn === 'undefined') ? 'undefined' : f__typeof(fn), f__StringLiteral('function')))) {
          fn.apply(thisArg, (f__useValue((f__setCachedValue(fns.captures), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : []).concat(next));
        }
      };
      _asyncEverySeries(fns, apply, function () {
        if (f__useValue(callback)) {
          callback.apply(thisArg, arguments);
        }
      });
    } else {
      apply = function (fn) {
        if (f__useValue(Array.isArray(fn))) {
          return _every(fn, apply);
        } else if (f__useValue(f__tripleEqual(f__useValue(typeof fn === 'undefined') ? 'undefined' : f__typeof(fn), f__StringLiteral('function')))) {
          return fn.apply(thisArg, f__useValue((f__setCachedValue(fns.captures), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : []);
        } else if (f__useValue(f__useValue((f__setCachedValue(f__tripleEqual(f__useValue(typeof fn === 'undefined') ? 'undefined' : f__typeof(fn), f__StringLiteral('string'))), f__useValue(f__getCachedValue()))) ? self.resource : f__getCachedValue())) {
          self.resource[fn].apply(thisArg, f__useValue((f__setCachedValue(fns.captures), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : []);
        }
      };
      _every(fns, apply);
    }
  });

  f__assign(Router.prototype, f__StringLiteral('traverse'), function (method, path, routes, regexp, filter) {
    var fns = [],
        current,
        exact,
        match,
        next,
        that;
    function filterRoutes(routes) {
      if (f__useValue(f__not(filter))) {
        return routes;
      }
      function deepCopy(source) {
        var result = [];
        for (var i = 0; f__useValue(i < source.length); i++) {
          f__assign(result, i, f__useValue(Array.isArray(source[i])) ? deepCopy(source[i]) : source[i]);
        }
        return result;
      }
      function applyFilter(fns) {
        for (var i = f__subtract(fns.length, 1); f__useValue(i >= 0); i--) {
          if (f__useValue(Array.isArray(fns[i]))) {
            applyFilter(fns[i]);
            if (f__useValue(f__tripleEqual(fns[i].length, 0))) {
              fns.splice(i, 1);
            }
          } else {
            if (f__useValue(f__not(filter(fns[i])))) {
              fns.splice(i, 1);
            }
          }
        }
      }
      var newRoutes = deepCopy(routes);
      f__assign(newRoutes, f__StringLiteral('matched'), routes.matched);
      f__assign(newRoutes, f__StringLiteral('captures'), routes.captures);
      f__assign(newRoutes, f__StringLiteral('after'), routes.after.filter(filter));
      applyFilter(newRoutes);
      return newRoutes;
    }
    if (f__useValue(f__useValue((f__setCachedValue(f__tripleEqual(path, this.delimiter)), f__useValue(f__getCachedValue()))) ? routes[method] : f__getCachedValue())) {
      next = [[routes.before, routes[method]].filter(Boolean)];
      f__assign(next, f__StringLiteral('after'), [routes.after].filter(Boolean));
      f__assign(next, f__StringLiteral('matched'), true);
      f__assign(next, f__StringLiteral('captures'), []);
      return filterRoutes(next);
    }
    for (var __fromJSForIn4623 in f__getForInLoopKeyObject(routes)) {
      var r;r = f__getTrackedPropertyName(routes, __fromJSForIn4623);

      if (f__useValue(f__useValue((f__setCachedValue(routes.hasOwnProperty(r)), f__useValue(f__getCachedValue()))) ? f__useValue((f__setCachedValue(f__not(this._methods[r])), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__useValue((f__setCachedValue(f__useValue((f__setCachedValue(this._methods[r]), f__useValue(f__getCachedValue()))) ? f__tripleEqual(f__useValue(typeof routes[r] === 'undefined') ? 'undefined' : f__typeof(routes[r]), f__StringLiteral('object')) : f__getCachedValue()), f__useValue(f__getCachedValue()))) ? f__not(Array.isArray(routes[r])) : f__getCachedValue() : f__getCachedValue())) {
        var r;r = f__getTrackedPropertyName(routes, __fromJSForIn4623);

        current = exact = f__add(f__add(regexp, this.delimiter), r);
        if (f__useValue(f__not(this.strict))) {
          var r;r = f__getTrackedPropertyName(routes, __fromJSForIn4623);

          exact = f__add(exact, f__add(f__add(f__StringLiteral('['), this.delimiter), f__StringLiteral(']?')));
        }
        match = path.match(new RegExp(f__add(f__StringLiteral('^'), exact)));
        if (f__useValue(f__not(match))) {
          var r;r = f__getTrackedPropertyName(routes, __fromJSForIn4623);

          continue;
        }
        if (f__useValue(f__useValue((f__setCachedValue(f__useValue((f__setCachedValue(match[0]), f__useValue(f__getCachedValue()))) ? f__doubleEqual(match[0], path) : f__getCachedValue()), f__useValue(f__getCachedValue()))) ? routes[r][method] : f__getCachedValue())) {
          var r;r = f__getTrackedPropertyName(routes, __fromJSForIn4623);

          next = [[routes[r].before, routes[r][method]].filter(Boolean)];
          f__assign(next, f__StringLiteral('after'), [routes[r].after].filter(Boolean));
          f__assign(next, f__StringLiteral('matched'), true);
          f__assign(next, f__StringLiteral('captures'), match.slice(1));
          if (f__useValue(f__useValue((f__setCachedValue(this.recurse), f__useValue(f__getCachedValue()))) ? f__tripleEqual(routes, this.routes) : f__getCachedValue())) {
            var r;r = f__getTrackedPropertyName(routes, __fromJSForIn4623);

            next.push([routes.before, routes.on].filter(Boolean));
            f__assign(next, f__StringLiteral('after'), next.after.concat([routes.after].filter(Boolean)));
          }
          return filterRoutes(next);
        }
        next = this.traverse(method, path, routes[r], current);
        if (f__useValue(next.matched)) {
          var r;r = f__getTrackedPropertyName(routes, __fromJSForIn4623);

          if (f__useValue(next.length > 0)) {
            var r;r = f__getTrackedPropertyName(routes, __fromJSForIn4623);

            fns = fns.concat(next);
          }
          if (f__useValue(this.recurse)) {
            var r;r = f__getTrackedPropertyName(routes, __fromJSForIn4623);

            fns.push([routes[r].before, routes[r].on].filter(Boolean));
            f__assign(next, f__StringLiteral('after'), next.after.concat([routes[r].after].filter(Boolean)));
            if (f__useValue(f__tripleEqual(routes, this.routes))) {
              var r;r = f__getTrackedPropertyName(routes, __fromJSForIn4623);

              fns.push([routes[f__StringLiteral('before')], routes[f__StringLiteral('on')]].filter(Boolean));
              f__assign(next, f__StringLiteral('after'), next.after.concat([routes[f__StringLiteral('after')]].filter(Boolean)));
            }
          }
          f__assign(fns, f__StringLiteral('matched'), true);
          f__assign(fns, f__StringLiteral('captures'), next.captures);
          f__assign(fns, f__StringLiteral('after'), next.after);
          return filterRoutes(fns);
        }
      }
    }
    return false;
  });

  f__assign(Router.prototype, f__StringLiteral('insert'), function (method, path, route, parent) {
    var methodType, parentType, isArray, nested, part;
    path = path.filter(function (p) {
      return f__useValue((f__setCachedValue(p), f__useValue(f__getCachedValue()))) ? p.length > 0 : f__getCachedValue();
    });
    parent = f__useValue((f__setCachedValue(parent), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : this.routes;
    part = path.shift();
    if (f__useValue(f__useValue((f__setCachedValue(/\:|\*/.test(part)), f__useValue(f__getCachedValue()))) ? f__not(/\\d|\\w/.test(part)) : f__getCachedValue())) {
      part = regifyString(part, this.params);
    }
    if (f__useValue(path.length > 0)) {
      f__assign(parent, part, f__useValue((f__setCachedValue(parent[part]), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__makeObject([]));
      return this.insert(method, path, route, parent[part]);
    }
    if (f__useValue(f__useValue((f__setCachedValue(f__useValue((f__setCachedValue(f__not(part)), f__useValue(f__getCachedValue()))) ? f__not(path.length) : f__getCachedValue()), f__useValue(f__getCachedValue()))) ? f__tripleEqual(parent, this.routes) : f__getCachedValue())) {
      methodType = f__useValue(typeof parent[method] === 'undefined') ? 'undefined' : f__typeof(parent[method]);
      switch (f__useValue(methodType)) {
        case f__useValue(f__StringLiteral('function')):
          f__assign(parent, method, [parent[method], route]);
          return;
        case f__useValue(f__StringLiteral('object')):
          parent[method].push(route);
          return;
        case f__useValue(f__StringLiteral('undefined')):
          f__assign(parent, method, route);
          return;
      }
      return;
    }
    parentType = f__useValue(typeof parent[part] === 'undefined') ? 'undefined' : f__typeof(parent[part]);
    isArray = Array.isArray(parent[part]);
    if (f__useValue(f__useValue((f__setCachedValue(f__useValue((f__setCachedValue(parent[part]), f__useValue(f__getCachedValue()))) ? f__not(isArray) : f__getCachedValue()), f__useValue(f__getCachedValue()))) ? f__doubleEqual(parentType, f__StringLiteral('object')) : f__getCachedValue())) {
      methodType = f__useValue(typeof parent[part][method] === 'undefined') ? 'undefined' : f__typeof(parent[part][method]);
      switch (f__useValue(methodType)) {
        case f__useValue(f__StringLiteral('function')):
          f__assign(parent[part], method, [parent[part][method], route]);
          return;
        case f__useValue(f__StringLiteral('object')):
          parent[part][method].push(route);
          return;
        case f__useValue(f__StringLiteral('undefined')):
          f__assign(parent[part], method, route);
          return;
      }
    } else if (f__useValue(f__doubleEqual(parentType, f__StringLiteral('undefined')))) {
      nested = f__makeObject([]);
      f__assign(nested, method, route);
      f__assign(parent, part, nested);
      return;
    }
    throw new Error(f__add(f__StringLiteral('Invalid route context: '), parentType));
  });

  f__assign(Router.prototype, f__StringLiteral('extend'), function (methods) {
    var self = this,
        len = methods.length,
        i;
    function extend(method) {
      f__assign(self._methods, method, true);
      f__assign(self, method, function () {
        var extra = f__useValue(f__tripleEqual(arguments.length, 1)) ? [method, f__StringLiteral('')] : [method];
        self.on.apply(self, extra.concat(Array.prototype.slice.call(arguments)));
      });
    }
    for (i = 0; f__useValue(i < len); i++) {
      extend(methods[i]);
    }
  });

  f__assign(Router.prototype, f__StringLiteral('runlist'), function (fns) {
    var runlist = f__useValue(f__useValue((f__setCachedValue(this.every), f__useValue(f__getCachedValue()))) ? this.every.before : f__getCachedValue()) ? [this.every.before].concat(_flatten(fns)) : _flatten(fns);
    if (f__useValue(f__useValue((f__setCachedValue(this.every), f__useValue(f__getCachedValue()))) ? this.every.on : f__getCachedValue())) {
      runlist.push(this.every.on);
    }
    f__assign(runlist, f__StringLiteral('captures'), fns.captures);
    f__assign(runlist, f__StringLiteral('source'), fns.source);
    return runlist;
  });

  f__assign(Router.prototype, f__StringLiteral('mount'), function (routes, path) {
    if (f__useValue(f__useValue((f__setCachedValue(f__useValue((f__setCachedValue(f__not(routes)), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__notTripleEqual(f__useValue(typeof routes === 'undefined') ? 'undefined' : f__typeof(routes), f__StringLiteral('object'))), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : Array.isArray(routes))) {
      return;
    }
    var self = this;
    path = f__useValue((f__setCachedValue(path), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : [];
    if (f__useValue(f__not(Array.isArray(path)))) {
      path = path.split(self.delimiter);
    }
    function insertOrMount(route, local) {
      var rename = route,
          parts = route.split(self.delimiter),
          routeType = f__useValue(typeof routes[route] === 'undefined') ? 'undefined' : f__typeof(routes[route]),
          isRoute = f__useValue((f__setCachedValue(f__tripleEqual(parts[0], f__StringLiteral(''))), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__not(self._methods[parts[0]]),
          event = f__useValue(isRoute) ? f__StringLiteral('on') : rename;
      if (f__useValue(isRoute)) {
        rename = rename.slice((f__useValue((f__setCachedValue(rename.match(new RegExp(f__add(f__StringLiteral('^'), self.delimiter)))), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : [f__StringLiteral('')])[0].length);
        parts.shift();
      }
      if (f__useValue(f__useValue((f__setCachedValue(f__useValue((f__setCachedValue(isRoute), f__useValue(f__getCachedValue()))) ? f__tripleEqual(routeType, f__StringLiteral('object')) : f__getCachedValue()), f__useValue(f__getCachedValue()))) ? f__not(Array.isArray(routes[route])) : f__getCachedValue())) {
        local = local.concat(parts);
        self.mount(routes[route], local);
        return;
      }
      if (f__useValue(isRoute)) {
        local = local.concat(rename.split(self.delimiter));
        local = terminator(local, self.delimiter);
      }
      self.insert(event, local, routes[route]);
    }
    for (var __fromJSForIn4624 in f__getForInLoopKeyObject(routes)) {
      var route;route = f__getTrackedPropertyName(routes, __fromJSForIn4624);

      if (f__useValue(routes.hasOwnProperty(route))) {
        var route;route = f__getTrackedPropertyName(routes, __fromJSForIn4624);

        insertOrMount(route, path.slice(0));
      }
    }
  });
})(f__useValue(f__tripleEqual(f__useValue(typeof exports === 'undefined') ? 'undefined' : f__typeof(exports), f__StringLiteral('object'))) ? exports : window);
//# sourceMappingURL=director.js.map