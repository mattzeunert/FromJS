import addElOrigin from "./addElOrigin"
import $ from "jquery"

// tries to describe the relationship between an assigned innerHTML value
// and the value you get back when reading el.innerHTML.
// e.g. you could assign "<input type='checkbox' checked>" and get back
// "<input type='checkbox' checked=''>"
export default function mapInnerHTMLAssignment(el, assignedInnerHTML, actionName, initialExtraCharsValue){
    var innerHTMLAfterAssignment = nativeInnerHTMLDescriptor.get.call(el)
    var forDebuggingProcessedHtml = ""
    var charOffset = 0;
    var extraCharsAdded = 0;
    if (initialExtraCharsValue !== undefined){
        extraCharsAdded = initialExtraCharsValue
    }
    processNewInnerHtml(el)

    function processNewInnerHtml(el){
        var children = Array.prototype.slice.apply(el.childNodes, [])
        addElOrigin(el, "replaceContents", {
            action: actionName,
            children: children
        })

        $(el).contents().each(function(i, child){
            var isTextNode = child.nodeType === 3
            if (isTextNode) {
                addElOrigin(child, "textValue", {
                    "action": actionName,
                    inputValues: [assignedInnerHTML],
                    value: innerHTMLAfterAssignment,
                    inputValuesCharacterIndex: [charOffset],
                    extraCharsAdded: extraCharsAdded
                })

                charOffset += child.textContent.length
                forDebuggingProcessedHtml += child.textContent
            } else {

                addElOrigin(child, "openingTagStart", {
                    action: actionName,
                    inputValues: [assignedInnerHTML],
                    inputValuesCharacterIndex: [charOffset],
                    value: innerHTMLAfterAssignment,
                    extraCharsAdded: extraCharsAdded
                })
                var openingTagStart = "<" + child.tagName
                charOffset += openingTagStart.length
                forDebuggingProcessedHtml += openingTagStart

                for (var i = 0;i<child.attributes.length;i++) {
                    var attr = child.attributes[i]

                    var charOffsetBefore = charOffset

                    var attrStr = " " + attr.name
                    attrStr += "='" + attr.textContent +  "'"

                    charOffset += attrStr.length
                    var offsetAtCharIndex = null
                    var extraCharsAddedHere = 0;
                    if (attr.textContent === ""){
                        //charOffset += "'='".length
                        extraCharsAddedHere = "=''".length

                        offsetAtCharIndex = []
                        for (var charIndex in attrStr){
                            if (charIndex >= attrStr.length - '=""'.length){
                                offsetAtCharIndex.push(attrStr.length - "=''".length - charIndex - 1)
                            } else {
                                offsetAtCharIndex.push(0)
                            }
                        }
                    }



                    addElOrigin(child, "attribute_" + attr.name, {
                        action: actionName,
                        inputValues: [assignedInnerHTML],
                        value: innerHTMLAfterAssignment,
                        inputValuesCharacterIndex: [charOffsetBefore],
                        extraCharsAdded: extraCharsAdded,
                        offsetAtCharIndex: offsetAtCharIndex
                    })

                    extraCharsAdded += extraCharsAddedHere


                    forDebuggingProcessedHtml += attrStr
                }

                // console.log("extraCharsAdded", extraCharsAdded)


                var openingTagEnd = ">"
                if (assignedInnerHTML.toString()[charOffset] === " ") {
                    // something like <div > (with extra space)
                    // this char will not show up in the re-serialized innerHTML
                    // extraCharsAdded -= 1;
                    openingTagEnd += " "
                }
                addElOrigin(child, "openingTagEnd", {
                    action: actionName,
                    inputValues: [assignedInnerHTML],
                    inputValuesCharacterIndex: [charOffset],
                    value: innerHTMLAfterAssignment,
                    extraCharsAdded: extraCharsAdded
                })
                charOffset += openingTagEnd.length
                forDebuggingProcessedHtml += openingTagEnd


                processNewInnerHtml(child)

                if (tagTypeHasClosingTag(child.tagName)) {
                    addElOrigin(child, "closingTag", {
                        action: actionName,
                        inputValues: [assignedInnerHTML],
                        inputValuesCharacterIndex: [charOffset],
                        value: innerHTMLAfterAssignment,
                        extraCharsAdded: extraCharsAdded
                    })
                    var closingTag = "</" + child.tagName + ">"
                    charOffset += closingTag.length
                    forDebuggingProcessedHtml += closingTag
                }

            }
            // console.log("processed", forDebuggingProcessedHtml, assignedInnerHTML.toString().toLowerCase().replace(/\"/g, "'") === forDebuggingProcessedHtml.toLowerCase())

        })
    }
}
