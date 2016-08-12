// two chars in a string literal can map to one char in the actual string value (i.e. if there's an escape sequence like
// "\n" that becomes one new line character)
export default function adjustColumnForLineBreaks(line, columnNumber){
    for (var i=0;i<columnNumber;i++){
        if(line[i] === "\\" && line[i + 1] === "n"){
            columnNumber++;
        }
    }
    return columnNumber
}