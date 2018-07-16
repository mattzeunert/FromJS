import * as request from "request";
import * as waitUntil from "wait-until";
import * as Proxy from "http-mitm-proxy";

////////////////////////

Error["stackTraceLimit"] = Infinity;

import { spawn } from "threads";

export function startProxy(options) {
  return new Promise(resolve => {
    var fesProxy = new ProxyInstrumenter(options);
    fesProxy.start().then(() => {
      resolve(fesProxy);
    });
  });
}

function getUrl(ctx) {
  let protocol = ctx.isSSL ? "https" : "http";
  return (
    protocol +
    "://" +
    ctx.clientToProxyRequest.headers.host +
    ctx.clientToProxyRequest.url
  );
}

function checkIsJS(ctx) {
  return ctx.clientToProxyRequest.url
    .replace("?dontprocess", "")
    .split("?")[0]
    .endsWith(".js");
}

class ProxyInstrumenter {
  urlCache = {};
  babelPluginOptions = {};
  instrumenterFilePath = "";
  proxy: any = null;
  requestsInProgress: any[] = [];
  port: null;
  shouldInstrument: any;
  silent = false;
  rewriteHtml: any;
  handleEvalScript: any;
  certDirectory: string;
  verbose: boolean;
  onCompilationComplete: any;
  onRegisterEvalScript: any;
  shouldBlock: any;
  enableInstrumenation = true;

  constructor({
    babelPluginOptions,
    instrumenterFilePath,
    port,
    shouldInstrument,
    silent,
    rewriteHtml,
    handleEvalScript,
    certDirectory,
    verbose,
    onCompilationComplete,
    onRegisterEvalScript,
    shouldBlock
  }) {
    this.port = port;
    this.instrumenterFilePath = instrumenterFilePath;
    this.proxy = Proxy();
    this.babelPluginOptions = babelPluginOptions;
    this.shouldInstrument = shouldInstrument;
    this.rewriteHtml = rewriteHtml;
    this.silent = silent;
    this.handleEvalScript = handleEvalScript;
    this.certDirectory = certDirectory;
    this.verbose = verbose;
    this.onCompilationComplete = onCompilationComplete;
    this.onRegisterEvalScript = onRegisterEvalScript;
    this.shouldBlock = shouldBlock;

    this.proxy.onError((ctx, err, errorKind) => {
      var url = "n/a";
      // ctx may be null
      if (ctx) {
        url = getUrl(ctx);
        this.finishRequest(ctx.requestId);
      }

      console.error("[PROXY]" + errorKind + " on " + url + ":", err);
    });

    this.proxy.onRequest(this.onRequest.bind(this));

    this.proxy.onResponseEnd((ctx, callback) => {
      // this.log(
      //   "resp end",
      //   getUrl(ctx),
      //   "#req still in progress:",
      //   this.requestsInProgress.length
      // );
      callback();
    });
  }

  log(...args) {
    args.unshift("[PROXY]");
    console.log.apply(console, args);
  }

  onRequest(ctx, callback) {
    const requestInfo = {
      protocol: ctx.isSSL ? "https" : "http",
      url: getUrl(ctx),
      path: ctx.clientToProxyRequest.url,
      port:
        parseFloat(ctx.clientToProxyRequest.headers.host.split(":")[1]) || 80,
      method: ctx.clientToProxyRequest.method.toUpperCase()
    };
    var url = requestInfo.url;
    ctx.requestId = url + "_" + Math.random();

    if (!this.enableInstrumenation || requestInfo.method !== "GET") {
      this.preventBrowserCaching(ctx);
      callback();
      return;
    }

    if (this.shouldBlock && this.shouldBlock(requestInfo)) {
      ctx.proxyToClientResponse.statusCode = 401; // Unauthorized
      ctx.proxyToClientResponse.end("");
      return;
    }

    if (!this.silent && this.verbose) {
      this.log("Request: " + url);
    }

    if (url === "http://example.com/verifyProxyWorks") {
      ctx.proxyToClientResponse.end("Confirmed proxy works!");
      return;
    }

    if (this.urlCache[url]) {
      if (this.verbose) {
        this.log("Url cache hit!");
      }
      Object.keys(this.urlCache[url].headers).forEach(name => {
        var value = this.urlCache[url].headers[name];
        ctx.proxyToClientResponse.setHeader(name, value);
      });

      this.preventBrowserCaching(ctx);
      ctx.proxyToClientResponse.end(new Buffer(this.urlCache[url].body));
      return;
    }

    this.requestsInProgress.push(ctx.requestId);

    const proxyToServerHeaders = ctx.proxyToServerRequestOptions.headers;
    if ("accept-encoding" in proxyToServerHeaders) {
      // Disable Brotli compression since we can't decode it
      // (e.g. cloudflare uses it if we let it)
      proxyToServerHeaders["accept-encoding"] = proxyToServerHeaders[
        "accept-encoding"
      ].replace(", br", "");
    }

    var isDontProcess = ctx.clientToProxyRequest.url.includes("?dontprocess");
    var isMap = url.split("?")[0].endsWith(".map") && !url.includes(".css.map");
    var isHtml =
      !checkIsJS(ctx) &&
      !requestInfo.url.endsWith(".png") &&
      !requestInfo.url.endsWith(".jpg") &&
      !requestInfo.url.endsWith(".woff2") &&
      ctx.clientToProxyRequest.headers.accept &&
      ctx.clientToProxyRequest.headers.accept.includes("text/html");

    let shouldInstrument = true;
    if (this.shouldInstrument) {
      shouldInstrument = this.shouldInstrument(requestInfo);
    }

    ctx.use(Proxy.gunzip);

    const maybeProcessJs = (body, done) => {
      if (!isDontProcess) {
        this.processCode(body, url).then(
          result => {
            done(result.code);
          },
          err => {
            this.log("process code error", err);
            this.finishRequest(ctx.requestId);
            done(body);
          }
        );
      } else {
        done(body);
      }
    };

    if ((isHtml || checkIsJS(ctx)) && shouldInstrument) {
      this.waitForResponseEnd(ctx).then(({ body, ctx, sendResponse }) => {
        const contentType = ctx.serverToProxyResponse.headers["content-type"];

        let resourceType;
        if (contentType) {
          if (contentType.includes("text/html")) {
            resourceType = "html";
          } else if (
            contentType.includes("text/javascript") ||
            contentType.includes("application/javascript")
          ) {
            resourceType = "js";
          } else {
            // not html or js
            sendResponse(body);
            return;
          }
        } else {
          if (isHtml) {
            resourceType = "html";
          } else if (checkIsJS(ctx)) {
            resourceType = "js";
          }
        }

        if (resourceType === "html") {
          this.processHtml(body).then(function(html) {
            body = html;
            sendResponse(body);
          });
        } else if (resourceType === "js") {
          maybeProcessJs(body, responseCode => {
            sendResponse(responseCode);
          });
        } else {
          throw "???";
        }
      });
      callback();
    } else if (isMap && shouldInstrument) {
      this.getSourceMap(url).then(sourceMap => {
        ctx.proxyToClientResponse.end(JSON.stringify(sourceMap));
        this.finishRequest(ctx.requestId);
      });
    } else {
      ctx.onResponseEnd((ctx, callback) => {
        this.finishRequest(ctx.requestId);
        return callback();
      });
      callback();
    }
  }

  async processHtml(body) {
    if (this.rewriteHtml) {
      body = this.rewriteHtml(body);
    }

    body = await this.compileHtmlInlineScriptTags(body);

    // Remove integrity hashes, since the browser will prevent loading
    // the instrumented HTML otherwise
    body = body.replace(/ integrity="[\S]+"/g, "");

    return body;
  }

  async compileHtmlInlineScriptTags(body) {
    var MagicString = require("magic-string");
    var magicHtml = new MagicString(body);
    const parse5 = require("parse5");
    const doc = parse5.parse(body, { sourceCodeLocationInfo: true });

    const walk = require("walk-parse5");

    const inlineScriptTags: any[] = [];

    walk(doc, async node => {
      // Optionally kill traversal
      if (node.tagName === "script") {
        if (
          node.attrs.find(attr => attr.name === "data-fromjs-dont-instrument")
        ) {
          return;
        }
        const hasSrcAttribute = !!node.attrs.find(attr => attr.name === "src");
        const typeAttribute = node.attrs.find(attr => attr.name === "type");
        const typeIsJS =
          !typeAttribute ||
          ["application/javascript", "text/javascript"].includes(
            typeAttribute.value
          );
        const isInlineScriptTag = !hasSrcAttribute && typeIsJS;
        if (isInlineScriptTag) {
          inlineScriptTags.push(node);
        }
      }
    });

    await Promise.all(
      inlineScriptTags.map(async node => {
        const code = node.childNodes[0].value;
        const compRes = <any>await this.instrumentForEval(code);
        node.compiledCode = compRes.instrumentedCode;
      })
    );

    inlineScriptTags.forEach(node => {
      const textLoc = node.childNodes[0].sourceCodeLocation;
      magicHtml.overwrite(
        textLoc.startOffset,
        textLoc.endOffset,
        node.compiledCode
      );
    });

    return magicHtml.toString();
  }

  setEnableInstrumentation(enable) {
    // Disable instrumentation for all files
    // Separate setting from shouldInstrument because this will also bypass the cache
    // (maybe including whether value is instrumented in cache would be better... but this works for now)
    this.enableInstrumenation = enable;
  }

  // Just here for FromJS convenience, normally easier to just read value directly
  _getEnableInstrumentation() {
    return this.enableInstrumenation;
  }

  start() {
    var port = this.port;
    this.proxy.listen({
      port: port,
      sslCaDir: this.certDirectory,
      silent: true
    });
    // Was having issues in CI, so make sure to wait for proxy to be ready
    return new Promise(resolve => {
      waitUntil()
        .interval(50)
        .times(200)
        .condition(cb => {
          this.proxiedFetchUrl("http://example.com/verifyProxyWorks").then(
            function(body) {
              cb(body === "Confirmed proxy works!");
            },
            function(err) {
              cb(false);
            }
          );
        })
        .done(function() {
          resolve();
        });
    });
  }

  preventBrowserCaching(ctx) {
    try {
      ctx.proxyToClientResponse.setHeader(
        "Cache-Control",
        "no-cache, no-store, must-revalidate"
      );
      ctx.proxyToClientResponse.setHeader("Pragma", "no-cache");
      ctx.proxyToClientResponse.setHeader("expires", "0");

      var setHeader = ctx.proxyToClientResponse.setHeader;
      ctx.proxyToClientResponse.setHeader = function(header) {
        if (header === "cache-control" || header === "expires") {
          return;
        }
        return setHeader.apply(this, arguments);
      };
    } catch (err) {
      console.log(err, getUrl(ctx));
    }
  }

  waitForResponseEnd(ctx) {
    var jsFetchStartTime = new Date();
    return new Promise<any>(resolve => {
      this.preventBrowserCaching(ctx);

      var chunks: any[] = [];
      ctx.onResponseData(function(ctx, chunk, callback) {
        chunks.push(chunk);

        return callback(null, null); // don't write chunks to client response
      });

      ctx.onResponseEnd((ctx, callback) => {
        var buffer = Buffer.concat(chunks);

        var body = buffer.toString();
        var msElapsed = new Date().valueOf() - jsFetchStartTime.valueOf();
        var speed = Math.round(buffer.byteLength / msElapsed / 1000 * 1000);
        if (!this.silent && this.verbose) {
          this.log(
            "JS ResponseEnd",
            getUrl(ctx),
            "Time:",
            msElapsed + "ms",
            "Size: ",
            buffer.byteLength / 1024 + "kb",
            " Speed",
            speed + "kb/s"
          );
        }

        const sendResponse = responseBody => {
          this.finishRequest(ctx.requestId);
          if (body.length === 0) {
            // console.log(body, responseBody);
            console.log("EMPTY RESPONSE", getUrl(ctx));
          } else {
            const sizeInMb =
              Math.round(responseBody.length / 1024 / 1024 * 1000) / 1000;
            if (sizeInMb > 1) {
              console.log(getUrl(ctx), "size", sizeInMb, "MB");
            }

            const contentType =
              ctx.serverToProxyResponse.headers["content-type"];
            const isHtml = contentType && contentType.includes("text/html");

            if (!isHtml) {
              // don't cache html since the transformations fromjs does on it tend to be simpler...
              // however this is fromjs specific
              // having a shouldCache option would be good if proxy instrumenter
              // should be useful independenly
              this.cacheUrl(getUrl(ctx), {
                body: responseBody,
                headers: ctx.serverToProxyResponse.headers
              });
            }
          }

          ctx.proxyToClientResponse.end(new Buffer(responseBody));
          callback();
        };
        resolve({ body, ctx, sendResponse });
      });
    });
  }

  cacheUrl(url, cacheData) {
    this.urlCache[url] = cacheData;
  }

  instrumentForEval(code) {
    const compile = (code, url, done) => {
      this.processCode(code, url).then(done);
    };

    return new Promise(resolve => {
      this.handleEvalScript(
        code,
        compile,
        ({ url, instrumentedCode, code, map }) => {
          this.cacheUrl(url, {
            headers: {},
            body: instrumentedCode
          });

          this.cacheUrl(url + "?dontprocess", {
            headers: {},
            body: code
          });

          this.cacheUrl(url + ".map", {
            headers: {},
            body: map
          });
          resolve({
            instrumentedCode
          });
        }
      );
    });
  }

  registerEvalScript({ url, code, instrumentedCode, map, locs }) {
    this.cacheUrl(url, {
      headers: {},
      body: instrumentedCode
    });
    this.cacheUrl(url + "?dontprocess", {
      headers: {},
      body: code
    });
    this.cacheUrl(url + ".map", {
      headers: {},
      body: JSON.stringify(map)
    });
    this.onRegisterEvalScript({ url, code, instrumentedCode, map, locs });
  }

  finishRequest(finishedRequestId) {
    this.requestsInProgress = this.requestsInProgress.filter(
      id => id !== finishedRequestId
    );
  }

  proxiedFetchUrl(url) {
    var r = request.defaults({ proxy: "http://127.0.0.1:" + this.port });
    return new Promise((resolve, reject) => {
      if (this.urlCache[url]) {
        resolve(this.urlCache[url].body);
      } else {
        r({ url, rejectUnauthorized: false }, function(error, response, body) {
          if (error) {
            reject(error);
          } else {
            resolve(body);
          }
        });
      }
    });
  }

  getSourceMap(url) {
    var jsUrl = url.replace(".js.map", ".js");
    // console.time("Get sourceMap" + url);
    return new Promise(resolve => {
      this.proxiedFetchUrl(jsUrl).then(body => {
        this.processCode(body, jsUrl).then(function(result) {
          // console.timeEnd("Get sourceMap" + url);
          resolve(result.map);
        });
      });
    });
  }

  requestProcessCode(body, url, babelPluginOptions) {
    return new Promise(resolve => {
      const RUN_IN_SAME_PROCESS = false;

      if (body.length > 1024 * 500) {
        console.time(url);
      }

      if (RUN_IN_SAME_PROCESS) {
        console.log("Running compilation in proxy process for debugging");
        var compile = require(this.instrumenterFilePath);
        compile({ body, url, babelPluginOptions }, resolve);
      } else {
        var compilerProcess = spawn(this.instrumenterFilePath);
        var path = require("path");
        compilerProcess
          .send({ body, url, babelPluginOptions })
          .on("message", function(response) {
            resolve(response);
            if (body.length > 1024 * 500) {
              console.timeEnd(url);
            }
            compilerProcess.kill();
          })
          .on("error", error => {
            this.log("worker error", error);
          });
      }
    });
  }

  processCodeCache = {};
  setProcessCodeCache(body, url, result) {
    var cacheKey = body + url;
    this.processCodeCache[cacheKey] = result;
  }

  processCode(body, url) {
    var cacheKey = body + url;
    if (this.processCodeCache[cacheKey]) {
      return Promise.resolve(this.processCodeCache[cacheKey]);
    }
    return this.requestProcessCode(body, url, this.babelPluginOptions).then(
      response => {
        var { code, map, locs } = <any>response;
        if (this.onCompilationComplete) {
          this.onCompilationComplete(response);
        }
        var result = { code, map };
        this.setProcessCodeCache(body, url, result);
        return Promise.resolve(result);
      }
    );
  }

  hasPendingRequests() {
    return this.requestsInProgress.length > 0;
  }
  close() {
    this.proxy.close();
  }
}
