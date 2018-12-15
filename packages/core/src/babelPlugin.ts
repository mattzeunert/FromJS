import * as FunctionNames from "./FunctionNames";
import * as babel from "@babel/core";
import * as OperationTypes from "./OperationTypes";
// import * as fs from "fs";
import * as babylon from "@babel/parser";
import operations, { shouldSkipIdentifier, initForBabel } from "./operations";
import {
  ignoreNode,
  ignoredArrayExpression,
  ignoredStringLiteral,
  ignoredIdentifier,
  ignoredCallExpression,
  ignoredNumericLiteral,
  createOperation,
  getLastOperationTrackingResultCall,
  runIfIdentifierExists,
  isInNodeType,
  isInIdOfVariableDeclarator,
  isInLeftPartOfAssignmentExpression,
  getTrackingVarName,
  addLoc,
  skipPath,
  getTrackingIdentifier,
  getLocObjectASTNode
} from "./babelPluginHelpers";

import helperCodeLoaded from "../helperFunctions";

import * as t from "@babel/types";
import { VERIFY } from "./config";
initForBabel(t, babylon);

var helperCode = `
  (function(){
    var global = Function("return this")();
    if (!global.__fromJSConfig) {
      global.__fromJSConfig = {
        VERIFY: ${VERIFY}
      }
    }
  })();
`;

helperCode += helperCodeLoaded.toString();

helperCode += "/* HELPER_FUNCTIONS_END */ ";

// I got some babel-generator "cannot read property 'type' of undefined" errors
// when prepending the code itself, so just prepend a single eval call expression
helperCode =
  `
  if (typeof __fromJSMaybeMapInitialPageHTML !== "undefined") {
    __fromJSMaybeMapInitialPageHTML()
  }
  var global = Function("return this")();
if (!global.__didInitializeDataFlowTracking) {` +
  "eval(`" +
  helperCode
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/, "\\$") +
  "\n//# sourceURL=/helperFns.js`)" +
  "}";
helperCode += "// aaaaa"; // this seems to help with debugging/evaling the code... not sure why...just take it out if the tests dont break

function plugin(babel) {
  const { types: t } = babel;

  function handleFunction(path) {
    const declarators: any[] = [];
    path.node.params.forEach((param, i) => {
      if (param.type === "ObjectPattern") {
        // do nothing for now, logic is in objectpattern visitor
        // for (var n = 0; n < param.properties.length; n++) {
        //   const prop = param.properties[n];
        //   declarators.push(
        //     t.variableDeclarator(
        //       addLoc(
        //         getTrackingIdentifier(
        //           prop.value ? prop.value.name : prop.key.name
        //         ),
        //         prop.loc
        //       ),
        //       t.nullLiteral()
        //     )
        //   );
        // }
      } else if (param.type === "ArrayPattern") {
        param.elements.forEach(elem => {
          let varName;
          if (elem.type === "Identifier") {
            varName = elem.name;
          } else if (elem.type === "AssignmentPattern") {
            varName = elem.left.name;
          } else {
            throw Error("array pattern elem type");
          }
          declarators.push(
            t.variableDeclarator(
              addLoc(getTrackingIdentifier(varName), param.loc),
              ignoredCallExpression(FunctionNames.getEmptyTrackingInfo, [
                ignoredStringLiteral("arrayPatternInFunction"),
                getLocObjectASTNode(elem.loc)
              ])
            )
          );
        });
      } else {
        declarators.push(
          t.variableDeclarator(
            addLoc(getTrackingIdentifier(param.name), param.loc),
            t.callExpression(
              t.identifier(FunctionNames.getFunctionArgTrackingInfo),
              [t.numericLiteral(i)]
            )
          )
        );
      }
    });

    // keep whole list in case the function uses `arguments` object
    // We can't just access the arg tracking values when `arguments` is used (instead of doing it
    // at the top of the function)
    // That's because when we return the argTrackingValues are not reset to the parent function's
    declarators.push(
      t.variableDeclarator(
        ignoredIdentifier("__allArgTV"),
        ignoredCallExpression(FunctionNames.getFunctionArgTrackingInfo, [])
      )
    );

    const d = t.variableDeclaration("var", declarators);
    skipPath(d);
    path.node.body.body.unshift(d);
    path.node.ignore = true; // I'm not sure why it would re-enter the functiondecl/expr, but it has happened before
  }

  const visitors = {
    FunctionDeclaration(path) {
      handleFunction(path);
    },

    FunctionExpression(path) {
      handleFunction(path);
    },

    ObjectPattern(path) {
      // debugger;
      const newProperties: any[] = [];
      path.node.properties.forEach(prop => {
        newProperties.push(prop);
        let varName;
        if (prop.value && prop.value.type === "Identifier") {
          varName = prop.value.name;
        } else if (prop.value && prop.value.type === "AssignmentPattern") {
          varName = prop.value.left.name;
        } else {
          varName = prop.key.name;
        }
        newProperties.push(
          skipPath(
            t.ObjectProperty(
              ignoreNode(getTrackingIdentifier(varName)),
              t.assignmentPattern(
                getTrackingIdentifier(varName),
                ignoredCallExpression(FunctionNames.getEmptyTrackingInfo, [
                  ignoredStringLiteral("objectPattern"),
                  getLocObjectASTNode(prop.loc)
                ])
              )
            )
          )
        );
      });
      path.node.properties = newProperties;
    },

    VariableDeclaration(path) {
      if (path.parent.type === "ForInStatement") {
        return;
      }
      var originalDeclarations = path.node.declarations;
      var newDeclarations: any[] = [];

      originalDeclarations.forEach(function(decl) {
        newDeclarations.push(decl);
        if (!decl.init) {
          decl.init = addLoc(ignoredIdentifier("undefined"), decl.loc);
        }

        if (decl.id.type === "ArrayPattern") {
          decl.id.elements.forEach(elem => {
            let varName;
            if (elem.type === "Identifier") {
              varName = elem.name;
            } else if (elem.type === "AssignmentPattern") {
              varName = elem.left.name;
            } else {
              throw Error("array pattern elem type");
            }
            newDeclarations.push(
              t.variableDeclarator(
                addLoc(getTrackingIdentifier(varName), elem.loc),
                skipPath(
                  ignoredCallExpression(FunctionNames.getEmptyTrackingInfo, [
                    ignoredStringLiteral("arrayPatternInVarDeclaration"),
                    getLocObjectASTNode(elem.loc)
                  ])
                )
              )
            );
          });
        } else if (decl.id.type === "ObjectPattern") {
          // declarations are inserted into object pattern already
        } else {
          newDeclarations.push(
            t.variableDeclarator(
              addLoc(getTrackingIdentifier(decl.id.name), decl.id.loc),
              skipPath(
                t.callExpression(
                  t.identifier(FunctionNames.getLastOperationTrackingResult),
                  []
                )
              )
            )
          );
        }
      });

      path.node.declarations = newDeclarations;
    },

    WithStatement(path) {
      function i(node) {
        if (node.name === null) {
          debugger;
        }
        node.ignoreInWithStatementVisitor = true;
        return node;
      }

      // not an ideal way to track things and might not work for nested
      // with statements, but with statement use should be rare.
      // Underscore uses them for templates though.
      let obj = path.node.object;
      path.get("object").traverse({
        Identifier(path) {
          path.replaceWith(i(path.node));
        }
      });
      path.traverse({
        Identifier(path) {
          if (path.node.ignoreInWithStatementVisitor) {
            return;
          }
          if (shouldSkipIdentifier(path)) {
            return;
          }
          if (
            ["WithStatement", "FunctionExpression"].includes(path.parent.type)
          ) {
            return;
          }
          if (path.parent.type === "MemberExpression") {
            if ((path.parent.property = path.node)) {
              console.log("ignoreing");
              return;
            }
          }
          path.node.ignoreInWithStatementVisitor = true;

          const identifierName = path.node.name;
          path.replaceWith(
            ignoreNode(
              t.conditionalExpression(
                ignoreNode(
                  t.binaryExpression(
                    "in",
                    addLoc(t.stringLiteral(identifierName), path.node.loc),
                    obj
                  )
                ),
                addLoc(
                  t.memberExpression(
                    obj,
                    addLoc(t.stringLiteral(identifierName), path.node.loc),
                    true
                  ),
                  path.node.loc
                ),
                i(addLoc(t.identifier(identifierName), path.node.loc))
              )
            )
          );
        }
      });
    },

    CatchClause(path) {
      const errName = path.node.param.name;
      // We don't track anything, but this var has to exist to avoid "err___tv is undeclared" errors
      const trackingVarDec = skipPath(
        t.variableDeclaration("var", [
          t.variableDeclarator(t.identifier(getTrackingVarName(errName)))
        ])
      );
      path.node.body.body.push(trackingVarDec);
    },

    ForInStatement(path) {
      let varName;
      let isNewVariable;
      if (path.node.left.type === "VariableDeclaration") {
        varName = path.node.left.declarations[0].id.name;
        isNewVariable = true;
      } else if (path.node.left.type === "Identifier") {
        varName = path.node.left.name;
        isNewVariable = false;
      } else {
        throw Error("not sure what this is");
      }

      if (path.node.body.type !== "BlockStatement") {
        // Technically it might not be safe to make this conversion
        // because it affects scoping for let/const inside the body
        // ...although that's not usually what you do inside a for in body
        path.node.body = ignoreNode(
          babel.types.blockStatement([path.node.body])
        );
      }

      const body = path.node.body.body;

      let forInRightValueIdentifier = ignoreNode(
        path.scope.generateUidIdentifier("__forInRightVal")
      );

      path.insertBefore(
        ignoreNode(
          t.variableDeclaration("let", [
            t.variableDeclarator(forInRightValueIdentifier, path.node.right)
          ])
        )
      );

      if (isNewVariable) {
        var declaration = ignoreNode(
          t.variableDeclaration("var", [
            t.variableDeclarator(ignoredIdentifier(getTrackingVarName(varName)))
          ])
        );
        body.unshift(declaration);
      }

      path.node.right = forInRightValueIdentifier;

      var assignment = ignoreNode(
        t.expressionStatement(
          ignoreNode(
            t.assignmentExpression(
              "=",
              ignoredIdentifier(getTrackingVarName(varName)),
              ignoredCallExpression(
                FunctionNames.getObjectPropertyNameTrackingValue,
                [forInRightValueIdentifier, ignoredIdentifier(varName)]
              )
            )
          )
        )
      );
      body.unshift(assignment);
    }
  };

  Object.keys(operations).forEach(key => {
    var operation = operations[key];
    key = key[0].toUpperCase() + key.slice(1);
    if (operation.visitor) {
      if (visitors[key]) {
        throw Error("duplicate visitor " + key);
      }
      visitors[key] = path => {
        var ret = operation.visitor.call(operation, path);
        if (ret) {
          if (!ret.loc) {
            // debugger;
          }
          try {
            path.replaceWith(ret);
          } catch (err) {
            // for easier debugging
            debugger;
            operation.visitor.call(operation, path);
            throw err;
          }
        }
      };
    }
  });

  // var enter = 0;
  // var enterNotIgnored = 0;

  Object.keys(visitors).forEach(key => {
    var originalVisitor = visitors[key];
    visitors[key] = function(path) {
      // enter++;
      if (path.node.skipPath) {
        path.skip();
        return;
      }
      if (path.node.skipKeys) {
        path.skipKeys = path.node.skipKeys;
        return;
      }
      if (path.node.ignore) {
        return;
      }
      // enterNotIgnored++;
      return originalVisitor.apply(this, arguments);
    };
  });

  visitors["Program"] = {
    // Run on exit so injected code isn't processed by other babel plugins
    exit: function(path) {
      const babelPluginOptions = plugin["babelPluginOptions"];
      let usableHelperCode;
      if (babelPluginOptions) {
        const { accessToken, backendPort } = babelPluginOptions;
        usableHelperCode = helperCode;
        usableHelperCode = usableHelperCode.replace(
          /ACCESS_TOKEN_PLACEHOLDER/g,
          accessToken
        );
        usableHelperCode = usableHelperCode.replace(
          /BACKEND_PORT_PLACEHOLDER/g,
          backendPort
        );
      } else {
        usableHelperCode = helperCode;
      }

      // console.log({ enter, enterNotIgnored });

      var initCodeAstNodes = babylon
        .parse(usableHelperCode)
        .program.body.reverse();
      initCodeAstNodes.forEach(node => {
        path.node.body.unshift(node);
      });
    }
  };

  return {
    name: "fromjs-babel-plugin",
    visitor: visitors
  };
}

export default plugin;
