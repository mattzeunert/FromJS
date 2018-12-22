/*!
  Copyright (c) 2015 Jed Watson.
  Licensed under the MIT License (MIT), see
  http://jedwatson.github.io/classnames
*/
/* global define */

(function () {
	'use strict';

	var hasOwn = f__makeObject([]).hasOwnProperty;

	function classNames() {
		var classes = f__StringLiteral('');

		for (var i = 0; f__useValue(i < arguments.length); i++) {
			var arg = arguments[i];
			if (f__useValue(f__not(arg))) continue;

			var argType = f__useValue(typeof arg === 'undefined') ? 'undefined' : f__typeof(arg);

			if (f__useValue(f__useValue((f__setCachedValue(f__tripleEqual(argType, f__StringLiteral('string'))), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__tripleEqual(argType, f__StringLiteral('number')))) {
				classes = f__add(classes, f__add(f__StringLiteral(' '), arg));
			} else if (f__useValue(Array.isArray(arg))) {
				classes = f__add(classes, f__add(f__StringLiteral(' '), classNames.apply(null, arg)));
			} else if (f__useValue(f__tripleEqual(argType, f__StringLiteral('object')))) {
				for (var __fromJSForIn358 in f__getForInLoopKeyObject(arg)) {
					var key;key = f__getTrackedPropertyName(arg, __fromJSForIn358);

					if (f__useValue(f__useValue((f__setCachedValue(hasOwn.call(arg, key)), f__useValue(f__getCachedValue()))) ? arg[key] : f__getCachedValue())) {
						var key;key = f__getTrackedPropertyName(arg, __fromJSForIn358);

						classes = f__add(classes, f__add(f__StringLiteral(' '), key));
					}
				}
			}
		}

		return classes.substr(1);
	}

	if (f__useValue(f__useValue((f__setCachedValue(f__notTripleEqual(f__useValue(typeof module === 'undefined') ? 'undefined' : f__typeof(module), f__StringLiteral('undefined'))), f__useValue(f__getCachedValue()))) ? module.exports : f__getCachedValue())) {
		f__assign(module, f__StringLiteral('exports'), classNames);
	} else if (f__useValue(f__useValue((f__setCachedValue(f__useValue((f__setCachedValue(f__tripleEqual(f__useValue(typeof define === 'undefined') ? 'undefined' : f__typeof(define), f__StringLiteral('function'))), f__useValue(f__getCachedValue()))) ? f__tripleEqual(f__useValue(typeof define.amd === 'undefined') ? 'undefined' : f__typeof(define.amd), f__StringLiteral('object')) : f__getCachedValue()), f__useValue(f__getCachedValue()))) ? define.amd : f__getCachedValue())) {
		// register as 'classnames', consistent with npm package name
		define(f__StringLiteral('classnames'), function () {
			return classNames;
		});
	} else {
		f__assign(window, f__StringLiteral('classNames'), classNames);
	}
})();
//# sourceMappingURL=index.js.map