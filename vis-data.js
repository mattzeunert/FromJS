window.visOriginData = {
  "children": [
    {
      "action": "initial html",
      "actionDetails": "SECTION",
      "children": [],
      "inputValues": []
    },
    {
      "action": "initial html",
      "actionDetails": "SCRIPT",
      "children": [],
      "inputValues": []
    },
    {
      "action": "initial html",
      "actionDetails": "SCRIPT",
      "children": [],
      "inputValues": []
    },
    {
      "action": "initial html",
      "actionDetails": "SCRIPT",
      "children": [],
      "inputValues": []
    },
    {
      "action": "initial html",
      "actionDetails": "SCRIPT",
      "children": [],
      "inputValues": []
    },
    {
      "action": "appendChild",
      "actionDetails": "SCRIPT",
      "stack": [
        "Error",
        "    at HTMLBodyElement.<anonymous> (http://localhost:8000/string-trace.js:225:24)",
        "    at new window.Function (http://localhost:8000/string-trace.js:299:19)",
        "    at Function._.template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1483:20)",
        "    at onload (http://localhost:8000/backbone-todomvc/simple.js:2:19)",
        "    at onload (http://localhost:8000/backbone-todomvc/simple.html:9:26)"
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
          "functionName": "onload",
          "fileName": "http://localhost:8000/backbone-todomvc/simple-original.js",
          "lineNumber": 2,
          "columnNumber": 18,
          "prevLine": "function onload(){",
          "nextLine": "    var html = templ({name: \"John\"})",
          "line": "    var templ = _.template(\"Hello <%= name %>\")"
        },
        {
          "functionName": "onload",
          "fileName": "http://localhost:8000/backbone-todomvc/simple.html",
          "lineNumber": 9,
          "columnNumber": 26,
          "source": "    at onload (http://localhost:8000/backbone-todomvc/simple.html:9:26)",
          "prevLine": "\t</head>",
          "nextLine": "\t\t<section class=\"todoapp\">",
          "line": "\t<body onload=\"onload()\">"
        }
      ]
    },
    {
      "action": "appendChild",
      "actionDetails": "DIV",
      "children": [
        {
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
                    "    at makeOrigin (http://localhost:8000/string-trace.js:119:16)",
                    "    at stringTrace (http://localhost:8000/string-trace.js:133:17)",
                    "    at fn07253631235109281 (Function07253631235109281.js:2:11)",
                    "    at http://localhost:8000/string-trace.js:302:31",
                    "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                    "    at onload (http://localhost:8000/backbone-todomvc/simple.js:3:16)",
                    "    at onload (http://localhost:8000/backbone-todomvc/simple.html:9:26)"
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
                      "functionName": "onload",
                      "fileName": "http://localhost:8000/backbone-todomvc/simple-original.js",
                      "lineNumber": 3,
                      "columnNumber": 15,
                      "prevLine": "    var templ = _.template(\"Hello <%= name %>\")",
                      "nextLine": "    var el = document.createElement(\"div\")",
                      "line": "    var html = templ({name: \"John\"})"
                    },
                    {
                      "functionName": "onload",
                      "fileName": "http://localhost:8000/backbone-todomvc/simple.html",
                      "lineNumber": 9,
                      "columnNumber": 26,
                      "source": "    at onload (http://localhost:8000/backbone-todomvc/simple.html:9:26)",
                      "prevLine": "\t</head>",
                      "nextLine": "\t\t<section class=\"todoapp\">",
                      "line": "\t<body onload=\"onload()\">"
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
                          "action": "string literal",
                          "inputValues": [
                            null
                          ],
                          "value": "Hello ",
                          "stack": [
                            "Error",
                            "    at makeOrigin (http://localhost:8000/string-trace.js:119:16)",
                            "    at stringTrace (http://localhost:8000/string-trace.js:133:17)",
                            "    at fn07253631235109281 (Function07253631235109281.js:8:59)",
                            "    at http://localhost:8000/string-trace.js:302:31",
                            "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                            "    at onload (http://localhost:8000/backbone-todomvc/simple.js:3:16)",
                            "    at onload (http://localhost:8000/backbone-todomvc/simple.html:9:26)"
                          ],
                          "resolvedStack": [
                            {
                              "functionName": "print",
                              "fileName": "unknown",
                              "lineNumber": 3,
                              "columnNumber": 0,
                              "prevLine": "with(obj||{}){",
                              "nextLine": "((__t=( name ))==null?'':__t)+",
                              "line": "__p+='Hello '+"
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
                              "functionName": "onload",
                              "fileName": "http://localhost:8000/backbone-todomvc/simple-original.js",
                              "lineNumber": 3,
                              "columnNumber": 15,
                              "prevLine": "    var templ = _.template(\"Hello <%= name %>\")",
                              "nextLine": "    var el = document.createElement(\"div\")",
                              "line": "    var html = templ({name: \"John\"})"
                            },
                            {
                              "functionName": "onload",
                              "fileName": "http://localhost:8000/backbone-todomvc/simple.html",
                              "lineNumber": 9,
                              "columnNumber": 26,
                              "source": "    at onload (http://localhost:8000/backbone-todomvc/simple.html:9:26)",
                              "prevLine": "\t</head>",
                              "nextLine": "\t\t<section class=\"todoapp\">",
                              "line": "\t<body onload=\"onload()\">"
                            }
                          ]
                        },
                        {
                          "action": "string literal",
                          "inputValues": [
                            null
                          ],
                          "value": "John",
                          "stack": [
                            "Error",
                            "    at makeOrigin (http://localhost:8000/string-trace.js:119:16)",
                            "    at stringTrace (http://localhost:8000/string-trace.js:133:17)",
                            "    at stringTraceAdd (http://localhost:8000/string-trace.js:161:13)",
                            "    at fn07253631235109281 (Function07253631235109281.js:8:44)",
                            "    at http://localhost:8000/string-trace.js:302:31",
                            "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                            "    at onload (http://localhost:8000/backbone-todomvc/simple.js:3:16)",
                            "    at onload (http://localhost:8000/backbone-todomvc/simple.html:9:26)"
                          ],
                          "resolvedStack": [
                            {
                              "functionName": "print",
                              "fileName": "unknown",
                              "lineNumber": 3,
                              "columnNumber": 0,
                              "prevLine": "with(obj||{}){",
                              "nextLine": "((__t=( name ))==null?'':__t)+",
                              "line": "__p+='Hello '+"
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
                              "functionName": "onload",
                              "fileName": "http://localhost:8000/backbone-todomvc/simple-original.js",
                              "lineNumber": 3,
                              "columnNumber": 15,
                              "prevLine": "    var templ = _.template(\"Hello <%= name %>\")",
                              "nextLine": "    var el = document.createElement(\"div\")",
                              "line": "    var html = templ({name: \"John\"})"
                            },
                            {
                              "functionName": "onload",
                              "fileName": "http://localhost:8000/backbone-todomvc/simple.html",
                              "lineNumber": 9,
                              "columnNumber": 26,
                              "source": "    at onload (http://localhost:8000/backbone-todomvc/simple.html:9:26)",
                              "prevLine": "\t</head>",
                              "nextLine": "\t\t<section class=\"todoapp\">",
                              "line": "\t<body onload=\"onload()\">"
                            }
                          ]
                        }
                      ],
                      "value": "Hello John",
                      "stack": [
                        "Error",
                        "    at makeOrigin (http://localhost:8000/string-trace.js:119:16)",
                        "    at stringTraceAdd (http://localhost:8000/string-trace.js:170:17)",
                        "    at fn07253631235109281 (Function07253631235109281.js:8:44)",
                        "    at http://localhost:8000/string-trace.js:302:31",
                        "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                        "    at onload (http://localhost:8000/backbone-todomvc/simple.js:3:16)",
                        "    at onload (http://localhost:8000/backbone-todomvc/simple.html:9:26)"
                      ],
                      "resolvedStack": [
                        {
                          "functionName": "print",
                          "fileName": "unknown",
                          "lineNumber": 3,
                          "columnNumber": 0,
                          "prevLine": "with(obj||{}){",
                          "nextLine": "((__t=( name ))==null?'':__t)+",
                          "line": "__p+='Hello '+"
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
                          "functionName": "onload",
                          "fileName": "http://localhost:8000/backbone-todomvc/simple-original.js",
                          "lineNumber": 3,
                          "columnNumber": 15,
                          "prevLine": "    var templ = _.template(\"Hello <%= name %>\")",
                          "nextLine": "    var el = document.createElement(\"div\")",
                          "line": "    var html = templ({name: \"John\"})"
                        },
                        {
                          "functionName": "onload",
                          "fileName": "http://localhost:8000/backbone-todomvc/simple.html",
                          "lineNumber": 9,
                          "columnNumber": 26,
                          "source": "    at onload (http://localhost:8000/backbone-todomvc/simple.html:9:26)",
                          "prevLine": "\t</head>",
                          "nextLine": "\t\t<section class=\"todoapp\">",
                          "line": "\t<body onload=\"onload()\">"
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
                        "    at makeOrigin (http://localhost:8000/string-trace.js:119:16)",
                        "    at stringTrace (http://localhost:8000/string-trace.js:133:17)",
                        "    at fn07253631235109281 (Function07253631235109281.js:8:150)",
                        "    at http://localhost:8000/string-trace.js:302:31",
                        "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                        "    at onload (http://localhost:8000/backbone-todomvc/simple.js:3:16)",
                        "    at onload (http://localhost:8000/backbone-todomvc/simple.html:9:26)"
                      ],
                      "resolvedStack": [
                        {
                          "functionName": "print",
                          "fileName": "unknown",
                          "lineNumber": 3,
                          "columnNumber": 0,
                          "prevLine": "with(obj||{}){",
                          "nextLine": "((__t=( name ))==null?'':__t)+",
                          "line": "__p+='Hello '+"
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
                          "functionName": "onload",
                          "fileName": "http://localhost:8000/backbone-todomvc/simple-original.js",
                          "lineNumber": 3,
                          "columnNumber": 15,
                          "prevLine": "    var templ = _.template(\"Hello <%= name %>\")",
                          "nextLine": "    var el = document.createElement(\"div\")",
                          "line": "    var html = templ({name: \"John\"})"
                        },
                        {
                          "functionName": "onload",
                          "fileName": "http://localhost:8000/backbone-todomvc/simple.html",
                          "lineNumber": 9,
                          "columnNumber": 26,
                          "source": "    at onload (http://localhost:8000/backbone-todomvc/simple.html:9:26)",
                          "prevLine": "\t</head>",
                          "nextLine": "\t\t<section class=\"todoapp\">",
                          "line": "\t<body onload=\"onload()\">"
                        }
                      ]
                    }
                  ],
                  "value": "Hello John",
                  "stack": [
                    "Error",
                    "    at makeOrigin (http://localhost:8000/string-trace.js:119:16)",
                    "    at stringTraceAdd (http://localhost:8000/string-trace.js:170:17)",
                    "    at fn07253631235109281 (Function07253631235109281.js:8:29)",
                    "    at http://localhost:8000/string-trace.js:302:31",
                    "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                    "    at onload (http://localhost:8000/backbone-todomvc/simple.js:3:16)",
                    "    at onload (http://localhost:8000/backbone-todomvc/simple.html:9:26)"
                  ],
                  "resolvedStack": [
                    {
                      "functionName": "print",
                      "fileName": "unknown",
                      "lineNumber": 3,
                      "columnNumber": 0,
                      "prevLine": "with(obj||{}){",
                      "nextLine": "((__t=( name ))==null?'':__t)+",
                      "line": "__p+='Hello '+"
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
                      "functionName": "onload",
                      "fileName": "http://localhost:8000/backbone-todomvc/simple-original.js",
                      "lineNumber": 3,
                      "columnNumber": 15,
                      "prevLine": "    var templ = _.template(\"Hello <%= name %>\")",
                      "nextLine": "    var el = document.createElement(\"div\")",
                      "line": "    var html = templ({name: \"John\"})"
                    },
                    {
                      "functionName": "onload",
                      "fileName": "http://localhost:8000/backbone-todomvc/simple.html",
                      "lineNumber": 9,
                      "columnNumber": 26,
                      "source": "    at onload (http://localhost:8000/backbone-todomvc/simple.html:9:26)",
                      "prevLine": "\t</head>",
                      "nextLine": "\t\t<section class=\"todoapp\">",
                      "line": "\t<body onload=\"onload()\">"
                    }
                  ]
                }
              ],
              "value": "Hello John",
              "stack": [
                "Error",
                "    at makeOrigin (http://localhost:8000/string-trace.js:119:16)",
                "    at stringTraceAdd (http://localhost:8000/string-trace.js:170:17)",
                "    at fn07253631235109281 (Function07253631235109281.js:8:9)",
                "    at http://localhost:8000/string-trace.js:302:31",
                "    at template (http://localhost:8000/backbone-todomvc/modules/underscore/underscore.js:1490:21)",
                "    at onload (http://localhost:8000/backbone-todomvc/simple.js:3:16)",
                "    at onload (http://localhost:8000/backbone-todomvc/simple.html:9:26)"
              ],
              "resolvedStack": [
                {
                  "functionName": "print",
                  "fileName": "unknown",
                  "lineNumber": 3,
                  "columnNumber": 0,
                  "prevLine": "with(obj||{}){",
                  "nextLine": "((__t=( name ))==null?'':__t)+",
                  "line": "__p+='Hello '+"
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
                  "functionName": "onload",
                  "fileName": "http://localhost:8000/backbone-todomvc/simple-original.js",
                  "lineNumber": 3,
                  "columnNumber": 15,
                  "prevLine": "    var templ = _.template(\"Hello <%= name %>\")",
                  "nextLine": "    var el = document.createElement(\"div\")",
                  "line": "    var html = templ({name: \"John\"})"
                },
                {
                  "functionName": "onload",
                  "fileName": "http://localhost:8000/backbone-todomvc/simple.html",
                  "lineNumber": 9,
                  "columnNumber": 26,
                  "source": "    at onload (http://localhost:8000/backbone-todomvc/simple.html:9:26)",
                  "prevLine": "\t</head>",
                  "nextLine": "\t\t<section class=\"todoapp\">",
                  "line": "\t<body onload=\"onload()\">"
                }
              ]
            }
          ],
          "action": "assign innerHTML",
          "stack": [
            "Error",
            "    at Error (native)",
            "    at stringTraceSetInnerHTML (http://localhost:8000/string-trace.js:197:20)",
            "    at onload (http://localhost:8000/backbone-todomvc/simple.js:5:5)",
            "    at onload (http://localhost:8000/backbone-todomvc/simple.html:9:26)"
          ],
          "resolvedStack": [
            {
              "functionName": "onload",
              "fileName": "http://localhost:8000/backbone-todomvc/simple-original.js",
              "lineNumber": 5,
              "columnNumber": 4,
              "prevLine": "    var el = document.createElement(\"div\")",
              "nextLine": "    document.body.appendChild(el)",
              "line": "    el.innerHTML = html;"
            },
            {
              "functionName": "onload",
              "fileName": "http://localhost:8000/backbone-todomvc/simple.html",
              "lineNumber": 9,
              "columnNumber": 26,
              "source": "    at onload (http://localhost:8000/backbone-todomvc/simple.html:9:26)",
              "prevLine": "\t</head>",
              "nextLine": "\t\t<section class=\"todoapp\">",
              "line": "\t<body onload=\"onload()\">"
            }
          ]
        }
      ],
      "inputValues": [],
      "stack": [
        "Error",
        "    at HTMLBodyElement.<anonymous> (http://localhost:8000/string-trace.js:225:24)",
        "    at onload (http://localhost:8000/backbone-todomvc/simple.js:6:19)",
        "    at onload (http://localhost:8000/backbone-todomvc/simple.html:9:26)"
      ],
      "resolvedStack": [
        {
          "functionName": "onload",
          "fileName": "http://localhost:8000/backbone-todomvc/simple-original.js",
          "lineNumber": 6,
          "columnNumber": 18,
          "prevLine": "    el.innerHTML = html;",
          "nextLine": "}",
          "line": "    document.body.appendChild(el)"
        },
        {
          "functionName": "onload",
          "fileName": "http://localhost:8000/backbone-todomvc/simple.html",
          "lineNumber": 9,
          "columnNumber": 26,
          "source": "    at onload (http://localhost:8000/backbone-todomvc/simple.html:9:26)",
          "prevLine": "\t</head>",
          "nextLine": "\t\t<section class=\"todoapp\">",
          "line": "\t<body onload=\"onload()\">"
        }
      ]
    }
  ],
  "inputValues": []
}
