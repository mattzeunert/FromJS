/*!
 * qunit-extras
 * Copyright 2011-2016 John-David Dalton <http://allyoucanleet.com/>
 * Based on a gist by Jörn Zaefferer <https://gist.github.com/722381>
 * Available under MIT license <http://mths.be/mit>
 */
;(function() {

  /** Used as a safe reference for `undefined` in pre ES5 environments. */
  var undefined;

  /** Used for built-in method references. */
  var arrayProto = Array.prototype;

  /** Built-in value references. */
  var push = arrayProto.push,
      slice = arrayProto.slice,
      unshift = arrayProto.unshift;

  /** Used as a horizontal rule in console output. */
  var hr = '----------------------------------------';

  /** Used to display the wait throbber. */
  var throbberDelay = 500,
      waitCount = -1;

  /** Used to match parts of the assert message. */
  var reDied = /^Died on test #\d+/;

  /** Used to associate color names with their corresponding codes. */
  var ansiCodes = {
    'bold': 1,
    'green': 32,
    'magenta': 35,
    'red': 31
  };

  /** Detect free variable `global` from Node.js. */
  var freeGlobal = checkGlobal(typeof global == 'object' && global);

  /** Detect free variable `self`. */
  var freeSelf = checkGlobal(typeof self == 'object' && self);

  /** Detect `this` as the global object. */
  var thisGlobal = checkGlobal(typeof this == 'object' && this);

  /** Used as a reference to the global object. */
  var root = freeGlobal || freeSelf || thisGlobal || Function('return this')();

  /** Detect free variable `exports`. */
  var freeExports = freeGlobal && typeof exports == 'object' && exports;

  /** Detect free variable `module`. */
  var freeModule = freeExports && typeof module == 'object' && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /** Detect environment objects. */
  var phantom = root.phantom ,
      document = !phantom && root.document,
      process = phantom || root.process;

  /** Detect environment flags. */
  var isNode = root.process && typeof process.on == 'function',
      isPhantomPage = typeof root.callPhantom == 'function',
      isSilent = document && !isPhantomPage,
      isWindows = isNode && process.platform == 'win32';

  /** Detect if ANSI escape codes are supported. */
  var isAnsiSupported = (function() {
    if (isNode && process.stdout && !process.stdout.isTTY) {
      return false;
    }
    if (isWindows || getEnv('COLORTERM')) {
      return true;
    }
    return /^(?:ansi|cygwin|linux|screen|xterm|vt100)$|color/i.test(getEnv('TERM'));
  }());

  /*--------------------------------------------------------------------------*/

  /**
   * Checks if `value` is a global object.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {null|Object} Returns `value` if it's a global object, else `null`.
   */
  function checkGlobal(value) {
    return (value && value.Object === Object) ? value : null;
  }

  /**
   * Adds text color to the terminal output of `string`.
   *
   * @private
   * @param {string} colorName The name of the color to add.
   * @param {string} string The string to add colors to.
   * @returns {string} Returns the colored string.
   */
  function color(colorName, string) {
    return isAnsiSupported
      ? ('\x1B[' + ansiCodes[colorName] + 'm' + string + '\x1B[0m')
      : string;
  }

  /**
   * Gets the environment variable value by a given name.
   *
   * @private
   * @param {string} name The name of the environment variable to get.
   * @returns {*} Returns the environment variable value.
   */
  function getEnv(name) {
    if (isNode) {
      return process.env[name];
    }
    if (phantom) {
      return require('system').env[name];
    }
  }

  /**
   * Checks if a given value is present in an array using strict equality
   * for comparisons, i.e. `===`.
   *
   * @private
   * @param {Array} array The array to iterate over.
   * @param {*} value The value to check for.
   * @returns {boolean} Returns `true` if the `value` is found, else `false`.
   */
  function includes(array, value) {
    var length = array ? array.length : 0;
    while (length--) {
      if (array[length] === value) {
        return true;
      }
    }
    return false;
  }

  /**
   * Gets the last element of `array`.
   *
   * @private
   * @param {Array} array The array to query.
   * @returns {*} Returns the last element of `array`.
   */
  function last(array) {
    var length = array ? array.length : 0;
    return length ? array[length - 1] : undefined;
  }

  /**
   * Writes an inline message to standard output.
   *
   * @private
   * @param {string} [text=''] The text to log.
   */
  var logInline = (function() {
    if (!isNode || isWindows) {
      return function() {};
    }
    // Cleanup any inline logs when exited via `ctrl+c`.
    process.on('SIGINT', function() {
      logInline();
      process.exit();
    });

    var prevLine = '';
    return function(text) {
      text = text == null ? '' : text;
      if (text.length > hr.length) {
        text = text.slice(0, hr.length - 3) + '...';
      }
      var blankLine = repeat(' ', prevLine.length);
      prevLine = text;
      process.stdout.write(text + blankLine.slice(text.length) + '\r');
    }
  }());

  /**
   * Writes the wait throbber to standard output.
   *
   * @private
   */
  function logThrobber() {
    logInline('Please wait' + repeat('.', (++waitCount % 3) + 1));
  }

  /**
   * Creates a string with `text` repeated `n` number of times.
   *
   * @private
   * @param {string} text The text to repeat.
   * @param {number} n The number of times to repeat `text`.
   * @returns {string} The created string.
   */
  function repeat(text, n) {
    return Array(n + 1).join(text);
  }

  /**
   * Creates a function that provides `value` to the wrapper function as its
   * first argument. Additional arguments provided to the function are appended
   * to those provided to the wrapper function. The wrapper is executed with
   * the `this` binding of the created function.
   *
   * @private
   * @param {*} value The value to wrap.
   * @param {Function} wrapper The wrapper function.
   * @returns {Function} Returns the new function.
   */
  function wrap(value, wrapper) {
    return function() {
      var args = [value];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Installs extras on `QUnit`.
   *
   * @param {Object} QUnit The QUnit object.
   * @returns {Object} Returns `QUnit`.
   */
  function install(QUnit) {

    /**
     * The number of retries async tests have to succeed.
     *
     * @memberOf QUnit.config
     * @type number
     */
    QUnit.config.asyncRetries = 0;

    /**
     * An object of excused tests and assertions.
     *
     * @memberOf QUnit.config
     * @type Object
     */
    QUnit.config.excused = {};

    /**
     * An object used to hold "extras" information about the current running test.
     *
     * @memberOf QUnit.config
     * @type Object
     */
    QUnit.config.extrasData = {

      /**
       * The data object for the active test module.
       *
       * @memberOf QUnit.config.extrasData
       * @type Object
       */
      'module': {},

      /**
       * The data object for Sauce Labs.
       *
       * @memberOf QUnit.config.extrasData
       * @type Object
       */
      'sauce': {

        /**
         * An array of failed test details.
         *
         * @memberOf QUnit.config.extrasData.sauce
         * @type Array
         */
        'tests': []
      }
    };

    /**
     * Converts a number into a string.
     *
     * **Note:** This prevents a JIT bug in Safari 9.
     *
     * @memberOf QUnit
     * @type Function
     * @param {number} number The number to stringify.
     * @returns {string} The result string.
     */
    QUnit.dump.parsers.number = String;

    /*------------------------------------------------------------------------*/

    // Add a callback to be triggered after every assertion.
    QUnit.log(function(details) {
      QUnit.config.extrasData.module.logs.push(details);
    });

    // Add a callback to be triggered at the start of every test module.
    QUnit.moduleStart(function(details) {
      var module = QUnit.config.extrasData.module;
      module.name = details.name;
      module.logs = [];
      module.printed = false;
    });

    // Wrap to flag tests using `assert.async`.
    QUnit.assert.async = wrap(QUnit.assert.async, function(async) {
      this.test.isAsync = true;
      return async.apply(this, slice.call(arguments, 1));
    });

    // Add a callback to be triggered at the start of every test.
    QUnit.testStart(function(details) {
      var config = QUnit.config,
          test = config.current,
          excused = config.excused || {},
          excusedTests = excused[details.module],
          excusedAsserts = excusedTests && excusedTests[details.name];

      // Excuse the entire test.
      if (excusedAsserts === true) {
        test.async = false;
        test.callback = function() {};
        test.expected = 0;
        return;
      }
      // Exit early if test is already wrapped.
      if (test.retries != null) {
        return;
      }
      // Wrap to enable async test retries.
      test.retries = 0;
      test.finish = wrap(test.finish, function(finish) {
        var args = slice.call(arguments, 1);
        if (!this.isAsync) {
          finish.apply(this, args);
          return;
        }
        var asserts = this.assertions,
            config = QUnit.config,
            index = -1,
            length = asserts.length,
            logs = config.extrasData.module.logs,
            queue = config.queue;

        while (++index < length) {
          var assert = asserts[index];
          if (!assert.result && this.retries < config.asyncRetries) {
            var oldLength = queue.length;
            logs.length -= asserts.length;
            asserts.length = 0;

            this.resumed = false;
            this.retries++;
            this.queue();

            unshift.apply(queue, queue.splice(oldLength, queue.length - oldLength));
            return;
          }
        }
        finish.apply(this, args);
      });

      // Wrap to excuse specific assertions.
      test.finish = wrap(test.finish, function(finish) {
        var asserts = this.assertions,
            config = QUnit.config,
            expected = this.expected,
            items = asserts.slice(),
            length = items.length;

        if (expected == null) {
          if (config.requireExpects) {
            expected = length;
            items.push('Expected number of assertions to be defined, but expect() was not called.');
          } else if (!length) {
            expected = 1;
            items.push('Expected at least one assertion, but none were run - call expect(0) to accept zero assertions.');
          }
        } else if (expected != length) {
          items.push('Expected ' + String(expected) + ' assertions, but ' + length + ' were run');
        }
        var index = -1;
        length = items.length;

        while (++index < length) {
          var assert = items[index],
              isStr = typeof assert == 'string',
              assertMessage = isStr ? assert : assert.message,
              assertValue = isStr ? assert : assert.expected,
              assertDied = (reDied.exec(assertMessage) || [''])[0];

          if (includes(excusedAsserts, assertMessage) ||
              includes(excusedAsserts, assertDied) ||
              includes(excusedAsserts, assertValue) ||
              includes(excusedAsserts, String(assertValue).replace(/\s+/g, ''))) {
            if (isStr) {
              while (asserts.length < expected) {
                asserts.push({ 'result': true });
              }
              asserts.length = expected;
            }
            else {
              assert.result = true;
            }
          }
        }
        finish.apply(this, slice.call(arguments, 1));
      });

      // Wrap to add `expected`.
      test.pushResult = wrap(test.pushResult, function(pushResult, details) {
        pushResult.apply(this, slice.call(arguments, 1));
        var assert = last(this.assertions);
        assert.expected = QUnit.dump.parse(details.expected);
      });
    });

    // Add a callback to be triggered after a test is completed.
    QUnit.testDone(function(details) {
      var config = QUnit.config,
          failures = details.failed,
          hidepassed = config.hidepassed;

      if (hidepassed && !failures) {
        return;
      }
      var data = config.extrasData,
          module = data.module,
          moduleLogs = module.logs;

      if (!isSilent) {
        logInline();
        if (!module.printed) {
          module.printed = true;
          console.log(hr);
          console.log(color('bold', module.name));
          console.log(hr);
        }
        console.log(' ' + (failures ? color('red', 'FAIL') : color('green', 'PASS')) + ' - ' + details.name);
      }
      if (!failures) {
        return;
      }
      var index = -1,
          length = moduleLogs.length;

      while(++index < length) {
        var entry = moduleLogs[index],
            result = entry.result;

        if (hidepassed && result) {
          continue;
        }
        var expected = entry.expected,
            type = typeof expected != 'undefined' ? 'EQ' : 'OK';

        var message = [
          result ? color('green', 'PASS') : color('red', 'FAIL'),
          type,
          entry.message || 'ok'
        ];

        if (!result && type == 'EQ') {
          message.push(color('magenta',
            'Expected: ' + (entry.negative ? 'NOT ' : '') + String(expected) + ', ' +
            'Actual: ' + String(entry.actual)
          ));
        }
        if (!isSilent) {
          console.log('    ' + message.join(' | '));
        }
        if (!result) {
          data.sauce.tests.push(entry);
        }
      }
    });

    // Add a callback to be triggered when all testing has completed.
    QUnit.done(function(details) {
      var failures = details.failed,
          statusColor = failures ? 'magenta' : 'green';

      if (!isSilent) {
        logInline();
        console.log(hr);
        console.log(color(statusColor, '    PASS: ' + details.passed + '  FAIL: ' + failures + '  TOTAL: ' + details.total));
        console.log(color(statusColor, '    Finished in ' + details.runtime + ' milliseconds.'));
        console.log(hr);
      }
      // Exit out of Node.js or PhantomJS.
      try {
        if (failures) {
          process.exit(1);
        } else {
          process.exit(0);
        }
      } catch (e) {}

      // Assign results to `global_test_results` for Sauce Labs.
      details.tests = QUnit.config.extrasData.sauce.tests;
      root.global_test_results = details;
    });

    /*------------------------------------------------------------------------*/

    // Add CLI extras.
    if (!document) {
      // Start log throbber.
      if (!isSilent) {
        setInterval(logThrobber, throbberDelay);
      }
      // Must call `QUnit.start` in the test file if not loaded in a browser.
      QUnit.config.autostart = false;
      try { QUnit.init(); } catch (e) {}
    }
    return QUnit;
  }

  /*--------------------------------------------------------------------------*/

  // Install QUnit Extras.
  if (moduleExports) {
    freeModule.exports = install(require('qunitjs'));
  } else {
    install(root.QUnit);
  }
}.call(this));
