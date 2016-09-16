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
    return waitForEl("#fromjs-sidebar")
}

function switchToIframe(){
    var el = browser.driver.findElement(by.css("#fromjs-sidebar iframe"))
    browser.switchTo().frame(el)
}

function switchToInspectedPage(){
    browser.switchTo().defaultContent()
}

function inspectElement(cssSelector) {
    element(by.css(cssSelector)).click();
    switchToIframe()
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
    inspectElement
}
