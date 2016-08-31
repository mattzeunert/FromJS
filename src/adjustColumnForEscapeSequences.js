// two chars in a string literal can map to one char in the actual string value (i.e. if there's an escape sequence like
// "\n" that becomes one new line character)
// doesn't work for explicit unicode escapes like \u0020 right now
export default function adjustColumnForEscapeSequences(line, columnNumber){
    for (var i=0;i<columnNumber;i++){
        if (line[i] === "\\") {
            var charAfter = line[i + 1]
            if(charAfter === "n"){
                columnNumber++;
            }
            if(charAfter === "t"){
                columnNumber++;
            }
            if(charAfter === "\""){
                columnNumber++;
            }
            if(charAfter === "'"){
                columnNumber++;
            }
        }
    }
    return columnNumber
}
