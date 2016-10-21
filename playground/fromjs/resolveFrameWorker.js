/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ({

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(839);


/***/ },

/***/ 516:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;//     Underscore.js 1.8.3
	//     http://underscorejs.org
	//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	//     Underscore may be freely distributed under the MIT license.
	
	(function() {
	
	  // Baseline setup
	  // --------------
	
	  // Establish the root object, `window` in the browser, or `exports` on the server.
	  var root = this;
	
	  // Save the previous value of the `_` variable.
	  var previousUnderscore = root._;
	
	  // Save bytes in the minified (but not gzipped) version:
	  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;
	
	  // Create quick reference variables for speed access to core prototypes.
	  var
	    push             = ArrayProto.push,
	    slice            = ArrayProto.slice,
	    toString         = ObjProto.toString,
	    hasOwnProperty   = ObjProto.hasOwnProperty;
	
	  // All **ECMAScript 5** native function implementations that we hope to use
	  // are declared here.
	  var
	    nativeIsArray      = Array.isArray,
	    nativeKeys         = Object.keys,
	    nativeBind         = FuncProto.bind,
	    nativeCreate       = Object.create;
	
	  // Naked function reference for surrogate-prototype-swapping.
	  var Ctor = function(){};
	
	  // Create a safe reference to the Underscore object for use below.
	  var _ = function(obj) {
	    if (obj instanceof _) return obj;
	    if (!(this instanceof _)) return new _(obj);
	    this._wrapped = obj;
	  };
	
	  // Export the Underscore object for **Node.js**, with
	  // backwards-compatibility for the old `require()` API. If we're in
	  // the browser, add `_` as a global object.
	  if (true) {
	    if (typeof module !== 'undefined' && module.exports) {
	      exports = module.exports = _;
	    }
	    exports._ = _;
	  } else {
	    root._ = _;
	  }
	
	  // Current version.
	  _.VERSION = '1.8.3';
	
	  // Internal function that returns an efficient (for current engines) version
	  // of the passed-in callback, to be repeatedly applied in other Underscore
	  // functions.
	  var optimizeCb = function(func, context, argCount) {
	    if (context === void 0) return func;
	    switch (argCount == null ? 3 : argCount) {
	      case 1: return function(value) {
	        return func.call(context, value);
	      };
	      case 2: return function(value, other) {
	        return func.call(context, value, other);
	      };
	      case 3: return function(value, index, collection) {
	        return func.call(context, value, index, collection);
	      };
	      case 4: return function(accumulator, value, index, collection) {
	        return func.call(context, accumulator, value, index, collection);
	      };
	    }
	    return function() {
	      return func.apply(context, arguments);
	    };
	  };
	
	  // A mostly-internal function to generate callbacks that can be applied
	  // to each element in a collection, returning the desired result — either
	  // identity, an arbitrary callback, a property matcher, or a property accessor.
	  var cb = function(value, context, argCount) {
	    if (value == null) return _.identity;
	    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
	    if (_.isObject(value)) return _.matcher(value);
	    return _.property(value);
	  };
	  _.iteratee = function(value, context) {
	    return cb(value, context, Infinity);
	  };
	
	  // An internal function for creating assigner functions.
	  var createAssigner = function(keysFunc, undefinedOnly) {
	    return function(obj) {
	      var length = arguments.length;
	      if (length < 2 || obj == null) return obj;
	      for (var index = 1; index < length; index++) {
	        var source = arguments[index],
	            keys = keysFunc(source),
	            l = keys.length;
	        for (var i = 0; i < l; i++) {
	          var key = keys[i];
	          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
	        }
	      }
	      return obj;
	    };
	  };
	
	  // An internal function for creating a new object that inherits from another.
	  var baseCreate = function(prototype) {
	    if (!_.isObject(prototype)) return {};
	    if (nativeCreate) return nativeCreate(prototype);
	    Ctor.prototype = prototype;
	    var result = new Ctor;
	    Ctor.prototype = null;
	    return result;
	  };
	
	  var property = function(key) {
	    return function(obj) {
	      return obj == null ? void 0 : obj[key];
	    };
	  };
	
	  // Helper for collection methods to determine whether a collection
	  // should be iterated as an array or as an object
	  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
	  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
	  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
	  var getLength = property('length');
	  var isArrayLike = function(collection) {
	    var length = getLength(collection);
	    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
	  };
	
	  // Collection Functions
	  // --------------------
	
	  // The cornerstone, an `each` implementation, aka `forEach`.
	  // Handles raw objects in addition to array-likes. Treats all
	  // sparse array-likes as if they were dense.
	  _.each = _.forEach = function(obj, iteratee, context) {
	    iteratee = optimizeCb(iteratee, context);
	    var i, length;
	    if (isArrayLike(obj)) {
	      for (i = 0, length = obj.length; i < length; i++) {
	        iteratee(obj[i], i, obj);
	      }
	    } else {
	      var keys = _.keys(obj);
	      for (i = 0, length = keys.length; i < length; i++) {
	        iteratee(obj[keys[i]], keys[i], obj);
	      }
	    }
	    return obj;
	  };
	
	  // Return the results of applying the iteratee to each element.
	  _.map = _.collect = function(obj, iteratee, context) {
	    iteratee = cb(iteratee, context);
	    var keys = !isArrayLike(obj) && _.keys(obj),
	        length = (keys || obj).length,
	        results = Array(length);
	    for (var index = 0; index < length; index++) {
	      var currentKey = keys ? keys[index] : index;
	      results[index] = iteratee(obj[currentKey], currentKey, obj);
	    }
	    return results;
	  };
	
	  // Create a reducing function iterating left or right.
	  function createReduce(dir) {
	    // Optimized iterator function as using arguments.length
	    // in the main function will deoptimize the, see #1991.
	    function iterator(obj, iteratee, memo, keys, index, length) {
	      for (; index >= 0 && index < length; index += dir) {
	        var currentKey = keys ? keys[index] : index;
	        memo = iteratee(memo, obj[currentKey], currentKey, obj);
	      }
	      return memo;
	    }
	
	    return function(obj, iteratee, memo, context) {
	      iteratee = optimizeCb(iteratee, context, 4);
	      var keys = !isArrayLike(obj) && _.keys(obj),
	          length = (keys || obj).length,
	          index = dir > 0 ? 0 : length - 1;
	      // Determine the initial value if none is provided.
	      if (arguments.length < 3) {
	        memo = obj[keys ? keys[index] : index];
	        index += dir;
	      }
	      return iterator(obj, iteratee, memo, keys, index, length);
	    };
	  }
	
	  // **Reduce** builds up a single result from a list of values, aka `inject`,
	  // or `foldl`.
	  _.reduce = _.foldl = _.inject = createReduce(1);
	
	  // The right-associative version of reduce, also known as `foldr`.
	  _.reduceRight = _.foldr = createReduce(-1);
	
	  // Return the first value which passes a truth test. Aliased as `detect`.
	  _.find = _.detect = function(obj, predicate, context) {
	    var key;
	    if (isArrayLike(obj)) {
	      key = _.findIndex(obj, predicate, context);
	    } else {
	      key = _.findKey(obj, predicate, context);
	    }
	    if (key !== void 0 && key !== -1) return obj[key];
	  };
	
	  // Return all the elements that pass a truth test.
	  // Aliased as `select`.
	  _.filter = _.select = function(obj, predicate, context) {
	    var results = [];
	    predicate = cb(predicate, context);
	    _.each(obj, function(value, index, list) {
	      if (predicate(value, index, list)) results.push(value);
	    });
	    return results;
	  };
	
	  // Return all the elements for which a truth test fails.
	  _.reject = function(obj, predicate, context) {
	    return _.filter(obj, _.negate(cb(predicate)), context);
	  };
	
	  // Determine whether all of the elements match a truth test.
	  // Aliased as `all`.
	  _.every = _.all = function(obj, predicate, context) {
	    predicate = cb(predicate, context);
	    var keys = !isArrayLike(obj) && _.keys(obj),
	        length = (keys || obj).length;
	    for (var index = 0; index < length; index++) {
	      var currentKey = keys ? keys[index] : index;
	      if (!predicate(obj[currentKey], currentKey, obj)) return false;
	    }
	    return true;
	  };
	
	  // Determine if at least one element in the object matches a truth test.
	  // Aliased as `any`.
	  _.some = _.any = function(obj, predicate, context) {
	    predicate = cb(predicate, context);
	    var keys = !isArrayLike(obj) && _.keys(obj),
	        length = (keys || obj).length;
	    for (var index = 0; index < length; index++) {
	      var currentKey = keys ? keys[index] : index;
	      if (predicate(obj[currentKey], currentKey, obj)) return true;
	    }
	    return false;
	  };
	
	  // Determine if the array or object contains a given item (using `===`).
	  // Aliased as `includes` and `include`.
	  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
	    if (!isArrayLike(obj)) obj = _.values(obj);
	    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
	    return _.indexOf(obj, item, fromIndex) >= 0;
	  };
	
	  // Invoke a method (with arguments) on every item in a collection.
	  _.invoke = function(obj, method) {
	    var args = slice.call(arguments, 2);
	    var isFunc = _.isFunction(method);
	    return _.map(obj, function(value) {
	      var func = isFunc ? method : value[method];
	      return func == null ? func : func.apply(value, args);
	    });
	  };
	
	  // Convenience version of a common use case of `map`: fetching a property.
	  _.pluck = function(obj, key) {
	    return _.map(obj, _.property(key));
	  };
	
	  // Convenience version of a common use case of `filter`: selecting only objects
	  // containing specific `key:value` pairs.
	  _.where = function(obj, attrs) {
	    return _.filter(obj, _.matcher(attrs));
	  };
	
	  // Convenience version of a common use case of `find`: getting the first object
	  // containing specific `key:value` pairs.
	  _.findWhere = function(obj, attrs) {
	    return _.find(obj, _.matcher(attrs));
	  };
	
	  // Return the maximum element (or element-based computation).
	  _.max = function(obj, iteratee, context) {
	    var result = -Infinity, lastComputed = -Infinity,
	        value, computed;
	    if (iteratee == null && obj != null) {
	      obj = isArrayLike(obj) ? obj : _.values(obj);
	      for (var i = 0, length = obj.length; i < length; i++) {
	        value = obj[i];
	        if (value > result) {
	          result = value;
	        }
	      }
	    } else {
	      iteratee = cb(iteratee, context);
	      _.each(obj, function(value, index, list) {
	        computed = iteratee(value, index, list);
	        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
	          result = value;
	          lastComputed = computed;
	        }
	      });
	    }
	    return result;
	  };
	
	  // Return the minimum element (or element-based computation).
	  _.min = function(obj, iteratee, context) {
	    var result = Infinity, lastComputed = Infinity,
	        value, computed;
	    if (iteratee == null && obj != null) {
	      obj = isArrayLike(obj) ? obj : _.values(obj);
	      for (var i = 0, length = obj.length; i < length; i++) {
	        value = obj[i];
	        if (value < result) {
	          result = value;
	        }
	      }
	    } else {
	      iteratee = cb(iteratee, context);
	      _.each(obj, function(value, index, list) {
	        computed = iteratee(value, index, list);
	        if (computed < lastComputed || computed === Infinity && result === Infinity) {
	          result = value;
	          lastComputed = computed;
	        }
	      });
	    }
	    return result;
	  };
	
	  // Shuffle a collection, using the modern version of the
	  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
	  _.shuffle = function(obj) {
	    var set = isArrayLike(obj) ? obj : _.values(obj);
	    var length = set.length;
	    var shuffled = Array(length);
	    for (var index = 0, rand; index < length; index++) {
	      rand = _.random(0, index);
	      if (rand !== index) shuffled[index] = shuffled[rand];
	      shuffled[rand] = set[index];
	    }
	    return shuffled;
	  };
	
	  // Sample **n** random values from a collection.
	  // If **n** is not specified, returns a single random element.
	  // The internal `guard` argument allows it to work with `map`.
	  _.sample = function(obj, n, guard) {
	    if (n == null || guard) {
	      if (!isArrayLike(obj)) obj = _.values(obj);
	      return obj[_.random(obj.length - 1)];
	    }
	    return _.shuffle(obj).slice(0, Math.max(0, n));
	  };
	
	  // Sort the object's values by a criterion produced by an iteratee.
	  _.sortBy = function(obj, iteratee, context) {
	    iteratee = cb(iteratee, context);
	    return _.pluck(_.map(obj, function(value, index, list) {
	      return {
	        value: value,
	        index: index,
	        criteria: iteratee(value, index, list)
	      };
	    }).sort(function(left, right) {
	      var a = left.criteria;
	      var b = right.criteria;
	      if (a !== b) {
	        if (a > b || a === void 0) return 1;
	        if (a < b || b === void 0) return -1;
	      }
	      return left.index - right.index;
	    }), 'value');
	  };
	
	  // An internal function used for aggregate "group by" operations.
	  var group = function(behavior) {
	    return function(obj, iteratee, context) {
	      var result = {};
	      iteratee = cb(iteratee, context);
	      _.each(obj, function(value, index) {
	        var key = iteratee(value, index, obj);
	        behavior(result, value, key);
	      });
	      return result;
	    };
	  };
	
	  // Groups the object's values by a criterion. Pass either a string attribute
	  // to group by, or a function that returns the criterion.
	  _.groupBy = group(function(result, value, key) {
	    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
	  });
	
	  // Indexes the object's values by a criterion, similar to `groupBy`, but for
	  // when you know that your index values will be unique.
	  _.indexBy = group(function(result, value, key) {
	    result[key] = value;
	  });
	
	  // Counts instances of an object that group by a certain criterion. Pass
	  // either a string attribute to count by, or a function that returns the
	  // criterion.
	  _.countBy = group(function(result, value, key) {
	    if (_.has(result, key)) result[key]++; else result[key] = 1;
	  });
	
	  // Safely create a real, live array from anything iterable.
	  _.toArray = function(obj) {
	    if (!obj) return [];
	    if (_.isArray(obj)) return slice.call(obj);
	    if (isArrayLike(obj)) return _.map(obj, _.identity);
	    return _.values(obj);
	  };
	
	  // Return the number of elements in an object.
	  _.size = function(obj) {
	    if (obj == null) return 0;
	    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
	  };
	
	  // Split a collection into two arrays: one whose elements all satisfy the given
	  // predicate, and one whose elements all do not satisfy the predicate.
	  _.partition = function(obj, predicate, context) {
	    predicate = cb(predicate, context);
	    var pass = [], fail = [];
	    _.each(obj, function(value, key, obj) {
	      (predicate(value, key, obj) ? pass : fail).push(value);
	    });
	    return [pass, fail];
	  };
	
	  // Array Functions
	  // ---------------
	
	  // Get the first element of an array. Passing **n** will return the first N
	  // values in the array. Aliased as `head` and `take`. The **guard** check
	  // allows it to work with `_.map`.
	  _.first = _.head = _.take = function(array, n, guard) {
	    if (array == null) return void 0;
	    if (n == null || guard) return array[0];
	    return _.initial(array, array.length - n);
	  };
	
	  // Returns everything but the last entry of the array. Especially useful on
	  // the arguments object. Passing **n** will return all the values in
	  // the array, excluding the last N.
	  _.initial = function(array, n, guard) {
	    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
	  };
	
	  // Get the last element of an array. Passing **n** will return the last N
	  // values in the array.
	  _.last = function(array, n, guard) {
	    if (array == null) return void 0;
	    if (n == null || guard) return array[array.length - 1];
	    return _.rest(array, Math.max(0, array.length - n));
	  };
	
	  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
	  // Especially useful on the arguments object. Passing an **n** will return
	  // the rest N values in the array.
	  _.rest = _.tail = _.drop = function(array, n, guard) {
	    return slice.call(array, n == null || guard ? 1 : n);
	  };
	
	  // Trim out all falsy values from an array.
	  _.compact = function(array) {
	    return _.filter(array, _.identity);
	  };
	
	  // Internal implementation of a recursive `flatten` function.
	  var flatten = function(input, shallow, strict, startIndex) {
	    var output = [], idx = 0;
	    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
	      var value = input[i];
	      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
	        //flatten current level of array or arguments object
	        if (!shallow) value = flatten(value, shallow, strict);
	        var j = 0, len = value.length;
	        output.length += len;
	        while (j < len) {
	          output[idx++] = value[j++];
	        }
	      } else if (!strict) {
	        output[idx++] = value;
	      }
	    }
	    return output;
	  };
	
	  // Flatten out an array, either recursively (by default), or just one level.
	  _.flatten = function(array, shallow) {
	    return flatten(array, shallow, false);
	  };
	
	  // Return a version of the array that does not contain the specified value(s).
	  _.without = function(array) {
	    return _.difference(array, slice.call(arguments, 1));
	  };
	
	  // Produce a duplicate-free version of the array. If the array has already
	  // been sorted, you have the option of using a faster algorithm.
	  // Aliased as `unique`.
	  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
	    if (!_.isBoolean(isSorted)) {
	      context = iteratee;
	      iteratee = isSorted;
	      isSorted = false;
	    }
	    if (iteratee != null) iteratee = cb(iteratee, context);
	    var result = [];
	    var seen = [];
	    for (var i = 0, length = getLength(array); i < length; i++) {
	      var value = array[i],
	          computed = iteratee ? iteratee(value, i, array) : value;
	      if (isSorted) {
	        if (!i || seen !== computed) result.push(value);
	        seen = computed;
	      } else if (iteratee) {
	        if (!_.contains(seen, computed)) {
	          seen.push(computed);
	          result.push(value);
	        }
	      } else if (!_.contains(result, value)) {
	        result.push(value);
	      }
	    }
	    return result;
	  };
	
	  // Produce an array that contains the union: each distinct element from all of
	  // the passed-in arrays.
	  _.union = function() {
	    return _.uniq(flatten(arguments, true, true));
	  };
	
	  // Produce an array that contains every item shared between all the
	  // passed-in arrays.
	  _.intersection = function(array) {
	    var result = [];
	    var argsLength = arguments.length;
	    for (var i = 0, length = getLength(array); i < length; i++) {
	      var item = array[i];
	      if (_.contains(result, item)) continue;
	      for (var j = 1; j < argsLength; j++) {
	        if (!_.contains(arguments[j], item)) break;
	      }
	      if (j === argsLength) result.push(item);
	    }
	    return result;
	  };
	
	  // Take the difference between one array and a number of other arrays.
	  // Only the elements present in just the first array will remain.
	  _.difference = function(array) {
	    var rest = flatten(arguments, true, true, 1);
	    return _.filter(array, function(value){
	      return !_.contains(rest, value);
	    });
	  };
	
	  // Zip together multiple lists into a single array -- elements that share
	  // an index go together.
	  _.zip = function() {
	    return _.unzip(arguments);
	  };
	
	  // Complement of _.zip. Unzip accepts an array of arrays and groups
	  // each array's elements on shared indices
	  _.unzip = function(array) {
	    var length = array && _.max(array, getLength).length || 0;
	    var result = Array(length);
	
	    for (var index = 0; index < length; index++) {
	      result[index] = _.pluck(array, index);
	    }
	    return result;
	  };
	
	  // Converts lists into objects. Pass either a single array of `[key, value]`
	  // pairs, or two parallel arrays of the same length -- one of keys, and one of
	  // the corresponding values.
	  _.object = function(list, values) {
	    var result = {};
	    for (var i = 0, length = getLength(list); i < length; i++) {
	      if (values) {
	        result[list[i]] = values[i];
	      } else {
	        result[list[i][0]] = list[i][1];
	      }
	    }
	    return result;
	  };
	
	  // Generator function to create the findIndex and findLastIndex functions
	  function createPredicateIndexFinder(dir) {
	    return function(array, predicate, context) {
	      predicate = cb(predicate, context);
	      var length = getLength(array);
	      var index = dir > 0 ? 0 : length - 1;
	      for (; index >= 0 && index < length; index += dir) {
	        if (predicate(array[index], index, array)) return index;
	      }
	      return -1;
	    };
	  }
	
	  // Returns the first index on an array-like that passes a predicate test
	  _.findIndex = createPredicateIndexFinder(1);
	  _.findLastIndex = createPredicateIndexFinder(-1);
	
	  // Use a comparator function to figure out the smallest index at which
	  // an object should be inserted so as to maintain order. Uses binary search.
	  _.sortedIndex = function(array, obj, iteratee, context) {
	    iteratee = cb(iteratee, context, 1);
	    var value = iteratee(obj);
	    var low = 0, high = getLength(array);
	    while (low < high) {
	      var mid = Math.floor((low + high) / 2);
	      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
	    }
	    return low;
	  };
	
	  // Generator function to create the indexOf and lastIndexOf functions
	  function createIndexFinder(dir, predicateFind, sortedIndex) {
	    return function(array, item, idx) {
	      var i = 0, length = getLength(array);
	      if (typeof idx == 'number') {
	        if (dir > 0) {
	            i = idx >= 0 ? idx : Math.max(idx + length, i);
	        } else {
	            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
	        }
	      } else if (sortedIndex && idx && length) {
	        idx = sortedIndex(array, item);
	        return array[idx] === item ? idx : -1;
	      }
	      if (item !== item) {
	        idx = predicateFind(slice.call(array, i, length), _.isNaN);
	        return idx >= 0 ? idx + i : -1;
	      }
	      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
	        if (array[idx] === item) return idx;
	      }
	      return -1;
	    };
	  }
	
	  // Return the position of the first occurrence of an item in an array,
	  // or -1 if the item is not included in the array.
	  // If the array is large and already in sort order, pass `true`
	  // for **isSorted** to use binary search.
	  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
	  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);
	
	  // Generate an integer Array containing an arithmetic progression. A port of
	  // the native Python `range()` function. See
	  // [the Python documentation](http://docs.python.org/library/functions.html#range).
	  _.range = function(start, stop, step) {
	    if (stop == null) {
	      stop = start || 0;
	      start = 0;
	    }
	    step = step || 1;
	
	    var length = Math.max(Math.ceil((stop - start) / step), 0);
	    var range = Array(length);
	
	    for (var idx = 0; idx < length; idx++, start += step) {
	      range[idx] = start;
	    }
	
	    return range;
	  };
	
	  // Function (ahem) Functions
	  // ------------------
	
	  // Determines whether to execute a function as a constructor
	  // or a normal function with the provided arguments
	  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
	    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
	    var self = baseCreate(sourceFunc.prototype);
	    var result = sourceFunc.apply(self, args);
	    if (_.isObject(result)) return result;
	    return self;
	  };
	
	  // Create a function bound to a given object (assigning `this`, and arguments,
	  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
	  // available.
	  _.bind = function(func, context) {
	    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
	    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
	    var args = slice.call(arguments, 2);
	    var bound = function() {
	      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
	    };
	    return bound;
	  };
	
	  // Partially apply a function by creating a version that has had some of its
	  // arguments pre-filled, without changing its dynamic `this` context. _ acts
	  // as a placeholder, allowing any combination of arguments to be pre-filled.
	  _.partial = function(func) {
	    var boundArgs = slice.call(arguments, 1);
	    var bound = function() {
	      var position = 0, length = boundArgs.length;
	      var args = Array(length);
	      for (var i = 0; i < length; i++) {
	        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
	      }
	      while (position < arguments.length) args.push(arguments[position++]);
	      return executeBound(func, bound, this, this, args);
	    };
	    return bound;
	  };
	
	  // Bind a number of an object's methods to that object. Remaining arguments
	  // are the method names to be bound. Useful for ensuring that all callbacks
	  // defined on an object belong to it.
	  _.bindAll = function(obj) {
	    var i, length = arguments.length, key;
	    if (length <= 1) throw new Error('bindAll must be passed function names');
	    for (i = 1; i < length; i++) {
	      key = arguments[i];
	      obj[key] = _.bind(obj[key], obj);
	    }
	    return obj;
	  };
	
	  // Memoize an expensive function by storing its results.
	  _.memoize = function(func, hasher) {
	    var memoize = function(key) {
	      var cache = memoize.cache;
	      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
	      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
	      return cache[address];
	    };
	    memoize.cache = {};
	    return memoize;
	  };
	
	  // Delays a function for the given number of milliseconds, and then calls
	  // it with the arguments supplied.
	  _.delay = function(func, wait) {
	    var args = slice.call(arguments, 2);
	    return setTimeout(function(){
	      return func.apply(null, args);
	    }, wait);
	  };
	
	  // Defers a function, scheduling it to run after the current call stack has
	  // cleared.
	  _.defer = _.partial(_.delay, _, 1);
	
	  // Returns a function, that, when invoked, will only be triggered at most once
	  // during a given window of time. Normally, the throttled function will run
	  // as much as it can, without ever going more than once per `wait` duration;
	  // but if you'd like to disable the execution on the leading edge, pass
	  // `{leading: false}`. To disable execution on the trailing edge, ditto.
	  _.throttle = function(func, wait, options) {
	    var context, args, result;
	    var timeout = null;
	    var previous = 0;
	    if (!options) options = {};
	    var later = function() {
	      previous = options.leading === false ? 0 : _.now();
	      timeout = null;
	      result = func.apply(context, args);
	      if (!timeout) context = args = null;
	    };
	    return function() {
	      var now = _.now();
	      if (!previous && options.leading === false) previous = now;
	      var remaining = wait - (now - previous);
	      context = this;
	      args = arguments;
	      if (remaining <= 0 || remaining > wait) {
	        if (timeout) {
	          clearTimeout(timeout);
	          timeout = null;
	        }
	        previous = now;
	        result = func.apply(context, args);
	        if (!timeout) context = args = null;
	      } else if (!timeout && options.trailing !== false) {
	        timeout = setTimeout(later, remaining);
	      }
	      return result;
	    };
	  };
	
	  // Returns a function, that, as long as it continues to be invoked, will not
	  // be triggered. The function will be called after it stops being called for
	  // N milliseconds. If `immediate` is passed, trigger the function on the
	  // leading edge, instead of the trailing.
	  _.debounce = function(func, wait, immediate) {
	    var timeout, args, context, timestamp, result;
	
	    var later = function() {
	      var last = _.now() - timestamp;
	
	      if (last < wait && last >= 0) {
	        timeout = setTimeout(later, wait - last);
	      } else {
	        timeout = null;
	        if (!immediate) {
	          result = func.apply(context, args);
	          if (!timeout) context = args = null;
	        }
	      }
	    };
	
	    return function() {
	      context = this;
	      args = arguments;
	      timestamp = _.now();
	      var callNow = immediate && !timeout;
	      if (!timeout) timeout = setTimeout(later, wait);
	      if (callNow) {
	        result = func.apply(context, args);
	        context = args = null;
	      }
	
	      return result;
	    };
	  };
	
	  // Returns the first function passed as an argument to the second,
	  // allowing you to adjust arguments, run code before and after, and
	  // conditionally execute the original function.
	  _.wrap = function(func, wrapper) {
	    return _.partial(wrapper, func);
	  };
	
	  // Returns a negated version of the passed-in predicate.
	  _.negate = function(predicate) {
	    return function() {
	      return !predicate.apply(this, arguments);
	    };
	  };
	
	  // Returns a function that is the composition of a list of functions, each
	  // consuming the return value of the function that follows.
	  _.compose = function() {
	    var args = arguments;
	    var start = args.length - 1;
	    return function() {
	      var i = start;
	      var result = args[start].apply(this, arguments);
	      while (i--) result = args[i].call(this, result);
	      return result;
	    };
	  };
	
	  // Returns a function that will only be executed on and after the Nth call.
	  _.after = function(times, func) {
	    return function() {
	      if (--times < 1) {
	        return func.apply(this, arguments);
	      }
	    };
	  };
	
	  // Returns a function that will only be executed up to (but not including) the Nth call.
	  _.before = function(times, func) {
	    var memo;
	    return function() {
	      if (--times > 0) {
	        memo = func.apply(this, arguments);
	      }
	      if (times <= 1) func = null;
	      return memo;
	    };
	  };
	
	  // Returns a function that will be executed at most one time, no matter how
	  // often you call it. Useful for lazy initialization.
	  _.once = _.partial(_.before, 2);
	
	  // Object Functions
	  // ----------------
	
	  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
	  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
	  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
	                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];
	
	  function collectNonEnumProps(obj, keys) {
	    var nonEnumIdx = nonEnumerableProps.length;
	    var constructor = obj.constructor;
	    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;
	
	    // Constructor is a special case.
	    var prop = 'constructor';
	    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);
	
	    while (nonEnumIdx--) {
	      prop = nonEnumerableProps[nonEnumIdx];
	      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
	        keys.push(prop);
	      }
	    }
	  }
	
	  // Retrieve the names of an object's own properties.
	  // Delegates to **ECMAScript 5**'s native `Object.keys`
	  _.keys = function(obj) {
	    if (!_.isObject(obj)) return [];
	    if (nativeKeys) return nativeKeys(obj);
	    var keys = [];
	    for (var key in obj) if (_.has(obj, key)) keys.push(key);
	    // Ahem, IE < 9.
	    if (hasEnumBug) collectNonEnumProps(obj, keys);
	    return keys;
	  };
	
	  // Retrieve all the property names of an object.
	  _.allKeys = function(obj) {
	    if (!_.isObject(obj)) return [];
	    var keys = [];
	    for (var key in obj) keys.push(key);
	    // Ahem, IE < 9.
	    if (hasEnumBug) collectNonEnumProps(obj, keys);
	    return keys;
	  };
	
	  // Retrieve the values of an object's properties.
	  _.values = function(obj) {
	    var keys = _.keys(obj);
	    var length = keys.length;
	    var values = Array(length);
	    for (var i = 0; i < length; i++) {
	      values[i] = obj[keys[i]];
	    }
	    return values;
	  };
	
	  // Returns the results of applying the iteratee to each element of the object
	  // In contrast to _.map it returns an object
	  _.mapObject = function(obj, iteratee, context) {
	    iteratee = cb(iteratee, context);
	    var keys =  _.keys(obj),
	          length = keys.length,
	          results = {},
	          currentKey;
	      for (var index = 0; index < length; index++) {
	        currentKey = keys[index];
	        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
	      }
	      return results;
	  };
	
	  // Convert an object into a list of `[key, value]` pairs.
	  _.pairs = function(obj) {
	    var keys = _.keys(obj);
	    var length = keys.length;
	    var pairs = Array(length);
	    for (var i = 0; i < length; i++) {
	      pairs[i] = [keys[i], obj[keys[i]]];
	    }
	    return pairs;
	  };
	
	  // Invert the keys and values of an object. The values must be serializable.
	  _.invert = function(obj) {
	    var result = {};
	    var keys = _.keys(obj);
	    for (var i = 0, length = keys.length; i < length; i++) {
	      result[obj[keys[i]]] = keys[i];
	    }
	    return result;
	  };
	
	  // Return a sorted list of the function names available on the object.
	  // Aliased as `methods`
	  _.functions = _.methods = function(obj) {
	    var names = [];
	    for (var key in obj) {
	      if (_.isFunction(obj[key])) names.push(key);
	    }
	    return names.sort();
	  };
	
	  // Extend a given object with all the properties in passed-in object(s).
	  _.extend = createAssigner(_.allKeys);
	
	  // Assigns a given object with all the own properties in the passed-in object(s)
	  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
	  _.extendOwn = _.assign = createAssigner(_.keys);
	
	  // Returns the first key on an object that passes a predicate test
	  _.findKey = function(obj, predicate, context) {
	    predicate = cb(predicate, context);
	    var keys = _.keys(obj), key;
	    for (var i = 0, length = keys.length; i < length; i++) {
	      key = keys[i];
	      if (predicate(obj[key], key, obj)) return key;
	    }
	  };
	
	  // Return a copy of the object only containing the whitelisted properties.
	  _.pick = function(object, oiteratee, context) {
	    var result = {}, obj = object, iteratee, keys;
	    if (obj == null) return result;
	    if (_.isFunction(oiteratee)) {
	      keys = _.allKeys(obj);
	      iteratee = optimizeCb(oiteratee, context);
	    } else {
	      keys = flatten(arguments, false, false, 1);
	      iteratee = function(value, key, obj) { return key in obj; };
	      obj = Object(obj);
	    }
	    for (var i = 0, length = keys.length; i < length; i++) {
	      var key = keys[i];
	      var value = obj[key];
	      if (iteratee(value, key, obj)) result[key] = value;
	    }
	    return result;
	  };
	
	   // Return a copy of the object without the blacklisted properties.
	  _.omit = function(obj, iteratee, context) {
	    if (_.isFunction(iteratee)) {
	      iteratee = _.negate(iteratee);
	    } else {
	      var keys = _.map(flatten(arguments, false, false, 1), String);
	      iteratee = function(value, key) {
	        return !_.contains(keys, key);
	      };
	    }
	    return _.pick(obj, iteratee, context);
	  };
	
	  // Fill in a given object with default properties.
	  _.defaults = createAssigner(_.allKeys, true);
	
	  // Creates an object that inherits from the given prototype object.
	  // If additional properties are provided then they will be added to the
	  // created object.
	  _.create = function(prototype, props) {
	    var result = baseCreate(prototype);
	    if (props) _.extendOwn(result, props);
	    return result;
	  };
	
	  // Create a (shallow-cloned) duplicate of an object.
	  _.clone = function(obj) {
	    if (!_.isObject(obj)) return obj;
	    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
	  };
	
	  // Invokes interceptor with the obj, and then returns obj.
	  // The primary purpose of this method is to "tap into" a method chain, in
	  // order to perform operations on intermediate results within the chain.
	  _.tap = function(obj, interceptor) {
	    interceptor(obj);
	    return obj;
	  };
	
	  // Returns whether an object has a given set of `key:value` pairs.
	  _.isMatch = function(object, attrs) {
	    var keys = _.keys(attrs), length = keys.length;
	    if (object == null) return !length;
	    var obj = Object(object);
	    for (var i = 0; i < length; i++) {
	      var key = keys[i];
	      if (attrs[key] !== obj[key] || !(key in obj)) return false;
	    }
	    return true;
	  };
	
	
	  // Internal recursive comparison function for `isEqual`.
	  var eq = function(a, b, aStack, bStack) {
	    // Identical objects are equal. `0 === -0`, but they aren't identical.
	    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
	    if (a === b) return a !== 0 || 1 / a === 1 / b;
	    // A strict comparison is necessary because `null == undefined`.
	    if (a == null || b == null) return a === b;
	    // Unwrap any wrapped objects.
	    if (a instanceof _) a = a._wrapped;
	    if (b instanceof _) b = b._wrapped;
	    // Compare `[[Class]]` names.
	    var className = toString.call(a);
	    if (className !== toString.call(b)) return false;
	    switch (className) {
	      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
	      case '[object RegExp]':
	      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
	      case '[object String]':
	        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
	        // equivalent to `new String("5")`.
	        return '' + a === '' + b;
	      case '[object Number]':
	        // `NaN`s are equivalent, but non-reflexive.
	        // Object(NaN) is equivalent to NaN
	        if (+a !== +a) return +b !== +b;
	        // An `egal` comparison is performed for other numeric values.
	        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
	      case '[object Date]':
	      case '[object Boolean]':
	        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
	        // millisecond representations. Note that invalid dates with millisecond representations
	        // of `NaN` are not equivalent.
	        return +a === +b;
	    }
	
	    var areArrays = className === '[object Array]';
	    if (!areArrays) {
	      if (typeof a != 'object' || typeof b != 'object') return false;
	
	      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
	      // from different frames are.
	      var aCtor = a.constructor, bCtor = b.constructor;
	      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
	                               _.isFunction(bCtor) && bCtor instanceof bCtor)
	                          && ('constructor' in a && 'constructor' in b)) {
	        return false;
	      }
	    }
	    // Assume equality for cyclic structures. The algorithm for detecting cyclic
	    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
	
	    // Initializing stack of traversed objects.
	    // It's done here since we only need them for objects and arrays comparison.
	    aStack = aStack || [];
	    bStack = bStack || [];
	    var length = aStack.length;
	    while (length--) {
	      // Linear search. Performance is inversely proportional to the number of
	      // unique nested structures.
	      if (aStack[length] === a) return bStack[length] === b;
	    }
	
	    // Add the first object to the stack of traversed objects.
	    aStack.push(a);
	    bStack.push(b);
	
	    // Recursively compare objects and arrays.
	    if (areArrays) {
	      // Compare array lengths to determine if a deep comparison is necessary.
	      length = a.length;
	      if (length !== b.length) return false;
	      // Deep compare the contents, ignoring non-numeric properties.
	      while (length--) {
	        if (!eq(a[length], b[length], aStack, bStack)) return false;
	      }
	    } else {
	      // Deep compare objects.
	      var keys = _.keys(a), key;
	      length = keys.length;
	      // Ensure that both objects contain the same number of properties before comparing deep equality.
	      if (_.keys(b).length !== length) return false;
	      while (length--) {
	        // Deep compare each member
	        key = keys[length];
	        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
	      }
	    }
	    // Remove the first object from the stack of traversed objects.
	    aStack.pop();
	    bStack.pop();
	    return true;
	  };
	
	  // Perform a deep comparison to check if two objects are equal.
	  _.isEqual = function(a, b) {
	    return eq(a, b);
	  };
	
	  // Is a given array, string, or object empty?
	  // An "empty" object has no enumerable own-properties.
	  _.isEmpty = function(obj) {
	    if (obj == null) return true;
	    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
	    return _.keys(obj).length === 0;
	  };
	
	  // Is a given value a DOM element?
	  _.isElement = function(obj) {
	    return !!(obj && obj.nodeType === 1);
	  };
	
	  // Is a given value an array?
	  // Delegates to ECMA5's native Array.isArray
	  _.isArray = nativeIsArray || function(obj) {
	    return toString.call(obj) === '[object Array]';
	  };
	
	  // Is a given variable an object?
	  _.isObject = function(obj) {
	    var type = typeof obj;
	    return type === 'function' || type === 'object' && !!obj;
	  };
	
	  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
	  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
	    _['is' + name] = function(obj) {
	      return toString.call(obj) === '[object ' + name + ']';
	    };
	  });
	
	  // Define a fallback version of the method in browsers (ahem, IE < 9), where
	  // there isn't any inspectable "Arguments" type.
	  if (!_.isArguments(arguments)) {
	    _.isArguments = function(obj) {
	      return _.has(obj, 'callee');
	    };
	  }
	
	  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
	  // IE 11 (#1621), and in Safari 8 (#1929).
	  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
	    _.isFunction = function(obj) {
	      return typeof obj == 'function' || false;
	    };
	  }
	
	  // Is a given object a finite number?
	  _.isFinite = function(obj) {
	    return isFinite(obj) && !isNaN(parseFloat(obj));
	  };
	
	  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
	  _.isNaN = function(obj) {
	    return _.isNumber(obj) && obj !== +obj;
	  };
	
	  // Is a given value a boolean?
	  _.isBoolean = function(obj) {
	    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
	  };
	
	  // Is a given value equal to null?
	  _.isNull = function(obj) {
	    return obj === null;
	  };
	
	  // Is a given variable undefined?
	  _.isUndefined = function(obj) {
	    return obj === void 0;
	  };
	
	  // Shortcut function for checking if an object has a given property directly
	  // on itself (in other words, not on a prototype).
	  _.has = function(obj, key) {
	    return obj != null && hasOwnProperty.call(obj, key);
	  };
	
	  // Utility Functions
	  // -----------------
	
	  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
	  // previous owner. Returns a reference to the Underscore object.
	  _.noConflict = function() {
	    root._ = previousUnderscore;
	    return this;
	  };
	
	  // Keep the identity function around for default iteratees.
	  _.identity = function(value) {
	    return value;
	  };
	
	  // Predicate-generating functions. Often useful outside of Underscore.
	  _.constant = function(value) {
	    return function() {
	      return value;
	    };
	  };
	
	  _.noop = function(){};
	
	  _.property = property;
	
	  // Generates a function for a given object that returns a given property.
	  _.propertyOf = function(obj) {
	    return obj == null ? function(){} : function(key) {
	      return obj[key];
	    };
	  };
	
	  // Returns a predicate for checking whether an object has a given set of
	  // `key:value` pairs.
	  _.matcher = _.matches = function(attrs) {
	    attrs = _.extendOwn({}, attrs);
	    return function(obj) {
	      return _.isMatch(obj, attrs);
	    };
	  };
	
	  // Run a function **n** times.
	  _.times = function(n, iteratee, context) {
	    var accum = Array(Math.max(0, n));
	    iteratee = optimizeCb(iteratee, context, 1);
	    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
	    return accum;
	  };
	
	  // Return a random integer between min and max (inclusive).
	  _.random = function(min, max) {
	    if (max == null) {
	      max = min;
	      min = 0;
	    }
	    return min + Math.floor(Math.random() * (max - min + 1));
	  };
	
	  // A (possibly faster) way to get the current timestamp as an integer.
	  _.now = Date.now || function() {
	    return new Date().getTime();
	  };
	
	   // List of HTML entities for escaping.
	  var escapeMap = {
	    '&': '&amp;',
	    '<': '&lt;',
	    '>': '&gt;',
	    '"': '&quot;',
	    "'": '&#x27;',
	    '`': '&#x60;'
	  };
	  var unescapeMap = _.invert(escapeMap);
	
	  // Functions for escaping and unescaping strings to/from HTML interpolation.
	  var createEscaper = function(map) {
	    var escaper = function(match) {
	      return map[match];
	    };
	    // Regexes for identifying a key that needs to be escaped
	    var source = '(?:' + _.keys(map).join('|') + ')';
	    var testRegexp = RegExp(source);
	    var replaceRegexp = RegExp(source, 'g');
	    return function(string) {
	      string = string == null ? '' : '' + string;
	      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
	    };
	  };
	  _.escape = createEscaper(escapeMap);
	  _.unescape = createEscaper(unescapeMap);
	
	  // If the value of the named `property` is a function then invoke it with the
	  // `object` as context; otherwise, return it.
	  _.result = function(object, property, fallback) {
	    var value = object == null ? void 0 : object[property];
	    if (value === void 0) {
	      value = fallback;
	    }
	    return _.isFunction(value) ? value.call(object) : value;
	  };
	
	  // Generate a unique integer id (unique within the entire client session).
	  // Useful for temporary DOM ids.
	  var idCounter = 0;
	  _.uniqueId = function(prefix) {
	    var id = ++idCounter + '';
	    return prefix ? prefix + id : id;
	  };
	
	  // By default, Underscore uses ERB-style template delimiters, change the
	  // following template settings to use alternative delimiters.
	  _.templateSettings = {
	    evaluate    : /<%([\s\S]+?)%>/g,
	    interpolate : /<%=([\s\S]+?)%>/g,
	    escape      : /<%-([\s\S]+?)%>/g
	  };
	
	  // When customizing `templateSettings`, if you don't want to define an
	  // interpolation, evaluation or escaping regex, we need one that is
	  // guaranteed not to match.
	  var noMatch = /(.)^/;
	
	  // Certain characters need to be escaped so that they can be put into a
	  // string literal.
	  var escapes = {
	    "'":      "'",
	    '\\':     '\\',
	    '\r':     'r',
	    '\n':     'n',
	    '\u2028': 'u2028',
	    '\u2029': 'u2029'
	  };
	
	  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;
	
	  var escapeChar = function(match) {
	    return '\\' + escapes[match];
	  };
	
	  // JavaScript micro-templating, similar to John Resig's implementation.
	  // Underscore templating handles arbitrary delimiters, preserves whitespace,
	  // and correctly escapes quotes within interpolated code.
	  // NB: `oldSettings` only exists for backwards compatibility.
	  _.template = function(text, settings, oldSettings) {
	    if (!settings && oldSettings) settings = oldSettings;
	    settings = _.defaults({}, settings, _.templateSettings);
	
	    // Combine delimiters into one regular expression via alternation.
	    var matcher = RegExp([
	      (settings.escape || noMatch).source,
	      (settings.interpolate || noMatch).source,
	      (settings.evaluate || noMatch).source
	    ].join('|') + '|$', 'g');
	
	    // Compile the template source, escaping string literals appropriately.
	    var index = 0;
	    var source = "__p+='";
	    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
	      source += text.slice(index, offset).replace(escaper, escapeChar);
	      index = offset + match.length;
	
	      if (escape) {
	        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
	      } else if (interpolate) {
	        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
	      } else if (evaluate) {
	        source += "';\n" + evaluate + "\n__p+='";
	      }
	
	      // Adobe VMs need the match returned to produce the correct offest.
	      return match;
	    });
	    source += "';\n";
	
	    // If a variable is not specified, place data values in local scope.
	    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';
	
	    source = "var __t,__p='',__j=Array.prototype.join," +
	      "print=function(){__p+=__j.call(arguments,'');};\n" +
	      source + 'return __p;\n';
	
	    try {
	      var render = new Function(settings.variable || 'obj', '_', source);
	    } catch (e) {
	      e.source = source;
	      throw e;
	    }
	
	    var template = function(data) {
	      return render.call(this, data, _);
	    };
	
	    // Provide the compiled source as a convenience for precompilation.
	    var argument = settings.variable || 'obj';
	    template.source = 'function(' + argument + '){\n' + source + '}';
	
	    return template;
	  };
	
	  // Add a "chain" function. Start chaining a wrapped Underscore object.
	  _.chain = function(obj) {
	    var instance = _(obj);
	    instance._chain = true;
	    return instance;
	  };
	
	  // OOP
	  // ---------------
	  // If Underscore is called as a function, it returns a wrapped object that
	  // can be used OO-style. This wrapper holds altered versions of all the
	  // underscore functions. Wrapped objects may be chained.
	
	  // Helper function to continue chaining intermediate results.
	  var result = function(instance, obj) {
	    return instance._chain ? _(obj).chain() : obj;
	  };
	
	  // Add your own custom functions to the Underscore object.
	  _.mixin = function(obj) {
	    _.each(_.functions(obj), function(name) {
	      var func = _[name] = obj[name];
	      _.prototype[name] = function() {
	        var args = [this._wrapped];
	        push.apply(args, arguments);
	        return result(this, func.apply(_, args));
	      };
	    });
	  };
	
	  // Add all of the Underscore functions to the wrapper object.
	  _.mixin(_);
	
	  // Add all mutator Array functions to the wrapper.
	  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
	    var method = ArrayProto[name];
	    _.prototype[name] = function() {
	      var obj = this._wrapped;
	      method.apply(obj, arguments);
	      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
	      return result(this, obj);
	    };
	  });
	
	  // Add all accessor Array functions to the wrapper.
	  _.each(['concat', 'join', 'slice'], function(name) {
	    var method = ArrayProto[name];
	    _.prototype[name] = function() {
	      return result(this, method.apply(this._wrapped, arguments));
	    };
	  });
	
	  // Extracts the result from a wrapped and chained object.
	  _.prototype.value = function() {
	    return this._wrapped;
	  };
	
	  // Provide unwrapping proxy for some methods used in engine operations
	  // such as arithmetic and JSON stringification.
	  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;
	
	  _.prototype.toString = function() {
	    return '' + this._wrapped;
	  };
	
	  // AMD registration happens at the end for compatibility with AMD loaders
	  // that may not enforce next-turn semantics on modules. Even though general
	  // practice for AMD registration is to be anonymous, underscore registers
	  // as a named module because, like jQuery, it is a base library that is
	  // popular enough to be bundled in a third party lib, but not be part of
	  // an AMD load request. Those cases could generate an error when an
	  // anonymous define() is called outside of a loader request.
	  if (true) {
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {
	      return _;
	    }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  }
	}.call(this));


/***/ },

/***/ 525:
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	
	var _underscore = __webpack_require__(516);
	
	var _underscore2 = _interopRequireDefault(_underscore);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var defaultConfig = {
	    logUntrackedStrings: false,
	    logUntrackedPropertyNames: false,
	    validateHtmlMapping: false,
	    logTracingSteps: false,
	    // show value field below code, normally hidden for original page HTML
	    alwaysShowValue: false,
	    // Catch errors to avoid making app crash completely, but annoying for debugging
	    catchUIErrors: true,
	    logReceivedInspectorMessages: false,
	    // useful for debugging, especially E2E tests in CI environement
	    logBGPageLogsOnInspectedPage: false
	};
	
	var customConfig;
	if (true) {
	    customConfig = {};
	} else {
	    customConfig = {
	        alwaysShowValue: true,
	        catchUIErrors: false,
	        validateHtmlMapping: false,
	        logTracingSteps: false,
	        logReceivedInspectorMessages: true,
	        logBGPageLogsOnInspectedPage: true
	    };
	}
	
	var config = _underscore2.default.extend(defaultConfig, customConfig);
	
	exports.default = config;

/***/ },

/***/ 541:
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	var _underscore = __webpack_require__(516);
	
	var _underscore2 = _interopRequireDefault(_underscore);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var endsWith = __webpack_require__(542);
	var StackTraceGPS = __webpack_require__(543);
	var ErrorStackParser = __webpack_require__(546);
	class FrameResolver {
	    constructor(ajax) {
	        this._gps = new StackTraceGPS({ ajax: ajax });;
	        this._resolvedFrameCache = {};
	        this._frameStringsCurrentlyBeingResolved = {};
	    }
	    _addCodeToFrame(frameObject, callback) {
	        this._gps._get(frameObject.fileName).then(function (src) {
	            var lines = src.split("\n");
	            var zeroIndexedLineNumber = frameObject.lineNumber - 1;
	            frameObject = _extends({}, frameObject);
	            frameObject.prevLines = lines.slice(0, zeroIndexedLineNumber);
	            frameObject.line = lines[zeroIndexedLineNumber];
	            frameObject.nextLines = lines.slice(zeroIndexedLineNumber + 1);
	
	            if (frameObject.line === undefined) {
	                debugger;
	            }
	
	            callback(null, frameObject);
	        });
	    }
	    resolve(frameString, callback) {
	        // console.time("Resolve Frame " + frameString)
	        var self = this;
	        if (this._resolvedFrameCache[frameString]) {
	            done([null, this._resolvedFrameCache[frameString]]);
	            return;
	        }
	
	        var isCanceled = false;
	
	        var frameObject = ErrorStackParser.parse({ stack: frameString })[0];
	
	        if (endsWith(frameObject.fileName, ".html")) {
	            // don't bother looking for source map file
	            frameObject.fileName += ".dontprocess";
	            this._addCodeToFrame(frameObject, callback);
	        } else {
	            // Use promises so we can re-use them, so if the same frame is requested again
	            // before the first one succeeded we don't attempt to resolve again
	            if (self._frameStringsCurrentlyBeingResolved[frameString]) {
	                self._frameStringsCurrentlyBeingResolved[frameString].then(done);
	            } else {
	                self._frameStringsCurrentlyBeingResolved[frameString] = new Promise(function (resolve, reject) {
	                    self._gps.pinpoint(frameObject).then(function (newFrame) {
	                        self._addCodeToFrame(newFrame, function (err, frame) {
	                            resolve([err, frame]);
	                        });
	                    }, function () {
	                        self._addCodeToFrame(frameObject, function (err, frame) {
	                            resolve([err, frame]);
	                        });
	                        console.log("error", arguments);
	                    });
	                });
	
	                self._frameStringsCurrentlyBeingResolved[frameString].then(done);
	            }
	        }
	
	        function done(args) {
	            var [err, frame] = args;
	            // console.timeEnd("Resolve Frame " + frameString)
	            delete self._frameStringsCurrentlyBeingResolved[frameString];
	
	            self._resolvedFrameCache[frameString] = frame;
	            if (!isCanceled) {
	                callback(err, frame);
	            }
	        }
	
	        return function cancel() {
	            isCanceled = true;
	        };
	    }
	    addFilesToCache(files) {
	        this._gps.sourceCache = _underscore2.default.extend(this._gps.sourceCache, files);
	    }
	    getSourceFileContent(filePath, callback) {
	        this._gps._get(filePath).then(function (src) {
	            callback(src);
	        });
	    }
	}
	exports.default = FrameResolver;

/***/ },

/***/ 542:
/***/ function(module, exports) {

	/*!
	 * ends-with <https://github.com/jonschlinkert/ends-with>
	 *
	 * Copyright (c) 2014 Jon Schlinkert, contributors.
	 * Licensed under the MIT license.
	 */
	
	'use strict';
	
	module.exports = function (a, b) {
	  if (Array.isArray(a)) {
	    return a[a.length - 1] === b;
	  }
	
	  a = String(a);
	  b = String(b);
	
	  var i = b.length;
	  var len = a.length - i;
	
	  while (i--) {
	    if (b.charAt(i) !== a.charAt(len + i)) {
	      return false;
	    }
	  }
	  return true;
	};

/***/ },

/***/ 543:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';
	
	/*
	    originally stored this file in repo because I had some issues loading the
	    correctly versioned files of the different stacktrace.js libraries
	
	    Now I also added a patch to cache the map consumer object.
	    See here: https://github.com/stacktracejs/stacktrace-gps/issues/41
	*/
	
	(function (root, factory) {
	    'use strict';
	    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.
	
	    /* istanbul ignore next */
	
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(544), __webpack_require__(545)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('source-map/lib/source-map-consumer'), require('./stackframe'));
	    } else {
	        root.StackTraceGPS = factory(root.SourceMap || root.sourceMap, root.StackFrame);
	    }
	})(undefined, function (SourceMap, StackFrame) {
	    'use strict';
	
	    /**
	     * Make a X-Domain request to url and callback.
	     *
	     * @param {String} url
	     * @returns {Promise} with response text if fulfilled
	     */
	
	    function _xdr(url) {
	        return new Promise(function (resolve, reject) {
	            var req = new XMLHttpRequest();
	            req.open('get', url);
	            req.onerror = reject;
	            req.onreadystatechange = function onreadystatechange() {
	                if (req.readyState === 4) {
	                    if (req.status >= 200 && req.status < 300) {
	                        resolve(req.responseText);
	                    } else {
	                        reject(new Error('HTTP status: ' + req.status + ' retrieving ' + url));
	                    }
	                }
	            };
	            req.send();
	        });
	    }
	
	    /**
	     * Convert a Base64-encoded string into its original representation.
	     * Used for inline sourcemaps.
	     *
	     * @param {String} b64str Base-64 encoded string
	     * @returns {String} original representation of the base64-encoded string.
	     */
	    function _atob(b64str) {
	        if (typeof window !== 'undefined' && window.atob) {
	            return window.atob(b64str);
	        } else {
	            throw new Error('You must supply a polyfill for window.atob in this environment');
	        }
	    }
	
	    function _parseJson(string) {
	        if (typeof JSON !== 'undefined' && JSON.parse) {
	            return JSON.parse(string);
	        } else {
	            throw new Error('You must supply a polyfill for JSON.parse in this environment');
	        }
	    }
	
	    function _findFunctionName(source, lineNumber /*, columnNumber*/) {
	        // function {name}({args}) m[1]=name m[2]=args
	        var reFunctionDeclaration = /function\s+([^(]*?)\s*\(([^)]*)\)/;
	        // {name} = function ({args}) TODO args capture
	        var reFunctionExpression = /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*function\b/;
	        // {name} = eval()
	        var reFunctionEvaluation = /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*(?:eval|new Function)\b/;
	        var lines = source.split('\n');
	
	        // Walk backwards in the source lines until we find the line which matches one of the patterns above
	        var code = '';
	        var maxLines = Math.min(lineNumber, 20);
	        var m;
	        for (var i = 0; i < maxLines; ++i) {
	            // lineNo is 1-based, source[] is 0-based
	            var line = lines[lineNumber - i - 1];
	            var commentPos = line.indexOf('//');
	            if (commentPos >= 0) {
	                line = line.substr(0, commentPos);
	            }
	
	            if (line) {
	                code = line + code;
	                m = reFunctionExpression.exec(code);
	                if (m && m[1]) {
	                    return m[1];
	                }
	                m = reFunctionDeclaration.exec(code);
	                if (m && m[1]) {
	                    return m[1];
	                }
	                m = reFunctionEvaluation.exec(code);
	                if (m && m[1]) {
	                    return m[1];
	                }
	            }
	        }
	        return undefined;
	    }
	
	    function _ensureSupportedEnvironment() {
	        if (typeof Object.defineProperty !== 'function' || typeof Object.create !== 'function') {
	            throw new Error('Unable to consume source maps in older browsers');
	        }
	    }
	
	    function _ensureStackFrameIsLegit(stackframe) {
	        if (typeof stackframe !== 'object') {
	            throw new TypeError('Given StackFrame is not an object');
	        } else if (typeof stackframe.fileName !== 'string') {
	            throw new TypeError('Given file name is not a String');
	        } else if (typeof stackframe.lineNumber !== 'number' || stackframe.lineNumber % 1 !== 0 || stackframe.lineNumber < 1) {
	            throw new TypeError('Given line number must be a positive integer');
	        } else if (typeof stackframe.columnNumber !== 'number' || stackframe.columnNumber % 1 !== 0 || stackframe.columnNumber < 0) {
	            throw new TypeError('Given column number must be a non-negative integer');
	        }
	        return true;
	    }
	
	    function _findSourceMappingURL(source) {
	        var m = /\/\/[#@] ?sourceMappingURL=([^\s'"]+)\s*$/.exec(source);
	        if (m && m[1]) {
	            return m[1];
	        } else {
	            console.warn("not found for", source);
	            throw new Error('sourceMappingURL not found');
	        }
	    }
	
	    var consumers = new Map();
	    function getMapConsumer(rawSourceMap) {
	        var consumer = consumers.get(rawSourceMap);
	        if (!consumer) {
	            consumer = new SourceMap.SourceMapConsumer(rawSourceMap);
	            consumers.set(rawSourceMap, consumer);
	        }
	        return consumer;
	    }
	
	    function _extractLocationInfoFromSourceMap(stackframe, rawSourceMap, sourceCache) {
	        return new Promise(function (resolve, reject) {
	            var mapConsumer = getMapConsumer(rawSourceMap);
	
	            var loc = mapConsumer.originalPositionFor({
	                line: stackframe.lineNumber,
	                column: stackframe.columnNumber
	            });
	
	            if (loc.source) {
	                var mappedSource = mapConsumer.sourceContentFor(loc.source);
	                if (mappedSource) {
	                    sourceCache[loc.source] = mappedSource;
	                }
	
	                var newStackFrame = new StackFrame(loc.name || stackframe.functionName, stackframe.args, loc.source, loc.line, loc.column);
	                // console.log("new stackframe", newStackFrame)
	                resolve(newStackFrame);
	            } else {
	                reject(new Error('Could not get original source for given stackframe and source map'));
	            }
	        });
	    }
	
	    /**
	     * @constructor
	     * @param {Object} opts
	     *      opts.sourceCache = {url: "Source String"} => preload source cache
	     *      opts.offline = True to prevent network requests.
	     *              Best effort without sources or source maps.
	     *      opts.ajax = Promise returning function to make X-Domain requests
	     */
	    return function StackTraceGPS(opts) {
	        if (!(this instanceof StackTraceGPS)) {
	            return new StackTraceGPS(opts);
	        }
	        opts = opts || {};
	
	        this.sourceCache = opts.sourceCache || {};
	
	        this.ajax = opts.ajax || _xdr;
	
	        this._atob = opts.atob || _atob;
	
	        this._get = function _get(location) {
	            return new Promise(function (resolve, reject) {
	                var isDataUrl = location.substr(0, 5) === 'data:';
	                if (this.sourceCache[location]) {
	                    resolve(this.sourceCache[location]);
	                } else if (opts.offline && !isDataUrl) {
	                    reject(new Error('Cannot make network requests in offline mode'));
	                } else {
	                    if (isDataUrl) {
	                        // data URLs can have parameters.
	                        // see http://tools.ietf.org/html/rfc2397
	                        var supportedEncodingRegexp = /^data:application\/json;([\w=:"-]+;)*base64,/;
	                        var match = location.match(supportedEncodingRegexp);
	                        if (match) {
	                            var sourceMapStart = match[0].length;
	                            var encodedSource = location.substr(sourceMapStart);
	                            var source = this._atob(encodedSource);
	                            this.sourceCache[location] = source;
	                            resolve(source);
	                        } else {
	                            reject(new Error('The encoding of the inline sourcemap is not supported'));
	                        }
	                    } else {
	                        var xhrPromise = this.ajax(location, { method: 'get' });
	                        // Cache the Promise to prevent duplicate in-flight requests
	                        this.sourceCache[location] = xhrPromise;
	                        xhrPromise.then(resolve, reject);
	                    }
	                }
	            }.bind(this));
	        };
	
	        /**
	         * Given a StackFrame, enhance function name and use source maps for a
	         * better StackFrame.
	         *
	         * @param {StackFrame} stackframe object
	         * @returns {Promise} that resolves with with source-mapped StackFrame
	         */
	        this.pinpoint = function StackTraceGPS$$pinpoint(stackframe) {
	            return new Promise(function (resolve, reject) {
	                this.getMappedLocation(stackframe).then(function (mappedStackFrame) {
	                    function resolveMappedStackFrame() {
	                        resolve(mappedStackFrame);
	                    }
	
	                    this.findFunctionName(mappedStackFrame).then(resolve, resolveMappedStackFrame)['catch'](resolveMappedStackFrame);
	                }.bind(this), reject);
	            }.bind(this));
	        };
	
	        /**
	         * Given a StackFrame, guess function name from location information.
	         *
	         * @param {StackFrame} stackframe
	         * @returns {Promise} that resolves with enhanced StackFrame.
	         */
	        this.findFunctionName = function StackTraceGPS$$findFunctionName(stackframe) {
	            return new Promise(function (resolve, reject) {
	                _ensureStackFrameIsLegit(stackframe);
	                this._get(stackframe.fileName).then(function getSourceCallback(source) {
	                    var lineNumber = stackframe.lineNumber;
	                    var columnNumber = stackframe.columnNumber;
	                    var guessedFunctionName = _findFunctionName(source, lineNumber, columnNumber);
	                    // Only replace functionName if we found something
	                    if (guessedFunctionName) {
	
	                        var newStackFrame = new StackFrame(guessedFunctionName, stackframe.args, stackframe.fileName, lineNumber, columnNumber);
	                        resolve(newStackFrame);
	                    } else {
	                        resolve(stackframe);
	                    }
	                }, reject)['catch'](reject);
	            }.bind(this));
	        };
	
	        /**
	         * Given a StackFrame, seek source-mapped location and return new enhanced StackFrame.
	         *
	         * @param {StackFrame} stackframe
	         * @returns {Promise} that resolves with enhanced StackFrame.
	         */
	        this.getMappedLocation = function StackTraceGPS$$getMappedLocation(stackframe) {
	            return new Promise(function (resolve, reject) {
	                _ensureSupportedEnvironment();
	                _ensureStackFrameIsLegit(stackframe);
	
	                var sourceCache = this.sourceCache;
	                var fileName = stackframe.fileName;
	                this._get(fileName).then(function (source) {
	                    var sourceMappingURL = _findSourceMappingURL(source);
	                    var isDataUrl = sourceMappingURL.substr(0, 5) === 'data:';
	                    var base = fileName.substring(0, fileName.lastIndexOf('/') + 1);
	
	                    if (sourceMappingURL[0] !== '/' && !isDataUrl && !/^https?:\/\/|^\/\//i.test(sourceMappingURL)) {
	                        sourceMappingURL = base + sourceMappingURL;
	                    }
	
	                    this._get(sourceMappingURL).then(function (sourceMap) {
	                        if (typeof sourceMap === 'string') {
	                            sourceMap = _parseJson(sourceMap.replace(/^\)\]\}'/, ''));
	
	                            // map needs source map used in .get to be identical
	                            this.sourceCache[sourceMappingURL] = sourceMap;
	                        }
	                        if (typeof sourceMap.sourceRoot === 'undefined') {
	                            sourceMap.sourceRoot = base;
	                        }
	
	                        _extractLocationInfoFromSourceMap(stackframe, sourceMap, sourceCache).then(function () {
	
	                            resolve.apply(this, arguments);
	                        })['catch'](function () {
	                            resolve(stackframe);
	                        });
	                    }.bind(this), reject)['catch'](reject);
	                }.bind(this), reject)['catch'](reject);
	            }.bind(this));
	        };
	    };
	});

/***/ },

/***/ 544:
/***/ function(module, exports, __webpack_require__) {

	'use strict';(function webpackUniversalModuleDefinition(root,factory){if(true)module.exports=factory();else if(typeof define==='function'&&define.amd)define([],factory);else if(typeof exports==='object')exports["sourceMap"]=factory();else root["sourceMap"]=factory();})(undefined,function(){return(/******/function(modules){// webpackBootstrap
	/******/// The module cache
	/******/var installedModules={};/******/// The require function
	/******/function __webpack_require__(moduleId){/******/// Check if module is in cache
	/******/if(installedModules[moduleId])/******/return installedModules[moduleId].exports;/******/// Create a new module (and put it into the cache)
	/******/var module=installedModules[moduleId]={/******/exports:{},/******/id:moduleId,/******/loaded:false/******/};/******/// Execute the module function
	/******/modules[moduleId].call(module.exports,module,module.exports,__webpack_require__);/******/// Flag the module as loaded
	/******/module.loaded=true;/******/// Return the exports of the module
	/******/return module.exports;/******/}/******/// expose the modules object (__webpack_modules__)
	/******/__webpack_require__.m=modules;/******/// expose the module cache
	/******/__webpack_require__.c=installedModules;/******/// __webpack_public_path__
	/******/__webpack_require__.p="";/******/// Load entry module and return exports
	/******/return __webpack_require__(0);/******/}(/************************************************************************//******/[/* 0 *//***/function(module,exports,__webpack_require__){/*
		 * Copyright 2009-2011 Mozilla Foundation and contributors
		 * Licensed under the New BSD license. See LICENSE.txt or:
		 * http://opensource.org/licenses/BSD-3-Clause
		 */exports.SourceMapGenerator=__webpack_require__(1).SourceMapGenerator;exports.SourceMapConsumer=__webpack_require__(7).SourceMapConsumer;exports.SourceNode=__webpack_require__(10).SourceNode;/***/},/* 1 *//***/function(module,exports,__webpack_require__){/* -*- Mode: js; js-indent-level: 2; -*- *//*
		 * Copyright 2011 Mozilla Foundation and contributors
		 * Licensed under the New BSD license. See LICENSE or:
		 * http://opensource.org/licenses/BSD-3-Clause
		 */var base64VLQ=__webpack_require__(2);var util=__webpack_require__(4);var ArraySet=__webpack_require__(5).ArraySet;var MappingList=__webpack_require__(6).MappingList;/**
		 * An instance of the SourceMapGenerator represents a source map which is
		 * being built incrementally. You may pass an object with the following
		 * properties:
		 *
		 *   - file: The filename of the generated source.
		 *   - sourceRoot: A root for all relative URLs in this source map.
		 */function SourceMapGenerator(aArgs){if(!aArgs){aArgs={};}this._file=util.getArg(aArgs,'file',null);this._sourceRoot=util.getArg(aArgs,'sourceRoot',null);this._skipValidation=util.getArg(aArgs,'skipValidation',false);this._sources=new ArraySet();this._names=new ArraySet();this._mappings=new MappingList();this._sourcesContents=null;}SourceMapGenerator.prototype._version=3;/**
		 * Creates a new SourceMapGenerator based on a SourceMapConsumer
		 *
		 * @param aSourceMapConsumer The SourceMap.
		 */SourceMapGenerator.fromSourceMap=function SourceMapGenerator_fromSourceMap(aSourceMapConsumer){var sourceRoot=aSourceMapConsumer.sourceRoot;var generator=new SourceMapGenerator({file:aSourceMapConsumer.file,sourceRoot:sourceRoot});aSourceMapConsumer.eachMapping(function(mapping){var newMapping={generated:{line:mapping.generatedLine,column:mapping.generatedColumn}};if(mapping.source!=null){newMapping.source=mapping.source;if(sourceRoot!=null){newMapping.source=util.relative(sourceRoot,newMapping.source);}newMapping.original={line:mapping.originalLine,column:mapping.originalColumn};if(mapping.name!=null){newMapping.name=mapping.name;}}generator.addMapping(newMapping);});aSourceMapConsumer.sources.forEach(function(sourceFile){var content=aSourceMapConsumer.sourceContentFor(sourceFile);if(content!=null){generator.setSourceContent(sourceFile,content);}});return generator;};/**
		 * Add a single mapping from original source line and column to the generated
		 * source's line and column for this source map being created. The mapping
		 * object should have the following properties:
		 *
		 *   - generated: An object with the generated line and column positions.
		 *   - original: An object with the original line and column positions.
		 *   - source: The original source file (relative to the sourceRoot).
		 *   - name: An optional original token name for this mapping.
		 */SourceMapGenerator.prototype.addMapping=function SourceMapGenerator_addMapping(aArgs){var generated=util.getArg(aArgs,'generated');var original=util.getArg(aArgs,'original',null);var source=util.getArg(aArgs,'source',null);var name=util.getArg(aArgs,'name',null);if(!this._skipValidation){this._validateMapping(generated,original,source,name);}if(source!=null){source=String(source);if(!this._sources.has(source)){this._sources.add(source);}}if(name!=null){name=String(name);if(!this._names.has(name)){this._names.add(name);}}this._mappings.add({generatedLine:generated.line,generatedColumn:generated.column,originalLine:original!=null&&original.line,originalColumn:original!=null&&original.column,source:source,name:name});};/**
		 * Set the source content for a source file.
		 */SourceMapGenerator.prototype.setSourceContent=function SourceMapGenerator_setSourceContent(aSourceFile,aSourceContent){var source=aSourceFile;if(this._sourceRoot!=null){source=util.relative(this._sourceRoot,source);}if(aSourceContent!=null){// Add the source content to the _sourcesContents map.
	// Create a new _sourcesContents map if the property is null.
	if(!this._sourcesContents){this._sourcesContents=Object.create(null);}this._sourcesContents[util.toSetString(source)]=aSourceContent;}else if(this._sourcesContents){// Remove the source file from the _sourcesContents map.
	// If the _sourcesContents map is empty, set the property to null.
	delete this._sourcesContents[util.toSetString(source)];if(Object.keys(this._sourcesContents).length===0){this._sourcesContents=null;}}};/**
		 * Applies the mappings of a sub-source-map for a specific source file to the
		 * source map being generated. Each mapping to the supplied source file is
		 * rewritten using the supplied source map. Note: The resolution for the
		 * resulting mappings is the minimium of this map and the supplied map.
		 *
		 * @param aSourceMapConsumer The source map to be applied.
		 * @param aSourceFile Optional. The filename of the source file.
		 *        If omitted, SourceMapConsumer's file property will be used.
		 * @param aSourceMapPath Optional. The dirname of the path to the source map
		 *        to be applied. If relative, it is relative to the SourceMapConsumer.
		 *        This parameter is needed when the two source maps aren't in the same
		 *        directory, and the source map to be applied contains relative source
		 *        paths. If so, those relative source paths need to be rewritten
		 *        relative to the SourceMapGenerator.
		 */SourceMapGenerator.prototype.applySourceMap=function SourceMapGenerator_applySourceMap(aSourceMapConsumer,aSourceFile,aSourceMapPath){var sourceFile=aSourceFile;// If aSourceFile is omitted, we will use the file property of the SourceMap
	if(aSourceFile==null){if(aSourceMapConsumer.file==null){throw new Error('SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, '+'or the source map\'s "file" property. Both were omitted.');}sourceFile=aSourceMapConsumer.file;}var sourceRoot=this._sourceRoot;// Make "sourceFile" relative if an absolute Url is passed.
	if(sourceRoot!=null){sourceFile=util.relative(sourceRoot,sourceFile);}// Applying the SourceMap can add and remove items from the sources and
	// the names array.
	var newSources=new ArraySet();var newNames=new ArraySet();// Find mappings for the "sourceFile"
	this._mappings.unsortedForEach(function(mapping){if(mapping.source===sourceFile&&mapping.originalLine!=null){// Check if it can be mapped by the source map, then update the mapping.
	var original=aSourceMapConsumer.originalPositionFor({line:mapping.originalLine,column:mapping.originalColumn});if(original.source!=null){// Copy mapping
	mapping.source=original.source;if(aSourceMapPath!=null){mapping.source=util.join(aSourceMapPath,mapping.source);}if(sourceRoot!=null){mapping.source=util.relative(sourceRoot,mapping.source);}mapping.originalLine=original.line;mapping.originalColumn=original.column;if(original.name!=null){mapping.name=original.name;}}}var source=mapping.source;if(source!=null&&!newSources.has(source)){newSources.add(source);}var name=mapping.name;if(name!=null&&!newNames.has(name)){newNames.add(name);}},this);this._sources=newSources;this._names=newNames;// Copy sourcesContents of applied map.
	aSourceMapConsumer.sources.forEach(function(sourceFile){var content=aSourceMapConsumer.sourceContentFor(sourceFile);if(content!=null){if(aSourceMapPath!=null){sourceFile=util.join(aSourceMapPath,sourceFile);}if(sourceRoot!=null){sourceFile=util.relative(sourceRoot,sourceFile);}this.setSourceContent(sourceFile,content);}},this);};/**
		 * A mapping can have one of the three levels of data:
		 *
		 *   1. Just the generated position.
		 *   2. The Generated position, original position, and original source.
		 *   3. Generated and original position, original source, as well as a name
		 *      token.
		 *
		 * To maintain consistency, we validate that any new mapping being added falls
		 * in to one of these categories.
		 */SourceMapGenerator.prototype._validateMapping=function SourceMapGenerator_validateMapping(aGenerated,aOriginal,aSource,aName){if(aGenerated&&'line'in aGenerated&&'column'in aGenerated&&aGenerated.line>0&&aGenerated.column>=0&&!aOriginal&&!aSource&&!aName){// Case 1.
	return;}else if(aGenerated&&'line'in aGenerated&&'column'in aGenerated&&aOriginal&&'line'in aOriginal&&'column'in aOriginal&&aGenerated.line>0&&aGenerated.column>=0&&aOriginal.line>0&&aOriginal.column>=0&&aSource){// Cases 2 and 3.
	return;}else{throw new Error('Invalid mapping: '+JSON.stringify({generated:aGenerated,source:aSource,original:aOriginal,name:aName}));}};/**
		 * Serialize the accumulated mappings in to the stream of base 64 VLQs
		 * specified by the source map format.
		 */SourceMapGenerator.prototype._serializeMappings=function SourceMapGenerator_serializeMappings(){var previousGeneratedColumn=0;var previousGeneratedLine=1;var previousOriginalColumn=0;var previousOriginalLine=0;var previousName=0;var previousSource=0;var result='';var next;var mapping;var nameIdx;var sourceIdx;var mappings=this._mappings.toArray();for(var i=0,len=mappings.length;i<len;i++){mapping=mappings[i];next='';if(mapping.generatedLine!==previousGeneratedLine){previousGeneratedColumn=0;while(mapping.generatedLine!==previousGeneratedLine){next+=';';previousGeneratedLine++;}}else{if(i>0){if(!util.compareByGeneratedPositionsInflated(mapping,mappings[i-1])){continue;}next+=',';}}next+=base64VLQ.encode(mapping.generatedColumn-previousGeneratedColumn);previousGeneratedColumn=mapping.generatedColumn;if(mapping.source!=null){sourceIdx=this._sources.indexOf(mapping.source);next+=base64VLQ.encode(sourceIdx-previousSource);previousSource=sourceIdx;// lines are stored 0-based in SourceMap spec version 3
	next+=base64VLQ.encode(mapping.originalLine-1-previousOriginalLine);previousOriginalLine=mapping.originalLine-1;next+=base64VLQ.encode(mapping.originalColumn-previousOriginalColumn);previousOriginalColumn=mapping.originalColumn;if(mapping.name!=null){nameIdx=this._names.indexOf(mapping.name);next+=base64VLQ.encode(nameIdx-previousName);previousName=nameIdx;}}result+=next;}return result;};SourceMapGenerator.prototype._generateSourcesContent=function SourceMapGenerator_generateSourcesContent(aSources,aSourceRoot){return aSources.map(function(source){if(!this._sourcesContents){return null;}if(aSourceRoot!=null){source=util.relative(aSourceRoot,source);}var key=util.toSetString(source);return Object.prototype.hasOwnProperty.call(this._sourcesContents,key)?this._sourcesContents[key]:null;},this);};/**
		 * Externalize the source map.
		 */SourceMapGenerator.prototype.toJSON=function SourceMapGenerator_toJSON(){var map={version:this._version,sources:this._sources.toArray(),names:this._names.toArray(),mappings:this._serializeMappings()};if(this._file!=null){map.file=this._file;}if(this._sourceRoot!=null){map.sourceRoot=this._sourceRoot;}if(this._sourcesContents){map.sourcesContent=this._generateSourcesContent(map.sources,map.sourceRoot);}return map;};/**
		 * Render the source map being generated to a string.
		 */SourceMapGenerator.prototype.toString=function SourceMapGenerator_toString(){return JSON.stringify(this.toJSON());};exports.SourceMapGenerator=SourceMapGenerator;/***/},/* 2 *//***/function(module,exports,__webpack_require__){/* -*- Mode: js; js-indent-level: 2; -*- *//*
		 * Copyright 2011 Mozilla Foundation and contributors
		 * Licensed under the New BSD license. See LICENSE or:
		 * http://opensource.org/licenses/BSD-3-Clause
		 *
		 * Based on the Base 64 VLQ implementation in Closure Compiler:
		 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
		 *
		 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
		 * Redistribution and use in source and binary forms, with or without
		 * modification, are permitted provided that the following conditions are
		 * met:
		 *
		 *  * Redistributions of source code must retain the above copyright
		 *    notice, this list of conditions and the following disclaimer.
		 *  * Redistributions in binary form must reproduce the above
		 *    copyright notice, this list of conditions and the following
		 *    disclaimer in the documentation and/or other materials provided
		 *    with the distribution.
		 *  * Neither the name of Google Inc. nor the names of its
		 *    contributors may be used to endorse or promote products derived
		 *    from this software without specific prior written permission.
		 *
		 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
		 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
		 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
		 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
		 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
		 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
		 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
		 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
		 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
		 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
		 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
		 */var base64=__webpack_require__(3);// A single base 64 digit can contain 6 bits of data. For the base 64 variable
	// length quantities we use in the source map spec, the first bit is the sign,
	// the next four bits are the actual value, and the 6th bit is the
	// continuation bit. The continuation bit tells us whether there are more
	// digits in this value following this digit.
	//
	//   Continuation
	//   |    Sign
	//   |    |
	//   V    V
	//   101011
	var VLQ_BASE_SHIFT=5;// binary: 100000
	var VLQ_BASE=1<<VLQ_BASE_SHIFT;// binary: 011111
	var VLQ_BASE_MASK=VLQ_BASE-1;// binary: 100000
	var VLQ_CONTINUATION_BIT=VLQ_BASE;/**
		 * Converts from a two-complement value to a value where the sign bit is
		 * placed in the least significant bit.  For example, as decimals:
		 *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
		 *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
		 */function toVLQSigned(aValue){return aValue<0?(-aValue<<1)+1:(aValue<<1)+0;}/**
		 * Converts to a two-complement value from a value where the sign bit is
		 * placed in the least significant bit.  For example, as decimals:
		 *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
		 *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
		 */function fromVLQSigned(aValue){var isNegative=(aValue&1)===1;var shifted=aValue>>1;return isNegative?-shifted:shifted;}/**
		 * Returns the base 64 VLQ encoded value.
		 */exports.encode=function base64VLQ_encode(aValue){var encoded="";var digit;var vlq=toVLQSigned(aValue);do{digit=vlq&VLQ_BASE_MASK;vlq>>>=VLQ_BASE_SHIFT;if(vlq>0){// There are still more digits in this value, so we must make sure the
	// continuation bit is marked.
	digit|=VLQ_CONTINUATION_BIT;}encoded+=base64.encode(digit);}while(vlq>0);return encoded;};/**
		 * Decodes the next base 64 VLQ value from the given string and returns the
		 * value and the rest of the string via the out parameter.
		 */exports.decode=function base64VLQ_decode(aStr,aIndex,aOutParam){var strLen=aStr.length;var result=0;var shift=0;var continuation,digit;do{if(aIndex>=strLen){throw new Error("Expected more digits in base 64 VLQ value.");}digit=base64.decode(aStr.charCodeAt(aIndex++));if(digit===-1){throw new Error("Invalid base64 digit: "+aStr.charAt(aIndex-1));}continuation=!!(digit&VLQ_CONTINUATION_BIT);digit&=VLQ_BASE_MASK;result=result+(digit<<shift);shift+=VLQ_BASE_SHIFT;}while(continuation);aOutParam.value=fromVLQSigned(result);aOutParam.rest=aIndex;};/***/},/* 3 *//***/function(module,exports){/* -*- Mode: js; js-indent-level: 2; -*- *//*
		 * Copyright 2011 Mozilla Foundation and contributors
		 * Licensed under the New BSD license. See LICENSE or:
		 * http://opensource.org/licenses/BSD-3-Clause
		 */var intToCharMap='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');/**
		 * Encode an integer in the range of 0 to 63 to a single base 64 digit.
		 */exports.encode=function(number){if(0<=number&&number<intToCharMap.length){return intToCharMap[number];}throw new TypeError("Must be between 0 and 63: "+number);};/**
		 * Decode a single base 64 character code digit to an integer. Returns -1 on
		 * failure.
		 */exports.decode=function(charCode){var bigA=65;// 'A'
	var bigZ=90;// 'Z'
	var littleA=97;// 'a'
	var littleZ=122;// 'z'
	var zero=48;// '0'
	var nine=57;// '9'
	var plus=43;// '+'
	var slash=47;// '/'
	var littleOffset=26;var numberOffset=52;// 0 - 25: ABCDEFGHIJKLMNOPQRSTUVWXYZ
	if(bigA<=charCode&&charCode<=bigZ){return charCode-bigA;}// 26 - 51: abcdefghijklmnopqrstuvwxyz
	if(littleA<=charCode&&charCode<=littleZ){return charCode-littleA+littleOffset;}// 52 - 61: 0123456789
	if(zero<=charCode&&charCode<=nine){return charCode-zero+numberOffset;}// 62: +
	if(charCode==plus){return 62;}// 63: /
	if(charCode==slash){return 63;}// Invalid base64 digit.
	return-1;};/***/},/* 4 *//***/function(module,exports){/* -*- Mode: js; js-indent-level: 2; -*- *//*
		 * Copyright 2011 Mozilla Foundation and contributors
		 * Licensed under the New BSD license. See LICENSE or:
		 * http://opensource.org/licenses/BSD-3-Clause
		 *//**
		 * This is a helper function for getting values from parameter/options
		 * objects.
		 *
		 * @param args The object we are extracting values from
		 * @param name The name of the property we are getting.
		 * @param defaultValue An optional value to return if the property is missing
		 * from the object. If this is not specified and the property is missing, an
		 * error will be thrown.
		 */function getArg(aArgs,aName,aDefaultValue){if(aName in aArgs){return aArgs[aName];}else if(arguments.length===3){return aDefaultValue;}else{throw new Error('"'+aName+'" is a required argument.');}}exports.getArg=getArg;var urlRegexp=/^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.]*)(?::(\d+))?(\S*)$/;var dataUrlRegexp=/^data:.+\,.+$/;function urlParse(aUrl){var match=aUrl.match(urlRegexp);if(!match){return null;}return{scheme:match[1],auth:match[2],host:match[3],port:match[4],path:match[5]};}exports.urlParse=urlParse;function urlGenerate(aParsedUrl){var url='';if(aParsedUrl.scheme){url+=aParsedUrl.scheme+':';}url+='//';if(aParsedUrl.auth){url+=aParsedUrl.auth+'@';}if(aParsedUrl.host){url+=aParsedUrl.host;}if(aParsedUrl.port){url+=":"+aParsedUrl.port;}if(aParsedUrl.path){url+=aParsedUrl.path;}return url;}exports.urlGenerate=urlGenerate;/**
		 * Normalizes a path, or the path portion of a URL:
		 *
		 * - Replaces consequtive slashes with one slash.
		 * - Removes unnecessary '.' parts.
		 * - Removes unnecessary '<dir>/..' parts.
		 *
		 * Based on code in the Node.js 'path' core module.
		 *
		 * @param aPath The path or url to normalize.
		 */function normalize(aPath){var path=aPath;var url=urlParse(aPath);if(url){if(!url.path){return aPath;}path=url.path;}var isAbsolute=exports.isAbsolute(path);var parts=path.split(/\/+/);for(var part,up=0,i=parts.length-1;i>=0;i--){part=parts[i];if(part==='.'){parts.splice(i,1);}else if(part==='..'){up++;}else if(up>0){if(part===''){// The first part is blank if the path is absolute. Trying to go
	// above the root is a no-op. Therefore we can remove all '..' parts
	// directly after the root.
	parts.splice(i+1,up);up=0;}else{parts.splice(i,2);up--;}}}path=parts.join('/');if(path===''){path=isAbsolute?'/':'.';}if(url){url.path=path;return urlGenerate(url);}return path;}exports.normalize=normalize;/**
		 * Joins two paths/URLs.
		 *
		 * @param aRoot The root path or URL.
		 * @param aPath The path or URL to be joined with the root.
		 *
		 * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
		 *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
		 *   first.
		 * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
		 *   is updated with the result and aRoot is returned. Otherwise the result
		 *   is returned.
		 *   - If aPath is absolute, the result is aPath.
		 *   - Otherwise the two paths are joined with a slash.
		 * - Joining for example 'http://' and 'www.example.com' is also supported.
		 */function join(aRoot,aPath){if(aRoot===""){aRoot=".";}if(aPath===""){aPath=".";}var aPathUrl=urlParse(aPath);var aRootUrl=urlParse(aRoot);if(aRootUrl){aRoot=aRootUrl.path||'/';}// `join(foo, '//www.example.org')`
	if(aPathUrl&&!aPathUrl.scheme){if(aRootUrl){aPathUrl.scheme=aRootUrl.scheme;}return urlGenerate(aPathUrl);}if(aPathUrl||aPath.match(dataUrlRegexp)){return aPath;}// `join('http://', 'www.example.com')`
	if(aRootUrl&&!aRootUrl.host&&!aRootUrl.path){aRootUrl.host=aPath;return urlGenerate(aRootUrl);}var joined=aPath.charAt(0)==='/'?aPath:normalize(aRoot.replace(/\/+$/,'')+'/'+aPath);if(aRootUrl){aRootUrl.path=joined;return urlGenerate(aRootUrl);}return joined;}exports.join=join;exports.isAbsolute=function(aPath){return aPath.charAt(0)==='/'||!!aPath.match(urlRegexp);};/**
		 * Make a path relative to a URL or another path.
		 *
		 * @param aRoot The root path or URL.
		 * @param aPath The path or URL to be made relative to aRoot.
		 */function relative(aRoot,aPath){if(aRoot===""){aRoot=".";}aRoot=aRoot.replace(/\/$/,'');// It is possible for the path to be above the root. In this case, simply
	// checking whether the root is a prefix of the path won't work. Instead, we
	// need to remove components from the root one by one, until either we find
	// a prefix that fits, or we run out of components to remove.
	var level=0;while(aPath.indexOf(aRoot+'/')!==0){var index=aRoot.lastIndexOf("/");if(index<0){return aPath;}// If the only part of the root that is left is the scheme (i.e. http://,
	// file:///, etc.), one or more slashes (/), or simply nothing at all, we
	// have exhausted all components, so the path is not relative to the root.
	aRoot=aRoot.slice(0,index);if(aRoot.match(/^([^\/]+:\/)?\/*$/)){return aPath;}++level;}// Make sure we add a "../" for each component we removed from the root.
	return Array(level+1).join("../")+aPath.substr(aRoot.length+1);}exports.relative=relative;var supportsNullProto=function(){var obj=Object.create(null);return!('__proto__'in obj);}();function identity(s){return s;}/**
		 * Because behavior goes wacky when you set `__proto__` on objects, we
		 * have to prefix all the strings in our set with an arbitrary character.
		 *
		 * See https://github.com/mozilla/source-map/pull/31 and
		 * https://github.com/mozilla/source-map/issues/30
		 *
		 * @param String aStr
		 */function toSetString(aStr){if(isProtoString(aStr)){return'$'+aStr;}return aStr;}exports.toSetString=supportsNullProto?identity:toSetString;function fromSetString(aStr){if(isProtoString(aStr)){return aStr.slice(1);}return aStr;}exports.fromSetString=supportsNullProto?identity:fromSetString;function isProtoString(s){if(!s){return false;}var length=s.length;if(length<9/* "__proto__".length */){return false;}if(s.charCodeAt(length-1)!==95/* '_' */||s.charCodeAt(length-2)!==95/* '_' */||s.charCodeAt(length-3)!==111/* 'o' */||s.charCodeAt(length-4)!==116/* 't' */||s.charCodeAt(length-5)!==111/* 'o' */||s.charCodeAt(length-6)!==114/* 'r' */||s.charCodeAt(length-7)!==112/* 'p' */||s.charCodeAt(length-8)!==95/* '_' */||s.charCodeAt(length-9)!==95/* '_' */){return false;}for(var i=length-10;i>=0;i--){if(s.charCodeAt(i)!==36/* '$' */){return false;}}return true;}/**
		 * Comparator between two mappings where the original positions are compared.
		 *
		 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
		 * mappings with the same original source/line/column, but different generated
		 * line and column the same. Useful when searching for a mapping with a
		 * stubbed out mapping.
		 */function compareByOriginalPositions(mappingA,mappingB,onlyCompareOriginal){var cmp=mappingA.source-mappingB.source;if(cmp!==0){return cmp;}cmp=mappingA.originalLine-mappingB.originalLine;if(cmp!==0){return cmp;}cmp=mappingA.originalColumn-mappingB.originalColumn;if(cmp!==0||onlyCompareOriginal){return cmp;}cmp=mappingA.generatedColumn-mappingB.generatedColumn;if(cmp!==0){return cmp;}cmp=mappingA.generatedLine-mappingB.generatedLine;if(cmp!==0){return cmp;}return mappingA.name-mappingB.name;}exports.compareByOriginalPositions=compareByOriginalPositions;/**
		 * Comparator between two mappings with deflated source and name indices where
		 * the generated positions are compared.
		 *
		 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
		 * mappings with the same generated line and column, but different
		 * source/name/original line and column the same. Useful when searching for a
		 * mapping with a stubbed out mapping.
		 */function compareByGeneratedPositionsDeflated(mappingA,mappingB,onlyCompareGenerated){var cmp=mappingA.generatedLine-mappingB.generatedLine;if(cmp!==0){return cmp;}cmp=mappingA.generatedColumn-mappingB.generatedColumn;if(cmp!==0||onlyCompareGenerated){return cmp;}cmp=mappingA.source-mappingB.source;if(cmp!==0){return cmp;}cmp=mappingA.originalLine-mappingB.originalLine;if(cmp!==0){return cmp;}cmp=mappingA.originalColumn-mappingB.originalColumn;if(cmp!==0){return cmp;}return mappingA.name-mappingB.name;}exports.compareByGeneratedPositionsDeflated=compareByGeneratedPositionsDeflated;function strcmp(aStr1,aStr2){if(aStr1===aStr2){return 0;}if(aStr1>aStr2){return 1;}return-1;}/**
		 * Comparator between two mappings with inflated source and name strings where
		 * the generated positions are compared.
		 */function compareByGeneratedPositionsInflated(mappingA,mappingB){var cmp=mappingA.generatedLine-mappingB.generatedLine;if(cmp!==0){return cmp;}cmp=mappingA.generatedColumn-mappingB.generatedColumn;if(cmp!==0){return cmp;}cmp=strcmp(mappingA.source,mappingB.source);if(cmp!==0){return cmp;}cmp=mappingA.originalLine-mappingB.originalLine;if(cmp!==0){return cmp;}cmp=mappingA.originalColumn-mappingB.originalColumn;if(cmp!==0){return cmp;}return strcmp(mappingA.name,mappingB.name);}exports.compareByGeneratedPositionsInflated=compareByGeneratedPositionsInflated;/***/},/* 5 *//***/function(module,exports,__webpack_require__){/* -*- Mode: js; js-indent-level: 2; -*- *//*
		 * Copyright 2011 Mozilla Foundation and contributors
		 * Licensed under the New BSD license. See LICENSE or:
		 * http://opensource.org/licenses/BSD-3-Clause
		 */var util=__webpack_require__(4);var has=Object.prototype.hasOwnProperty;/**
		 * A data structure which is a combination of an array and a set. Adding a new
		 * member is O(1), testing for membership is O(1), and finding the index of an
		 * element is O(1). Removing elements from the set is not supported. Only
		 * strings are supported for membership.
		 */function ArraySet(){this._array=[];this._set=Object.create(null);}/**
		 * Static method for creating ArraySet instances from an existing array.
		 */ArraySet.fromArray=function ArraySet_fromArray(aArray,aAllowDuplicates){var set=new ArraySet();for(var i=0,len=aArray.length;i<len;i++){set.add(aArray[i],aAllowDuplicates);}return set;};/**
		 * Return how many unique items are in this ArraySet. If duplicates have been
		 * added, than those do not count towards the size.
		 *
		 * @returns Number
		 */ArraySet.prototype.size=function ArraySet_size(){return Object.getOwnPropertyNames(this._set).length;};/**
		 * Add the given string to this set.
		 *
		 * @param String aStr
		 */ArraySet.prototype.add=function ArraySet_add(aStr,aAllowDuplicates){var sStr=util.toSetString(aStr);var isDuplicate=has.call(this._set,sStr);var idx=this._array.length;if(!isDuplicate||aAllowDuplicates){this._array.push(aStr);}if(!isDuplicate){this._set[sStr]=idx;}};/**
		 * Is the given string a member of this set?
		 *
		 * @param String aStr
		 */ArraySet.prototype.has=function ArraySet_has(aStr){var sStr=util.toSetString(aStr);return has.call(this._set,sStr);};/**
		 * What is the index of the given string in the array?
		 *
		 * @param String aStr
		 */ArraySet.prototype.indexOf=function ArraySet_indexOf(aStr){var sStr=util.toSetString(aStr);if(has.call(this._set,sStr)){return this._set[sStr];}throw new Error('"'+aStr+'" is not in the set.');};/**
		 * What is the element at the given index?
		 *
		 * @param Number aIdx
		 */ArraySet.prototype.at=function ArraySet_at(aIdx){if(aIdx>=0&&aIdx<this._array.length){return this._array[aIdx];}throw new Error('No element indexed by '+aIdx);};/**
		 * Returns the array representation of this set (which has the proper indices
		 * indicated by indexOf). Note that this is a copy of the internal array used
		 * for storing the members so that no one can mess with internal state.
		 */ArraySet.prototype.toArray=function ArraySet_toArray(){return this._array.slice();};exports.ArraySet=ArraySet;/***/},/* 6 *//***/function(module,exports,__webpack_require__){/* -*- Mode: js; js-indent-level: 2; -*- *//*
		 * Copyright 2014 Mozilla Foundation and contributors
		 * Licensed under the New BSD license. See LICENSE or:
		 * http://opensource.org/licenses/BSD-3-Clause
		 */var util=__webpack_require__(4);/**
		 * Determine whether mappingB is after mappingA with respect to generated
		 * position.
		 */function generatedPositionAfter(mappingA,mappingB){// Optimized for most common case
	var lineA=mappingA.generatedLine;var lineB=mappingB.generatedLine;var columnA=mappingA.generatedColumn;var columnB=mappingB.generatedColumn;return lineB>lineA||lineB==lineA&&columnB>=columnA||util.compareByGeneratedPositionsInflated(mappingA,mappingB)<=0;}/**
		 * A data structure to provide a sorted view of accumulated mappings in a
		 * performance conscious manner. It trades a neglibable overhead in general
		 * case for a large speedup in case of mappings being added in order.
		 */function MappingList(){this._array=[];this._sorted=true;// Serves as infimum
	this._last={generatedLine:-1,generatedColumn:0};}/**
		 * Iterate through internal items. This method takes the same arguments that
		 * `Array.prototype.forEach` takes.
		 *
		 * NOTE: The order of the mappings is NOT guaranteed.
		 */MappingList.prototype.unsortedForEach=function MappingList_forEach(aCallback,aThisArg){this._array.forEach(aCallback,aThisArg);};/**
		 * Add the given source mapping.
		 *
		 * @param Object aMapping
		 */MappingList.prototype.add=function MappingList_add(aMapping){if(generatedPositionAfter(this._last,aMapping)){this._last=aMapping;this._array.push(aMapping);}else{this._sorted=false;this._array.push(aMapping);}};/**
		 * Returns the flat, sorted array of mappings. The mappings are sorted by
		 * generated position.
		 *
		 * WARNING: This method returns internal data without copying, for
		 * performance. The return value must NOT be mutated, and should be treated as
		 * an immutable borrow. If you want to take ownership, you must make your own
		 * copy.
		 */MappingList.prototype.toArray=function MappingList_toArray(){if(!this._sorted){this._array.sort(util.compareByGeneratedPositionsInflated);this._sorted=true;}return this._array;};exports.MappingList=MappingList;/***/},/* 7 *//***/function(module,exports,__webpack_require__){/* -*- Mode: js; js-indent-level: 2; -*- *//*
		 * Copyright 2011 Mozilla Foundation and contributors
		 * Licensed under the New BSD license. See LICENSE or:
		 * http://opensource.org/licenses/BSD-3-Clause
		 */var util=__webpack_require__(4);var binarySearch=__webpack_require__(8);var ArraySet=__webpack_require__(5).ArraySet;var base64VLQ=__webpack_require__(2);var quickSort=__webpack_require__(9).quickSort;function SourceMapConsumer(aSourceMap){var sourceMap=aSourceMap;if(typeof aSourceMap==='string'){sourceMap=JSON.parse(aSourceMap.replace(/^\)\]\}'/,''));}return sourceMap.sections!=null?new IndexedSourceMapConsumer(sourceMap):new BasicSourceMapConsumer(sourceMap);}SourceMapConsumer.fromSourceMap=function(aSourceMap){return BasicSourceMapConsumer.fromSourceMap(aSourceMap);};/**
		 * The version of the source mapping spec that we are consuming.
		 */SourceMapConsumer.prototype._version=3;// `__generatedMappings` and `__originalMappings` are arrays that hold the
	// parsed mapping coordinates from the source map's "mappings" attribute. They
	// are lazily instantiated, accessed via the `_generatedMappings` and
	// `_originalMappings` getters respectively, and we only parse the mappings
	// and create these arrays once queried for a source location. We jump through
	// these hoops because there can be many thousands of mappings, and parsing
	// them is expensive, so we only want to do it if we must.
	//
	// Each object in the arrays is of the form:
	//
	//     {
	//       generatedLine: The line number in the generated code,
	//       generatedColumn: The column number in the generated code,
	//       source: The path to the original source file that generated this
	//               chunk of code,
	//       originalLine: The line number in the original source that
	//                     corresponds to this chunk of generated code,
	//       originalColumn: The column number in the original source that
	//                       corresponds to this chunk of generated code,
	//       name: The name of the original symbol which generated this chunk of
	//             code.
	//     }
	//
	// All properties except for `generatedLine` and `generatedColumn` can be
	// `null`.
	//
	// `_generatedMappings` is ordered by the generated positions.
	//
	// `_originalMappings` is ordered by the original positions.
	SourceMapConsumer.prototype.__generatedMappings=null;Object.defineProperty(SourceMapConsumer.prototype,'_generatedMappings',{get:function(){if(!this.__generatedMappings){this._parseMappings(this._mappings,this.sourceRoot);}return this.__generatedMappings;}});SourceMapConsumer.prototype.__originalMappings=null;Object.defineProperty(SourceMapConsumer.prototype,'_originalMappings',{get:function(){if(!this.__originalMappings){this._parseMappings(this._mappings,this.sourceRoot);}return this.__originalMappings;}});SourceMapConsumer.prototype._charIsMappingSeparator=function SourceMapConsumer_charIsMappingSeparator(aStr,index){var c=aStr.charAt(index);return c===";"||c===",";};/**
		 * Parse the mappings in a string in to a data structure which we can easily
		 * query (the ordered arrays in the `this.__generatedMappings` and
		 * `this.__originalMappings` properties).
		 */SourceMapConsumer.prototype._parseMappings=function SourceMapConsumer_parseMappings(aStr,aSourceRoot){throw new Error("Subclasses must implement _parseMappings");};SourceMapConsumer.GENERATED_ORDER=1;SourceMapConsumer.ORIGINAL_ORDER=2;SourceMapConsumer.GREATEST_LOWER_BOUND=1;SourceMapConsumer.LEAST_UPPER_BOUND=2;/**
		 * Iterate over each mapping between an original source/line/column and a
		 * generated line/column in this source map.
		 *
		 * @param Function aCallback
		 *        The function that is called with each mapping.
		 * @param Object aContext
		 *        Optional. If specified, this object will be the value of `this` every
		 *        time that `aCallback` is called.
		 * @param aOrder
		 *        Either `SourceMapConsumer.GENERATED_ORDER` or
		 *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
		 *        iterate over the mappings sorted by the generated file's line/column
		 *        order or the original's source/line/column order, respectively. Defaults to
		 *        `SourceMapConsumer.GENERATED_ORDER`.
		 */SourceMapConsumer.prototype.eachMapping=function SourceMapConsumer_eachMapping(aCallback,aContext,aOrder){var context=aContext||null;var order=aOrder||SourceMapConsumer.GENERATED_ORDER;var mappings;switch(order){case SourceMapConsumer.GENERATED_ORDER:mappings=this._generatedMappings;break;case SourceMapConsumer.ORIGINAL_ORDER:mappings=this._originalMappings;break;default:throw new Error("Unknown order of iteration.");}var sourceRoot=this.sourceRoot;mappings.map(function(mapping){var source=mapping.source===null?null:this._sources.at(mapping.source);if(source!=null&&sourceRoot!=null){source=util.join(sourceRoot,source);}return{source:source,generatedLine:mapping.generatedLine,generatedColumn:mapping.generatedColumn,originalLine:mapping.originalLine,originalColumn:mapping.originalColumn,name:mapping.name===null?null:this._names.at(mapping.name)};},this).forEach(aCallback,context);};/**
		 * Returns all generated line and column information for the original source,
		 * line, and column provided. If no column is provided, returns all mappings
		 * corresponding to a either the line we are searching for or the next
		 * closest line that has any mappings. Otherwise, returns all mappings
		 * corresponding to the given line and either the column we are searching for
		 * or the next closest column that has any offsets.
		 *
		 * The only argument is an object with the following properties:
		 *
		 *   - source: The filename of the original source.
		 *   - line: The line number in the original source.
		 *   - column: Optional. the column number in the original source.
		 *
		 * and an array of objects is returned, each with the following properties:
		 *
		 *   - line: The line number in the generated source, or null.
		 *   - column: The column number in the generated source, or null.
		 */SourceMapConsumer.prototype.allGeneratedPositionsFor=function SourceMapConsumer_allGeneratedPositionsFor(aArgs){var line=util.getArg(aArgs,'line');// When there is no exact match, BasicSourceMapConsumer.prototype._findMapping
	// returns the index of the closest mapping less than the needle. By
	// setting needle.originalColumn to 0, we thus find the last mapping for
	// the given line, provided such a mapping exists.
	var needle={source:util.getArg(aArgs,'source'),originalLine:line,originalColumn:util.getArg(aArgs,'column',0)};if(this.sourceRoot!=null){needle.source=util.relative(this.sourceRoot,needle.source);}if(!this._sources.has(needle.source)){return[];}needle.source=this._sources.indexOf(needle.source);var mappings=[];var index=this._findMapping(needle,this._originalMappings,"originalLine","originalColumn",util.compareByOriginalPositions,binarySearch.LEAST_UPPER_BOUND);if(index>=0){var mapping=this._originalMappings[index];if(aArgs.column===undefined){var originalLine=mapping.originalLine;// Iterate until either we run out of mappings, or we run into
	// a mapping for a different line than the one we found. Since
	// mappings are sorted, this is guaranteed to find all mappings for
	// the line we found.
	while(mapping&&mapping.originalLine===originalLine){mappings.push({line:util.getArg(mapping,'generatedLine',null),column:util.getArg(mapping,'generatedColumn',null),lastColumn:util.getArg(mapping,'lastGeneratedColumn',null)});mapping=this._originalMappings[++index];}}else{var originalColumn=mapping.originalColumn;// Iterate until either we run out of mappings, or we run into
	// a mapping for a different line than the one we were searching for.
	// Since mappings are sorted, this is guaranteed to find all mappings for
	// the line we are searching for.
	while(mapping&&mapping.originalLine===line&&mapping.originalColumn==originalColumn){mappings.push({line:util.getArg(mapping,'generatedLine',null),column:util.getArg(mapping,'generatedColumn',null),lastColumn:util.getArg(mapping,'lastGeneratedColumn',null)});mapping=this._originalMappings[++index];}}}return mappings;};exports.SourceMapConsumer=SourceMapConsumer;/**
		 * A BasicSourceMapConsumer instance represents a parsed source map which we can
		 * query for information about the original file positions by giving it a file
		 * position in the generated source.
		 *
		 * The only parameter is the raw source map (either as a JSON string, or
		 * already parsed to an object). According to the spec, source maps have the
		 * following attributes:
		 *
		 *   - version: Which version of the source map spec this map is following.
		 *   - sources: An array of URLs to the original source files.
		 *   - names: An array of identifiers which can be referrenced by individual mappings.
		 *   - sourceRoot: Optional. The URL root from which all sources are relative.
		 *   - sourcesContent: Optional. An array of contents of the original source files.
		 *   - mappings: A string of base64 VLQs which contain the actual mappings.
		 *   - file: Optional. The generated file this source map is associated with.
		 *
		 * Here is an example source map, taken from the source map spec[0]:
		 *
		 *     {
		 *       version : 3,
		 *       file: "out.js",
		 *       sourceRoot : "",
		 *       sources: ["foo.js", "bar.js"],
		 *       names: ["src", "maps", "are", "fun"],
		 *       mappings: "AA,AB;;ABCDE;"
		 *     }
		 *
		 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
		 */function BasicSourceMapConsumer(aSourceMap){var sourceMap=aSourceMap;if(typeof aSourceMap==='string'){sourceMap=JSON.parse(aSourceMap.replace(/^\)\]\}'/,''));}var version=util.getArg(sourceMap,'version');var sources=util.getArg(sourceMap,'sources');// Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
	// requires the array) to play nice here.
	var names=util.getArg(sourceMap,'names',[]);var sourceRoot=util.getArg(sourceMap,'sourceRoot',null);var sourcesContent=util.getArg(sourceMap,'sourcesContent',null);var mappings=util.getArg(sourceMap,'mappings');var file=util.getArg(sourceMap,'file',null);// Once again, Sass deviates from the spec and supplies the version as a
	// string rather than a number, so we use loose equality checking here.
	if(version!=this._version){throw new Error('Unsupported version: '+version);}sources=sources.map(String)// Some source maps produce relative source paths like "./foo.js" instead of
	// "foo.js".  Normalize these first so that future comparisons will succeed.
	// See bugzil.la/1090768.
	.map(util.normalize)// Always ensure that absolute sources are internally stored relative to
	// the source root, if the source root is absolute. Not doing this would
	// be particularly problematic when the source root is a prefix of the
	// source (valid, but why??). See github issue #199 and bugzil.la/1188982.
	.map(function(source){return sourceRoot&&util.isAbsolute(sourceRoot)&&util.isAbsolute(source)?util.relative(sourceRoot,source):source;});// Pass `true` below to allow duplicate names and sources. While source maps
	// are intended to be compressed and deduplicated, the TypeScript compiler
	// sometimes generates source maps with duplicates in them. See Github issue
	// #72 and bugzil.la/889492.
	this._names=ArraySet.fromArray(names.map(String),true);this._sources=ArraySet.fromArray(sources,true);this.sourceRoot=sourceRoot;this.sourcesContent=sourcesContent;this._mappings=mappings;this.file=file;}BasicSourceMapConsumer.prototype=Object.create(SourceMapConsumer.prototype);BasicSourceMapConsumer.prototype.consumer=SourceMapConsumer;/**
		 * Create a BasicSourceMapConsumer from a SourceMapGenerator.
		 *
		 * @param SourceMapGenerator aSourceMap
		 *        The source map that will be consumed.
		 * @returns BasicSourceMapConsumer
		 */BasicSourceMapConsumer.fromSourceMap=function SourceMapConsumer_fromSourceMap(aSourceMap){var smc=Object.create(BasicSourceMapConsumer.prototype);var names=smc._names=ArraySet.fromArray(aSourceMap._names.toArray(),true);var sources=smc._sources=ArraySet.fromArray(aSourceMap._sources.toArray(),true);smc.sourceRoot=aSourceMap._sourceRoot;smc.sourcesContent=aSourceMap._generateSourcesContent(smc._sources.toArray(),smc.sourceRoot);smc.file=aSourceMap._file;// Because we are modifying the entries (by converting string sources and
	// names to indices into the sources and names ArraySets), we have to make
	// a copy of the entry or else bad things happen. Shared mutable state
	// strikes again! See github issue #191.
	var generatedMappings=aSourceMap._mappings.toArray().slice();var destGeneratedMappings=smc.__generatedMappings=[];var destOriginalMappings=smc.__originalMappings=[];for(var i=0,length=generatedMappings.length;i<length;i++){var srcMapping=generatedMappings[i];var destMapping=new Mapping();destMapping.generatedLine=srcMapping.generatedLine;destMapping.generatedColumn=srcMapping.generatedColumn;if(srcMapping.source){destMapping.source=sources.indexOf(srcMapping.source);destMapping.originalLine=srcMapping.originalLine;destMapping.originalColumn=srcMapping.originalColumn;if(srcMapping.name){destMapping.name=names.indexOf(srcMapping.name);}destOriginalMappings.push(destMapping);}destGeneratedMappings.push(destMapping);}quickSort(smc.__originalMappings,util.compareByOriginalPositions);return smc;};/**
		 * The version of the source mapping spec that we are consuming.
		 */BasicSourceMapConsumer.prototype._version=3;/**
		 * The list of original sources.
		 */Object.defineProperty(BasicSourceMapConsumer.prototype,'sources',{get:function(){return this._sources.toArray().map(function(s){return this.sourceRoot!=null?util.join(this.sourceRoot,s):s;},this);}});/**
		 * Provide the JIT with a nice shape / hidden class.
		 */function Mapping(){this.generatedLine=0;this.generatedColumn=0;this.source=null;this.originalLine=null;this.originalColumn=null;this.name=null;}/**
		 * Parse the mappings in a string in to a data structure which we can easily
		 * query (the ordered arrays in the `this.__generatedMappings` and
		 * `this.__originalMappings` properties).
		 */BasicSourceMapConsumer.prototype._parseMappings=function SourceMapConsumer_parseMappings(aStr,aSourceRoot){var generatedLine=1;var previousGeneratedColumn=0;var previousOriginalLine=0;var previousOriginalColumn=0;var previousSource=0;var previousName=0;var length=aStr.length;var index=0;var cachedSegments={};var temp={};var originalMappings=[];var generatedMappings=[];var mapping,str,segment,end,value;while(index<length){if(aStr.charAt(index)===';'){generatedLine++;index++;previousGeneratedColumn=0;}else if(aStr.charAt(index)===','){index++;}else{mapping=new Mapping();mapping.generatedLine=generatedLine;// Because each offset is encoded relative to the previous one,
	// many segments often have the same encoding. We can exploit this
	// fact by caching the parsed variable length fields of each segment,
	// allowing us to avoid a second parse if we encounter the same
	// segment again.
	for(end=index;end<length;end++){if(this._charIsMappingSeparator(aStr,end)){break;}}str=aStr.slice(index,end);segment=cachedSegments[str];if(segment){index+=str.length;}else{segment=[];while(index<end){base64VLQ.decode(aStr,index,temp);value=temp.value;index=temp.rest;segment.push(value);}if(segment.length===2){throw new Error('Found a source, but no line and column');}if(segment.length===3){throw new Error('Found a source and line, but no column');}cachedSegments[str]=segment;}// Generated column.
	mapping.generatedColumn=previousGeneratedColumn+segment[0];previousGeneratedColumn=mapping.generatedColumn;if(segment.length>1){// Original source.
	mapping.source=previousSource+segment[1];previousSource+=segment[1];// Original line.
	mapping.originalLine=previousOriginalLine+segment[2];previousOriginalLine=mapping.originalLine;// Lines are stored 0-based
	mapping.originalLine+=1;// Original column.
	mapping.originalColumn=previousOriginalColumn+segment[3];previousOriginalColumn=mapping.originalColumn;if(segment.length>4){// Original name.
	mapping.name=previousName+segment[4];previousName+=segment[4];}}generatedMappings.push(mapping);if(typeof mapping.originalLine==='number'){originalMappings.push(mapping);}}}quickSort(generatedMappings,util.compareByGeneratedPositionsDeflated);this.__generatedMappings=generatedMappings;quickSort(originalMappings,util.compareByOriginalPositions);this.__originalMappings=originalMappings;};/**
		 * Find the mapping that best matches the hypothetical "needle" mapping that
		 * we are searching for in the given "haystack" of mappings.
		 */BasicSourceMapConsumer.prototype._findMapping=function SourceMapConsumer_findMapping(aNeedle,aMappings,aLineName,aColumnName,aComparator,aBias){// To return the position we are searching for, we must first find the
	// mapping for the given position and then return the opposite position it
	// points to. Because the mappings are sorted, we can use binary search to
	// find the best mapping.
	if(aNeedle[aLineName]<=0){throw new TypeError('Line must be greater than or equal to 1, got '+aNeedle[aLineName]);}if(aNeedle[aColumnName]<0){throw new TypeError('Column must be greater than or equal to 0, got '+aNeedle[aColumnName]);}return binarySearch.search(aNeedle,aMappings,aComparator,aBias);};/**
		 * Compute the last column for each generated mapping. The last column is
		 * inclusive.
		 */BasicSourceMapConsumer.prototype.computeColumnSpans=function SourceMapConsumer_computeColumnSpans(){for(var index=0;index<this._generatedMappings.length;++index){var mapping=this._generatedMappings[index];// Mappings do not contain a field for the last generated columnt. We
	// can come up with an optimistic estimate, however, by assuming that
	// mappings are contiguous (i.e. given two consecutive mappings, the
	// first mapping ends where the second one starts).
	if(index+1<this._generatedMappings.length){var nextMapping=this._generatedMappings[index+1];if(mapping.generatedLine===nextMapping.generatedLine){mapping.lastGeneratedColumn=nextMapping.generatedColumn-1;continue;}}// The last mapping for each line spans the entire line.
	mapping.lastGeneratedColumn=Infinity;}};/**
		 * Returns the original source, line, and column information for the generated
		 * source's line and column positions provided. The only argument is an object
		 * with the following properties:
		 *
		 *   - line: The line number in the generated source.
		 *   - column: The column number in the generated source.
		 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
		 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
		 *     closest element that is smaller than or greater than the one we are
		 *     searching for, respectively, if the exact element cannot be found.
		 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
		 *
		 * and an object is returned with the following properties:
		 *
		 *   - source: The original source file, or null.
		 *   - line: The line number in the original source, or null.
		 *   - column: The column number in the original source, or null.
		 *   - name: The original identifier, or null.
		 */BasicSourceMapConsumer.prototype.originalPositionFor=function SourceMapConsumer_originalPositionFor(aArgs){var needle={generatedLine:util.getArg(aArgs,'line'),generatedColumn:util.getArg(aArgs,'column')};var index=this._findMapping(needle,this._generatedMappings,"generatedLine","generatedColumn",util.compareByGeneratedPositionsDeflated,util.getArg(aArgs,'bias',SourceMapConsumer.GREATEST_LOWER_BOUND));if(index>=0){var mapping=this._generatedMappings[index];if(mapping.generatedLine===needle.generatedLine){var source=util.getArg(mapping,'source',null);if(source!==null){source=this._sources.at(source);if(this.sourceRoot!=null){source=util.join(this.sourceRoot,source);}}var name=util.getArg(mapping,'name',null);if(name!==null){name=this._names.at(name);}return{source:source,line:util.getArg(mapping,'originalLine',null),column:util.getArg(mapping,'originalColumn',null),name:name};}}return{source:null,line:null,column:null,name:null};};/**
		 * Return true if we have the source content for every source in the source
		 * map, false otherwise.
		 */BasicSourceMapConsumer.prototype.hasContentsOfAllSources=function BasicSourceMapConsumer_hasContentsOfAllSources(){if(!this.sourcesContent){return false;}return this.sourcesContent.length>=this._sources.size()&&!this.sourcesContent.some(function(sc){return sc==null;});};/**
		 * Returns the original source content. The only argument is the url of the
		 * original source file. Returns null if no original source content is
		 * available.
		 */BasicSourceMapConsumer.prototype.sourceContentFor=function SourceMapConsumer_sourceContentFor(aSource,nullOnMissing){if(!this.sourcesContent){return null;}if(this.sourceRoot!=null){aSource=util.relative(this.sourceRoot,aSource);}if(this._sources.has(aSource)){return this.sourcesContent[this._sources.indexOf(aSource)];}var url;if(this.sourceRoot!=null&&(url=util.urlParse(this.sourceRoot))){// XXX: file:// URIs and absolute paths lead to unexpected behavior for
	// many users. We can help them out when they expect file:// URIs to
	// behave like it would if they were running a local HTTP server. See
	// https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
	var fileUriAbsPath=aSource.replace(/^file:\/\//,"");if(url.scheme=="file"&&this._sources.has(fileUriAbsPath)){return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)];}if((!url.path||url.path=="/")&&this._sources.has("/"+aSource)){return this.sourcesContent[this._sources.indexOf("/"+aSource)];}}// This function is used recursively from
	// IndexedSourceMapConsumer.prototype.sourceContentFor. In that case, we
	// don't want to throw if we can't find the source - we just want to
	// return null, so we provide a flag to exit gracefully.
	if(nullOnMissing){return null;}else{throw new Error('"'+aSource+'" is not in the SourceMap.');}};/**
		 * Returns the generated line and column information for the original source,
		 * line, and column positions provided. The only argument is an object with
		 * the following properties:
		 *
		 *   - source: The filename of the original source.
		 *   - line: The line number in the original source.
		 *   - column: The column number in the original source.
		 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
		 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
		 *     closest element that is smaller than or greater than the one we are
		 *     searching for, respectively, if the exact element cannot be found.
		 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
		 *
		 * and an object is returned with the following properties:
		 *
		 *   - line: The line number in the generated source, or null.
		 *   - column: The column number in the generated source, or null.
		 */BasicSourceMapConsumer.prototype.generatedPositionFor=function SourceMapConsumer_generatedPositionFor(aArgs){var source=util.getArg(aArgs,'source');if(this.sourceRoot!=null){source=util.relative(this.sourceRoot,source);}if(!this._sources.has(source)){return{line:null,column:null,lastColumn:null};}source=this._sources.indexOf(source);var needle={source:source,originalLine:util.getArg(aArgs,'line'),originalColumn:util.getArg(aArgs,'column')};var index=this._findMapping(needle,this._originalMappings,"originalLine","originalColumn",util.compareByOriginalPositions,util.getArg(aArgs,'bias',SourceMapConsumer.GREATEST_LOWER_BOUND));if(index>=0){var mapping=this._originalMappings[index];if(mapping.source===needle.source){return{line:util.getArg(mapping,'generatedLine',null),column:util.getArg(mapping,'generatedColumn',null),lastColumn:util.getArg(mapping,'lastGeneratedColumn',null)};}}return{line:null,column:null,lastColumn:null};};exports.BasicSourceMapConsumer=BasicSourceMapConsumer;/**
		 * An IndexedSourceMapConsumer instance represents a parsed source map which
		 * we can query for information. It differs from BasicSourceMapConsumer in
		 * that it takes "indexed" source maps (i.e. ones with a "sections" field) as
		 * input.
		 *
		 * The only parameter is a raw source map (either as a JSON string, or already
		 * parsed to an object). According to the spec for indexed source maps, they
		 * have the following attributes:
		 *
		 *   - version: Which version of the source map spec this map is following.
		 *   - file: Optional. The generated file this source map is associated with.
		 *   - sections: A list of section definitions.
		 *
		 * Each value under the "sections" field has two fields:
		 *   - offset: The offset into the original specified at which this section
		 *       begins to apply, defined as an object with a "line" and "column"
		 *       field.
		 *   - map: A source map definition. This source map could also be indexed,
		 *       but doesn't have to be.
		 *
		 * Instead of the "map" field, it's also possible to have a "url" field
		 * specifying a URL to retrieve a source map from, but that's currently
		 * unsupported.
		 *
		 * Here's an example source map, taken from the source map spec[0], but
		 * modified to omit a section which uses the "url" field.
		 *
		 *  {
		 *    version : 3,
		 *    file: "app.js",
		 *    sections: [{
		 *      offset: {line:100, column:10},
		 *      map: {
		 *        version : 3,
		 *        file: "section.js",
		 *        sources: ["foo.js", "bar.js"],
		 *        names: ["src", "maps", "are", "fun"],
		 *        mappings: "AAAA,E;;ABCDE;"
		 *      }
		 *    }],
		 *  }
		 *
		 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.535es3xeprgt
		 */function IndexedSourceMapConsumer(aSourceMap){var sourceMap=aSourceMap;if(typeof aSourceMap==='string'){sourceMap=JSON.parse(aSourceMap.replace(/^\)\]\}'/,''));}var version=util.getArg(sourceMap,'version');var sections=util.getArg(sourceMap,'sections');if(version!=this._version){throw new Error('Unsupported version: '+version);}this._sources=new ArraySet();this._names=new ArraySet();var lastOffset={line:-1,column:0};this._sections=sections.map(function(s){if(s.url){// The url field will require support for asynchronicity.
	// See https://github.com/mozilla/source-map/issues/16
	throw new Error('Support for url field in sections not implemented.');}var offset=util.getArg(s,'offset');var offsetLine=util.getArg(offset,'line');var offsetColumn=util.getArg(offset,'column');if(offsetLine<lastOffset.line||offsetLine===lastOffset.line&&offsetColumn<lastOffset.column){throw new Error('Section offsets must be ordered and non-overlapping.');}lastOffset=offset;return{generatedOffset:{// The offset fields are 0-based, but we use 1-based indices when
	// encoding/decoding from VLQ.
	generatedLine:offsetLine+1,generatedColumn:offsetColumn+1},consumer:new SourceMapConsumer(util.getArg(s,'map'))};});}IndexedSourceMapConsumer.prototype=Object.create(SourceMapConsumer.prototype);IndexedSourceMapConsumer.prototype.constructor=SourceMapConsumer;/**
		 * The version of the source mapping spec that we are consuming.
		 */IndexedSourceMapConsumer.prototype._version=3;/**
		 * The list of original sources.
		 */Object.defineProperty(IndexedSourceMapConsumer.prototype,'sources',{get:function(){var sources=[];for(var i=0;i<this._sections.length;i++){for(var j=0;j<this._sections[i].consumer.sources.length;j++){sources.push(this._sections[i].consumer.sources[j]);}}return sources;}});/**
		 * Returns the original source, line, and column information for the generated
		 * source's line and column positions provided. The only argument is an object
		 * with the following properties:
		 *
		 *   - line: The line number in the generated source.
		 *   - column: The column number in the generated source.
		 *
		 * and an object is returned with the following properties:
		 *
		 *   - source: The original source file, or null.
		 *   - line: The line number in the original source, or null.
		 *   - column: The column number in the original source, or null.
		 *   - name: The original identifier, or null.
		 */IndexedSourceMapConsumer.prototype.originalPositionFor=function IndexedSourceMapConsumer_originalPositionFor(aArgs){var needle={generatedLine:util.getArg(aArgs,'line'),generatedColumn:util.getArg(aArgs,'column')};// Find the section containing the generated position we're trying to map
	// to an original position.
	var sectionIndex=binarySearch.search(needle,this._sections,function(needle,section){var cmp=needle.generatedLine-section.generatedOffset.generatedLine;if(cmp){return cmp;}return needle.generatedColumn-section.generatedOffset.generatedColumn;});var section=this._sections[sectionIndex];if(!section){return{source:null,line:null,column:null,name:null};}return section.consumer.originalPositionFor({line:needle.generatedLine-(section.generatedOffset.generatedLine-1),column:needle.generatedColumn-(section.generatedOffset.generatedLine===needle.generatedLine?section.generatedOffset.generatedColumn-1:0),bias:aArgs.bias});};/**
		 * Return true if we have the source content for every source in the source
		 * map, false otherwise.
		 */IndexedSourceMapConsumer.prototype.hasContentsOfAllSources=function IndexedSourceMapConsumer_hasContentsOfAllSources(){return this._sections.every(function(s){return s.consumer.hasContentsOfAllSources();});};/**
		 * Returns the original source content. The only argument is the url of the
		 * original source file. Returns null if no original source content is
		 * available.
		 */IndexedSourceMapConsumer.prototype.sourceContentFor=function IndexedSourceMapConsumer_sourceContentFor(aSource,nullOnMissing){for(var i=0;i<this._sections.length;i++){var section=this._sections[i];var content=section.consumer.sourceContentFor(aSource,true);if(content){return content;}}if(nullOnMissing){return null;}else{throw new Error('"'+aSource+'" is not in the SourceMap.');}};/**
		 * Returns the generated line and column information for the original source,
		 * line, and column positions provided. The only argument is an object with
		 * the following properties:
		 *
		 *   - source: The filename of the original source.
		 *   - line: The line number in the original source.
		 *   - column: The column number in the original source.
		 *
		 * and an object is returned with the following properties:
		 *
		 *   - line: The line number in the generated source, or null.
		 *   - column: The column number in the generated source, or null.
		 */IndexedSourceMapConsumer.prototype.generatedPositionFor=function IndexedSourceMapConsumer_generatedPositionFor(aArgs){for(var i=0;i<this._sections.length;i++){var section=this._sections[i];// Only consider this section if the requested source is in the list of
	// sources of the consumer.
	if(section.consumer.sources.indexOf(util.getArg(aArgs,'source'))===-1){continue;}var generatedPosition=section.consumer.generatedPositionFor(aArgs);if(generatedPosition){var ret={line:generatedPosition.line+(section.generatedOffset.generatedLine-1),column:generatedPosition.column+(section.generatedOffset.generatedLine===generatedPosition.line?section.generatedOffset.generatedColumn-1:0)};return ret;}}return{line:null,column:null};};/**
		 * Parse the mappings in a string in to a data structure which we can easily
		 * query (the ordered arrays in the `this.__generatedMappings` and
		 * `this.__originalMappings` properties).
		 */IndexedSourceMapConsumer.prototype._parseMappings=function IndexedSourceMapConsumer_parseMappings(aStr,aSourceRoot){this.__generatedMappings=[];this.__originalMappings=[];for(var i=0;i<this._sections.length;i++){var section=this._sections[i];var sectionMappings=section.consumer._generatedMappings;for(var j=0;j<sectionMappings.length;j++){var mapping=sectionMappings[j];var source=section.consumer._sources.at(mapping.source);if(section.consumer.sourceRoot!==null){source=util.join(section.consumer.sourceRoot,source);}this._sources.add(source);source=this._sources.indexOf(source);var name=section.consumer._names.at(mapping.name);this._names.add(name);name=this._names.indexOf(name);// The mappings coming from the consumer for the section have
	// generated positions relative to the start of the section, so we
	// need to offset them to be relative to the start of the concatenated
	// generated file.
	var adjustedMapping={source:source,generatedLine:mapping.generatedLine+(section.generatedOffset.generatedLine-1),generatedColumn:mapping.generatedColumn+(section.generatedOffset.generatedLine===mapping.generatedLine?section.generatedOffset.generatedColumn-1:0),originalLine:mapping.originalLine,originalColumn:mapping.originalColumn,name:name};this.__generatedMappings.push(adjustedMapping);if(typeof adjustedMapping.originalLine==='number'){this.__originalMappings.push(adjustedMapping);}}}quickSort(this.__generatedMappings,util.compareByGeneratedPositionsDeflated);quickSort(this.__originalMappings,util.compareByOriginalPositions);};exports.IndexedSourceMapConsumer=IndexedSourceMapConsumer;/***/},/* 8 *//***/function(module,exports){/* -*- Mode: js; js-indent-level: 2; -*- *//*
		 * Copyright 2011 Mozilla Foundation and contributors
		 * Licensed under the New BSD license. See LICENSE or:
		 * http://opensource.org/licenses/BSD-3-Clause
		 */exports.GREATEST_LOWER_BOUND=1;exports.LEAST_UPPER_BOUND=2;/**
		 * Recursive implementation of binary search.
		 *
		 * @param aLow Indices here and lower do not contain the needle.
		 * @param aHigh Indices here and higher do not contain the needle.
		 * @param aNeedle The element being searched for.
		 * @param aHaystack The non-empty array being searched.
		 * @param aCompare Function which takes two elements and returns -1, 0, or 1.
		 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
		 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
		 *     closest element that is smaller than or greater than the one we are
		 *     searching for, respectively, if the exact element cannot be found.
		 */function recursiveSearch(aLow,aHigh,aNeedle,aHaystack,aCompare,aBias){// This function terminates when one of the following is true:
	//
	//   1. We find the exact element we are looking for.
	//
	//   2. We did not find the exact element, but we can return the index of
	//      the next-closest element.
	//
	//   3. We did not find the exact element, and there is no next-closest
	//      element than the one we are searching for, so we return -1.
	var mid=Math.floor((aHigh-aLow)/2)+aLow;var cmp=aCompare(aNeedle,aHaystack[mid],true);if(cmp===0){// Found the element we are looking for.
	return mid;}else if(cmp>0){// Our needle is greater than aHaystack[mid].
	if(aHigh-mid>1){// The element is in the upper half.
	return recursiveSearch(mid,aHigh,aNeedle,aHaystack,aCompare,aBias);}// The exact needle element was not found in this haystack. Determine if
	// we are in termination case (3) or (2) and return the appropriate thing.
	if(aBias==exports.LEAST_UPPER_BOUND){return aHigh<aHaystack.length?aHigh:-1;}else{return mid;}}else{// Our needle is less than aHaystack[mid].
	if(mid-aLow>1){// The element is in the lower half.
	return recursiveSearch(aLow,mid,aNeedle,aHaystack,aCompare,aBias);}// we are in termination case (3) or (2) and return the appropriate thing.
	if(aBias==exports.LEAST_UPPER_BOUND){return mid;}else{return aLow<0?-1:aLow;}}}/**
		 * This is an implementation of binary search which will always try and return
		 * the index of the closest element if there is no exact hit. This is because
		 * mappings between original and generated line/col pairs are single points,
		 * and there is an implicit region between each of them, so a miss just means
		 * that you aren't on the very start of a region.
		 *
		 * @param aNeedle The element you are looking for.
		 * @param aHaystack The array that is being searched.
		 * @param aCompare A function which takes the needle and an element in the
		 *     array and returns -1, 0, or 1 depending on whether the needle is less
		 *     than, equal to, or greater than the element, respectively.
		 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
		 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
		 *     closest element that is smaller than or greater than the one we are
		 *     searching for, respectively, if the exact element cannot be found.
		 *     Defaults to 'binarySearch.GREATEST_LOWER_BOUND'.
		 */exports.search=function search(aNeedle,aHaystack,aCompare,aBias){if(aHaystack.length===0){return-1;}var index=recursiveSearch(-1,aHaystack.length,aNeedle,aHaystack,aCompare,aBias||exports.GREATEST_LOWER_BOUND);if(index<0){return-1;}// We have found either the exact element, or the next-closest element than
	// the one we are searching for. However, there may be more than one such
	// element. Make sure we always return the smallest of these.
	while(index-1>=0){if(aCompare(aHaystack[index],aHaystack[index-1],true)!==0){break;}--index;}return index;};/***/},/* 9 *//***/function(module,exports){/* -*- Mode: js; js-indent-level: 2; -*- *//*
		 * Copyright 2011 Mozilla Foundation and contributors
		 * Licensed under the New BSD license. See LICENSE or:
		 * http://opensource.org/licenses/BSD-3-Clause
		 */// It turns out that some (most?) JavaScript engines don't self-host
	// `Array.prototype.sort`. This makes sense because C++ will likely remain
	// faster than JS when doing raw CPU-intensive sorting. However, when using a
	// custom comparator function, calling back and forth between the VM's C++ and
	// JIT'd JS is rather slow *and* loses JIT type information, resulting in
	// worse generated code for the comparator function than would be optimal. In
	// fact, when sorting with a comparator, these costs outweigh the benefits of
	// sorting in C++. By using our own JS-implemented Quick Sort (below), we get
	// a ~3500ms mean speed-up in `bench/bench.html`.
	/**
		 * Swap the elements indexed by `x` and `y` in the array `ary`.
		 *
		 * @param {Array} ary
		 *        The array.
		 * @param {Number} x
		 *        The index of the first item.
		 * @param {Number} y
		 *        The index of the second item.
		 */function swap(ary,x,y){var temp=ary[x];ary[x]=ary[y];ary[y]=temp;}/**
		 * Returns a random integer within the range `low .. high` inclusive.
		 *
		 * @param {Number} low
		 *        The lower bound on the range.
		 * @param {Number} high
		 *        The upper bound on the range.
		 */function randomIntInRange(low,high){return Math.round(low+Math.random()*(high-low));}/**
		 * The Quick Sort algorithm.
		 *
		 * @param {Array} ary
		 *        An array to sort.
		 * @param {function} comparator
		 *        Function to use to compare two items.
		 * @param {Number} p
		 *        Start index of the array
		 * @param {Number} r
		 *        End index of the array
		 */function doQuickSort(ary,comparator,p,r){// If our lower bound is less than our upper bound, we (1) partition the
	// array into two pieces and (2) recurse on each half. If it is not, this is
	// the empty array and our base case.
	if(p<r){// (1) Partitioning.
	//
	// The partitioning chooses a pivot between `p` and `r` and moves all
	// elements that are less than or equal to the pivot to the before it, and
	// all the elements that are greater than it after it. The effect is that
	// once partition is done, the pivot is in the exact place it will be when
	// the array is put in sorted order, and it will not need to be moved
	// again. This runs in O(n) time.
	// Always choose a random pivot so that an input array which is reverse
	// sorted does not cause O(n^2) running time.
	var pivotIndex=randomIntInRange(p,r);var i=p-1;swap(ary,pivotIndex,r);var pivot=ary[r];// Immediately after `j` is incremented in this loop, the following hold
	// true:
	//
	//   * Every element in `ary[p .. i]` is less than or equal to the pivot.
	//
	//   * Every element in `ary[i+1 .. j-1]` is greater than the pivot.
	for(var j=p;j<r;j++){if(comparator(ary[j],pivot)<=0){i+=1;swap(ary,i,j);}}swap(ary,i+1,j);var q=i+1;// (2) Recurse on each half.
	doQuickSort(ary,comparator,p,q-1);doQuickSort(ary,comparator,q+1,r);}}/**
		 * Sort the given array in-place with the given comparator function.
		 *
		 * @param {Array} ary
		 *        An array to sort.
		 * @param {function} comparator
		 *        Function to use to compare two items.
		 */exports.quickSort=function(ary,comparator){doQuickSort(ary,comparator,0,ary.length-1);};/***/},/* 10 *//***/function(module,exports,__webpack_require__){/* -*- Mode: js; js-indent-level: 2; -*- *//*
		 * Copyright 2011 Mozilla Foundation and contributors
		 * Licensed under the New BSD license. See LICENSE or:
		 * http://opensource.org/licenses/BSD-3-Clause
		 */var SourceMapGenerator=__webpack_require__(1).SourceMapGenerator;var util=__webpack_require__(4);// Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
	// operating systems these days (capturing the result).
	var REGEX_NEWLINE=/(\r?\n)/;// Newline character code for charCodeAt() comparisons
	var NEWLINE_CODE=10;// Private symbol for identifying `SourceNode`s when multiple versions of
	// the source-map library are loaded. This MUST NOT CHANGE across
	// versions!
	var isSourceNode="$$$isSourceNode$$$";/**
		 * SourceNodes provide a way to abstract over interpolating/concatenating
		 * snippets of generated JavaScript source code while maintaining the line and
		 * column information associated with the original source code.
		 *
		 * @param aLine The original line number.
		 * @param aColumn The original column number.
		 * @param aSource The original source's filename.
		 * @param aChunks Optional. An array of strings which are snippets of
		 *        generated JS, or other SourceNodes.
		 * @param aName The original identifier.
		 */function SourceNode(aLine,aColumn,aSource,aChunks,aName){this.children=[];this.sourceContents={};this.line=aLine==null?null:aLine;this.column=aColumn==null?null:aColumn;this.source=aSource==null?null:aSource;this.name=aName==null?null:aName;this[isSourceNode]=true;if(aChunks!=null)this.add(aChunks);}/**
		 * Creates a SourceNode from generated code and a SourceMapConsumer.
		 *
		 * @param aGeneratedCode The generated code
		 * @param aSourceMapConsumer The SourceMap for the generated code
		 * @param aRelativePath Optional. The path that relative sources in the
		 *        SourceMapConsumer should be relative to.
		 */SourceNode.fromStringWithSourceMap=function SourceNode_fromStringWithSourceMap(aGeneratedCode,aSourceMapConsumer,aRelativePath){// The SourceNode we want to fill with the generated code
	// and the SourceMap
	var node=new SourceNode();// All even indices of this array are one line of the generated code,
	// while all odd indices are the newlines between two adjacent lines
	// (since `REGEX_NEWLINE` captures its match).
	// Processed fragments are removed from this array, by calling `shiftNextLine`.
	var remainingLines=aGeneratedCode.split(REGEX_NEWLINE);var shiftNextLine=function(){var lineContents=remainingLines.shift();// The last line of a file might not have a newline.
	var newLine=remainingLines.shift()||"";return lineContents+newLine;};// We need to remember the position of "remainingLines"
	var lastGeneratedLine=1,lastGeneratedColumn=0;// The generate SourceNodes we need a code range.
	// To extract it current and last mapping is used.
	// Here we store the last mapping.
	var lastMapping=null;aSourceMapConsumer.eachMapping(function(mapping){if(lastMapping!==null){// We add the code from "lastMapping" to "mapping":
	// First check if there is a new line in between.
	if(lastGeneratedLine<mapping.generatedLine){// Associate first line with "lastMapping"
	addMappingWithCode(lastMapping,shiftNextLine());lastGeneratedLine++;lastGeneratedColumn=0;// The remaining code is added without mapping
	}else{// There is no new line in between.
	// Associate the code between "lastGeneratedColumn" and
	// "mapping.generatedColumn" with "lastMapping"
	var nextLine=remainingLines[0];var code=nextLine.substr(0,mapping.generatedColumn-lastGeneratedColumn);remainingLines[0]=nextLine.substr(mapping.generatedColumn-lastGeneratedColumn);lastGeneratedColumn=mapping.generatedColumn;addMappingWithCode(lastMapping,code);// No more remaining code, continue
	lastMapping=mapping;return;}}// We add the generated code until the first mapping
	// to the SourceNode without any mapping.
	// Each line is added as separate string.
	while(lastGeneratedLine<mapping.generatedLine){node.add(shiftNextLine());lastGeneratedLine++;}if(lastGeneratedColumn<mapping.generatedColumn){var nextLine=remainingLines[0];node.add(nextLine.substr(0,mapping.generatedColumn));remainingLines[0]=nextLine.substr(mapping.generatedColumn);lastGeneratedColumn=mapping.generatedColumn;}lastMapping=mapping;},this);// We have processed all mappings.
	if(remainingLines.length>0){if(lastMapping){// Associate the remaining code in the current line with "lastMapping"
	addMappingWithCode(lastMapping,shiftNextLine());}// and add the remaining lines without any mapping
	node.add(remainingLines.join(""));}// Copy sourcesContent into SourceNode
	aSourceMapConsumer.sources.forEach(function(sourceFile){var content=aSourceMapConsumer.sourceContentFor(sourceFile);if(content!=null){if(aRelativePath!=null){sourceFile=util.join(aRelativePath,sourceFile);}node.setSourceContent(sourceFile,content);}});return node;function addMappingWithCode(mapping,code){if(mapping===null||mapping.source===undefined){node.add(code);}else{var source=aRelativePath?util.join(aRelativePath,mapping.source):mapping.source;node.add(new SourceNode(mapping.originalLine,mapping.originalColumn,source,code,mapping.name));}}};/**
		 * Add a chunk of generated JS to this source node.
		 *
		 * @param aChunk A string snippet of generated JS code, another instance of
		 *        SourceNode, or an array where each member is one of those things.
		 */SourceNode.prototype.add=function SourceNode_add(aChunk){if(Array.isArray(aChunk)){aChunk.forEach(function(chunk){this.add(chunk);},this);}else if(aChunk[isSourceNode]||typeof aChunk==="string"){if(aChunk){this.children.push(aChunk);}}else{throw new TypeError("Expected a SourceNode, string, or an array of SourceNodes and strings. Got "+aChunk);}return this;};/**
		 * Add a chunk of generated JS to the beginning of this source node.
		 *
		 * @param aChunk A string snippet of generated JS code, another instance of
		 *        SourceNode, or an array where each member is one of those things.
		 */SourceNode.prototype.prepend=function SourceNode_prepend(aChunk){if(Array.isArray(aChunk)){for(var i=aChunk.length-1;i>=0;i--){this.prepend(aChunk[i]);}}else if(aChunk[isSourceNode]||typeof aChunk==="string"){this.children.unshift(aChunk);}else{throw new TypeError("Expected a SourceNode, string, or an array of SourceNodes and strings. Got "+aChunk);}return this;};/**
		 * Walk over the tree of JS snippets in this node and its children. The
		 * walking function is called once for each snippet of JS and is passed that
		 * snippet and the its original associated source's line/column location.
		 *
		 * @param aFn The traversal function.
		 */SourceNode.prototype.walk=function SourceNode_walk(aFn){var chunk;for(var i=0,len=this.children.length;i<len;i++){chunk=this.children[i];if(chunk[isSourceNode]){chunk.walk(aFn);}else{if(chunk!==''){aFn(chunk,{source:this.source,line:this.line,column:this.column,name:this.name});}}}};/**
		 * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
		 * each of `this.children`.
		 *
		 * @param aSep The separator.
		 */SourceNode.prototype.join=function SourceNode_join(aSep){var newChildren;var i;var len=this.children.length;if(len>0){newChildren=[];for(i=0;i<len-1;i++){newChildren.push(this.children[i]);newChildren.push(aSep);}newChildren.push(this.children[i]);this.children=newChildren;}return this;};/**
		 * Call String.prototype.replace on the very right-most source snippet. Useful
		 * for trimming whitespace from the end of a source node, etc.
		 *
		 * @param aPattern The pattern to replace.
		 * @param aReplacement The thing to replace the pattern with.
		 */SourceNode.prototype.replaceRight=function SourceNode_replaceRight(aPattern,aReplacement){var lastChild=this.children[this.children.length-1];if(lastChild[isSourceNode]){lastChild.replaceRight(aPattern,aReplacement);}else if(typeof lastChild==='string'){this.children[this.children.length-1]=lastChild.replace(aPattern,aReplacement);}else{this.children.push(''.replace(aPattern,aReplacement));}return this;};/**
		 * Set the source content for a source file. This will be added to the SourceMapGenerator
		 * in the sourcesContent field.
		 *
		 * @param aSourceFile The filename of the source file
		 * @param aSourceContent The content of the source file
		 */SourceNode.prototype.setSourceContent=function SourceNode_setSourceContent(aSourceFile,aSourceContent){this.sourceContents[util.toSetString(aSourceFile)]=aSourceContent;};/**
		 * Walk over the tree of SourceNodes. The walking function is called for each
		 * source file content and is passed the filename and source content.
		 *
		 * @param aFn The traversal function.
		 */SourceNode.prototype.walkSourceContents=function SourceNode_walkSourceContents(aFn){for(var i=0,len=this.children.length;i<len;i++){if(this.children[i][isSourceNode]){this.children[i].walkSourceContents(aFn);}}var sources=Object.keys(this.sourceContents);for(var i=0,len=sources.length;i<len;i++){aFn(util.fromSetString(sources[i]),this.sourceContents[sources[i]]);}};/**
		 * Return the string representation of this source node. Walks over the tree
		 * and concatenates all the various snippets together to one string.
		 */SourceNode.prototype.toString=function SourceNode_toString(){var str="";this.walk(function(chunk){str+=chunk;});return str;};/**
		 * Returns the string representation of this source node along with a source
		 * map.
		 */SourceNode.prototype.toStringWithSourceMap=function SourceNode_toStringWithSourceMap(aArgs){var generated={code:"",line:1,column:0};var map=new SourceMapGenerator(aArgs);var sourceMappingActive=false;var lastOriginalSource=null;var lastOriginalLine=null;var lastOriginalColumn=null;var lastOriginalName=null;this.walk(function(chunk,original){generated.code+=chunk;if(original.source!==null&&original.line!==null&&original.column!==null){if(lastOriginalSource!==original.source||lastOriginalLine!==original.line||lastOriginalColumn!==original.column||lastOriginalName!==original.name){map.addMapping({source:original.source,original:{line:original.line,column:original.column},generated:{line:generated.line,column:generated.column},name:original.name});}lastOriginalSource=original.source;lastOriginalLine=original.line;lastOriginalColumn=original.column;lastOriginalName=original.name;sourceMappingActive=true;}else if(sourceMappingActive){map.addMapping({generated:{line:generated.line,column:generated.column}});lastOriginalSource=null;sourceMappingActive=false;}for(var idx=0,length=chunk.length;idx<length;idx++){if(chunk.charCodeAt(idx)===NEWLINE_CODE){generated.line++;generated.column=0;// Mappings end at eol
	if(idx+1===length){lastOriginalSource=null;sourceMappingActive=false;}else if(sourceMappingActive){map.addMapping({source:original.source,original:{line:original.line,column:original.column},generated:{line:generated.line,column:generated.column},name:original.name});}}else{generated.column++;}}});this.walkSourceContents(function(sourceFile,sourceContent){map.setSourceContent(sourceFile,sourceContent);});return{code:generated.code,map:map};};exports.SourceNode=SourceNode;/***/}/******/]));});;

/***/ },

/***/ 545:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';
	
	(function (root, factory) {
	    'use strict';
	    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.
	
	    /* istanbul ignore next */
	
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof exports === 'object') {
	        module.exports = factory();
	    } else {
	        root.StackFrame = factory();
	    }
	})(undefined, function () {
	    'use strict';
	
	    function _isNumber(n) {
	        return !isNaN(parseFloat(n)) && isFinite(n);
	    }
	
	    function _capitalize(str) {
	        return str[0].toUpperCase() + str.substring(1);
	    }
	
	    function _getter(p) {
	        return function () {
	            return this[p];
	        };
	    }
	
	    var booleanProps = ['isConstructor', 'isEval', 'isNative', 'isToplevel'];
	    var numericProps = ['columnNumber', 'lineNumber'];
	    var stringProps = ['fileName', 'functionName', 'source'];
	    var arrayProps = ['args'];
	
	    var props = booleanProps.concat(numericProps, stringProps, arrayProps);
	
	    function StackFrame(functionName, args, fileName, lineNumber, columnNumber, source) {
	        if (functionName instanceof Object) {
	            var obj = functionName;
	            var props = booleanProps.concat(numericProps.concat(stringProps.concat(arrayProps)));
	            for (var i = 0; i < props.length; i++) {
	                if (obj.hasOwnProperty(props[i]) && obj[props[i]] !== undefined) {
	                    this['set' + _capitalize(props[i])](obj[props[i]]);
	                }
	            }
	        } else {
	            if (functionName !== undefined) {
	                this.setFunctionName(functionName);
	            }
	            if (args !== undefined) {
	                this.setArgs(args);
	            }
	            if (fileName !== undefined) {
	                this.setFileName(fileName);
	            }
	            if (lineNumber !== undefined) {
	                this.setLineNumber(lineNumber);
	            }
	            if (columnNumber !== undefined) {
	                this.setColumnNumber(columnNumber);
	            }
	            if (source !== undefined) {
	                this.setSource(source);
	            }
	        }
	    }
	
	    StackFrame.prototype = {
	        getArgs: function () {
	            return this.args;
	        },
	        setArgs: function (v) {
	            if (Object.prototype.toString.call(v) !== '[object Array]') {
	                throw new TypeError('Args must be an Array');
	            }
	            this.args = v;
	        },
	
	        getEvalOrigin: function () {
	            return this.evalOrigin;
	        },
	        setEvalOrigin: function (v) {
	            if (v instanceof StackFrame) {
	                this.evalOrigin = v;
	            } else if (v instanceof Object) {
	                this.evalOrigin = new StackFrame(v);
	            } else {
	                throw new TypeError('Eval Origin must be an Object or StackFrame');
	            }
	        },
	
	        toString: function () {
	            var functionName = this.getFunctionName() || '{anonymous}';
	            var args = '(' + (this.getArgs() || []).join(',') + ')';
	            var fileName = this.getFileName() ? '@' + this.getFileName() : '';
	            var lineNumber = _isNumber(this.getLineNumber()) ? ':' + this.getLineNumber() : '';
	            var columnNumber = _isNumber(this.getColumnNumber()) ? ':' + this.getColumnNumber() : '';
	            return functionName + args + fileName + lineNumber + columnNumber;
	        }
	    };
	
	    for (var i = 0; i < booleanProps.length; i++) {
	        StackFrame.prototype['get' + _capitalize(booleanProps[i])] = _getter(booleanProps[i]);
	        StackFrame.prototype['set' + _capitalize(booleanProps[i])] = function (p) {
	            return function (v) {
	                this[p] = Boolean(v);
	            };
	        }(booleanProps[i]);
	    }
	
	    for (var j = 0; j < numericProps.length; j++) {
	        StackFrame.prototype['get' + _capitalize(numericProps[j])] = _getter(numericProps[j]);
	        StackFrame.prototype['set' + _capitalize(numericProps[j])] = function (p) {
	            return function (v) {
	                if (!_isNumber(v)) {
	                    throw new TypeError(p + ' must be a Number');
	                }
	                this[p] = Number(v);
	            };
	        }(numericProps[j]);
	    }
	
	    for (var k = 0; k < stringProps.length; k++) {
	        StackFrame.prototype['get' + _capitalize(stringProps[k])] = _getter(stringProps[k]);
	        StackFrame.prototype['set' + _capitalize(stringProps[k])] = function (p) {
	            return function (v) {
	                this[p] = String(v);
	            };
	        }(stringProps[k]);
	    }
	
	    return StackFrame;
	});

/***/ },

/***/ 546:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';
	
	(function (root, factory) {
	    'use strict';
	    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.
	
	    /* istanbul ignore next */
	
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(545)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('./stackframe'));
	    } else {
	        root.ErrorStackParser = factory(root.StackFrame);
	    }
	})(undefined, function ErrorStackParser(StackFrame) {
	    'use strict';
	
	    var FIREFOX_SAFARI_STACK_REGEXP = /(^|@)\S+\:\d+/;
	    var CHROME_IE_STACK_REGEXP = /^\s*at .*(\S+\:\d+|\(native\))/m;
	    var SAFARI_NATIVE_CODE_REGEXP = /^(eval@)?(\[native code\])?$/;
	
	    function _map(array, fn, thisArg) {
	        if (typeof Array.prototype.map === 'function') {
	            return array.map(fn, thisArg);
	        } else {
	            var output = new Array(array.length);
	            for (var i = 0; i < array.length; i++) {
	                output[i] = fn.call(thisArg, array[i]);
	            }
	            return output;
	        }
	    }
	
	    function _filter(array, fn, thisArg) {
	        if (typeof Array.prototype.filter === 'function') {
	            return array.filter(fn, thisArg);
	        } else {
	            var output = [];
	            for (var i = 0; i < array.length; i++) {
	                if (fn.call(thisArg, array[i])) {
	                    output.push(array[i]);
	                }
	            }
	            return output;
	        }
	    }
	
	    function _indexOf(array, target) {
	        if (typeof Array.prototype.indexOf === 'function') {
	            return array.indexOf(target);
	        } else {
	            for (var i = 0; i < array.length; i++) {
	                if (array[i] === target) {
	                    return i;
	                }
	            }
	            return -1;
	        }
	    }
	
	    return {
	        /**
	         * Given an Error object, extract the most information from it.
	         *
	         * @param {Error} error object
	         * @return {Array} of StackFrames
	         */
	        parse: function ErrorStackParser$$parse(error) {
	            if (typeof error.stacktrace !== 'undefined' || typeof error['opera#sourceloc'] !== 'undefined') {
	                return this.parseOpera(error);
	            } else if (error.stack && error.stack.match(CHROME_IE_STACK_REGEXP)) {
	                return this.parseV8OrIE(error);
	            } else if (error.stack) {
	                return this.parseFFOrSafari(error);
	            } else {
	                throw new Error('Cannot parse given Error object');
	            }
	        },
	
	        // Separate line and column numbers from a string of the form: (URI:Line:Column)
	        extractLocation: function ErrorStackParser$$extractLocation(urlLike) {
	            // Fail-fast but return locations like "(native)"
	            if (urlLike.indexOf(':') === -1) {
	                return [urlLike];
	            }
	
	            var regExp = /(.+?)(?:\:(\d+))?(?:\:(\d+))?$/;
	            var parts = regExp.exec(urlLike.replace(/[\(\)]/g, ''));
	            return [parts[1], parts[2] || undefined, parts[3] || undefined];
	        },
	
	        parseV8OrIE: function ErrorStackParser$$parseV8OrIE(error) {
	            var filtered = _filter(error.stack.split('\n'), function (line) {
	                return !!line.match(CHROME_IE_STACK_REGEXP);
	            }, this);
	
	            return _map(filtered, function (line) {
	                if (line.indexOf('(eval ') > -1) {
	                    // Throw away eval information until we implement stacktrace.js/stackframe#8
	                    line = line.replace(/eval code/g, 'eval').replace(/(\(eval at [^\()]*)|(\)\,.*$)/g, '');
	                }
	                var tokens = line.replace(/^\s+/, '').replace(/\(eval code/g, '(').split(/\s+/).slice(1);
	                var locationParts = this.extractLocation(tokens.pop());
	                var functionName = tokens.join(' ') || undefined;
	                var fileName = _indexOf(['eval', '<anonymous>'], locationParts[0]) > -1 ? undefined : locationParts[0];
	
	                return new StackFrame(functionName, undefined, fileName, locationParts[1], locationParts[2], line);
	            }, this);
	        },
	
	        parseFFOrSafari: function ErrorStackParser$$parseFFOrSafari(error) {
	            var filtered = _filter(error.stack.split('\n'), function (line) {
	                return !line.match(SAFARI_NATIVE_CODE_REGEXP);
	            }, this);
	
	            return _map(filtered, function (line) {
	                // Throw away eval information until we implement stacktrace.js/stackframe#8
	                if (line.indexOf(' > eval') > -1) {
	                    line = line.replace(/ line (\d+)(?: > eval line \d+)* > eval\:\d+\:\d+/g, ':$1');
	                }
	
	                if (line.indexOf('@') === -1 && line.indexOf(':') === -1) {
	                    // Safari eval frames only have function names and nothing else
	                    return new StackFrame(line);
	                } else {
	                    var tokens = line.split('@');
	                    var locationParts = this.extractLocation(tokens.pop());
	                    var functionName = tokens.join('@') || undefined;
	                    return new StackFrame(functionName, undefined, locationParts[0], locationParts[1], locationParts[2], line);
	                }
	            }, this);
	        },
	
	        parseOpera: function ErrorStackParser$$parseOpera(e) {
	            if (!e.stacktrace || e.message.indexOf('\n') > -1 && e.message.split('\n').length > e.stacktrace.split('\n').length) {
	                return this.parseOpera9(e);
	            } else if (!e.stack) {
	                return this.parseOpera10(e);
	            } else {
	                return this.parseOpera11(e);
	            }
	        },
	
	        parseOpera9: function ErrorStackParser$$parseOpera9(e) {
	            var lineRE = /Line (\d+).*script (?:in )?(\S+)/i;
	            var lines = e.message.split('\n');
	            var result = [];
	
	            for (var i = 2, len = lines.length; i < len; i += 2) {
	                var match = lineRE.exec(lines[i]);
	                if (match) {
	                    result.push(new StackFrame(undefined, undefined, match[2], match[1], undefined, lines[i]));
	                }
	            }
	
	            return result;
	        },
	
	        parseOpera10: function ErrorStackParser$$parseOpera10(e) {
	            var lineRE = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
	            var lines = e.stacktrace.split('\n');
	            var result = [];
	
	            for (var i = 0, len = lines.length; i < len; i += 2) {
	                var match = lineRE.exec(lines[i]);
	                if (match) {
	                    result.push(new StackFrame(match[3] || undefined, undefined, match[2], match[1], undefined, lines[i]));
	                }
	            }
	
	            return result;
	        },
	
	        // Opera 10.65+ Error.stack very similar to FF/Safari
	        parseOpera11: function ErrorStackParser$$parseOpera11(error) {
	            var filtered = _filter(error.stack.split('\n'), function (line) {
	                return !!line.match(FIREFOX_SAFARI_STACK_REGEXP) && !line.match(/^Error created at/);
	            }, this);
	
	            return _map(filtered, function (line) {
	                var tokens = line.split('@');
	                var locationParts = this.extractLocation(tokens.pop());
	                var functionCall = tokens.shift() || '';
	                var functionName = functionCall.replace(/<anonymous function(: (\w+))?>/, '$2').replace(/\([^\)]*\)/g, '') || undefined;
	                var argsRaw;
	                if (functionCall.match(/\(([^\)]*)\)/)) {
	                    argsRaw = functionCall.replace(/^[^\(]+\(([^\)]*)\)$/, '$1');
	                }
	                var args = argsRaw === undefined || argsRaw === '[arguments not available]' ? undefined : argsRaw.split(',');
	                return new StackFrame(functionName, args, locationParts[0], locationParts[1], locationParts[2], line);
	            }, this);
	        }
	    };
	});

/***/ },

/***/ 821:
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	
	var _underscore = __webpack_require__(516);
	
	var _underscore2 = _interopRequireDefault(_underscore);
	
	var _config = __webpack_require__(525);
	
	var _config2 = _interopRequireDefault(_config);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	class RoundTripMessageWrapper {
	    constructor(target, connectionName) {
	        var onMessage, postMessage, targetHref, close;
	
	        var userPassedInFunctions = target.onMessage && target.postMessage;
	        var targetIsWorkerGlobalScope = typeof DedicatedWorkerGlobalScope !== "undefined" && target instanceof DedicatedWorkerGlobalScope;
	        var targetIsWebWorker = typeof Worker !== "undefined" && target instanceof Worker;
	        // do this rather than `instanceof Window` because sometimes the constructor is a different
	        // `Window` object I think (probalby the Window object of the parent frame)
	        var targetIsWindow = target.constructor.toString().indexOf("function Window() { [native code] }") !== -1;
	        if (userPassedInFunctions) {
	            onMessage = target.onMessage;
	            postMessage = target.postMessage;
	        } else if (targetIsWorkerGlobalScope) {
	            onMessage = function (callback) {
	                target.addEventListener("message", callback);
	            };
	            close = () => {
	                target.removeEventListener("message", this._handle);
	            };
	            postMessage = function () {
	                target.postMessage.apply(null, arguments);
	            };
	        } else if (targetIsWebWorker) {
	            onMessage = function (callback) {
	                target.onmessage = callback;
	            };
	            close = function () {
	                target.onmessage = null;
	            };
	            postMessage = function () {
	                target.postMessage.apply(target, arguments);
	            };
	        } else if (targetIsWindow) {
	            targetHref = target.location.href;
	            onMessage = function (callback) {
	                window.addEventListener("message", callback);
	            };
	            close = () => {
	                window.removeEventListener("message", this._handle);
	            };
	            postMessage = function () {
	                target.postMessage.apply(target, arguments);
	            };
	        } else {
	            throw Error("Unknown RoundTripMessageWrapper target");
	        }
	
	        this.argsForDebugging = arguments;
	        this._handle = this._handle.bind(this);
	        onMessage(this._handle);
	        this._connectionName = connectionName;
	        this._targetHref = targetHref;
	        this.close = close;
	        this._postMessage = data => {
	            if (this.beforePostMessage) {
	                this.beforePostMessage();
	            }
	
	            data.timeSent = new Date();
	            postMessage(data, targetHref);
	
	            if (this.afterPostMessage) {
	                this.afterPostMessage();
	            }
	        };
	        this._handlers = {};
	    }
	    _handle(e) {
	        var data = e.data;
	        if (!data.isRoundTripMessage) {
	            return;
	        }
	
	        var messageType = data.messageType;
	        var handlers = this._handlers[messageType];
	
	        if (_config2.default.logReceivedInspectorMessages) {
	            var timeTaken = new Date().valueOf() - new Date(data.timeSent).valueOf();
	            var size = "";
	            var content = "";
	            // size += "Size: " + (JSON.stringify(data).length / 1024) + "KB"
	            // content = data
	            console.log(this._connectionName + " received", messageType, "took", timeTaken + "ms", size, content);
	        }
	
	        if (!handlers) {
	            return;
	        }
	
	        var self = this;
	        var callback = function () {
	            self._postMessage({
	                isRoundTripMessage: true,
	                messageType: messageType + data.id,
	                args: Array.from(arguments),
	                isResponse: true
	            });
	        };
	
	        handlers.forEach(function (handler) {
	            if (data.isResponse || !data.hasCallBack) {
	                handler.apply(null, [...data.args]);
	            } else {
	                handler.apply(null, [...data.args, callback]);
	            }
	        });
	    }
	    on(messageType, callback) {
	        var handlers = this._handlers[messageType];
	        if (!handlers) {
	            handlers = [];
	        }
	        handlers.push(callback);
	        this._handlers[messageType] = handlers;
	    }
	    send() {
	        var args = Array.from(arguments);
	        var messageType = args.shift();
	        var canceled = false;
	
	        var callback;
	        var hasCallBack = typeof _underscore2.default.last(args) === "function";
	        if (hasCallBack) {
	            callback = args.pop();
	        }
	
	        var id = _underscore2.default.uniqueId();
	
	        if (hasCallBack) {
	            this.on(messageType + id, function () {
	                if (canceled) {
	                    return;
	                }
	                callback.apply(null, arguments);
	            });
	        }
	
	        this._postMessage({
	            isRoundTripMessage: true,
	            messageType,
	            id,
	            args,
	            hasCallBack
	        });
	
	        return function cancel() {
	            canceled = true;
	        };
	    }
	}
	exports.default = RoundTripMessageWrapper;

/***/ },

/***/ 839:
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _resolveFrame = __webpack_require__(541);
	
	var _resolveFrame2 = _interopRequireDefault(_resolveFrame);
	
	var _RoundTripMessageWrapper = __webpack_require__(821);
	
	var _RoundTripMessageWrapper2 = _interopRequireDefault(_RoundTripMessageWrapper);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var wrapper = new _RoundTripMessageWrapper2.default(self, "ResolveFrameWorker");
	var frameResolver = new _resolveFrame2.default(function ajax(url) {
	    return new Promise(function (resolve, reject) {
	        wrapper.send("fetchUrl", url, function (text) {
	            resolve(text);
	        });
	    });
	});
	
	wrapper.on("resolveFrame", function (frameString, callback) {
	    frameResolver.resolve(frameString, function (err, res) {
	        callback(err, res);
	    });
	});
	
	wrapper.on("registerDynamicFiles", function (files, callback) {
	    frameResolver.addFilesToCache(files);
	    callback();
	});
	
	wrapper.on("getSourceFileContent", function (path, callback) {
	    frameResolver.getSourceFileContent(path, callback);
	});

/***/ }

/******/ });
//# sourceMappingURL=resolveFrameWorker.js.map