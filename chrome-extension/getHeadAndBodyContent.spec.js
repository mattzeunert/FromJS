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
              <!-- <body></body> -->
            </html>
        `
        var res = getHeadAndBodyContent(html)
        expect(res.headContent).toBe("<!-- <head></head> -->")
        expect(res.bodyContent).toBe("<!-- <body></body> -->")
    })

    it("Returns the original content of the head/body tags, rather than a serialized version", function(){
        var html = `
            <!doctype html>
            <html lang="en">
              <head><div ></div></head>
              <body><div ></div></body>
            </html>
        `
        var res = getHeadAndBodyContent(html)
        expect(res.headContent).toBe("<div ></div>")
        expect(res.bodyContent).toBe("<div ></div>")
    })

    it("Supports uppercase HTML tags", function(){
        var html = `
            <!doctype html>
            <html lang="en">
              <HEAD>head</HEAD>
              <BODY>body</BODY>
            </html>
        `
        var res = getHeadAndBodyContent(html)
        expect(res.headContent).toBe("head")
        expect(res.bodyContent).toBe("body")
    })

    it("Supports whitespace in the closing head or body tag", function(){
        var html = `
            <!doctype html>
            <html lang="en">
              <head>head</ head
              >
              <body>body</ body
              >
            </html>
        `
        var res = getHeadAndBodyContent(html)
        expect(res.headContent).toBe("head")
        expect(res.bodyContent).toBe("body")
    })


})
