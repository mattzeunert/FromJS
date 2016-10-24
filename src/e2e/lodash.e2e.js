var helpers = require("./helpers")

describe('Lodash Unit tests', function() {
    it("Loads and executes the lodash unit tests", function(){
        helpers.loadPage('http://localhost:9999/demos/lodash-master/test/index.html#speed-up-execution-and-break-tracing')
        .then(helpers.waitForEl("#qunit-testresult .total"))
        .then(function(){
            helpers.getInnerHtml("#qunit-testresult .passed").then(function(html){
                var passedTests = parseFloat(html)
                console.log("Passed tests: " + passedTests)
                expect(passedTests).toBeGreaterThan(6193 - 1)
            })
        })
    })
});
