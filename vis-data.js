window.visOriginData = {
  "children": [
    {
      "action": "initial html",
      "elIdentifier": "FOOTER",
      "children": [
        {
          "action": "initial html",
          "elIdentifier": "P",
          "children": [],
          "inputValues": []
        },
        {
          "action": "initial html",
          "elIdentifier": "P",
          "children": [
            {
              "action": "initial html",
              "elIdentifier": "A",
              "children": [],
              "inputValues": []
            }
          ],
          "inputValues": []
        },
        {
          "action": "initial html",
          "elIdentifier": "P",
          "children": [
            {
              "action": "initial html",
              "elIdentifier": "A",
              "children": [],
              "inputValues": []
            }
          ],
          "inputValues": []
        }
      ],
      "inputValues": []
    },
    {
      "action": "initial html",
      "elIdentifier": "SCRIPT",
      "children": [],
      "inputValues": []
    },
    {
      "action": "initial html",
      "elIdentifier": "SCRIPT",
      "children": [],
      "inputValues": []
    },
    {
      "action": "initial html",
      "elIdentifier": "SCRIPT",
      "children": [],
      "inputValues": []
    },
    {
      "action": "initial html",
      "elIdentifier": "SCRIPT",
      "children": [],
      "inputValues": []
    },
    {
      "action": "appendChild",
      "elIdentifier": "SCRIPT",
      "stack": [
        "Error",
        "    at HTMLBodyElement.<anonymous> (http://localhost:8000/string-trace.js:204:24)",
        "    at new window.Function (http://localhost:8000/string-trace.js:239:19)",
        "    at Function._.template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1483:20)",
        "    at http://localhost:8000/backbone-todomvc/js/views/todo-view.js:17:15",
        "    at http://localhost:8000/backbone-todomvc/js/views/todo-view.js:122:3"
      ],
      "resolvedStack": [
        {
          "functionName": "render",
          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
          "lineNumber": 1454,
          "columnNumber": 19,
          "prevLine": "    try {",
          "nextLine": "    } catch (e) {",
          "line": "      var render = new Function(settings.variable || 'obj', '_', source);"
        },
        {
          "fileName": "http://localhost:8000/backbone-todomvc/js/views/todo-view-original.js",
          "lineNumber": 16,
          "columnNumber": 14,
          "prevLine": "\t\t// Cache the template function for a single item.",
          "nextLine": "",
          "line": "\t\ttemplate: _.template($('#item-template').html()),"
        },
        {
          "functionName": "clear",
          "fileName": "http://localhost:8000/backbone-todomvc/js/views/todo-view-original.js",
          "lineNumber": 123,
          "columnNumber": 3,
          "prevLine": "\t});",
          "nextLine": "",
          "line": "})(jQuery);"
        }
      ]
    },
    {
      "action": "appendChild",
      "elIdentifier": "SCRIPT",
      "stack": [
        "Error",
        "    at HTMLBodyElement.<anonymous> (http://localhost:8000/string-trace.js:204:24)",
        "    at new window.Function (http://localhost:8000/string-trace.js:239:19)",
        "    at Function._.template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1483:20)",
        "    at http://localhost:8000/backbone-todomvc/js/views/app-view.js:19:20",
        "    at http://localhost:8000/backbone-todomvc/js/views/app-view.js:129:3"
      ],
      "resolvedStack": [
        {
          "functionName": "render",
          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
          "lineNumber": 1454,
          "columnNumber": 19,
          "prevLine": "    try {",
          "nextLine": "    } catch (e) {",
          "line": "      var render = new Function(settings.variable || 'obj', '_', source);"
        },
        {
          "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
          "lineNumber": 18,
          "columnNumber": 19,
          "prevLine": "\t\t// Our template for the line of statistics at the bottom of the app.",
          "nextLine": "",
          "line": "\t\tstatsTemplate: _.template($('#stats-template').html()),"
        },
        {
          "functionName": "toggleAllComplete",
          "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
          "lineNumber": 131,
          "columnNumber": 3,
          "prevLine": "\t});",
          "nextLine": "",
          "line": "})(jQuery);"
        }
      ]
    },
    {
      "action": "initial html",
      "elIdentifier": "SECTION",
      "children": [
        {
          "action": "initial html",
          "elIdentifier": "HEADER",
          "children": [
            {
              "action": "initial html",
              "elIdentifier": "H1",
              "children": [],
              "inputValues": []
            },
            {
              "action": "initial html",
              "elIdentifier": "INPUT",
              "children": [],
              "inputValues": []
            }
          ],
          "inputValues": []
        },
        {
          "action": "initial html",
          "elIdentifier": "FOOTER",
          "children": [
            {
              "inputValues": [
                {
                  "action": "replace call",
                  "inputValues": [
                    {
                      "action": "concat",
                      "inputValues": [
                        {
                          "action": "concat",
                          "inputValues": [
                            {
                              "action": "string literal",
                              "inputValues": [
                                null
                              ],
                              "value": "",
                              "stack": [
                                "Error",
                                "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                "    at stringTrace (http://localhost:8000/string-trace.js:112:17)",
                                "    at fn05961585486058731 (Function05961585486058731.js:2:11)",
                                "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                "    at template [as statsTemplate] (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                "    at app.AppView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/app-view.js:60:28)",
                                "    at later (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:851:25)"
                              ],
                              "resolvedStack": [
                                {
                                  "functionName": "print",
                                  "fileName": "unknown",
                                  "lineNumber": 1,
                                  "columnNumber": 8,
                                  "nextLine": "with(obj||{}){",
                                  "line": "var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};"
                                },
                                {
                                  "functionName": "template",
                                  "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                  "lineNumber": 1461,
                                  "columnNumber": 20,
                                  "prevLine": "    var template = function(data) {",
                                  "nextLine": "    };",
                                  "line": "      return render.call(this, data, _);"
                                },
                                {
                                  "functionName": "render",
                                  "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                  "lineNumber": 59,
                                  "columnNumber": 27,
                                  "prevLine": "",
                                  "nextLine": "\t\t\t\t\tcompleted: completed,",
                                  "line": "\t\t\t\tthis.$footer.html(this.statsTemplate({"
                                },
                                {
                                  "functionName": "later",
                                  "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                  "lineNumber": 828,
                                  "columnNumber": 24,
                                  "prevLine": "        if (!immediate) {",
                                  "nextLine": "          if (!timeout) context = args = null;",
                                  "line": "          result = func.apply(context, args);"
                                }
                              ]
                            },
                            {
                              "action": "concat",
                              "inputValues": [
                                {
                                  "action": "concat",
                                  "inputValues": [
                                    {
                                      "action": "concat",
                                      "inputValues": [
                                        {
                                          "action": "concat",
                                          "inputValues": [
                                            {
                                              "action": "string literal",
                                              "inputValues": [
                                                null
                                              ],
                                              "value": "\n\t\t\t<span class=\"todo-count\"><strong>",
                                              "stack": [
                                                "Error",
                                                "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                                "    at stringTrace (http://localhost:8000/string-trace.js:112:17)",
                                                "    at fn05961585486058731 (Function05961585486058731.js:8:89)",
                                                "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                                "    at template [as statsTemplate] (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                                "    at app.AppView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/app-view.js:60:28)",
                                                "    at later (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:851:25)"
                                              ],
                                              "resolvedStack": [
                                                {
                                                  "functionName": "print",
                                                  "fileName": "unknown",
                                                  "lineNumber": 3,
                                                  "columnNumber": 0,
                                                  "prevLine": "with(obj||{}){",
                                                  "nextLine": "((__t=( remaining ))==null?'':__t)+",
                                                  "line": "__p+='\\n\t\t\t<span class=\"todo-count\"><strong>'+"
                                                },
                                                {
                                                  "functionName": "template",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                  "lineNumber": 1461,
                                                  "columnNumber": 20,
                                                  "prevLine": "    var template = function(data) {",
                                                  "nextLine": "    };",
                                                  "line": "      return render.call(this, data, _);"
                                                },
                                                {
                                                  "functionName": "render",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                                  "lineNumber": 59,
                                                  "columnNumber": 27,
                                                  "prevLine": "",
                                                  "nextLine": "\t\t\t\t\tcompleted: completed,",
                                                  "line": "\t\t\t\tthis.$footer.html(this.statsTemplate({"
                                                },
                                                {
                                                  "functionName": "later",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                  "lineNumber": 828,
                                                  "columnNumber": 24,
                                                  "prevLine": "        if (!immediate) {",
                                                  "nextLine": "          if (!timeout) context = args = null;",
                                                  "line": "          result = func.apply(context, args);"
                                                }
                                              ]
                                            },
                                            null
                                          ],
                                          "value": "\n\t\t\t<span class=\"todo-count\"><strong>1",
                                          "stack": [
                                            "Error",
                                            "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                            "    at stringTraceAdd (http://localhost:8000/string-trace.js:149:17)",
                                            "    at fn05961585486058731 (Function05961585486058731.js:8:74)",
                                            "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                            "    at template [as statsTemplate] (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                            "    at app.AppView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/app-view.js:60:28)",
                                            "    at later (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:851:25)"
                                          ],
                                          "resolvedStack": [
                                            {
                                              "functionName": "print",
                                              "fileName": "unknown",
                                              "lineNumber": 3,
                                              "columnNumber": 0,
                                              "prevLine": "with(obj||{}){",
                                              "nextLine": "((__t=( remaining ))==null?'':__t)+",
                                              "line": "__p+='\\n\t\t\t<span class=\"todo-count\"><strong>'+"
                                            },
                                            {
                                              "functionName": "template",
                                              "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                              "lineNumber": 1461,
                                              "columnNumber": 20,
                                              "prevLine": "    var template = function(data) {",
                                              "nextLine": "    };",
                                              "line": "      return render.call(this, data, _);"
                                            },
                                            {
                                              "functionName": "render",
                                              "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                              "lineNumber": 59,
                                              "columnNumber": 27,
                                              "prevLine": "",
                                              "nextLine": "\t\t\t\t\tcompleted: completed,",
                                              "line": "\t\t\t\tthis.$footer.html(this.statsTemplate({"
                                            },
                                            {
                                              "functionName": "later",
                                              "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                              "lineNumber": 828,
                                              "columnNumber": 24,
                                              "prevLine": "        if (!immediate) {",
                                              "nextLine": "          if (!timeout) context = args = null;",
                                              "line": "          result = func.apply(context, args);"
                                            }
                                          ]
                                        },
                                        {
                                          "action": "string literal",
                                          "inputValues": [
                                            null
                                          ],
                                          "value": "</strong> ",
                                          "stack": [
                                            "Error",
                                            "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                            "    at stringTrace (http://localhost:8000/string-trace.js:112:17)",
                                            "    at fn05961585486058731 (Function05961585486058731.js:8:220)",
                                            "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                            "    at template [as statsTemplate] (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                            "    at app.AppView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/app-view.js:60:28)",
                                            "    at later (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:851:25)"
                                          ],
                                          "resolvedStack": [
                                            {
                                              "functionName": "print",
                                              "fileName": "unknown",
                                              "lineNumber": 3,
                                              "columnNumber": 0,
                                              "prevLine": "with(obj||{}){",
                                              "nextLine": "((__t=( remaining ))==null?'':__t)+",
                                              "line": "__p+='\\n\t\t\t<span class=\"todo-count\"><strong>'+"
                                            },
                                            {
                                              "functionName": "template",
                                              "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                              "lineNumber": 1461,
                                              "columnNumber": 20,
                                              "prevLine": "    var template = function(data) {",
                                              "nextLine": "    };",
                                              "line": "      return render.call(this, data, _);"
                                            },
                                            {
                                              "functionName": "render",
                                              "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                              "lineNumber": 59,
                                              "columnNumber": 27,
                                              "prevLine": "",
                                              "nextLine": "\t\t\t\t\tcompleted: completed,",
                                              "line": "\t\t\t\tthis.$footer.html(this.statsTemplate({"
                                            },
                                            {
                                              "functionName": "later",
                                              "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                              "lineNumber": 828,
                                              "columnNumber": 24,
                                              "prevLine": "        if (!immediate) {",
                                              "nextLine": "          if (!timeout) context = args = null;",
                                              "line": "          result = func.apply(context, args);"
                                            }
                                          ]
                                        }
                                      ],
                                      "value": "\n\t\t\t<span class=\"todo-count\"><strong>1</strong> ",
                                      "stack": [
                                        "Error",
                                        "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                        "    at stringTraceAdd (http://localhost:8000/string-trace.js:149:17)",
                                        "    at fn05961585486058731 (Function05961585486058731.js:8:59)",
                                        "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                        "    at template [as statsTemplate] (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                        "    at app.AppView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/app-view.js:60:28)",
                                        "    at later (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:851:25)"
                                      ],
                                      "resolvedStack": [
                                        {
                                          "functionName": "print",
                                          "fileName": "unknown",
                                          "lineNumber": 3,
                                          "columnNumber": 0,
                                          "prevLine": "with(obj||{}){",
                                          "nextLine": "((__t=( remaining ))==null?'':__t)+",
                                          "line": "__p+='\\n\t\t\t<span class=\"todo-count\"><strong>'+"
                                        },
                                        {
                                          "functionName": "template",
                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                          "lineNumber": 1461,
                                          "columnNumber": 20,
                                          "prevLine": "    var template = function(data) {",
                                          "nextLine": "    };",
                                          "line": "      return render.call(this, data, _);"
                                        },
                                        {
                                          "functionName": "render",
                                          "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                          "lineNumber": 59,
                                          "columnNumber": 27,
                                          "prevLine": "",
                                          "nextLine": "\t\t\t\t\tcompleted: completed,",
                                          "line": "\t\t\t\tthis.$footer.html(this.statsTemplate({"
                                        },
                                        {
                                          "functionName": "later",
                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                          "lineNumber": 828,
                                          "columnNumber": 24,
                                          "prevLine": "        if (!immediate) {",
                                          "nextLine": "          if (!timeout) context = args = null;",
                                          "line": "          result = func.apply(context, args);"
                                        }
                                      ]
                                    },
                                    {
                                      "action": "string literal",
                                      "inputValues": [
                                        null
                                      ],
                                      "value": "item",
                                      "stack": [
                                        "Error",
                                        "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                        "    at stringTrace (http://localhost:8000/string-trace.js:112:17)",
                                        "    at fn05961585486058731 (Function05961585486058731.js:8:335)",
                                        "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                        "    at template [as statsTemplate] (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                        "    at app.AppView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/app-view.js:60:28)",
                                        "    at later (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:851:25)"
                                      ],
                                      "resolvedStack": [
                                        {
                                          "functionName": "print",
                                          "fileName": "unknown",
                                          "lineNumber": 6,
                                          "columnNumber": 2,
                                          "prevLine": "'</strong> '+",
                                          "nextLine": "' left</span>\\n\t\t\t<ul class=\"filters\">\\n\t\t\t\t<li>\\n\t\t\t\t\t<a class=\"selected\" href=\"#/\">All</a>\\n\t\t\t\t</li>\\n\t\t\t\t<li>\\n\t\t\t\t\t<a href=\"#/active\">Active</a>\\n\t\t\t\t</li>\\n\t\t\t\t<li>\\n\t\t\t\t\t<a href=\"#/completed\">Completed</a>\\n\t\t\t\t</li>\\n\t\t\t</ul>\\n\t\t\t';",
                                          "line": "((__t=( remaining === 1 ? 'item' : 'items' ))==null?'':__t)+"
                                        },
                                        {
                                          "functionName": "template",
                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                          "lineNumber": 1461,
                                          "columnNumber": 20,
                                          "prevLine": "    var template = function(data) {",
                                          "nextLine": "    };",
                                          "line": "      return render.call(this, data, _);"
                                        },
                                        {
                                          "functionName": "render",
                                          "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                          "lineNumber": 59,
                                          "columnNumber": 27,
                                          "prevLine": "",
                                          "nextLine": "\t\t\t\t\tcompleted: completed,",
                                          "line": "\t\t\t\tthis.$footer.html(this.statsTemplate({"
                                        },
                                        {
                                          "functionName": "later",
                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                          "lineNumber": 828,
                                          "columnNumber": 24,
                                          "prevLine": "        if (!immediate) {",
                                          "nextLine": "          if (!timeout) context = args = null;",
                                          "line": "          result = func.apply(context, args);"
                                        }
                                      ]
                                    }
                                  ],
                                  "value": "\n\t\t\t<span class=\"todo-count\"><strong>1</strong> item",
                                  "stack": [
                                    "Error",
                                    "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                    "    at stringTraceAdd (http://localhost:8000/string-trace.js:149:17)",
                                    "    at fn05961585486058731 (Function05961585486058731.js:8:44)",
                                    "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                    "    at template [as statsTemplate] (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                    "    at app.AppView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/app-view.js:60:28)",
                                    "    at later (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:851:25)"
                                  ],
                                  "resolvedStack": [
                                    {
                                      "functionName": "print",
                                      "fileName": "unknown",
                                      "lineNumber": 3,
                                      "columnNumber": 0,
                                      "prevLine": "with(obj||{}){",
                                      "nextLine": "((__t=( remaining ))==null?'':__t)+",
                                      "line": "__p+='\\n\t\t\t<span class=\"todo-count\"><strong>'+"
                                    },
                                    {
                                      "functionName": "template",
                                      "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                      "lineNumber": 1461,
                                      "columnNumber": 20,
                                      "prevLine": "    var template = function(data) {",
                                      "nextLine": "    };",
                                      "line": "      return render.call(this, data, _);"
                                    },
                                    {
                                      "functionName": "render",
                                      "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                      "lineNumber": 59,
                                      "columnNumber": 27,
                                      "prevLine": "",
                                      "nextLine": "\t\t\t\t\tcompleted: completed,",
                                      "line": "\t\t\t\tthis.$footer.html(this.statsTemplate({"
                                    },
                                    {
                                      "functionName": "later",
                                      "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                      "lineNumber": 828,
                                      "columnNumber": 24,
                                      "prevLine": "        if (!immediate) {",
                                      "nextLine": "          if (!timeout) context = args = null;",
                                      "line": "          result = func.apply(context, args);"
                                    }
                                  ]
                                },
                                {
                                  "action": "string literal",
                                  "inputValues": [
                                    null
                                  ],
                                  "value": " left</span>\n\t\t\t<ul class=\"filters\">\n\t\t\t\t<li>\n\t\t\t\t\t<a class=\"selected\" href=\"#/\">All</a>\n\t\t\t\t</li>\n\t\t\t\t<li>\n\t\t\t\t\t<a href=\"#/active\">Active</a>\n\t\t\t\t</li>\n\t\t\t\t<li>\n\t\t\t\t\t<a href=\"#/completed\">Completed</a>\n\t\t\t\t</li>\n\t\t\t</ul>\n\t\t\t",
                                  "stack": [
                                    "Error",
                                    "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                    "    at stringTrace (http://localhost:8000/string-trace.js:112:17)",
                                    "    at fn05961585486058731 (Function05961585486058731.js:8:414)",
                                    "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                    "    at template [as statsTemplate] (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                    "    at app.AppView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/app-view.js:60:28)",
                                    "    at later (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:851:25)"
                                  ],
                                  "resolvedStack": [
                                    {
                                      "functionName": "print",
                                      "fileName": "unknown",
                                      "lineNumber": 3,
                                      "columnNumber": 0,
                                      "prevLine": "with(obj||{}){",
                                      "nextLine": "((__t=( remaining ))==null?'':__t)+",
                                      "line": "__p+='\\n\t\t\t<span class=\"todo-count\"><strong>'+"
                                    },
                                    {
                                      "functionName": "template",
                                      "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                      "lineNumber": 1461,
                                      "columnNumber": 20,
                                      "prevLine": "    var template = function(data) {",
                                      "nextLine": "    };",
                                      "line": "      return render.call(this, data, _);"
                                    },
                                    {
                                      "functionName": "render",
                                      "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                      "lineNumber": 59,
                                      "columnNumber": 27,
                                      "prevLine": "",
                                      "nextLine": "\t\t\t\t\tcompleted: completed,",
                                      "line": "\t\t\t\tthis.$footer.html(this.statsTemplate({"
                                    },
                                    {
                                      "functionName": "later",
                                      "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                      "lineNumber": 828,
                                      "columnNumber": 24,
                                      "prevLine": "        if (!immediate) {",
                                      "nextLine": "          if (!timeout) context = args = null;",
                                      "line": "          result = func.apply(context, args);"
                                    }
                                  ]
                                }
                              ],
                              "value": "\n\t\t\t<span class=\"todo-count\"><strong>1</strong> item left</span>\n\t\t\t<ul class=\"filters\">\n\t\t\t\t<li>\n\t\t\t\t\t<a class=\"selected\" href=\"#/\">All</a>\n\t\t\t\t</li>\n\t\t\t\t<li>\n\t\t\t\t\t<a href=\"#/active\">Active</a>\n\t\t\t\t</li>\n\t\t\t\t<li>\n\t\t\t\t\t<a href=\"#/completed\">Completed</a>\n\t\t\t\t</li>\n\t\t\t</ul>\n\t\t\t",
                              "stack": [
                                "Error",
                                "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                "    at stringTraceAdd (http://localhost:8000/string-trace.js:149:17)",
                                "    at fn05961585486058731 (Function05961585486058731.js:8:29)",
                                "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                "    at template [as statsTemplate] (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                "    at app.AppView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/app-view.js:60:28)",
                                "    at later (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:851:25)"
                              ],
                              "resolvedStack": [
                                {
                                  "functionName": "print",
                                  "fileName": "unknown",
                                  "lineNumber": 3,
                                  "columnNumber": 0,
                                  "prevLine": "with(obj||{}){",
                                  "nextLine": "((__t=( remaining ))==null?'':__t)+",
                                  "line": "__p+='\\n\t\t\t<span class=\"todo-count\"><strong>'+"
                                },
                                {
                                  "functionName": "template",
                                  "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                  "lineNumber": 1461,
                                  "columnNumber": 20,
                                  "prevLine": "    var template = function(data) {",
                                  "nextLine": "    };",
                                  "line": "      return render.call(this, data, _);"
                                },
                                {
                                  "functionName": "render",
                                  "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                  "lineNumber": 59,
                                  "columnNumber": 27,
                                  "prevLine": "",
                                  "nextLine": "\t\t\t\t\tcompleted: completed,",
                                  "line": "\t\t\t\tthis.$footer.html(this.statsTemplate({"
                                },
                                {
                                  "functionName": "later",
                                  "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                  "lineNumber": 828,
                                  "columnNumber": 24,
                                  "prevLine": "        if (!immediate) {",
                                  "nextLine": "          if (!timeout) context = args = null;",
                                  "line": "          result = func.apply(context, args);"
                                }
                              ]
                            }
                          ],
                          "value": "\n\t\t\t<span class=\"todo-count\"><strong>1</strong> item left</span>\n\t\t\t<ul class=\"filters\">\n\t\t\t\t<li>\n\t\t\t\t\t<a class=\"selected\" href=\"#/\">All</a>\n\t\t\t\t</li>\n\t\t\t\t<li>\n\t\t\t\t\t<a href=\"#/active\">Active</a>\n\t\t\t\t</li>\n\t\t\t\t<li>\n\t\t\t\t\t<a href=\"#/completed\">Completed</a>\n\t\t\t\t</li>\n\t\t\t</ul>\n\t\t\t",
                          "stack": [
                            "Error",
                            "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                            "    at stringTraceAdd (http://localhost:8000/string-trace.js:149:17)",
                            "    at fn05961585486058731 (Function05961585486058731.js:8:9)",
                            "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                            "    at template [as statsTemplate] (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                            "    at app.AppView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/app-view.js:60:28)",
                            "    at later (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:851:25)"
                          ],
                          "resolvedStack": [
                            {
                              "functionName": "print",
                              "fileName": "unknown",
                              "lineNumber": 3,
                              "columnNumber": 0,
                              "prevLine": "with(obj||{}){",
                              "nextLine": "((__t=( remaining ))==null?'':__t)+",
                              "line": "__p+='\\n\t\t\t<span class=\"todo-count\"><strong>'+"
                            },
                            {
                              "functionName": "template",
                              "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                              "lineNumber": 1461,
                              "columnNumber": 20,
                              "prevLine": "    var template = function(data) {",
                              "nextLine": "    };",
                              "line": "      return render.call(this, data, _);"
                            },
                            {
                              "functionName": "render",
                              "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                              "lineNumber": 59,
                              "columnNumber": 27,
                              "prevLine": "",
                              "nextLine": "\t\t\t\t\tcompleted: completed,",
                              "line": "\t\t\t\tthis.$footer.html(this.statsTemplate({"
                            },
                            {
                              "functionName": "later",
                              "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                              "lineNumber": 828,
                              "columnNumber": 24,
                              "prevLine": "        if (!immediate) {",
                              "nextLine": "          if (!timeout) context = args = null;",
                              "line": "          result = func.apply(context, args);"
                            }
                          ]
                        },
                        {
                          "action": "string literal",
                          "inputValues": [
                            null
                          ],
                          "value": "\n\t\t",
                          "stack": [
                            "Error",
                            "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                            "    at stringTrace (http://localhost:8000/string-trace.js:112:17)",
                            "    at fn05961585486058731 (Function05961585486058731.js:12:29)",
                            "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                            "    at template [as statsTemplate] (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                            "    at app.AppView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/app-view.js:60:28)",
                            "    at later (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:851:25)"
                          ],
                          "resolvedStack": [
                            {
                              "functionName": "print",
                              "fileName": "unknown",
                              "lineNumber": 11,
                              "columnNumber": 0,
                              "prevLine": " } ",
                              "nextLine": "}",
                              "line": "__p+='\\n\t\t';"
                            },
                            {
                              "functionName": "template",
                              "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                              "lineNumber": 1461,
                              "columnNumber": 20,
                              "prevLine": "    var template = function(data) {",
                              "nextLine": "    };",
                              "line": "      return render.call(this, data, _);"
                            },
                            {
                              "functionName": "render",
                              "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                              "lineNumber": 59,
                              "columnNumber": 27,
                              "prevLine": "",
                              "nextLine": "\t\t\t\t\tcompleted: completed,",
                              "line": "\t\t\t\tthis.$footer.html(this.statsTemplate({"
                            },
                            {
                              "functionName": "later",
                              "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                              "lineNumber": 828,
                              "columnNumber": 24,
                              "prevLine": "        if (!immediate) {",
                              "nextLine": "          if (!timeout) context = args = null;",
                              "line": "          result = func.apply(context, args);"
                            }
                          ]
                        }
                      ],
                      "value": "\n\t\t\t<span class=\"todo-count\"><strong>1</strong> item left</span>\n\t\t\t<ul class=\"filters\">\n\t\t\t\t<li>\n\t\t\t\t\t<a class=\"selected\" href=\"#/\">All</a>\n\t\t\t\t</li>\n\t\t\t\t<li>\n\t\t\t\t\t<a href=\"#/active\">Active</a>\n\t\t\t\t</li>\n\t\t\t\t<li>\n\t\t\t\t\t<a href=\"#/completed\">Completed</a>\n\t\t\t\t</li>\n\t\t\t</ul>\n\t\t\t\n\t\t",
                      "stack": [
                        "Error",
                        "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                        "    at stringTraceAdd (http://localhost:8000/string-trace.js:149:17)",
                        "    at fn05961585486058731 (Function05961585486058731.js:12:9)",
                        "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                        "    at template [as statsTemplate] (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                        "    at app.AppView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/app-view.js:60:28)",
                        "    at later (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:851:25)"
                      ],
                      "resolvedStack": [
                        {
                          "functionName": "print",
                          "fileName": "unknown",
                          "lineNumber": 11,
                          "columnNumber": 0,
                          "prevLine": " } ",
                          "nextLine": "}",
                          "line": "__p+='\\n\t\t';"
                        },
                        {
                          "functionName": "template",
                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                          "lineNumber": 1461,
                          "columnNumber": 20,
                          "prevLine": "    var template = function(data) {",
                          "nextLine": "    };",
                          "line": "      return render.call(this, data, _);"
                        },
                        {
                          "functionName": "render",
                          "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                          "lineNumber": 59,
                          "columnNumber": 27,
                          "prevLine": "",
                          "nextLine": "\t\t\t\t\tcompleted: completed,",
                          "line": "\t\t\t\tthis.$footer.html(this.statsTemplate({"
                        },
                        {
                          "functionName": "later",
                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                          "lineNumber": 828,
                          "columnNumber": 24,
                          "prevLine": "        if (!immediate) {",
                          "nextLine": "          if (!timeout) context = args = null;",
                          "line": "          result = func.apply(context, args);"
                        }
                      ]
                    },
                    {
                      "action": "arg_/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\\w:]+)[^>]*)\\/>/gi"
                    },
                    {
                      "action": "arg_<$1></$2>"
                    }
                  ],
                  "value": "\n\t\t\t<span class=\"todo-count\"><strong>1</strong> item left</span>\n\t\t\t<ul class=\"filters\">\n\t\t\t\t<li>\n\t\t\t\t\t<a class=\"selected\" href=\"#/\">All</a>\n\t\t\t\t</li>\n\t\t\t\t<li>\n\t\t\t\t\t<a href=\"#/active\">Active</a>\n\t\t\t\t</li>\n\t\t\t\t<li>\n\t\t\t\t\t<a href=\"#/completed\">Completed</a>\n\t\t\t\t</li>\n\t\t\t</ul>\n\t\t\t\n\t\t",
                  "stack": [
                    "Error",
                    "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                    "    at Proxy.StringTraceString.(anonymous function) (http://localhost:8000/string-trace.js:45:33)",
                    "    at .<anonymous> (http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery.js:901:250)",
                    "    at jQuery.access (http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery.js:632:12)",
                    "    at jQuery.fn.extend.html (http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery.js:900:396)",
                    "    at app.AppView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/app-view.js:60:18)",
                    "    at later (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:851:25)"
                  ],
                  "resolvedStack": [
                    {
                      "functionName": "html",
                      "fileName": "http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery-original.js",
                      "lineNumber": 5313,
                      "columnNumber": 18,
                      "prevLine": "",
                      "nextLine": "",
                      "line": "\t\t\t\tvalue = value.replace( rxhtmlTag, \"<$1></$2>\" );"
                    },
                    {
                      "functionName": "jQuery.access",
                      "fileName": "http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery-original.js",
                      "lineNumber": 3491,
                      "columnNumber": 7,
                      "prevLine": "\t\t\tif ( raw ) {",
                      "nextLine": "\t\t\t\tfn = null;",
                      "line": "\t\t\t\tfn.call( elems, value );"
                    },
                    {
                      "functionName": "html",
                      "fileName": "http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery-original.js",
                      "lineNumber": 5300,
                      "columnNumber": 9,
                      "prevLine": "\thtml: function( value ) {",
                      "nextLine": "\t\t\tvar elem = this[ 0 ] || {},",
                      "line": "\t\treturn access( this, function( value ) {"
                    },
                    {
                      "functionName": "render",
                      "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                      "lineNumber": 59,
                      "columnNumber": 17,
                      "prevLine": "",
                      "nextLine": "\t\t\t\t\tcompleted: completed,",
                      "line": "\t\t\t\tthis.$footer.html(this.statsTemplate({"
                    },
                    {
                      "functionName": "later",
                      "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                      "lineNumber": 828,
                      "columnNumber": 24,
                      "prevLine": "        if (!immediate) {",
                      "nextLine": "          if (!timeout) context = args = null;",
                      "line": "          result = func.apply(context, args);"
                    }
                  ]
                }
              ],
              "action": "assign innerHTML",
              "stack": [
                "Error",
                "    at Error (native)",
                "    at stringTraceSetInnerHTML (http://localhost:8000/string-trace.js:176:20)",
                "    at .<anonymous> (http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery.js:902:82)",
                "    at jQuery.access (http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery.js:632:12)",
                "    at jQuery.fn.extend.html (http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery.js:900:396)",
                "    at app.AppView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/app-view.js:60:18)",
                "    at later (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:851:25)"
              ],
              "resolvedStack": [
                {
                  "functionName": ".<anonymous>",
                  "fileName": "http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery-original.js",
                  "lineNumber": 5321,
                  "columnNumber": 49,
                  "prevLine": "\t\t\t\t\t\tif ( elem.nodeType === 1 ) {",
                  "nextLine": "\t\t\t\t\t\t\telem.innerHTML = value;",
                  "line": "\t\t\t\t\t\t\tjQuery.cleanData( getAll( elem, false ) );"
                },
                {
                  "functionName": "jQuery.access",
                  "fileName": "http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery-original.js",
                  "lineNumber": 3491,
                  "columnNumber": 7,
                  "prevLine": "\t\t\tif ( raw ) {",
                  "nextLine": "\t\t\t\tfn = null;",
                  "line": "\t\t\t\tfn.call( elems, value );"
                },
                {
                  "functionName": "html",
                  "fileName": "http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery-original.js",
                  "lineNumber": 5300,
                  "columnNumber": 9,
                  "prevLine": "\thtml: function( value ) {",
                  "nextLine": "\t\t\tvar elem = this[ 0 ] || {},",
                  "line": "\t\treturn access( this, function( value ) {"
                },
                {
                  "functionName": "render",
                  "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                  "lineNumber": 59,
                  "columnNumber": 17,
                  "prevLine": "",
                  "nextLine": "\t\t\t\t\tcompleted: completed,",
                  "line": "\t\t\t\tthis.$footer.html(this.statsTemplate({"
                },
                {
                  "functionName": "later",
                  "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                  "lineNumber": 828,
                  "columnNumber": 24,
                  "prevLine": "        if (!immediate) {",
                  "nextLine": "          if (!timeout) context = args = null;",
                  "line": "          result = func.apply(context, args);"
                }
              ]
            }
          ],
          "inputValues": []
        },
        {
          "action": "initial html",
          "elIdentifier": "SECTION",
          "children": [
            {
              "action": "initial html",
              "elIdentifier": "INPUT",
              "children": [],
              "inputValues": []
            },
            {
              "action": "initial html",
              "elIdentifier": "LABEL",
              "children": [],
              "inputValues": []
            },
            {
              "action": "initial html",
              "elIdentifier": "UL",
              "children": [
                {
                  "inputValues": [
                    {
                      "action": "replace call",
                      "inputValues": [
                        {
                          "action": "string literal",
                          "inputValues": [
                            null
                          ],
                          "value": "",
                          "stack": [
                            "Error",
                            "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                            "    at stringTrace (http://localhost:8000/string-trace.js:112:17)",
                            "    at app.AppView.Backbone.View.extend.addAll (http://localhost:8000/backbone-todomvc/js/views/app-view.js:83:20)",
                            "    at triggerEvents (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:392:72)",
                            "    at triggerApi (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:365:19)",
                            "    at eventsApi (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:164:16)",
                            "    at Events.trigger (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:355:5)",
                            "    at _.extend.reset (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:963:33)",
                            "    at Object.options.success (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:1054:27)",
                            "    at Backbone.LocalStorage.sync.window.Store.sync.Backbone.localSync (http://localhost:8000/backbone-todomvc/modules/backbone.localstorage/backbone.localStorage.js:205:19)"
                          ],
                          "resolvedStack": [
                            {
                              "functionName": "addAll",
                              "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                              "lineNumber": 85,
                              "columnNumber": 18,
                              "prevLine": "\t\taddAll: function () {",
                              "nextLine": "\t\t\tapp.todos.each(this.addOne, this);",
                              "line": "\t\t\tthis.$list.html('');"
                            },
                            {
                              "functionName": "triggerEvents",
                              "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                              "lineNumber": 370,
                              "columnNumber": 56,
                              "prevLine": "      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;",
                              "nextLine": "      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;",
                              "line": "      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;"
                            },
                            {
                              "functionName": "triggerApi",
                              "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                              "lineNumber": 356,
                              "columnNumber": 18,
                              "prevLine": "      if (events && allEvents) allEvents = allEvents.slice();",
                              "nextLine": "      if (allEvents) triggerEvents(allEvents, [name].concat(args));",
                              "line": "      if (events) triggerEvents(events, args);"
                            },
                            {
                              "functionName": "eventsApi",
                              "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                              "lineNumber": 155,
                              "columnNumber": 15,
                              "prevLine": "      // Finally, standard events.",
                              "nextLine": "    }",
                              "line": "      events = iteratee(events, name, callback, opts);"
                            },
                            {
                              "functionName": "trigger",
                              "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                              "lineNumber": 346,
                              "columnNumber": 4,
                              "prevLine": "",
                              "nextLine": "    return this;",
                              "line": "    eventsApi(triggerApi, this._events, name, void 0, args);"
                            },
                            {
                              "functionName": "reset",
                              "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                              "lineNumber": 934,
                              "columnNumber": 32,
                              "prevLine": "      models = this.add(models, _.extend({silent: true}, options));",
                              "nextLine": "      return models;",
                              "line": "      if (!options.silent) this.trigger('reset', this, options);"
                            },
                            {
                              "functionName": "success",
                              "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                              "lineNumber": 1025,
                              "columnNumber": 27,
                              "prevLine": "        var method = options.reset ? 'reset' : 'set';",
                              "nextLine": "        if (success) success.call(options.context, collection, resp, options);",
                              "line": "        collection[method](resp, options);"
                            },
                            {
                              "functionName": "Backbone.LocalStorage.sync.window.Store.sync.Backbone.localSync",
                              "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone.localstorage/backbone.localstorage-original.js",
                              "lineNumber": 210,
                              "columnNumber": 16,
                              "prevLine": "      } else {",
                              "nextLine": "      }",
                              "line": "        options.success(resp);"
                            }
                          ]
                        },
                        {
                          "action": "arg_/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\\w:]+)[^>]*)\\/>/gi"
                        },
                        {
                          "action": "arg_<$1></$2>"
                        }
                      ],
                      "value": "",
                      "stack": [
                        "Error",
                        "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                        "    at Proxy.StringTraceString.(anonymous function) (http://localhost:8000/string-trace.js:45:33)",
                        "    at .<anonymous> (http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery.js:901:250)",
                        "    at jQuery.access (http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery.js:632:12)",
                        "    at jQuery.fn.extend.html (http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery.js:900:396)",
                        "    at app.AppView.Backbone.View.extend.addAll (http://localhost:8000/backbone-todomvc/js/views/app-view.js:83:15)",
                        "    at triggerEvents (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:392:72)",
                        "    at triggerApi (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:365:19)",
                        "    at eventsApi (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:164:16)",
                        "    at Events.trigger (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:355:5)"
                      ],
                      "resolvedStack": [
                        {
                          "functionName": "html",
                          "fileName": "http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery-original.js",
                          "lineNumber": 5313,
                          "columnNumber": 18,
                          "prevLine": "",
                          "nextLine": "",
                          "line": "\t\t\t\tvalue = value.replace( rxhtmlTag, \"<$1></$2>\" );"
                        },
                        {
                          "functionName": "jQuery.access",
                          "fileName": "http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery-original.js",
                          "lineNumber": 3491,
                          "columnNumber": 7,
                          "prevLine": "\t\t\tif ( raw ) {",
                          "nextLine": "\t\t\t\tfn = null;",
                          "line": "\t\t\t\tfn.call( elems, value );"
                        },
                        {
                          "functionName": "html",
                          "fileName": "http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery-original.js",
                          "lineNumber": 5300,
                          "columnNumber": 9,
                          "prevLine": "\thtml: function( value ) {",
                          "nextLine": "\t\t\tvar elem = this[ 0 ] || {},",
                          "line": "\t\treturn access( this, function( value ) {"
                        },
                        {
                          "functionName": "addAll",
                          "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                          "lineNumber": 85,
                          "columnNumber": 14,
                          "prevLine": "\t\taddAll: function () {",
                          "nextLine": "\t\t\tapp.todos.each(this.addOne, this);",
                          "line": "\t\t\tthis.$list.html('');"
                        },
                        {
                          "functionName": "triggerEvents",
                          "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                          "lineNumber": 370,
                          "columnNumber": 56,
                          "prevLine": "      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;",
                          "nextLine": "      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;",
                          "line": "      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;"
                        },
                        {
                          "functionName": "triggerApi",
                          "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                          "lineNumber": 356,
                          "columnNumber": 18,
                          "prevLine": "      if (events && allEvents) allEvents = allEvents.slice();",
                          "nextLine": "      if (allEvents) triggerEvents(allEvents, [name].concat(args));",
                          "line": "      if (events) triggerEvents(events, args);"
                        },
                        {
                          "functionName": "eventsApi",
                          "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                          "lineNumber": 155,
                          "columnNumber": 15,
                          "prevLine": "      // Finally, standard events.",
                          "nextLine": "    }",
                          "line": "      events = iteratee(events, name, callback, opts);"
                        },
                        {
                          "functionName": "trigger",
                          "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                          "lineNumber": 346,
                          "columnNumber": 4,
                          "prevLine": "",
                          "nextLine": "    return this;",
                          "line": "    eventsApi(triggerApi, this._events, name, void 0, args);"
                        }
                      ]
                    }
                  ],
                  "action": "assign innerHTML",
                  "stack": [
                    "Error",
                    "    at Error (native)",
                    "    at stringTraceSetInnerHTML (http://localhost:8000/string-trace.js:176:20)",
                    "    at .<anonymous> (http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery.js:902:82)",
                    "    at jQuery.access (http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery.js:632:12)",
                    "    at jQuery.fn.extend.html (http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery.js:900:396)",
                    "    at app.AppView.Backbone.View.extend.addAll (http://localhost:8000/backbone-todomvc/js/views/app-view.js:83:15)",
                    "    at triggerEvents (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:392:72)",
                    "    at triggerApi (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:365:19)",
                    "    at eventsApi (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:164:16)",
                    "    at Events.trigger (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:355:5)"
                  ],
                  "resolvedStack": [
                    {
                      "functionName": ".<anonymous>",
                      "fileName": "http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery-original.js",
                      "lineNumber": 5321,
                      "columnNumber": 49,
                      "prevLine": "\t\t\t\t\t\tif ( elem.nodeType === 1 ) {",
                      "nextLine": "\t\t\t\t\t\t\telem.innerHTML = value;",
                      "line": "\t\t\t\t\t\t\tjQuery.cleanData( getAll( elem, false ) );"
                    },
                    {
                      "functionName": "jQuery.access",
                      "fileName": "http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery-original.js",
                      "lineNumber": 3491,
                      "columnNumber": 7,
                      "prevLine": "\t\t\tif ( raw ) {",
                      "nextLine": "\t\t\t\tfn = null;",
                      "line": "\t\t\t\tfn.call( elems, value );"
                    },
                    {
                      "functionName": "html",
                      "fileName": "http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery-original.js",
                      "lineNumber": 5300,
                      "columnNumber": 9,
                      "prevLine": "\thtml: function( value ) {",
                      "nextLine": "\t\t\tvar elem = this[ 0 ] || {},",
                      "line": "\t\treturn access( this, function( value ) {"
                    },
                    {
                      "functionName": "addAll",
                      "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                      "lineNumber": 85,
                      "columnNumber": 14,
                      "prevLine": "\t\taddAll: function () {",
                      "nextLine": "\t\t\tapp.todos.each(this.addOne, this);",
                      "line": "\t\t\tthis.$list.html('');"
                    },
                    {
                      "functionName": "triggerEvents",
                      "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                      "lineNumber": 370,
                      "columnNumber": 56,
                      "prevLine": "      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;",
                      "nextLine": "      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;",
                      "line": "      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;"
                    },
                    {
                      "functionName": "triggerApi",
                      "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                      "lineNumber": 356,
                      "columnNumber": 18,
                      "prevLine": "      if (events && allEvents) allEvents = allEvents.slice();",
                      "nextLine": "      if (allEvents) triggerEvents(allEvents, [name].concat(args));",
                      "line": "      if (events) triggerEvents(events, args);"
                    },
                    {
                      "functionName": "eventsApi",
                      "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                      "lineNumber": 155,
                      "columnNumber": 15,
                      "prevLine": "      // Finally, standard events.",
                      "nextLine": "    }",
                      "line": "      events = iteratee(events, name, callback, opts);"
                    },
                    {
                      "functionName": "trigger",
                      "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                      "lineNumber": 346,
                      "columnNumber": 4,
                      "prevLine": "",
                      "nextLine": "    return this;",
                      "line": "    eventsApi(triggerApi, this._events, name, void 0, args);"
                    }
                  ]
                },
                {
                  "action": "appendChild",
                  "elIdentifier": "LI",
                  "children": [
                    {
                      "inputValues": [
                        {
                          "action": "replace call",
                          "inputValues": [
                            {
                              "action": "concat",
                              "inputValues": [
                                {
                                  "action": "string literal",
                                  "inputValues": [
                                    null
                                  ],
                                  "value": "",
                                  "stack": [
                                    "Error",
                                    "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                    "    at stringTrace (http://localhost:8000/string-trace.js:112:17)",
                                    "    at fn05608707561863249 (Function05608707561863249.js:2:11)",
                                    "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                    "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                    "    at app.TodoView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/todo-view.js:52:23)",
                                    "    at app.AppView.Backbone.View.extend.addOne (http://localhost:8000/backbone-todomvc/js/views/app-view.js:78:27)",
                                    "    at http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:77:23",
                                    "    at Function._.each._.forEach (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:159:9)",
                                    "    at .each (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:91:27)"
                                  ],
                                  "resolvedStack": [
                                    {
                                      "functionName": "print",
                                      "fileName": "unknown",
                                      "lineNumber": 1,
                                      "columnNumber": 8,
                                      "nextLine": "with(obj||{}){",
                                      "line": "var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};"
                                    },
                                    {
                                      "functionName": "template",
                                      "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                      "lineNumber": 1461,
                                      "columnNumber": 20,
                                      "prevLine": "    var template = function(data) {",
                                      "nextLine": "    };",
                                      "line": "      return render.call(this, data, _);"
                                    },
                                    {
                                      "functionName": "render",
                                      "fileName": "http://localhost:8000/backbone-todomvc/js/views/todo-view-original.js",
                                      "lineNumber": 51,
                                      "columnNumber": 22,
                                      "prevLine": "",
                                      "nextLine": "\t\t\tthis.$el.toggleClass('completed', this.model.get('completed'));",
                                      "line": "\t\t\tthis.$el.html(this.template(this.model.toJSON()));"
                                    },
                                    {
                                      "functionName": "addOne",
                                      "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                      "lineNumber": 80,
                                      "columnNumber": 26,
                                      "prevLine": "\t\t\tvar view = new app.TodoView({ model: todo });",
                                      "nextLine": "\t\t},",
                                      "line": "\t\t\tthis.$list.append(view.render().el);"
                                    },
                                    {
                                      "functionName": "optimizeCb",
                                      "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                      "lineNumber": 73,
                                      "columnNumber": 20,
                                      "prevLine": "      case 3: return function(value, index, collection) {",
                                      "nextLine": "      };",
                                      "line": "        return func.call(context, value, index, collection);"
                                    },
                                    {
                                      "functionName": "forEach",
                                      "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                      "lineNumber": 153,
                                      "columnNumber": 8,
                                      "prevLine": "      for (i = 0, length = obj.length; i < length; i++) {",
                                      "nextLine": "      }",
                                      "line": "        iteratee(obj[i], i, obj);"
                                    },
                                    {
                                      "functionName": "addMethod",
                                      "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                                      "lineNumber": 87,
                                      "columnNumber": 25,
                                      "prevLine": "      case 3: return function(iteratee, context) {",
                                      "nextLine": "      };",
                                      "line": "        return _[method](this[attribute], cb(iteratee, this), context);"
                                    }
                                  ]
                                },
                                {
                                  "action": "concat",
                                  "inputValues": [
                                    {
                                      "action": "concat",
                                      "inputValues": [
                                        {
                                          "action": "concat",
                                          "inputValues": [
                                            {
                                              "action": "concat",
                                              "inputValues": [
                                                {
                                                  "action": "concat",
                                                  "inputValues": [
                                                    {
                                                      "action": "concat",
                                                      "inputValues": [
                                                        {
                                                          "action": "string literal",
                                                          "inputValues": [
                                                            null
                                                          ],
                                                          "value": "\n\t\t\t<div class=\"view\">\n\t\t\t\t<input class=\"toggle\" type=\"checkbox\" ",
                                                          "stack": [
                                                            "Error",
                                                            "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                                            "    at stringTrace (http://localhost:8000/string-trace.js:112:17)",
                                                            "    at fn05608707561863249 (Function05608707561863249.js:8:119)",
                                                            "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                                            "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                                            "    at app.TodoView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/todo-view.js:52:23)",
                                                            "    at app.AppView.Backbone.View.extend.addOne (http://localhost:8000/backbone-todomvc/js/views/app-view.js:78:27)",
                                                            "    at http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:77:23",
                                                            "    at Function._.each._.forEach (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:159:9)",
                                                            "    at .each (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:91:27)"
                                                          ],
                                                          "resolvedStack": [
                                                            {
                                                              "functionName": "print",
                                                              "fileName": "unknown",
                                                              "lineNumber": 3,
                                                              "columnNumber": 0,
                                                              "prevLine": "with(obj||{}){",
                                                              "nextLine": "((__t=( completed ? 'checked' : '' ))==null?'':__t)+",
                                                              "line": "__p+='\\n\t\t\t<div class=\"view\">\\n\t\t\t\t<input class=\"toggle\" type=\"checkbox\" '+"
                                                            },
                                                            {
                                                              "functionName": "template",
                                                              "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                              "lineNumber": 1461,
                                                              "columnNumber": 20,
                                                              "prevLine": "    var template = function(data) {",
                                                              "nextLine": "    };",
                                                              "line": "      return render.call(this, data, _);"
                                                            },
                                                            {
                                                              "functionName": "render",
                                                              "fileName": "http://localhost:8000/backbone-todomvc/js/views/todo-view-original.js",
                                                              "lineNumber": 51,
                                                              "columnNumber": 22,
                                                              "prevLine": "",
                                                              "nextLine": "\t\t\tthis.$el.toggleClass('completed', this.model.get('completed'));",
                                                              "line": "\t\t\tthis.$el.html(this.template(this.model.toJSON()));"
                                                            },
                                                            {
                                                              "functionName": "addOne",
                                                              "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                                              "lineNumber": 80,
                                                              "columnNumber": 26,
                                                              "prevLine": "\t\t\tvar view = new app.TodoView({ model: todo });",
                                                              "nextLine": "\t\t},",
                                                              "line": "\t\t\tthis.$list.append(view.render().el);"
                                                            },
                                                            {
                                                              "functionName": "optimizeCb",
                                                              "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                              "lineNumber": 73,
                                                              "columnNumber": 20,
                                                              "prevLine": "      case 3: return function(value, index, collection) {",
                                                              "nextLine": "      };",
                                                              "line": "        return func.call(context, value, index, collection);"
                                                            },
                                                            {
                                                              "functionName": "forEach",
                                                              "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                              "lineNumber": 153,
                                                              "columnNumber": 8,
                                                              "prevLine": "      for (i = 0, length = obj.length; i < length; i++) {",
                                                              "nextLine": "      }",
                                                              "line": "        iteratee(obj[i], i, obj);"
                                                            },
                                                            {
                                                              "functionName": "addMethod",
                                                              "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                                                              "lineNumber": 87,
                                                              "columnNumber": 25,
                                                              "prevLine": "      case 3: return function(iteratee, context) {",
                                                              "nextLine": "      };",
                                                              "line": "        return _[method](this[attribute], cb(iteratee, this), context);"
                                                            }
                                                          ]
                                                        },
                                                        {
                                                          "action": "string literal",
                                                          "inputValues": [
                                                            null
                                                          ],
                                                          "value": "",
                                                          "stack": [
                                                            "Error",
                                                            "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                                            "    at stringTrace (http://localhost:8000/string-trace.js:112:17)",
                                                            "    at fn05608707561863249 (Function05608707561863249.js:8:295)",
                                                            "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                                            "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                                            "    at app.TodoView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/todo-view.js:52:23)",
                                                            "    at app.AppView.Backbone.View.extend.addOne (http://localhost:8000/backbone-todomvc/js/views/app-view.js:78:27)",
                                                            "    at http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:77:23",
                                                            "    at Function._.each._.forEach (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:159:9)",
                                                            "    at .each (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:91:27)"
                                                          ],
                                                          "resolvedStack": [
                                                            {
                                                              "functionName": "print",
                                                              "fileName": "unknown",
                                                              "lineNumber": 4,
                                                              "columnNumber": 2,
                                                              "prevLine": "__p+='\\n\t\t\t<div class=\"view\">\\n\t\t\t\t<input class=\"toggle\" type=\"checkbox\" '+",
                                                              "nextLine": "'>\\n\t\t\t\t<label>'+",
                                                              "line": "((__t=( completed ? 'checked' : '' ))==null?'':__t)+"
                                                            },
                                                            {
                                                              "functionName": "template",
                                                              "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                              "lineNumber": 1461,
                                                              "columnNumber": 20,
                                                              "prevLine": "    var template = function(data) {",
                                                              "nextLine": "    };",
                                                              "line": "      return render.call(this, data, _);"
                                                            },
                                                            {
                                                              "functionName": "render",
                                                              "fileName": "http://localhost:8000/backbone-todomvc/js/views/todo-view-original.js",
                                                              "lineNumber": 51,
                                                              "columnNumber": 22,
                                                              "prevLine": "",
                                                              "nextLine": "\t\t\tthis.$el.toggleClass('completed', this.model.get('completed'));",
                                                              "line": "\t\t\tthis.$el.html(this.template(this.model.toJSON()));"
                                                            },
                                                            {
                                                              "functionName": "addOne",
                                                              "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                                              "lineNumber": 80,
                                                              "columnNumber": 26,
                                                              "prevLine": "\t\t\tvar view = new app.TodoView({ model: todo });",
                                                              "nextLine": "\t\t},",
                                                              "line": "\t\t\tthis.$list.append(view.render().el);"
                                                            },
                                                            {
                                                              "functionName": "optimizeCb",
                                                              "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                              "lineNumber": 73,
                                                              "columnNumber": 20,
                                                              "prevLine": "      case 3: return function(value, index, collection) {",
                                                              "nextLine": "      };",
                                                              "line": "        return func.call(context, value, index, collection);"
                                                            },
                                                            {
                                                              "functionName": "forEach",
                                                              "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                              "lineNumber": 153,
                                                              "columnNumber": 8,
                                                              "prevLine": "      for (i = 0, length = obj.length; i < length; i++) {",
                                                              "nextLine": "      }",
                                                              "line": "        iteratee(obj[i], i, obj);"
                                                            },
                                                            {
                                                              "functionName": "addMethod",
                                                              "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                                                              "lineNumber": 87,
                                                              "columnNumber": 25,
                                                              "prevLine": "      case 3: return function(iteratee, context) {",
                                                              "nextLine": "      };",
                                                              "line": "        return _[method](this[attribute], cb(iteratee, this), context);"
                                                            }
                                                          ]
                                                        }
                                                      ],
                                                      "value": "\n\t\t\t<div class=\"view\">\n\t\t\t\t<input class=\"toggle\" type=\"checkbox\" ",
                                                      "stack": [
                                                        "Error",
                                                        "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                                        "    at stringTraceAdd (http://localhost:8000/string-trace.js:149:17)",
                                                        "    at fn05608707561863249 (Function05608707561863249.js:8:104)",
                                                        "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                                        "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                                        "    at app.TodoView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/todo-view.js:52:23)",
                                                        "    at app.AppView.Backbone.View.extend.addOne (http://localhost:8000/backbone-todomvc/js/views/app-view.js:78:27)",
                                                        "    at http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:77:23",
                                                        "    at Function._.each._.forEach (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:159:9)",
                                                        "    at .each (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:91:27)"
                                                      ],
                                                      "resolvedStack": [
                                                        {
                                                          "functionName": "print",
                                                          "fileName": "unknown",
                                                          "lineNumber": 3,
                                                          "columnNumber": 0,
                                                          "prevLine": "with(obj||{}){",
                                                          "nextLine": "((__t=( completed ? 'checked' : '' ))==null?'':__t)+",
                                                          "line": "__p+='\\n\t\t\t<div class=\"view\">\\n\t\t\t\t<input class=\"toggle\" type=\"checkbox\" '+"
                                                        },
                                                        {
                                                          "functionName": "template",
                                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                          "lineNumber": 1461,
                                                          "columnNumber": 20,
                                                          "prevLine": "    var template = function(data) {",
                                                          "nextLine": "    };",
                                                          "line": "      return render.call(this, data, _);"
                                                        },
                                                        {
                                                          "functionName": "render",
                                                          "fileName": "http://localhost:8000/backbone-todomvc/js/views/todo-view-original.js",
                                                          "lineNumber": 51,
                                                          "columnNumber": 22,
                                                          "prevLine": "",
                                                          "nextLine": "\t\t\tthis.$el.toggleClass('completed', this.model.get('completed'));",
                                                          "line": "\t\t\tthis.$el.html(this.template(this.model.toJSON()));"
                                                        },
                                                        {
                                                          "functionName": "addOne",
                                                          "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                                          "lineNumber": 80,
                                                          "columnNumber": 26,
                                                          "prevLine": "\t\t\tvar view = new app.TodoView({ model: todo });",
                                                          "nextLine": "\t\t},",
                                                          "line": "\t\t\tthis.$list.append(view.render().el);"
                                                        },
                                                        {
                                                          "functionName": "optimizeCb",
                                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                          "lineNumber": 73,
                                                          "columnNumber": 20,
                                                          "prevLine": "      case 3: return function(value, index, collection) {",
                                                          "nextLine": "      };",
                                                          "line": "        return func.call(context, value, index, collection);"
                                                        },
                                                        {
                                                          "functionName": "forEach",
                                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                          "lineNumber": 153,
                                                          "columnNumber": 8,
                                                          "prevLine": "      for (i = 0, length = obj.length; i < length; i++) {",
                                                          "nextLine": "      }",
                                                          "line": "        iteratee(obj[i], i, obj);"
                                                        },
                                                        {
                                                          "functionName": "addMethod",
                                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                                                          "lineNumber": 87,
                                                          "columnNumber": 25,
                                                          "prevLine": "      case 3: return function(iteratee, context) {",
                                                          "nextLine": "      };",
                                                          "line": "        return _[method](this[attribute], cb(iteratee, this), context);"
                                                        }
                                                      ]
                                                    },
                                                    {
                                                      "action": "string literal",
                                                      "inputValues": [
                                                        null
                                                      ],
                                                      "value": ">\n\t\t\t\t<label>",
                                                      "stack": [
                                                        "Error",
                                                        "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                                        "    at stringTrace (http://localhost:8000/string-trace.js:112:17)",
                                                        "    at fn05608707561863249 (Function05608707561863249.js:8:347)",
                                                        "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                                        "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                                        "    at app.TodoView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/todo-view.js:52:23)",
                                                        "    at app.AppView.Backbone.View.extend.addOne (http://localhost:8000/backbone-todomvc/js/views/app-view.js:78:27)",
                                                        "    at http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:77:23",
                                                        "    at Function._.each._.forEach (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:159:9)",
                                                        "    at .each (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:91:27)"
                                                      ],
                                                      "resolvedStack": [
                                                        {
                                                          "functionName": "print",
                                                          "fileName": "unknown",
                                                          "lineNumber": 3,
                                                          "columnNumber": 0,
                                                          "prevLine": "with(obj||{}){",
                                                          "nextLine": "((__t=( completed ? 'checked' : '' ))==null?'':__t)+",
                                                          "line": "__p+='\\n\t\t\t<div class=\"view\">\\n\t\t\t\t<input class=\"toggle\" type=\"checkbox\" '+"
                                                        },
                                                        {
                                                          "functionName": "template",
                                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                          "lineNumber": 1461,
                                                          "columnNumber": 20,
                                                          "prevLine": "    var template = function(data) {",
                                                          "nextLine": "    };",
                                                          "line": "      return render.call(this, data, _);"
                                                        },
                                                        {
                                                          "functionName": "render",
                                                          "fileName": "http://localhost:8000/backbone-todomvc/js/views/todo-view-original.js",
                                                          "lineNumber": 51,
                                                          "columnNumber": 22,
                                                          "prevLine": "",
                                                          "nextLine": "\t\t\tthis.$el.toggleClass('completed', this.model.get('completed'));",
                                                          "line": "\t\t\tthis.$el.html(this.template(this.model.toJSON()));"
                                                        },
                                                        {
                                                          "functionName": "addOne",
                                                          "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                                          "lineNumber": 80,
                                                          "columnNumber": 26,
                                                          "prevLine": "\t\t\tvar view = new app.TodoView({ model: todo });",
                                                          "nextLine": "\t\t},",
                                                          "line": "\t\t\tthis.$list.append(view.render().el);"
                                                        },
                                                        {
                                                          "functionName": "optimizeCb",
                                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                          "lineNumber": 73,
                                                          "columnNumber": 20,
                                                          "prevLine": "      case 3: return function(value, index, collection) {",
                                                          "nextLine": "      };",
                                                          "line": "        return func.call(context, value, index, collection);"
                                                        },
                                                        {
                                                          "functionName": "forEach",
                                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                          "lineNumber": 153,
                                                          "columnNumber": 8,
                                                          "prevLine": "      for (i = 0, length = obj.length; i < length; i++) {",
                                                          "nextLine": "      }",
                                                          "line": "        iteratee(obj[i], i, obj);"
                                                        },
                                                        {
                                                          "functionName": "addMethod",
                                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                                                          "lineNumber": 87,
                                                          "columnNumber": 25,
                                                          "prevLine": "      case 3: return function(iteratee, context) {",
                                                          "nextLine": "      };",
                                                          "line": "        return _[method](this[attribute], cb(iteratee, this), context);"
                                                        }
                                                      ]
                                                    }
                                                  ],
                                                  "value": "\n\t\t\t<div class=\"view\">\n\t\t\t\t<input class=\"toggle\" type=\"checkbox\" >\n\t\t\t\t<label>",
                                                  "stack": [
                                                    "Error",
                                                    "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                                    "    at stringTraceAdd (http://localhost:8000/string-trace.js:149:17)",
                                                    "    at fn05608707561863249 (Function05608707561863249.js:8:89)",
                                                    "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                                    "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                                    "    at app.TodoView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/todo-view.js:52:23)",
                                                    "    at app.AppView.Backbone.View.extend.addOne (http://localhost:8000/backbone-todomvc/js/views/app-view.js:78:27)",
                                                    "    at http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:77:23",
                                                    "    at Function._.each._.forEach (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:159:9)",
                                                    "    at .each (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:91:27)"
                                                  ],
                                                  "resolvedStack": [
                                                    {
                                                      "functionName": "print",
                                                      "fileName": "unknown",
                                                      "lineNumber": 3,
                                                      "columnNumber": 0,
                                                      "prevLine": "with(obj||{}){",
                                                      "nextLine": "((__t=( completed ? 'checked' : '' ))==null?'':__t)+",
                                                      "line": "__p+='\\n\t\t\t<div class=\"view\">\\n\t\t\t\t<input class=\"toggle\" type=\"checkbox\" '+"
                                                    },
                                                    {
                                                      "functionName": "template",
                                                      "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                      "lineNumber": 1461,
                                                      "columnNumber": 20,
                                                      "prevLine": "    var template = function(data) {",
                                                      "nextLine": "    };",
                                                      "line": "      return render.call(this, data, _);"
                                                    },
                                                    {
                                                      "functionName": "render",
                                                      "fileName": "http://localhost:8000/backbone-todomvc/js/views/todo-view-original.js",
                                                      "lineNumber": 51,
                                                      "columnNumber": 22,
                                                      "prevLine": "",
                                                      "nextLine": "\t\t\tthis.$el.toggleClass('completed', this.model.get('completed'));",
                                                      "line": "\t\t\tthis.$el.html(this.template(this.model.toJSON()));"
                                                    },
                                                    {
                                                      "functionName": "addOne",
                                                      "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                                      "lineNumber": 80,
                                                      "columnNumber": 26,
                                                      "prevLine": "\t\t\tvar view = new app.TodoView({ model: todo });",
                                                      "nextLine": "\t\t},",
                                                      "line": "\t\t\tthis.$list.append(view.render().el);"
                                                    },
                                                    {
                                                      "functionName": "optimizeCb",
                                                      "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                      "lineNumber": 73,
                                                      "columnNumber": 20,
                                                      "prevLine": "      case 3: return function(value, index, collection) {",
                                                      "nextLine": "      };",
                                                      "line": "        return func.call(context, value, index, collection);"
                                                    },
                                                    {
                                                      "functionName": "forEach",
                                                      "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                      "lineNumber": 153,
                                                      "columnNumber": 8,
                                                      "prevLine": "      for (i = 0, length = obj.length; i < length; i++) {",
                                                      "nextLine": "      }",
                                                      "line": "        iteratee(obj[i], i, obj);"
                                                    },
                                                    {
                                                      "functionName": "addMethod",
                                                      "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                                                      "lineNumber": 87,
                                                      "columnNumber": 25,
                                                      "prevLine": "      case 3: return function(iteratee, context) {",
                                                      "nextLine": "      };",
                                                      "line": "        return _[method](this[attribute], cb(iteratee, this), context);"
                                                    }
                                                  ]
                                                },
                                                {
                                                  "action": "concat",
                                                  "inputValues": [
                                                    {
                                                      "action": "string literal",
                                                      "inputValues": [
                                                        null
                                                      ],
                                                      "value": "",
                                                      "stack": [
                                                        "Error",
                                                        "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                                        "    at stringTrace (http://localhost:8000/string-trace.js:112:17)",
                                                        "    at Function.escape (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1391:87)",
                                                        "    at fn05608707561863249 (Function05608707561863249.js:8:448)",
                                                        "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                                        "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                                        "    at app.TodoView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/todo-view.js:52:23)",
                                                        "    at app.AppView.Backbone.View.extend.addOne (http://localhost:8000/backbone-todomvc/js/views/app-view.js:78:27)",
                                                        "    at http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:77:23",
                                                        "    at Function._.each._.forEach (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:159:9)"
                                                      ],
                                                      "resolvedStack": [
                                                        {
                                                          "functionName": "escaper",
                                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                          "lineNumber": 1356,
                                                          "columnNumber": 29,
                                                          "prevLine": "    return function(string) {",
                                                          "nextLine": "      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;",
                                                          "line": "      string = string == null ? '' : '' + string;"
                                                        },
                                                        {
                                                          "functionName": "print",
                                                          "fileName": "unknown",
                                                          "lineNumber": 6,
                                                          "columnNumber": 28,
                                                          "prevLine": "'>\\n\t\t\t\t<label>'+",
                                                          "nextLine": "'</label>\\n\t\t\t\t<button class=\"destroy\"></button>\\n\t\t\t</div>\\n\t\t\t<input class=\"edit\" value=\"'+",
                                                          "line": "((__t=( title ))==null?'':_.escape(__t))+"
                                                        },
                                                        {
                                                          "functionName": "template",
                                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                          "lineNumber": 1461,
                                                          "columnNumber": 20,
                                                          "prevLine": "    var template = function(data) {",
                                                          "nextLine": "    };",
                                                          "line": "      return render.call(this, data, _);"
                                                        },
                                                        {
                                                          "functionName": "render",
                                                          "fileName": "http://localhost:8000/backbone-todomvc/js/views/todo-view-original.js",
                                                          "lineNumber": 51,
                                                          "columnNumber": 22,
                                                          "prevLine": "",
                                                          "nextLine": "\t\t\tthis.$el.toggleClass('completed', this.model.get('completed'));",
                                                          "line": "\t\t\tthis.$el.html(this.template(this.model.toJSON()));"
                                                        },
                                                        {
                                                          "functionName": "addOne",
                                                          "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                                          "lineNumber": 80,
                                                          "columnNumber": 26,
                                                          "prevLine": "\t\t\tvar view = new app.TodoView({ model: todo });",
                                                          "nextLine": "\t\t},",
                                                          "line": "\t\t\tthis.$list.append(view.render().el);"
                                                        },
                                                        {
                                                          "functionName": "optimizeCb",
                                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                          "lineNumber": 73,
                                                          "columnNumber": 20,
                                                          "prevLine": "      case 3: return function(value, index, collection) {",
                                                          "nextLine": "      };",
                                                          "line": "        return func.call(context, value, index, collection);"
                                                        },
                                                        {
                                                          "functionName": "forEach",
                                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                          "lineNumber": 153,
                                                          "columnNumber": 8,
                                                          "prevLine": "      for (i = 0, length = obj.length; i < length; i++) {",
                                                          "nextLine": "      }",
                                                          "line": "        iteratee(obj[i], i, obj);"
                                                        }
                                                      ]
                                                    },
                                                    {
                                                      "action": "string literal",
                                                      "inputValues": [
                                                        null
                                                      ],
                                                      "value": "Bake cake",
                                                      "stack": [
                                                        "Error",
                                                        "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                                        "    at stringTrace (http://localhost:8000/string-trace.js:112:17)",
                                                        "    at stringTraceAdd (http://localhost:8000/string-trace.js:140:13)",
                                                        "    at Function.escape (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1391:72)",
                                                        "    at fn05608707561863249 (Function05608707561863249.js:8:448)",
                                                        "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                                        "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                                        "    at app.TodoView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/todo-view.js:52:23)",
                                                        "    at app.AppView.Backbone.View.extend.addOne (http://localhost:8000/backbone-todomvc/js/views/app-view.js:78:27)",
                                                        "    at http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:77:23"
                                                      ],
                                                      "resolvedStack": [
                                                        {
                                                          "functionName": "escaper",
                                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                          "lineNumber": 1356,
                                                          "columnNumber": 29,
                                                          "prevLine": "    return function(string) {",
                                                          "nextLine": "      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;",
                                                          "line": "      string = string == null ? '' : '' + string;"
                                                        },
                                                        {
                                                          "functionName": "print",
                                                          "fileName": "unknown",
                                                          "lineNumber": 6,
                                                          "columnNumber": 28,
                                                          "prevLine": "'>\\n\t\t\t\t<label>'+",
                                                          "nextLine": "'</label>\\n\t\t\t\t<button class=\"destroy\"></button>\\n\t\t\t</div>\\n\t\t\t<input class=\"edit\" value=\"'+",
                                                          "line": "((__t=( title ))==null?'':_.escape(__t))+"
                                                        },
                                                        {
                                                          "functionName": "template",
                                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                          "lineNumber": 1461,
                                                          "columnNumber": 20,
                                                          "prevLine": "    var template = function(data) {",
                                                          "nextLine": "    };",
                                                          "line": "      return render.call(this, data, _);"
                                                        },
                                                        {
                                                          "functionName": "render",
                                                          "fileName": "http://localhost:8000/backbone-todomvc/js/views/todo-view-original.js",
                                                          "lineNumber": 51,
                                                          "columnNumber": 22,
                                                          "prevLine": "",
                                                          "nextLine": "\t\t\tthis.$el.toggleClass('completed', this.model.get('completed'));",
                                                          "line": "\t\t\tthis.$el.html(this.template(this.model.toJSON()));"
                                                        },
                                                        {
                                                          "functionName": "addOne",
                                                          "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                                          "lineNumber": 80,
                                                          "columnNumber": 26,
                                                          "prevLine": "\t\t\tvar view = new app.TodoView({ model: todo });",
                                                          "nextLine": "\t\t},",
                                                          "line": "\t\t\tthis.$list.append(view.render().el);"
                                                        },
                                                        {
                                                          "functionName": "optimizeCb",
                                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                          "lineNumber": 73,
                                                          "columnNumber": 20,
                                                          "prevLine": "      case 3: return function(value, index, collection) {",
                                                          "nextLine": "      };",
                                                          "line": "        return func.call(context, value, index, collection);"
                                                        }
                                                      ]
                                                    }
                                                  ],
                                                  "value": "Bake cake",
                                                  "stack": [
                                                    "Error",
                                                    "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                                    "    at stringTraceAdd (http://localhost:8000/string-trace.js:149:17)",
                                                    "    at Function.escape (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1391:72)",
                                                    "    at fn05608707561863249 (Function05608707561863249.js:8:448)",
                                                    "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                                    "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                                    "    at app.TodoView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/todo-view.js:52:23)",
                                                    "    at app.AppView.Backbone.View.extend.addOne (http://localhost:8000/backbone-todomvc/js/views/app-view.js:78:27)",
                                                    "    at http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:77:23",
                                                    "    at Function._.each._.forEach (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:159:9)"
                                                  ],
                                                  "resolvedStack": [
                                                    {
                                                      "functionName": "escaper",
                                                      "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                      "lineNumber": 1356,
                                                      "columnNumber": 29,
                                                      "prevLine": "    return function(string) {",
                                                      "nextLine": "      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;",
                                                      "line": "      string = string == null ? '' : '' + string;"
                                                    },
                                                    {
                                                      "functionName": "print",
                                                      "fileName": "unknown",
                                                      "lineNumber": 6,
                                                      "columnNumber": 28,
                                                      "prevLine": "'>\\n\t\t\t\t<label>'+",
                                                      "nextLine": "'</label>\\n\t\t\t\t<button class=\"destroy\"></button>\\n\t\t\t</div>\\n\t\t\t<input class=\"edit\" value=\"'+",
                                                      "line": "((__t=( title ))==null?'':_.escape(__t))+"
                                                    },
                                                    {
                                                      "functionName": "template",
                                                      "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                      "lineNumber": 1461,
                                                      "columnNumber": 20,
                                                      "prevLine": "    var template = function(data) {",
                                                      "nextLine": "    };",
                                                      "line": "      return render.call(this, data, _);"
                                                    },
                                                    {
                                                      "functionName": "render",
                                                      "fileName": "http://localhost:8000/backbone-todomvc/js/views/todo-view-original.js",
                                                      "lineNumber": 51,
                                                      "columnNumber": 22,
                                                      "prevLine": "",
                                                      "nextLine": "\t\t\tthis.$el.toggleClass('completed', this.model.get('completed'));",
                                                      "line": "\t\t\tthis.$el.html(this.template(this.model.toJSON()));"
                                                    },
                                                    {
                                                      "functionName": "addOne",
                                                      "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                                      "lineNumber": 80,
                                                      "columnNumber": 26,
                                                      "prevLine": "\t\t\tvar view = new app.TodoView({ model: todo });",
                                                      "nextLine": "\t\t},",
                                                      "line": "\t\t\tthis.$list.append(view.render().el);"
                                                    },
                                                    {
                                                      "functionName": "optimizeCb",
                                                      "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                      "lineNumber": 73,
                                                      "columnNumber": 20,
                                                      "prevLine": "      case 3: return function(value, index, collection) {",
                                                      "nextLine": "      };",
                                                      "line": "        return func.call(context, value, index, collection);"
                                                    },
                                                    {
                                                      "functionName": "forEach",
                                                      "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                      "lineNumber": 153,
                                                      "columnNumber": 8,
                                                      "prevLine": "      for (i = 0, length = obj.length; i < length; i++) {",
                                                      "nextLine": "      }",
                                                      "line": "        iteratee(obj[i], i, obj);"
                                                    }
                                                  ]
                                                }
                                              ],
                                              "value": "\n\t\t\t<div class=\"view\">\n\t\t\t\t<input class=\"toggle\" type=\"checkbox\" >\n\t\t\t\t<label>Bake cake",
                                              "stack": [
                                                "Error",
                                                "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                                "    at stringTraceAdd (http://localhost:8000/string-trace.js:149:17)",
                                                "    at fn05608707561863249 (Function05608707561863249.js:8:74)",
                                                "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                                "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                                "    at app.TodoView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/todo-view.js:52:23)",
                                                "    at app.AppView.Backbone.View.extend.addOne (http://localhost:8000/backbone-todomvc/js/views/app-view.js:78:27)",
                                                "    at http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:77:23",
                                                "    at Function._.each._.forEach (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:159:9)",
                                                "    at .each (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:91:27)"
                                              ],
                                              "resolvedStack": [
                                                {
                                                  "functionName": "print",
                                                  "fileName": "unknown",
                                                  "lineNumber": 3,
                                                  "columnNumber": 0,
                                                  "prevLine": "with(obj||{}){",
                                                  "nextLine": "((__t=( completed ? 'checked' : '' ))==null?'':__t)+",
                                                  "line": "__p+='\\n\t\t\t<div class=\"view\">\\n\t\t\t\t<input class=\"toggle\" type=\"checkbox\" '+"
                                                },
                                                {
                                                  "functionName": "template",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                  "lineNumber": 1461,
                                                  "columnNumber": 20,
                                                  "prevLine": "    var template = function(data) {",
                                                  "nextLine": "    };",
                                                  "line": "      return render.call(this, data, _);"
                                                },
                                                {
                                                  "functionName": "render",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/js/views/todo-view-original.js",
                                                  "lineNumber": 51,
                                                  "columnNumber": 22,
                                                  "prevLine": "",
                                                  "nextLine": "\t\t\tthis.$el.toggleClass('completed', this.model.get('completed'));",
                                                  "line": "\t\t\tthis.$el.html(this.template(this.model.toJSON()));"
                                                },
                                                {
                                                  "functionName": "addOne",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                                  "lineNumber": 80,
                                                  "columnNumber": 26,
                                                  "prevLine": "\t\t\tvar view = new app.TodoView({ model: todo });",
                                                  "nextLine": "\t\t},",
                                                  "line": "\t\t\tthis.$list.append(view.render().el);"
                                                },
                                                {
                                                  "functionName": "optimizeCb",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                  "lineNumber": 73,
                                                  "columnNumber": 20,
                                                  "prevLine": "      case 3: return function(value, index, collection) {",
                                                  "nextLine": "      };",
                                                  "line": "        return func.call(context, value, index, collection);"
                                                },
                                                {
                                                  "functionName": "forEach",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                  "lineNumber": 153,
                                                  "columnNumber": 8,
                                                  "prevLine": "      for (i = 0, length = obj.length; i < length; i++) {",
                                                  "nextLine": "      }",
                                                  "line": "        iteratee(obj[i], i, obj);"
                                                },
                                                {
                                                  "functionName": "addMethod",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                                                  "lineNumber": 87,
                                                  "columnNumber": 25,
                                                  "prevLine": "      case 3: return function(iteratee, context) {",
                                                  "nextLine": "      };",
                                                  "line": "        return _[method](this[attribute], cb(iteratee, this), context);"
                                                }
                                              ]
                                            },
                                            {
                                              "action": "string literal",
                                              "inputValues": [
                                                null
                                              ],
                                              "value": "</label>\n\t\t\t\t<button class=\"destroy\"></button>\n\t\t\t</div>\n\t\t\t<input class=\"edit\" value=\"",
                                              "stack": [
                                                "Error",
                                                "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                                "    at stringTrace (http://localhost:8000/string-trace.js:112:17)",
                                                "    at fn05608707561863249 (Function05608707561863249.js:8:462)",
                                                "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                                "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                                "    at app.TodoView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/todo-view.js:52:23)",
                                                "    at app.AppView.Backbone.View.extend.addOne (http://localhost:8000/backbone-todomvc/js/views/app-view.js:78:27)",
                                                "    at http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:77:23",
                                                "    at Function._.each._.forEach (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:159:9)",
                                                "    at .each (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:91:27)"
                                              ],
                                              "resolvedStack": [
                                                {
                                                  "functionName": "print",
                                                  "fileName": "unknown",
                                                  "lineNumber": 3,
                                                  "columnNumber": 0,
                                                  "prevLine": "with(obj||{}){",
                                                  "nextLine": "((__t=( completed ? 'checked' : '' ))==null?'':__t)+",
                                                  "line": "__p+='\\n\t\t\t<div class=\"view\">\\n\t\t\t\t<input class=\"toggle\" type=\"checkbox\" '+"
                                                },
                                                {
                                                  "functionName": "template",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                  "lineNumber": 1461,
                                                  "columnNumber": 20,
                                                  "prevLine": "    var template = function(data) {",
                                                  "nextLine": "    };",
                                                  "line": "      return render.call(this, data, _);"
                                                },
                                                {
                                                  "functionName": "render",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/js/views/todo-view-original.js",
                                                  "lineNumber": 51,
                                                  "columnNumber": 22,
                                                  "prevLine": "",
                                                  "nextLine": "\t\t\tthis.$el.toggleClass('completed', this.model.get('completed'));",
                                                  "line": "\t\t\tthis.$el.html(this.template(this.model.toJSON()));"
                                                },
                                                {
                                                  "functionName": "addOne",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                                  "lineNumber": 80,
                                                  "columnNumber": 26,
                                                  "prevLine": "\t\t\tvar view = new app.TodoView({ model: todo });",
                                                  "nextLine": "\t\t},",
                                                  "line": "\t\t\tthis.$list.append(view.render().el);"
                                                },
                                                {
                                                  "functionName": "optimizeCb",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                  "lineNumber": 73,
                                                  "columnNumber": 20,
                                                  "prevLine": "      case 3: return function(value, index, collection) {",
                                                  "nextLine": "      };",
                                                  "line": "        return func.call(context, value, index, collection);"
                                                },
                                                {
                                                  "functionName": "forEach",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                  "lineNumber": 153,
                                                  "columnNumber": 8,
                                                  "prevLine": "      for (i = 0, length = obj.length; i < length; i++) {",
                                                  "nextLine": "      }",
                                                  "line": "        iteratee(obj[i], i, obj);"
                                                },
                                                {
                                                  "functionName": "addMethod",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                                                  "lineNumber": 87,
                                                  "columnNumber": 25,
                                                  "prevLine": "      case 3: return function(iteratee, context) {",
                                                  "nextLine": "      };",
                                                  "line": "        return _[method](this[attribute], cb(iteratee, this), context);"
                                                }
                                              ]
                                            }
                                          ],
                                          "value": "\n\t\t\t<div class=\"view\">\n\t\t\t\t<input class=\"toggle\" type=\"checkbox\" >\n\t\t\t\t<label>Bake cake</label>\n\t\t\t\t<button class=\"destroy\"></button>\n\t\t\t</div>\n\t\t\t<input class=\"edit\" value=\"",
                                          "stack": [
                                            "Error",
                                            "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                            "    at stringTraceAdd (http://localhost:8000/string-trace.js:149:17)",
                                            "    at fn05608707561863249 (Function05608707561863249.js:8:59)",
                                            "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                            "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                            "    at app.TodoView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/todo-view.js:52:23)",
                                            "    at app.AppView.Backbone.View.extend.addOne (http://localhost:8000/backbone-todomvc/js/views/app-view.js:78:27)",
                                            "    at http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:77:23",
                                            "    at Function._.each._.forEach (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:159:9)",
                                            "    at .each (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:91:27)"
                                          ],
                                          "resolvedStack": [
                                            {
                                              "functionName": "print",
                                              "fileName": "unknown",
                                              "lineNumber": 3,
                                              "columnNumber": 0,
                                              "prevLine": "with(obj||{}){",
                                              "nextLine": "((__t=( completed ? 'checked' : '' ))==null?'':__t)+",
                                              "line": "__p+='\\n\t\t\t<div class=\"view\">\\n\t\t\t\t<input class=\"toggle\" type=\"checkbox\" '+"
                                            },
                                            {
                                              "functionName": "template",
                                              "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                              "lineNumber": 1461,
                                              "columnNumber": 20,
                                              "prevLine": "    var template = function(data) {",
                                              "nextLine": "    };",
                                              "line": "      return render.call(this, data, _);"
                                            },
                                            {
                                              "functionName": "render",
                                              "fileName": "http://localhost:8000/backbone-todomvc/js/views/todo-view-original.js",
                                              "lineNumber": 51,
                                              "columnNumber": 22,
                                              "prevLine": "",
                                              "nextLine": "\t\t\tthis.$el.toggleClass('completed', this.model.get('completed'));",
                                              "line": "\t\t\tthis.$el.html(this.template(this.model.toJSON()));"
                                            },
                                            {
                                              "functionName": "addOne",
                                              "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                              "lineNumber": 80,
                                              "columnNumber": 26,
                                              "prevLine": "\t\t\tvar view = new app.TodoView({ model: todo });",
                                              "nextLine": "\t\t},",
                                              "line": "\t\t\tthis.$list.append(view.render().el);"
                                            },
                                            {
                                              "functionName": "optimizeCb",
                                              "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                              "lineNumber": 73,
                                              "columnNumber": 20,
                                              "prevLine": "      case 3: return function(value, index, collection) {",
                                              "nextLine": "      };",
                                              "line": "        return func.call(context, value, index, collection);"
                                            },
                                            {
                                              "functionName": "forEach",
                                              "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                              "lineNumber": 153,
                                              "columnNumber": 8,
                                              "prevLine": "      for (i = 0, length = obj.length; i < length; i++) {",
                                              "nextLine": "      }",
                                              "line": "        iteratee(obj[i], i, obj);"
                                            },
                                            {
                                              "functionName": "addMethod",
                                              "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                                              "lineNumber": 87,
                                              "columnNumber": 25,
                                              "prevLine": "      case 3: return function(iteratee, context) {",
                                              "nextLine": "      };",
                                              "line": "        return _[method](this[attribute], cb(iteratee, this), context);"
                                            }
                                          ]
                                        },
                                        {
                                          "action": "concat",
                                          "inputValues": [
                                            {
                                              "action": "string literal",
                                              "inputValues": [
                                                null
                                              ],
                                              "value": "",
                                              "stack": [
                                                "Error",
                                                "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                                "    at stringTrace (http://localhost:8000/string-trace.js:112:17)",
                                                "    at Function.escape (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1391:87)",
                                                "    at fn05608707561863249 (Function05608707561863249.js:8:645)",
                                                "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                                "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                                "    at app.TodoView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/todo-view.js:52:23)",
                                                "    at app.AppView.Backbone.View.extend.addOne (http://localhost:8000/backbone-todomvc/js/views/app-view.js:78:27)",
                                                "    at http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:77:23",
                                                "    at Function._.each._.forEach (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:159:9)"
                                              ],
                                              "resolvedStack": [
                                                {
                                                  "functionName": "escaper",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                  "lineNumber": 1356,
                                                  "columnNumber": 29,
                                                  "prevLine": "    return function(string) {",
                                                  "nextLine": "      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;",
                                                  "line": "      string = string == null ? '' : '' + string;"
                                                },
                                                {
                                                  "functionName": "print",
                                                  "fileName": "unknown",
                                                  "lineNumber": 8,
                                                  "columnNumber": 28,
                                                  "prevLine": "'</label>\\n\t\t\t\t<button class=\"destroy\"></button>\\n\t\t\t</div>\\n\t\t\t<input class=\"edit\" value=\"'+",
                                                  "nextLine": "'\">\\n\t\t';",
                                                  "line": "((__t=( title ))==null?'':_.escape(__t))+"
                                                },
                                                {
                                                  "functionName": "template",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                  "lineNumber": 1461,
                                                  "columnNumber": 20,
                                                  "prevLine": "    var template = function(data) {",
                                                  "nextLine": "    };",
                                                  "line": "      return render.call(this, data, _);"
                                                },
                                                {
                                                  "functionName": "render",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/js/views/todo-view-original.js",
                                                  "lineNumber": 51,
                                                  "columnNumber": 22,
                                                  "prevLine": "",
                                                  "nextLine": "\t\t\tthis.$el.toggleClass('completed', this.model.get('completed'));",
                                                  "line": "\t\t\tthis.$el.html(this.template(this.model.toJSON()));"
                                                },
                                                {
                                                  "functionName": "addOne",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                                  "lineNumber": 80,
                                                  "columnNumber": 26,
                                                  "prevLine": "\t\t\tvar view = new app.TodoView({ model: todo });",
                                                  "nextLine": "\t\t},",
                                                  "line": "\t\t\tthis.$list.append(view.render().el);"
                                                },
                                                {
                                                  "functionName": "optimizeCb",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                  "lineNumber": 73,
                                                  "columnNumber": 20,
                                                  "prevLine": "      case 3: return function(value, index, collection) {",
                                                  "nextLine": "      };",
                                                  "line": "        return func.call(context, value, index, collection);"
                                                },
                                                {
                                                  "functionName": "forEach",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                  "lineNumber": 153,
                                                  "columnNumber": 8,
                                                  "prevLine": "      for (i = 0, length = obj.length; i < length; i++) {",
                                                  "nextLine": "      }",
                                                  "line": "        iteratee(obj[i], i, obj);"
                                                }
                                              ]
                                            },
                                            {
                                              "action": "string literal",
                                              "inputValues": [
                                                null
                                              ],
                                              "value": "Bake cake",
                                              "stack": [
                                                "Error",
                                                "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                                "    at stringTrace (http://localhost:8000/string-trace.js:112:17)",
                                                "    at stringTraceAdd (http://localhost:8000/string-trace.js:140:13)",
                                                "    at Function.escape (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1391:72)",
                                                "    at fn05608707561863249 (Function05608707561863249.js:8:645)",
                                                "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                                "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                                "    at app.TodoView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/todo-view.js:52:23)",
                                                "    at app.AppView.Backbone.View.extend.addOne (http://localhost:8000/backbone-todomvc/js/views/app-view.js:78:27)",
                                                "    at http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:77:23"
                                              ],
                                              "resolvedStack": [
                                                {
                                                  "functionName": "escaper",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                  "lineNumber": 1356,
                                                  "columnNumber": 29,
                                                  "prevLine": "    return function(string) {",
                                                  "nextLine": "      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;",
                                                  "line": "      string = string == null ? '' : '' + string;"
                                                },
                                                {
                                                  "functionName": "print",
                                                  "fileName": "unknown",
                                                  "lineNumber": 8,
                                                  "columnNumber": 28,
                                                  "prevLine": "'</label>\\n\t\t\t\t<button class=\"destroy\"></button>\\n\t\t\t</div>\\n\t\t\t<input class=\"edit\" value=\"'+",
                                                  "nextLine": "'\">\\n\t\t';",
                                                  "line": "((__t=( title ))==null?'':_.escape(__t))+"
                                                },
                                                {
                                                  "functionName": "template",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                  "lineNumber": 1461,
                                                  "columnNumber": 20,
                                                  "prevLine": "    var template = function(data) {",
                                                  "nextLine": "    };",
                                                  "line": "      return render.call(this, data, _);"
                                                },
                                                {
                                                  "functionName": "render",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/js/views/todo-view-original.js",
                                                  "lineNumber": 51,
                                                  "columnNumber": 22,
                                                  "prevLine": "",
                                                  "nextLine": "\t\t\tthis.$el.toggleClass('completed', this.model.get('completed'));",
                                                  "line": "\t\t\tthis.$el.html(this.template(this.model.toJSON()));"
                                                },
                                                {
                                                  "functionName": "addOne",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                                  "lineNumber": 80,
                                                  "columnNumber": 26,
                                                  "prevLine": "\t\t\tvar view = new app.TodoView({ model: todo });",
                                                  "nextLine": "\t\t},",
                                                  "line": "\t\t\tthis.$list.append(view.render().el);"
                                                },
                                                {
                                                  "functionName": "optimizeCb",
                                                  "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                                  "lineNumber": 73,
                                                  "columnNumber": 20,
                                                  "prevLine": "      case 3: return function(value, index, collection) {",
                                                  "nextLine": "      };",
                                                  "line": "        return func.call(context, value, index, collection);"
                                                }
                                              ]
                                            }
                                          ],
                                          "value": "Bake cake",
                                          "stack": [
                                            "Error",
                                            "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                            "    at stringTraceAdd (http://localhost:8000/string-trace.js:149:17)",
                                            "    at Function.escape (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1391:72)",
                                            "    at fn05608707561863249 (Function05608707561863249.js:8:645)",
                                            "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                            "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                            "    at app.TodoView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/todo-view.js:52:23)",
                                            "    at app.AppView.Backbone.View.extend.addOne (http://localhost:8000/backbone-todomvc/js/views/app-view.js:78:27)",
                                            "    at http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:77:23",
                                            "    at Function._.each._.forEach (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:159:9)"
                                          ],
                                          "resolvedStack": [
                                            {
                                              "functionName": "escaper",
                                              "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                              "lineNumber": 1356,
                                              "columnNumber": 29,
                                              "prevLine": "    return function(string) {",
                                              "nextLine": "      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;",
                                              "line": "      string = string == null ? '' : '' + string;"
                                            },
                                            {
                                              "functionName": "print",
                                              "fileName": "unknown",
                                              "lineNumber": 8,
                                              "columnNumber": 28,
                                              "prevLine": "'</label>\\n\t\t\t\t<button class=\"destroy\"></button>\\n\t\t\t</div>\\n\t\t\t<input class=\"edit\" value=\"'+",
                                              "nextLine": "'\">\\n\t\t';",
                                              "line": "((__t=( title ))==null?'':_.escape(__t))+"
                                            },
                                            {
                                              "functionName": "template",
                                              "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                              "lineNumber": 1461,
                                              "columnNumber": 20,
                                              "prevLine": "    var template = function(data) {",
                                              "nextLine": "    };",
                                              "line": "      return render.call(this, data, _);"
                                            },
                                            {
                                              "functionName": "render",
                                              "fileName": "http://localhost:8000/backbone-todomvc/js/views/todo-view-original.js",
                                              "lineNumber": 51,
                                              "columnNumber": 22,
                                              "prevLine": "",
                                              "nextLine": "\t\t\tthis.$el.toggleClass('completed', this.model.get('completed'));",
                                              "line": "\t\t\tthis.$el.html(this.template(this.model.toJSON()));"
                                            },
                                            {
                                              "functionName": "addOne",
                                              "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                              "lineNumber": 80,
                                              "columnNumber": 26,
                                              "prevLine": "\t\t\tvar view = new app.TodoView({ model: todo });",
                                              "nextLine": "\t\t},",
                                              "line": "\t\t\tthis.$list.append(view.render().el);"
                                            },
                                            {
                                              "functionName": "optimizeCb",
                                              "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                              "lineNumber": 73,
                                              "columnNumber": 20,
                                              "prevLine": "      case 3: return function(value, index, collection) {",
                                              "nextLine": "      };",
                                              "line": "        return func.call(context, value, index, collection);"
                                            },
                                            {
                                              "functionName": "forEach",
                                              "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                              "lineNumber": 153,
                                              "columnNumber": 8,
                                              "prevLine": "      for (i = 0, length = obj.length; i < length; i++) {",
                                              "nextLine": "      }",
                                              "line": "        iteratee(obj[i], i, obj);"
                                            }
                                          ]
                                        }
                                      ],
                                      "value": "\n\t\t\t<div class=\"view\">\n\t\t\t\t<input class=\"toggle\" type=\"checkbox\" >\n\t\t\t\t<label>Bake cake</label>\n\t\t\t\t<button class=\"destroy\"></button>\n\t\t\t</div>\n\t\t\t<input class=\"edit\" value=\"Bake cake",
                                      "stack": [
                                        "Error",
                                        "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                        "    at stringTraceAdd (http://localhost:8000/string-trace.js:149:17)",
                                        "    at fn05608707561863249 (Function05608707561863249.js:8:44)",
                                        "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                        "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                        "    at app.TodoView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/todo-view.js:52:23)",
                                        "    at app.AppView.Backbone.View.extend.addOne (http://localhost:8000/backbone-todomvc/js/views/app-view.js:78:27)",
                                        "    at http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:77:23",
                                        "    at Function._.each._.forEach (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:159:9)",
                                        "    at .each (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:91:27)"
                                      ],
                                      "resolvedStack": [
                                        {
                                          "functionName": "print",
                                          "fileName": "unknown",
                                          "lineNumber": 3,
                                          "columnNumber": 0,
                                          "prevLine": "with(obj||{}){",
                                          "nextLine": "((__t=( completed ? 'checked' : '' ))==null?'':__t)+",
                                          "line": "__p+='\\n\t\t\t<div class=\"view\">\\n\t\t\t\t<input class=\"toggle\" type=\"checkbox\" '+"
                                        },
                                        {
                                          "functionName": "template",
                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                          "lineNumber": 1461,
                                          "columnNumber": 20,
                                          "prevLine": "    var template = function(data) {",
                                          "nextLine": "    };",
                                          "line": "      return render.call(this, data, _);"
                                        },
                                        {
                                          "functionName": "render",
                                          "fileName": "http://localhost:8000/backbone-todomvc/js/views/todo-view-original.js",
                                          "lineNumber": 51,
                                          "columnNumber": 22,
                                          "prevLine": "",
                                          "nextLine": "\t\t\tthis.$el.toggleClass('completed', this.model.get('completed'));",
                                          "line": "\t\t\tthis.$el.html(this.template(this.model.toJSON()));"
                                        },
                                        {
                                          "functionName": "addOne",
                                          "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                          "lineNumber": 80,
                                          "columnNumber": 26,
                                          "prevLine": "\t\t\tvar view = new app.TodoView({ model: todo });",
                                          "nextLine": "\t\t},",
                                          "line": "\t\t\tthis.$list.append(view.render().el);"
                                        },
                                        {
                                          "functionName": "optimizeCb",
                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                          "lineNumber": 73,
                                          "columnNumber": 20,
                                          "prevLine": "      case 3: return function(value, index, collection) {",
                                          "nextLine": "      };",
                                          "line": "        return func.call(context, value, index, collection);"
                                        },
                                        {
                                          "functionName": "forEach",
                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                          "lineNumber": 153,
                                          "columnNumber": 8,
                                          "prevLine": "      for (i = 0, length = obj.length; i < length; i++) {",
                                          "nextLine": "      }",
                                          "line": "        iteratee(obj[i], i, obj);"
                                        },
                                        {
                                          "functionName": "addMethod",
                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                                          "lineNumber": 87,
                                          "columnNumber": 25,
                                          "prevLine": "      case 3: return function(iteratee, context) {",
                                          "nextLine": "      };",
                                          "line": "        return _[method](this[attribute], cb(iteratee, this), context);"
                                        }
                                      ]
                                    },
                                    {
                                      "action": "string literal",
                                      "inputValues": [
                                        null
                                      ],
                                      "value": "\">\n\t\t",
                                      "stack": [
                                        "Error",
                                        "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                        "    at stringTrace (http://localhost:8000/string-trace.js:112:17)",
                                        "    at fn05608707561863249 (Function05608707561863249.js:8:659)",
                                        "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                        "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                        "    at app.TodoView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/todo-view.js:52:23)",
                                        "    at app.AppView.Backbone.View.extend.addOne (http://localhost:8000/backbone-todomvc/js/views/app-view.js:78:27)",
                                        "    at http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:77:23",
                                        "    at Function._.each._.forEach (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:159:9)",
                                        "    at .each (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:91:27)"
                                      ],
                                      "resolvedStack": [
                                        {
                                          "functionName": "print",
                                          "fileName": "unknown",
                                          "lineNumber": 3,
                                          "columnNumber": 0,
                                          "prevLine": "with(obj||{}){",
                                          "nextLine": "((__t=( completed ? 'checked' : '' ))==null?'':__t)+",
                                          "line": "__p+='\\n\t\t\t<div class=\"view\">\\n\t\t\t\t<input class=\"toggle\" type=\"checkbox\" '+"
                                        },
                                        {
                                          "functionName": "template",
                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                          "lineNumber": 1461,
                                          "columnNumber": 20,
                                          "prevLine": "    var template = function(data) {",
                                          "nextLine": "    };",
                                          "line": "      return render.call(this, data, _);"
                                        },
                                        {
                                          "functionName": "render",
                                          "fileName": "http://localhost:8000/backbone-todomvc/js/views/todo-view-original.js",
                                          "lineNumber": 51,
                                          "columnNumber": 22,
                                          "prevLine": "",
                                          "nextLine": "\t\t\tthis.$el.toggleClass('completed', this.model.get('completed'));",
                                          "line": "\t\t\tthis.$el.html(this.template(this.model.toJSON()));"
                                        },
                                        {
                                          "functionName": "addOne",
                                          "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                          "lineNumber": 80,
                                          "columnNumber": 26,
                                          "prevLine": "\t\t\tvar view = new app.TodoView({ model: todo });",
                                          "nextLine": "\t\t},",
                                          "line": "\t\t\tthis.$list.append(view.render().el);"
                                        },
                                        {
                                          "functionName": "optimizeCb",
                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                          "lineNumber": 73,
                                          "columnNumber": 20,
                                          "prevLine": "      case 3: return function(value, index, collection) {",
                                          "nextLine": "      };",
                                          "line": "        return func.call(context, value, index, collection);"
                                        },
                                        {
                                          "functionName": "forEach",
                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                          "lineNumber": 153,
                                          "columnNumber": 8,
                                          "prevLine": "      for (i = 0, length = obj.length; i < length; i++) {",
                                          "nextLine": "      }",
                                          "line": "        iteratee(obj[i], i, obj);"
                                        },
                                        {
                                          "functionName": "addMethod",
                                          "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                                          "lineNumber": 87,
                                          "columnNumber": 25,
                                          "prevLine": "      case 3: return function(iteratee, context) {",
                                          "nextLine": "      };",
                                          "line": "        return _[method](this[attribute], cb(iteratee, this), context);"
                                        }
                                      ]
                                    }
                                  ],
                                  "value": "\n\t\t\t<div class=\"view\">\n\t\t\t\t<input class=\"toggle\" type=\"checkbox\" >\n\t\t\t\t<label>Bake cake</label>\n\t\t\t\t<button class=\"destroy\"></button>\n\t\t\t</div>\n\t\t\t<input class=\"edit\" value=\"Bake cake\">\n\t\t",
                                  "stack": [
                                    "Error",
                                    "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                    "    at stringTraceAdd (http://localhost:8000/string-trace.js:149:17)",
                                    "    at fn05608707561863249 (Function05608707561863249.js:8:29)",
                                    "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                    "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                    "    at app.TodoView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/todo-view.js:52:23)",
                                    "    at app.AppView.Backbone.View.extend.addOne (http://localhost:8000/backbone-todomvc/js/views/app-view.js:78:27)",
                                    "    at http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:77:23",
                                    "    at Function._.each._.forEach (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:159:9)",
                                    "    at .each (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:91:27)"
                                  ],
                                  "resolvedStack": [
                                    {
                                      "functionName": "print",
                                      "fileName": "unknown",
                                      "lineNumber": 3,
                                      "columnNumber": 0,
                                      "prevLine": "with(obj||{}){",
                                      "nextLine": "((__t=( completed ? 'checked' : '' ))==null?'':__t)+",
                                      "line": "__p+='\\n\t\t\t<div class=\"view\">\\n\t\t\t\t<input class=\"toggle\" type=\"checkbox\" '+"
                                    },
                                    {
                                      "functionName": "template",
                                      "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                      "lineNumber": 1461,
                                      "columnNumber": 20,
                                      "prevLine": "    var template = function(data) {",
                                      "nextLine": "    };",
                                      "line": "      return render.call(this, data, _);"
                                    },
                                    {
                                      "functionName": "render",
                                      "fileName": "http://localhost:8000/backbone-todomvc/js/views/todo-view-original.js",
                                      "lineNumber": 51,
                                      "columnNumber": 22,
                                      "prevLine": "",
                                      "nextLine": "\t\t\tthis.$el.toggleClass('completed', this.model.get('completed'));",
                                      "line": "\t\t\tthis.$el.html(this.template(this.model.toJSON()));"
                                    },
                                    {
                                      "functionName": "addOne",
                                      "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                      "lineNumber": 80,
                                      "columnNumber": 26,
                                      "prevLine": "\t\t\tvar view = new app.TodoView({ model: todo });",
                                      "nextLine": "\t\t},",
                                      "line": "\t\t\tthis.$list.append(view.render().el);"
                                    },
                                    {
                                      "functionName": "optimizeCb",
                                      "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                      "lineNumber": 73,
                                      "columnNumber": 20,
                                      "prevLine": "      case 3: return function(value, index, collection) {",
                                      "nextLine": "      };",
                                      "line": "        return func.call(context, value, index, collection);"
                                    },
                                    {
                                      "functionName": "forEach",
                                      "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                      "lineNumber": 153,
                                      "columnNumber": 8,
                                      "prevLine": "      for (i = 0, length = obj.length; i < length; i++) {",
                                      "nextLine": "      }",
                                      "line": "        iteratee(obj[i], i, obj);"
                                    },
                                    {
                                      "functionName": "addMethod",
                                      "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                                      "lineNumber": 87,
                                      "columnNumber": 25,
                                      "prevLine": "      case 3: return function(iteratee, context) {",
                                      "nextLine": "      };",
                                      "line": "        return _[method](this[attribute], cb(iteratee, this), context);"
                                    }
                                  ]
                                }
                              ],
                              "value": "\n\t\t\t<div class=\"view\">\n\t\t\t\t<input class=\"toggle\" type=\"checkbox\" >\n\t\t\t\t<label>Bake cake</label>\n\t\t\t\t<button class=\"destroy\"></button>\n\t\t\t</div>\n\t\t\t<input class=\"edit\" value=\"Bake cake\">\n\t\t",
                              "stack": [
                                "Error",
                                "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                                "    at stringTraceAdd (http://localhost:8000/string-trace.js:149:17)",
                                "    at fn05608707561863249 (Function05608707561863249.js:8:9)",
                                "    at .<anonymous> (http://localhost:8000/string-trace.js:242:31)",
                                "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                                "    at app.TodoView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/todo-view.js:52:23)",
                                "    at app.AppView.Backbone.View.extend.addOne (http://localhost:8000/backbone-todomvc/js/views/app-view.js:78:27)",
                                "    at http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:77:23",
                                "    at Function._.each._.forEach (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:159:9)",
                                "    at .each (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:91:27)"
                              ],
                              "resolvedStack": [
                                {
                                  "functionName": "print",
                                  "fileName": "unknown",
                                  "lineNumber": 3,
                                  "columnNumber": 0,
                                  "prevLine": "with(obj||{}){",
                                  "nextLine": "((__t=( completed ? 'checked' : '' ))==null?'':__t)+",
                                  "line": "__p+='\\n\t\t\t<div class=\"view\">\\n\t\t\t\t<input class=\"toggle\" type=\"checkbox\" '+"
                                },
                                {
                                  "functionName": "template",
                                  "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                  "lineNumber": 1461,
                                  "columnNumber": 20,
                                  "prevLine": "    var template = function(data) {",
                                  "nextLine": "    };",
                                  "line": "      return render.call(this, data, _);"
                                },
                                {
                                  "functionName": "render",
                                  "fileName": "http://localhost:8000/backbone-todomvc/js/views/todo-view-original.js",
                                  "lineNumber": 51,
                                  "columnNumber": 22,
                                  "prevLine": "",
                                  "nextLine": "\t\t\tthis.$el.toggleClass('completed', this.model.get('completed'));",
                                  "line": "\t\t\tthis.$el.html(this.template(this.model.toJSON()));"
                                },
                                {
                                  "functionName": "addOne",
                                  "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                                  "lineNumber": 80,
                                  "columnNumber": 26,
                                  "prevLine": "\t\t\tvar view = new app.TodoView({ model: todo });",
                                  "nextLine": "\t\t},",
                                  "line": "\t\t\tthis.$list.append(view.render().el);"
                                },
                                {
                                  "functionName": "optimizeCb",
                                  "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                  "lineNumber": 73,
                                  "columnNumber": 20,
                                  "prevLine": "      case 3: return function(value, index, collection) {",
                                  "nextLine": "      };",
                                  "line": "        return func.call(context, value, index, collection);"
                                },
                                {
                                  "functionName": "forEach",
                                  "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                                  "lineNumber": 153,
                                  "columnNumber": 8,
                                  "prevLine": "      for (i = 0, length = obj.length; i < length; i++) {",
                                  "nextLine": "      }",
                                  "line": "        iteratee(obj[i], i, obj);"
                                },
                                {
                                  "functionName": "addMethod",
                                  "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                                  "lineNumber": 87,
                                  "columnNumber": 25,
                                  "prevLine": "      case 3: return function(iteratee, context) {",
                                  "nextLine": "      };",
                                  "line": "        return _[method](this[attribute], cb(iteratee, this), context);"
                                }
                              ]
                            },
                            {
                              "action": "arg_/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\\w:]+)[^>]*)\\/>/gi"
                            },
                            {
                              "action": "arg_<$1></$2>"
                            }
                          ],
                          "value": "\n\t\t\t<div class=\"view\">\n\t\t\t\t<input class=\"toggle\" type=\"checkbox\" >\n\t\t\t\t<label>Bake cake</label>\n\t\t\t\t<button class=\"destroy\"></button>\n\t\t\t</div>\n\t\t\t<input class=\"edit\" value=\"Bake cake\">\n\t\t",
                          "stack": [
                            "Error",
                            "    at makeOrigin (http://localhost:8000/string-trace.js:98:16)",
                            "    at Proxy.StringTraceString.(anonymous function) (http://localhost:8000/string-trace.js:45:33)",
                            "    at .<anonymous> (http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery.js:901:250)",
                            "    at jQuery.access (http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery.js:632:12)",
                            "    at jQuery.fn.extend.html (http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery.js:900:396)",
                            "    at app.TodoView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/todo-view.js:52:13)",
                            "    at app.AppView.Backbone.View.extend.addOne (http://localhost:8000/backbone-todomvc/js/views/app-view.js:78:27)",
                            "    at http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:77:23",
                            "    at Function._.each._.forEach (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:159:9)",
                            "    at .each (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:91:27)"
                          ],
                          "resolvedStack": [
                            {
                              "functionName": "html",
                              "fileName": "http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery-original.js",
                              "lineNumber": 5313,
                              "columnNumber": 18,
                              "prevLine": "",
                              "nextLine": "",
                              "line": "\t\t\t\tvalue = value.replace( rxhtmlTag, \"<$1></$2>\" );"
                            },
                            {
                              "functionName": "jQuery.access",
                              "fileName": "http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery-original.js",
                              "lineNumber": 3491,
                              "columnNumber": 7,
                              "prevLine": "\t\t\tif ( raw ) {",
                              "nextLine": "\t\t\t\tfn = null;",
                              "line": "\t\t\t\tfn.call( elems, value );"
                            },
                            {
                              "functionName": "html",
                              "fileName": "http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery-original.js",
                              "lineNumber": 5300,
                              "columnNumber": 9,
                              "prevLine": "\thtml: function( value ) {",
                              "nextLine": "\t\t\tvar elem = this[ 0 ] || {},",
                              "line": "\t\treturn access( this, function( value ) {"
                            },
                            {
                              "functionName": "render",
                              "fileName": "http://localhost:8000/backbone-todomvc/js/views/todo-view-original.js",
                              "lineNumber": 51,
                              "columnNumber": 12,
                              "prevLine": "",
                              "nextLine": "\t\t\tthis.$el.toggleClass('completed', this.model.get('completed'));",
                              "line": "\t\t\tthis.$el.html(this.template(this.model.toJSON()));"
                            },
                            {
                              "functionName": "addOne",
                              "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                              "lineNumber": 80,
                              "columnNumber": 26,
                              "prevLine": "\t\t\tvar view = new app.TodoView({ model: todo });",
                              "nextLine": "\t\t},",
                              "line": "\t\t\tthis.$list.append(view.render().el);"
                            },
                            {
                              "functionName": "optimizeCb",
                              "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                              "lineNumber": 73,
                              "columnNumber": 20,
                              "prevLine": "      case 3: return function(value, index, collection) {",
                              "nextLine": "      };",
                              "line": "        return func.call(context, value, index, collection);"
                            },
                            {
                              "functionName": "forEach",
                              "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                              "lineNumber": 153,
                              "columnNumber": 8,
                              "prevLine": "      for (i = 0, length = obj.length; i < length; i++) {",
                              "nextLine": "      }",
                              "line": "        iteratee(obj[i], i, obj);"
                            },
                            {
                              "functionName": "addMethod",
                              "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                              "lineNumber": 87,
                              "columnNumber": 25,
                              "prevLine": "      case 3: return function(iteratee, context) {",
                              "nextLine": "      };",
                              "line": "        return _[method](this[attribute], cb(iteratee, this), context);"
                            }
                          ]
                        }
                      ],
                      "action": "assign innerHTML",
                      "stack": [
                        "Error",
                        "    at Error (native)",
                        "    at stringTraceSetInnerHTML (http://localhost:8000/string-trace.js:176:20)",
                        "    at .<anonymous> (http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery.js:902:82)",
                        "    at jQuery.access (http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery.js:632:12)",
                        "    at jQuery.fn.extend.html (http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery.js:900:396)",
                        "    at app.TodoView.Backbone.View.extend.render (http://localhost:8000/backbone-todomvc/js/views/todo-view.js:52:13)",
                        "    at app.AppView.Backbone.View.extend.addOne (http://localhost:8000/backbone-todomvc/js/views/app-view.js:78:27)",
                        "    at http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:77:23",
                        "    at Function._.each._.forEach (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:159:9)",
                        "    at .each (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:91:27)"
                      ],
                      "resolvedStack": [
                        {
                          "functionName": ".<anonymous>",
                          "fileName": "http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery-original.js",
                          "lineNumber": 5321,
                          "columnNumber": 49,
                          "prevLine": "\t\t\t\t\t\tif ( elem.nodeType === 1 ) {",
                          "nextLine": "\t\t\t\t\t\t\telem.innerHTML = value;",
                          "line": "\t\t\t\t\t\t\tjQuery.cleanData( getAll( elem, false ) );"
                        },
                        {
                          "functionName": "jQuery.access",
                          "fileName": "http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery-original.js",
                          "lineNumber": 3491,
                          "columnNumber": 7,
                          "prevLine": "\t\t\tif ( raw ) {",
                          "nextLine": "\t\t\t\tfn = null;",
                          "line": "\t\t\t\tfn.call( elems, value );"
                        },
                        {
                          "functionName": "html",
                          "fileName": "http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery-original.js",
                          "lineNumber": 5300,
                          "columnNumber": 9,
                          "prevLine": "\thtml: function( value ) {",
                          "nextLine": "\t\t\tvar elem = this[ 0 ] || {},",
                          "line": "\t\treturn access( this, function( value ) {"
                        },
                        {
                          "functionName": "render",
                          "fileName": "http://localhost:8000/backbone-todomvc/js/views/todo-view-original.js",
                          "lineNumber": 51,
                          "columnNumber": 12,
                          "prevLine": "",
                          "nextLine": "\t\t\tthis.$el.toggleClass('completed', this.model.get('completed'));",
                          "line": "\t\t\tthis.$el.html(this.template(this.model.toJSON()));"
                        },
                        {
                          "functionName": "addOne",
                          "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                          "lineNumber": 80,
                          "columnNumber": 26,
                          "prevLine": "\t\t\tvar view = new app.TodoView({ model: todo });",
                          "nextLine": "\t\t},",
                          "line": "\t\t\tthis.$list.append(view.render().el);"
                        },
                        {
                          "functionName": "optimizeCb",
                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                          "lineNumber": 73,
                          "columnNumber": 20,
                          "prevLine": "      case 3: return function(value, index, collection) {",
                          "nextLine": "      };",
                          "line": "        return func.call(context, value, index, collection);"
                        },
                        {
                          "functionName": "forEach",
                          "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                          "lineNumber": 153,
                          "columnNumber": 8,
                          "prevLine": "      for (i = 0, length = obj.length; i < length; i++) {",
                          "nextLine": "      }",
                          "line": "        iteratee(obj[i], i, obj);"
                        },
                        {
                          "functionName": "addMethod",
                          "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                          "lineNumber": 87,
                          "columnNumber": 25,
                          "prevLine": "      case 3: return function(iteratee, context) {",
                          "nextLine": "      };",
                          "line": "        return _[method](this[attribute], cb(iteratee, this), context);"
                        }
                      ]
                    }
                  ],
                  "inputValues": [],
                  "stack": [
                    "Error",
                    "    at HTMLUListElement.<anonymous> (http://localhost:8000/string-trace.js:204:24)",
                    "    at HTMLUListElement.<anonymous> (http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery.js:898:679)",
                    "    at jQuery.fn.extend.domManip (http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery.js:912:69)",
                    "    at jQuery.fn.extend.append (http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery.js:898:466)",
                    "    at app.AppView.Backbone.View.extend.addOne (http://localhost:8000/backbone-todomvc/js/views/app-view.js:78:15)",
                    "    at http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:77:23",
                    "    at Function._.each._.forEach (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:159:9)",
                    "    at .each (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:91:27)",
                    "    at app.AppView.Backbone.View.extend.addAll (http://localhost:8000/backbone-todomvc/js/views/app-view.js:84:14)",
                    "    at triggerEvents (http://localhost:8000/backbone-todomvc/modules/backbone/backbone.js:392:72)"
                  ],
                  "resolvedStack": [
                    {
                      "functionName": "append",
                      "fileName": "http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery-original.js",
                      "lineNumber": 5221,
                      "columnNumber": 11,
                      "prevLine": "\t\t\t\tvar target = manipulationTarget( this, elem );",
                      "nextLine": "\t\t\t}",
                      "line": "\t\t\t\ttarget.appendChild( elem );"
                    },
                    {
                      "functionName": "jQuery.fn.extend.domManip",
                      "fileName": "http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery-original.js",
                      "lineNumber": 5414,
                      "columnNumber": 14,
                      "prevLine": "",
                      "nextLine": "\t\t\t\t}",
                      "line": "\t\t\t\t\tcallback.call( this[ i ], node, i );"
                    },
                    {
                      "functionName": "append",
                      "fileName": "http://localhost:8000/backbone-todomvc/modules/jquery/dist/jquery-original.js",
                      "lineNumber": 5218,
                      "columnNumber": 14,
                      "prevLine": "\tappend: function() {",
                      "nextLine": "\t\t\tif ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {",
                      "line": "\t\treturn this.domManip( arguments, function( elem ) {"
                    },
                    {
                      "functionName": "addOne",
                      "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                      "lineNumber": 80,
                      "columnNumber": 14,
                      "prevLine": "\t\t\tvar view = new app.TodoView({ model: todo });",
                      "nextLine": "\t\t},",
                      "line": "\t\t\tthis.$list.append(view.render().el);"
                    },
                    {
                      "functionName": "optimizeCb",
                      "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                      "lineNumber": 73,
                      "columnNumber": 20,
                      "prevLine": "      case 3: return function(value, index, collection) {",
                      "nextLine": "      };",
                      "line": "        return func.call(context, value, index, collection);"
                    },
                    {
                      "functionName": "forEach",
                      "fileName": "http://localhost:8000/backbone-todomvc/modules/underscore/underscore-original.js",
                      "lineNumber": 153,
                      "columnNumber": 8,
                      "prevLine": "      for (i = 0, length = obj.length; i < length; i++) {",
                      "nextLine": "      }",
                      "line": "        iteratee(obj[i], i, obj);"
                    },
                    {
                      "functionName": "addMethod",
                      "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                      "lineNumber": 87,
                      "columnNumber": 25,
                      "prevLine": "      case 3: return function(iteratee, context) {",
                      "nextLine": "      };",
                      "line": "        return _[method](this[attribute], cb(iteratee, this), context);"
                    },
                    {
                      "functionName": "addAll",
                      "fileName": "http://localhost:8000/backbone-todomvc/js/views/app-view-original.js",
                      "lineNumber": 86,
                      "columnNumber": 13,
                      "prevLine": "\t\t\tthis.$list.html('');",
                      "nextLine": "\t\t},",
                      "line": "\t\t\tapp.todos.each(this.addOne, this);"
                    },
                    {
                      "functionName": "triggerEvents",
                      "fileName": "http://localhost:8000/backbone-todomvc/modules/backbone/backbone-original.js",
                      "lineNumber": 370,
                      "columnNumber": 56,
                      "prevLine": "      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;",
                      "nextLine": "      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;",
                      "line": "      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;"
                    }
                  ]
                }
              ],
              "inputValues": []
            }
          ],
          "inputValues": []
        }
      ],
      "inputValues": []
    }
  ],
  "inputValues": []
}
