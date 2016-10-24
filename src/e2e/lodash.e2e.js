var helpers = require("./helpers")

fdescribe('Lodash Unit tests', function() {
    it("Loads and executes the lodash unit tests", function(){
        helpers.loadPage('http://localhost:9999/demos/lodash-master/test/index.html')
        .then(helpers.waitForEl("#qunit-testresult .total"))
        .then(function(){
            helpers.getInnerHtml("#qunit-testresult .passed").then(function(html){
                var passedTests = parseFloat(html)
                console.log("Passed tests: " + passedTests)
                expect(passedTests).toBeGreaterThan(6209 - 1)
            })
        })
    })
});
