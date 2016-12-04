import cheerio from "../src/cheerio"

function getHeadOrBodyContent(pageHtml, tagName){
    var tagRegExp = new RegExp("<\\/?[^\\w]*?" + tagName + "[^>]*?>", "gi")

    // We want to use Cheerio to reliably parse HTML, but we need
    // the original tag content, not the version serialized from the parse tree
    // (e.g. turning <div     ></div> into <div></div>)
    // So instead we add a way to get the index of the matching tag
    // after parsing

    var pageHtmlWithIndices = pageHtml;
    var matchedClosingTag = false;
    var pageHtmlWithIndices = pageHtmlWithIndices.replace(tagRegExp, function(match, index){
        var isClosingTag = match[1] == "/"
        if (isClosingTag) {
            matchedClosingTag = true;
            return "<index>" + index + "</index>" + match
        } else {
            return match + "<index>" + (index + match.length) + "</index>"
        }
    })
    var $ = cheerio.load(pageHtmlWithIndices)

    function getIndexFromComment(comment){
        var content = comment.html();
        return parseFloat(content.replace(/[^0-9]/g,""))
    }
    var tag = $(tagName).first();
    var tagContents = $(tagName).contents()
    var fromIndex = getIndexFromComment(tagContents.first())
    var toIndex;

    if (matchedClosingTag) {
        toIndex = getIndexFromComment(tagContents.last())
    } else {
        // sometimes there's an opening tag but no closing tag...
        // so just go to end of content
        toIndex = pageHtml.length
    }

    return {
        content: pageHtml.slice(fromIndex, toIndex),
        fromIndex,
        toIndex
    }
}

function hasHead(pageHtml){
    return cheerio.load(pageHtml)("head").length > 0;
}

export default function getHeadAndBodyContent(pageHtml){
    var headContent = null;
    var bodyContent = null;

    if (hasHead(pageHtml)) {
        bodyContent = getHeadOrBodyContent(pageHtml, "body")
        headContent = getHeadOrBodyContent(pageHtml, "head")
    } else {
        // Presumably this page has neither a head nor a body tag,
        // so just put everything into the body
        bodyContent = {
            content: pageHtml,
            fromIndex: 0,
            toIndex: pageHtml.length
        }
    }

    return {
        // if headContent is null return null, otherwise get index
        headContent: headContent && headContent.content,
        headFromIndex: headContent && headContent.fromIndex,
        headToIndex: headContent && headContent.toIndex,
        bodyContent: bodyContent.content,
        bodyFromIndex: bodyContent.fromIndex,
        bodyToIndex: bodyContent.toIndex
    }
}
