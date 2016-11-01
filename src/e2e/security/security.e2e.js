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

        .then(waitForIsLoadingPage)

        .then(helpers.waitForEl("#security-done"))
        .then(function(){
            helpers.getInnerHtml("#result").then(function(resultHtml){
                expect(resultHtml.match(/PASSING/g).length).toBe(3)
            })
        })
    })

    function waitForIsLoadingPage(){
        console.log("Waiting for forTestsIsLoadingPage")
        return browser.driver.wait(function(){

           return browser.executeScript(function(){
               return window.forTestsIsLoadingPage === true
           })
       })
    }
});
