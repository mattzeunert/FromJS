'use strict';

var app = f__useValue((f__setCachedValue(app), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__makeObject([]);

(function () {
	'use strict';

	app.Utils = f__makeObject([[f__StringLiteral('uuid'), function uuid() {
		/*jshint bitwise:false */
		var i, random;
		var uuid = f__StringLiteral('');

		for (i = 0; i < 32; i++) {
			random = Math.random() * 16 | 0;
			if (f__useValue(f__useValue((f__setCachedValue(f__useValue((f__setCachedValue(f__useValue((f__setCachedValue(f__tripleEqual(i, 8)), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__tripleEqual(i, 12)), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__tripleEqual(i, 16)), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : f__tripleEqual(i, 20))) {
				uuid = f__add(uuid, f__StringLiteral('-'));
			}
			uuid = f__add(uuid, (f__useValue(f__tripleEqual(i, 12)) ? 4 : f__useValue(f__tripleEqual(i, 16)) ? random & 3 | 8 : random).toString(16));
		}

		return uuid;
	}], [f__StringLiteral('pluralize'), function pluralize(count, word) {
		return f__useValue(f__tripleEqual(count, 1)) ? word : f__add(word, f__StringLiteral('s'));
	}], [f__StringLiteral('store'), function store(namespace, data) {
		if (f__useValue(data)) {
			return localStorage.setItem(namespace, JSON.stringify(data));
		}

		var store = localStorage.getItem(namespace);
		return f__useValue((f__setCachedValue(f__useValue((f__setCachedValue(store), f__useValue(f__getCachedValue()))) ? JSON.parse(store) : f__getCachedValue()), f__useValue(f__getCachedValue()))) ? f__getCachedValue() : [];
	}], [f__StringLiteral('extend'), function extend() {
		var newObj = f__makeObject([]);
		for (var i = 0; i < arguments.length; i++) {
			var obj = arguments[i];
			for (var __fromJSForIn89 in obj) {
				var key;key = f__getTrackedPropertyName(obj, __fromJSForIn89);

				if (f__useValue(obj.hasOwnProperty(key))) {
					var key;key = f__getTrackedPropertyName(obj, __fromJSForIn89);

					f__assign(newObj, key, obj[key]);
				}
			}
		}
		return newObj;
	}]]);
})();
//# sourceMappingURL=utils.js.map