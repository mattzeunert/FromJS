var helpers = require("../helpers")

fdescribe('Security', function() {
    it("Initializes a (hopefully secret) cookie and navigates to the security test page", function(){
        browser.ignoreSynchronization = true;
        browser.get("http://localhost:9855/init")
        helpers.waitForEl("#confirm-cookie")

        browser.get("http://localhost:9856/src/e2e/security/security.html#auto-activate-fromjs")
        browser.executeScript("window.allowJSExecution()")
        .then(helpers.waitForEl("#security-done"))
        .then(function(){
            var getInnerHtml = function(){
                return "" + document.querySelector("#result").innerHTML
            }
            browser.executeScript(getInnerHtml).then(function (resultHtml) {
                expect(resultHtml.indexOf("FAILED")).toBe(-1)
            });
        })
    })
});
