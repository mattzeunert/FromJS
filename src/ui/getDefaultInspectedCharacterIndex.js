export default function getDefaultInspectedCharacterIndex(outerHtml){
    var contentBeforeNonWhitespaceCharacterInTagContentRegex = /^.*?\>[\s]*/
    var match = outerHtml.match(contentBeforeNonWhitespaceCharacterInTagContentRegex)
    var defaultCharacterIndex = 1;

    if (match){
        var nonContentCharCount = match[0].length
        if (outerHtml[nonContentCharCount] == "<") {
            return getDefaultInspectedCharacterIndex(outerHtml.slice(nonContentCharCount)) + nonContentCharCount
        }
        else {
            defaultCharacterIndex = nonContentCharCount
        }
    }

    if (defaultCharacterIndex >= outerHtml.length) {
        defaultCharacterIndex = 1;
    }

    return defaultCharacterIndex
}
