var helpers = require("../helpers")

describe('Security', function() {
    it("Initializes a (hopefully secret) cookie and navigates to the security test page", function(){
        browser.ignoreSynchronization = true;
        browser.get("http://localhost:9855/init")

        helpers.waitForEl("#confirm-cookie")

        browser.driver.wait(function(){
            console.log("Waiting for extension load")
           return browser.executeScript(function(){
               return window.extensionLoaded === true
           })
       })


        browser.get("http://localhost:9856/src/e2e/security/security.html#auto-activate-fromjs")

        // .then(function(){
        //     browser.pause();
        // })
        .then(waitForFromJSReady)

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

    function waitForFromJSReady(){
        return browser.driver.wait(function(){
            console.log("Waiting for fromJSIsReady")
           return browser.executeScript(function(){
               return window.fromJSIsReady === true
           })
       })
    }
});
