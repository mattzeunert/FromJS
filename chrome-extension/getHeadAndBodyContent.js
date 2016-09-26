function findTagContent(pageHtml, tagName){
    var startRegExp = new RegExp("<" + tagName + ".*?>")

    var tagContentStart = pageHtml.search(startRegExp);
    var tagContentEnd = pageHtml.lastIndexOf("</" + tagName + ">")

    var tagContent = pageHtml.substring(tagContentStart, tagContentEnd)
    var openingTag = tagContent.match(startRegExp)[0]
    tagContent = tagContent.substr(openingTag.length)

    return tagContent
}

export default function getHeadAndBodyContent(pageHtml){
    var hasHead = /<head.*?>/.test(pageHtml)

    var headContent = null;
    var bodyContent = null;

    if (hasHead) {
        bodyContent = findTagContent(pageHtml, "body")
        headContent = findTagContent(pageHtml, "head")
    } else {
        // Presumably this page has neither a head nor a body tag,
        // so just put everything into the body
        bodyContent = pageHtml
    }

    return {
        headContent,
        bodyContent
    }
}
