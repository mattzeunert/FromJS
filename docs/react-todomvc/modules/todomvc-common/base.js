/* global _ */
(function () {
	'use strict';

	/* jshint ignore:start */
	// Underscore's Template Module
	// Courtesy of underscorejs.org

	var _ = function (_) {
		f__assign(_, f__StringLiteral("defaults"), function (object) {
			if (f__useValue(f__not(object))) {
				return object;
			}
			for (var argsIndex = 1, argsLength = arguments.length; f__useValue(argsIndex < argsLength); argsIndex++) {
				var iterable = arguments[argsIndex];
				if (f__useValue(iterable)) {
					for (var __fromJSForIn357 in f__getForInLoopKeyObject(iterable)) {
						var key;key = f__getTrackedPropertyName(iterable, __fromJSForIn357);

						if (f__useValue(f__doubleEqual(object[key], null))) {
							var key;key = f__getTrackedPropertyName(iterable, __fromJSForIn357);

							f__assign(object, key, iterable[key]);
						}
					}
				}
			}
			return object;
		});

		// By default, Underscore uses ERB-style template delimiters, change the
		// following template settings to use alternative delimiters.
		f__assign(_, f__StringLiteral("templateSettings"), f__makeObject([["ObjectProperty", f__StringLiteral("evaluate"), /<%([\s\S]+?)%>/g], ["ObjectProperty", f__StringLiteral("interpolate"), /<%=([\s\S]+?)%>/g], ["ObjectProperty", f__StringLiteral("escape"), /<%-([\s\S]+?)%>/g]]));

		// When customizing `templateSettings`, if you don't want to define an
		// interpolation, evaluation or escaping regex, we need one that is
		// guaranteed not to match.
		var noMatch = /(.)^/;

		// Certain characters need to be escaped so that they can be put into a
		// string literal.
		var escapes = f__makeObject([["ObjectProperty", f__StringLiteral("'"), f__StringLiteral("'")], ["ObjectProperty", f__StringLiteral("\\"), f__StringLiteral("\\")], ["ObjectProperty", f__StringLiteral("\r"), f__StringLiteral("r")], ["ObjectProperty", f__StringLiteral("\n"), f__StringLiteral("n")], ["ObjectProperty", f__StringLiteral("\t"), f__StringLiteral("t")], ["ObjectProperty", f__StringLiteral("\u2028"), f__StringLiteral("u2028")], ["ObjectProperty", f__StringLiteral("\u2029"), f__StringLiteral("u2029")]]);

		var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

		// JavaScript micro-templating, similar to John Resig's implementation.
		// Underscore templating handles arbitrary delimiters, preserves whitespace,
		// and correctly escapes quotes within interpolated code.
		f__assign(_, f__StringLiteral("template"), function (text, data, settings) {
			var render;
			settings = _.defaults(f__makeObject([]), settings, _.templateSettings);

			// Combine delimiters into one regular expression via alternation.
			var matcher = new RegExp(f__add([(f__useValue((f__setCachedValue(settings.escape), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : noMatch).source, (f__useValue((f__setCachedValue(settings.interpolate), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : noMatch).source, (f__useValue((f__setCachedValue(settings.evaluate), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : noMatch).source].join(f__StringLiteral("|")), f__StringLiteral("|$")), f__StringLiteral("g"));

			// Compile the template source, escaping string literals appropriately.
			var index = 0;
			var source = f__StringLiteral("__p+='");
			text.replace(matcher, function (match, escape, interpolate, evaluate, offset) {
				source = f__add(source, text.slice(index, offset).replace(escaper, function (match) {
					return f__add(f__StringLiteral("\\"), escapes[match]);
				}));

				if (f__useValue(escape)) {
					source = f__add(source, f__add(f__add(f__StringLiteral("'+\n((__t=("), escape), f__StringLiteral("))==null?'':_.escape(__t))+\n'")));
				}
				if (f__useValue(interpolate)) {
					source = f__add(source, f__add(f__add(f__StringLiteral("'+\n((__t=("), interpolate), f__StringLiteral("))==null?'':__t)+\n'")));
				}
				if (f__useValue(evaluate)) {
					source = f__add(source, f__add(f__add(f__StringLiteral("';\n"), evaluate), f__StringLiteral("\n__p+='")));
				}
				index = f__add(offset, match.length);
				return match;
			});
			source = f__add(source, f__StringLiteral("';\n"));

			// If a variable is not specified, place data values in local scope.
			if (f__useValue(f__not(settings.variable))) source = f__add(f__add(f__StringLiteral("with(obj||{}){\n"), source), f__StringLiteral("}\n"));

			source = f__add(f__add(f__add(f__StringLiteral("var __t,__p='',__j=Array.prototype.join,"), f__StringLiteral("print=function(){__p+=__j.call(arguments,'');};\n")), source), f__StringLiteral("return __p;\n"));

			try {
				render = new Function(f__useValue((f__setCachedValue(settings.variable), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__StringLiteral("obj"), f__StringLiteral("_"), source);
			} catch (e) {
				f__assign(e, f__StringLiteral("source"), source);
				throw e;
			}

			if (f__useValue(data)) return render(data, _);
			var template = function (data) {
				return render.call(this, data, _);
			};

			// Provide the compiled function source as a convenience for precompilation.
			f__assign(template, f__StringLiteral("source"), f__add(f__add(f__add(f__add(f__StringLiteral("function("), f__useValue((f__setCachedValue(settings.variable), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__StringLiteral("obj")), f__StringLiteral("){\n")), source), f__StringLiteral("}")));

			return template;
		});

		return _;
	}(f__makeObject([]));

	if (f__useValue(f__tripleEqual(location.hostname, f__StringLiteral("todomvc.com")))) {
		(function (i, s, o, g, r, a, m) {
			f__assign(i, f__StringLiteral("GoogleAnalyticsObject"), r);f__assign(i, r, f__useValue((f__setCachedValue(i[r]), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : function () {
				f__assign(i[r], f__StringLiteral("q"), f__useValue((f__setCachedValue(i[r].q), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : []).push(arguments);
			}), f__assign(i[r], f__StringLiteral("l"), f__multiply(1, new Date()));a = s.createElement(o), m = s.getElementsByTagName(o)[0];f__assign(a, f__StringLiteral("async"), 1);f__assign(a, f__StringLiteral("src"), g);m.parentNode.insertBefore(a, m);
		})(window, document, f__StringLiteral("script"), f__StringLiteral("https://www.google-analytics.com/analytics.js"), f__StringLiteral("ga"));
		ga(f__StringLiteral("create"), f__StringLiteral("UA-31081062-1"), f__StringLiteral("auto"));
		ga(f__StringLiteral("send"), f__StringLiteral("pageview"));
	}
	/* jshint ignore:end */

	function redirect() {
		if (f__useValue(f__tripleEqual(location.hostname, f__StringLiteral("tastejs.github.io")))) {
			f__assign(location, f__StringLiteral("href"), location.href.replace(f__StringLiteral("tastejs.github.io/todomvc"), f__StringLiteral("todomvc.com")));
		}
	}

	function findRoot() {
		var base = location.href.indexOf(f__StringLiteral("examples/"));
		return location.href.substr(0, base);
	}

	function getFile(file, callback) {
		if (f__useValue(f__not(location.host))) {
			return console.info(f__StringLiteral("Miss the info bar? Run TodoMVC from a server to avoid a cross-origin error."));
		}

		var xhr = new XMLHttpRequest();

		xhr.open(f__StringLiteral("GET"), f__add(findRoot(), file), true);
		xhr.send();

		f__assign(xhr, f__StringLiteral("onload"), function () {
			if (f__useValue(f__useValue((f__setCachedValue(f__tripleEqual(xhr.status, 200)), f__useValue(f__getCachedValue()))) ? callback : f__getCachedValue())) {
				callback(xhr.responseText);
			}
		});
	}

	function Learn(learnJSON, config) {
		if (f__useValue(f__not(this instanceof Learn))) {
			return new Learn(learnJSON, config);
		}

		var template, framework;

		if (f__useValue(f__notTripleEqual(f__useValue(typeof learnJSON === "undefined") ? "undefined" : f__typeof(learnJSON), f__StringLiteral("object")))) {
			try {
				learnJSON = JSON.parse(learnJSON);
			} catch (e) {
				return;
			}
		}

		if (f__useValue(config)) {
			template = config.template;
			framework = config.framework;
		}

		if (f__useValue(f__useValue((f__setCachedValue(f__not(template)), f__useValue(f__getCachedValue()))) ? learnJSON.templates : f__getCachedValue())) {
			template = learnJSON.templates.todomvc;
		}

		if (f__useValue(f__useValue((f__setCachedValue(f__not(framework)), f__useValue(f__getCachedValue()))) ? document.querySelector(f__StringLiteral("[data-framework]")) : f__getCachedValue())) {
			framework = document.querySelector(f__StringLiteral("[data-framework]")).dataset.framework;
		}

		f__assign(this, f__StringLiteral("template"), template);

		if (f__useValue(learnJSON.backend)) {
			f__assign(this, f__StringLiteral("frameworkJSON"), learnJSON.backend);
			f__assign(this.frameworkJSON, f__StringLiteral("issueLabel"), framework);
			this.append(f__makeObject([["ObjectProperty", f__StringLiteral("backend"), true]]));
		} else if (f__useValue(learnJSON[framework])) {
			f__assign(this, f__StringLiteral("frameworkJSON"), learnJSON[framework]);
			f__assign(this.frameworkJSON, f__StringLiteral("issueLabel"), framework);
			this.append();
		}

		this.fetchIssueCount();
	}

	f__assign(Learn.prototype, f__StringLiteral("append"), function (opts) {
		var aside = document.createElement(f__StringLiteral("aside"));
		f__assign(aside, f__StringLiteral("innerHTML"), _.template(this.template, this.frameworkJSON));
		f__assign(aside, f__StringLiteral("className"), f__StringLiteral("learn"));

		if (f__useValue(f__useValue((f__setCachedValue(opts), f__useValue(f__getCachedValue()))) ? opts.backend : f__getCachedValue())) {
			// Remove demo link
			var sourceLinks = aside.querySelector(f__StringLiteral(".source-links"));
			var heading = sourceLinks.firstElementChild;
			var sourceLink = sourceLinks.lastElementChild;
			// Correct link path
			var href = sourceLink.getAttribute(f__StringLiteral("href"));
			sourceLink.setAttribute(f__StringLiteral("href"), href.substr(href.lastIndexOf(f__StringLiteral("http"))));
			f__assign(sourceLinks, f__StringLiteral("innerHTML"), f__add(heading.outerHTML, sourceLink.outerHTML));
		} else {
			// Localize demo links
			var demoLinks = aside.querySelectorAll(f__StringLiteral(".demo-link"));
			Array.prototype.forEach.call(demoLinks, function (demoLink) {
				if (f__useValue(f__notTripleEqual(demoLink.getAttribute(f__StringLiteral("href")).substr(0, 4), f__StringLiteral("http")))) {
					demoLink.setAttribute(f__StringLiteral("href"), f__add(findRoot(), demoLink.getAttribute(f__StringLiteral("href"))));
				}
			});
		}

		f__assign(document.body, f__StringLiteral("className"), f__add(document.body.className, f__StringLiteral(" learn-bar")).trim());
		document.body.insertAdjacentHTML(f__StringLiteral("afterBegin"), aside.outerHTML);
	});

	f__assign(Learn.prototype, f__StringLiteral("fetchIssueCount"), function () {
		var issueLink = document.getElementById(f__StringLiteral("issue-count-link"));
		if (f__useValue(issueLink)) {
			var url = issueLink.href.replace(f__StringLiteral("https://github.com"), f__StringLiteral("https://api.github.com/repos"));
			var xhr = new XMLHttpRequest();
			xhr.open(f__StringLiteral("GET"), url, true);
			f__assign(xhr, f__StringLiteral("onload"), function (e) {
				var parsedResponse = JSON.parse(e.target.responseText);
				if (f__useValue(parsedResponse instanceof Array)) {
					var count = parsedResponse.length;
					if (f__useValue(f__notTripleEqual(count, 0))) {
						f__assign(issueLink, f__StringLiteral("innerHTML"), f__add(f__add(f__StringLiteral("This app has "), count), f__StringLiteral(" open issues")));
						f__assign(document.getElementById(f__StringLiteral("issue-count")).style, f__StringLiteral("display"), f__StringLiteral("inline"));
					}
				}
			});
			xhr.send();
		}
	});

	redirect();
	getFile(f__StringLiteral("learn.json"), Learn);
})();
//# sourceMappingURL=base.js.map