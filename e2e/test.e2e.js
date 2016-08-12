function waitForEl(cssSelector){
     return browser.driver.wait(function(){
        console.log("Looking for ", cssSelector);
        return browser.driver.isElementPresent(by.css(cssSelector)).then(function(el){
            return el === true;
        });
    })
}

describe('test', function() {
    it('aaa', function() {
        browser.ignoreSynchronization = true;
        browser.get('http://localhost:7500/demos/index.html');

        waitForEl('.fromjs-show-inspector-button')
        .then(function(){
            browser.driver.findElement(by.css('.new-todo')).sendKeys('Jane');
            browser.driver.findElement(by.css('.new-todo')).sendKeys(protractor.Key.ENTER);

            return waitForEl('input[type="checkbox"]')
        })
        .then(function(){
            element(by.css('.fromjs-show-inspector-button')).click();
            return waitForEl("#fromjs")
        })
        .then(function(){
            element(by.css('input[type="checkbox"]')).click();
            return waitForEl('.fromjs-origin-path-step')
        })
        .then(function(){
            expect(element(by.css(".fromjs-origin-path-step")).getText()).toContain("Initial Page HTML")
        })
    });
});