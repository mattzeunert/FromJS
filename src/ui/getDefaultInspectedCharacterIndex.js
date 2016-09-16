export default function getDefaultInspectedCharacterIndex(outerHtml){
    var contentBeforeNonWhitespaceCharacterInTagContentRegex = /^.*?\>[\s]*/
    var match = outerHtml.match(contentBeforeNonWhitespaceCharacterInTagContentRegex)
    var defaultCharacterIndex = 1;

    if (match){
        defaultCharacterIndex = match[0].length
    }

    if (defaultCharacterIndex >= outerHtml.length) {
        defaultCharacterIndex = 1;
    }

    return defaultCharacterIndex
}
