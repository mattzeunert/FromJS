function waitForEl(cssSelector){
     return browser.driver.wait(function(){
        console.log("Looking for ", cssSelector);
        return browser.driver.isElementPresent(by.css(cssSelector)).then(function(el){
            return el === true;
        });
    })
}

function expectResult(inspectedChar, expectedAction){
    switchToIframe();

    var searchChar = element(by.css("[data-test-marker-inspected-value] .fromjs-highlighted-character")).getText()
    expect(searchChar).toBe(inspectedChar)

    var el = element(by.css(".fromjs-origin-path-step"))
    var action = el.element(by.css("[data-test-marker-step-action]")).getText()
    var resultChar = el.element(by.css(".fromjs-highlighted-character")).getText()

    expect(action).toBe(expectedAction)
    expect(resultChar).toBe(inspectedChar)

    switchToInspectedPage();
}

function loadPage(url){
    browser.ignoreSynchronization = true;
    browser.get(url);

    return waitForEl('.fromjs-show-inspector-button')
}

function openFromJSInspector(){
    element(by.css('.fromjs-show-inspector-button')).click();
    var promise = waitForEl("#fromjs-sidebar")
    .then(function(){
        switchToIframe();
        return waitForEl("#fromjs")
        .then(function(){
            switchToInspectedPage()
        })
    })

    return promise;
}

function switchToIframe(){
    isInIFrame = true;
    var el = browser.driver.findElement(by.css("#fromjs-sidebar iframe"))
    browser.switchTo().frame(el)
}

function switchToInspectedPage(){
    isInIFrame = false;
    browser.switchTo().defaultContent()
}

function inspectElement(cssSelector, /* zero-based */ charIndex) {
    if (charIndex > 20) {
        throw "Don't think this will work, because the text will be truncated with an ellipsis in it, so char index isn't equal to nth-child span"
    }
    element(by.css(cssSelector)).click();
    switchToIframe()
    return waitForEl('.fromjs-origin-path-step')
    .then(function(){
        if (charIndex !== undefined) {
            // I've tried simulating a click and it was fine locally, but on Travis CI
            // I got this error, even after waiting for the element to be clickable:
            // unknown error: Element is not clickable at point (32, 65). Other element would receive the click:
            // <div class="fromjs-value__content">...</div>
            browser.executeScript("e2eTestSimulateInpsectCharacter(" + charIndex + ")")
            .then(function(){
                switchToInspectedPage()
                return waitForHighlightedCharIndex(charIndex)
            })
        } else {
            switchToInspectedPage()
        }
    })
}

function getInnerHtml(selector){
    return new Promise(function(resolve){
        var getInnerHtml = function(selector){
            return "" + document.querySelector(selector).innerHTML
        }
        browser.executeScript(getInnerHtml, selector).then(function (resultHtml) {
            resolve(resultHtml)
        });
    })
}

function waitForHighlightedCharIndex(charIndex){
    switchToIframe();
    var elSelector = "[data-test-marker-inspected-value] span:nth-child(" + (charIndex + 1) + ")"
    return waitForEl(elSelector + ".fromjs-highlighted-character")
    .then(function(){
        return switchToInspectedPage()
    })
}

function inspectParentElement() {
    switchToIframe()
    element(by.css(".fromjs-go-up-button")).click()
    return waitForEl('.fromjs-origin-path-step')
    .then(function(){
        switchToInspectedPage()
    })
}

module.exports = {
    waitForEl,
    expectResult,
    loadPage,
    openFromJSInspector,
    inspectElement,
    switchToIframe,
    switchToInspectedPage,
    inspectElement,
    inspectParentElement,
    waitForHighlightedCharIndex,
    getInnerHtml
}
