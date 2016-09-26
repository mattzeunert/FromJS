import getHeadAndBodyContent from "./getHeadAndBodyContent"

describe("getHeadAndBodyContent", function(){
    it("Returns the body and head content if available", function(){
        var res = getHeadAndBodyContent(`
            <head>HEAD</head>
            <body>BODY</body>
        `)
        expect(res.headContent).toBe("HEAD")
        expect(res.bodyContent).toBe("BODY")
    })

    it("Puts all content in the body tag if there is no container tag", function(){
        var res = getHeadAndBodyContent(`Hello`)
        expect(res.headContent).toBe(null)
        expect(res.bodyContent).toBe("Hello")
    })

    it("Can handle an HTML comments", function(){
        var html = `
            <!doctype html>
            <html lang="en">
              <head><!-- <head></head> --></head>
              <body><!-- <body></body> --></body>
            </html>
        `
        var res = getHeadAndBodyContent(html)
        expect(res.headContent).toBe("<!-- <head></head> -->")
        expect(res.bodyContent).toBe("<!-- <body></body> -->")
    })

    // todo: support capitalized html tags
})
