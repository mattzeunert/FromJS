
var closingTagRegExp = /\<\/\w+\>$/;
export default function getOpeningAndClosingTags(outerHTML, innerHTML){
    var closingTagMatches = outerHTML.match(closingTagRegExp)
    var closingTag = ""
    var tagIsSelfClosing = closingTagMatches === null
    if (!tagIsSelfClosing){
        closingTag = closingTagMatches[0]
    }
    var openingTag = outerHTML.substr(0,outerHTML.length - innerHTML.length - closingTag.length)

    return {
        openingTag, closingTag
    }
}
