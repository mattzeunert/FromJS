import ValueMap from "./value-map"
import exportElementOrigin from "./export-element-origin"
import resolveFrame, {getSourceFileContent} from "./resolve-frame"
import fileIsDynamicCode from "./fileIsDynamicCode"

export default function whereDoesCharComeFrom(originObject, characterIndex, callback){
    characterIndex = parseFloat(characterIndex)

    var steps = [];

    window.exportToVis = function(){
        exportElementOrigin(originObject)
    }

    var step = {
        originObject: originObject,
        characterIndex: characterIndex
    }
    steps.push(step)

    nextStep(step)
    function nextStep(step){
        goUp(step, function(newStep){
            if (newStep !== null && !step.originObject){
                throw "hmm?"
            }

            if (newStep !== null){
                steps.push(newStep)
                nextStep(newStep)
            } else {
                callback(steps)
            }
        })
    }

}

window.whereDoesCharComeFrom = whereDoesCharComeFrom

function goUp(step, callback){
    // console.log("trying to handle step with action", step.originObject.action, step)

    var ret
    if (step.originObject.action === "set className"){
        var characterIndex =  step.characterIndex
        var newCharIndex = characterIndex - " class='".length

        var clickedOnAttributeLeftPart = newCharIndex < 0
        var clickedOnAttributeRightPart = newCharIndex >= step.originObject.inputValues[0].value.length

        if (clickedOnAttributeLeftPart || clickedOnAttributeRightPart) {
            return null; // clicked on class=' part rather than actual class name
        }
        ret = {
            originObject: step.originObject.inputValues[0],
            characterIndex: newCharIndex
        }
    } else if (step.originObject.inputValues.length === 1 && step.originObject.inputValues[0].value === step.originObject.value) {
        ret = {
            originObject: step.originObject.inputValues[0],
            characterIndex: step.characterIndex
        }
    } else if (step.originObject.action === "Ancestor innerHTML") {
        var offsetAtChar = 0;
        if (step.originObject.offsetAtCharIndex){
            offsetAtChar = step.originObject.offsetAtCharIndex[step.characterIndex - step.originObject.inputValuesCharacterIndex[0]]
        }
        ret = {
            originObject: step.originObject.inputValues[0],
            characterIndex: step.characterIndex - step.originObject.extraCharsAdded + offsetAtChar
        }
    } else  if (step.originObject.action === "concat") {
        var valueMap = new ValueMap()
        valueMap.append(step.originObject.inputValues[0])
        valueMap.append(step.originObject.inputValues[1])

        ret = valueMap.getItemAt(step.characterIndex)
    } else if (step.originObject.action === "Element") {
        var valueMap = new ValueMap();
        var createElement;

        var tagOrigins = [];
        var contentOrigins = []
        step.originObject.inputValues.forEach(function(inputValue){
            if (inputValue.action === "createElement" || inputValue.action === "set className" ||
                inputValue.action === "setAttribute" ||
                inputValue.action === "initial html tag"){
                tagOrigins.push(inputValue)
            } else {
                contentOrigins.push(inputValue)
            }
        })


        tagOrigins.forEach(function(tagOrigin){
            if (tagOrigin.action === "createElement") {
                valueMap.appendString("<" + tagOrigin.inputValues[0].value , tagOrigin, 0)
            } else if (tagOrigin.action === "set className"){
                valueMap.appendString(" class='" + tagOrigin.value + "'", tagOrigin, 0)
            } else if (tagOrigin.action === "setAttribute") {
                valueMap.appendString(" " + tagOrigin.inputValues[0].value + '="' + tagOrigin.inputValues[1].value + '"', tagOrigin, 0)
            } else {
                debugger
            }
        })
        tagOrigins.forEach(function(tagOrigin){
            if (tagOrigin.action === "createElement") {
                var contentBefore = "<" + tagOrigin.inputValues[0].value
                valueMap.appendString(">" , tagOrigin, contentBefore.length)
            }
        })
        contentOrigins.forEach(function(inputValue){
            if (inputValue.action === "createElement") {
                return;
            }
            else if (inputValue.action === "appendChild"){
                valueMap.append(inputValue)
            }
            else if (inputValue.action === "assign innerHTML"){
                valueMap.append(inputValue)
            }
            else if (inputValue.action === "initial html content"){
                valueMap.append(inputValue)
            }
            else {
                throw "unhandled input value in elment item"
            }
        })
        tagOrigins.forEach(function(tagOrigin){
            if (tagOrigin.action === "createElement") {
                valueMap.appendString("</" + tagOrigin.inputValues[0].value + ">", tagOrigin, 0)
            }
        })

        ret = valueMap.getItemAt(step.characterIndex)
    } else if (step.originObject.action === "createElement") {
        var characterIndex = step.characterIndex
        var elementType = step.originObject.inputValues[0].value;
        var openingHtml = "<" + elementType + ">"
        var closingHtml = "<" + elementType + "/>"
        // step.originObject.value is something like '<li></li>', but we need a char index for just 'li'
        if (characterIndex >= openingHtml.length) {
            characterIndex -= openingHtml.length;
            characterIndex -= "/".length;
        }
        characterIndex -= "<".length

        if (characterIndex<0){
            // they clicked on either a < or an /
            // it's not really clear what that should mean, since that doesn't have an origin
            // but let's pretend for now
            characterIndex = 0
        }
        if (characterIndex == step.originObject.inputValues[0].value.length) {
            // they clicked on ">", should really end path here
            characterIndex = step.originObject.inputValues[0].value.length - 1
        }
        ret = {
            originObject: step.originObject.inputValues[0],
            characterIndex: characterIndex
        }
    } else if (step.originObject.action === "replace call") {
        var valueMap = ValueMap.deserialize(step.originObject.valueItems, step.originObject.inputValues)
        ret = valueMap.getItemAt(step.characterIndex)
    }else if (step.originObject.action === "slice call") {
        var valueMap = ValueMap.deserialize(step.originObject.valueItems, step.originObject.inputValues)
        ret = valueMap.getItemAt(step.characterIndex)
    }
    else if (step.originObject.action === "JSON.parse"){
        if (step.originObject.inputValues.length === 1) {
            ret = {
                originObject: step.originObject.inputValues[0],
                characterIndex: step.characterIndex + step.originObject.inputValuesCharacterIndex[0]
            }
        } else {
            throw "need to handlesss"
        }
    }
    else if (step.originObject.action === "match call"){
        if (step.originObject.value === step.originObject.inputValues[0].value) {
            ret = {
                originObject: step.originObject.inputValues[0],
                characterIndex: step.characterIndex
            }
        } else {
            throw "not handled mathc call"
        }
    }
    else if (step.originObject.action === "Initial Body HTML"){
        ret = {
            originObject: step.originObject.inputValues[0],
            characterIndex: step.characterIndex - step.originObject.extraCharsAdded
        }
    }
    else if (step.originObject.action === "String Literal"){
        callback(null)
        resolveFrame(step.originObject.stack[0], function(err, frame){

            if (fileIsDynamicCode(frame.fileName)){
                getSourceFileContent(frame.fileName, function(content){
                    var lines = content.split("\n")
                    var linesBeforeCurrentLine = lines.slice(0, frame.lineNumber - 1)
                    var characterIndex = 0;
                    linesBeforeCurrentLine.forEach(function(line){
                        characterIndex += line.length + "\n".length;
                    })
                    characterIndex += frame.columnNumber
                    characterIndex += step.characterIndex

                    callback({
                        originObject: {
                            action: "Dynamic Script",
                            value: content,
                            inputValues: []
                        },
                        characterIndex
                    })
                })
            } else {
                callback(null)
            }
        })
        return;
    }
    else {
        console.log("not handling step", step)
        callback(null)
        return
    }

    if (ret.originObject.action === "set className") {
        ret.characterIndex = ret.characterIndex - " class='".length
        if (ret.characterIndex < 0) {
            ret.characterIndex = 0;
            console.log("todo: really this means that this is the end of the path")
        }
    }



    callback(ret);
}
