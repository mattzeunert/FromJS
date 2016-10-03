import ValueMap from "./value-map"
import exportElementOrigin from "./export-element-origin"
import fileIsDynamicCode from "./fileIsDynamicCode"
import getRootOriginAtChar from "./getRootOriginAtChar"
import $ from "jquery"
import _ from "underscore"
import adjustColumnForEscapeSequences from "./adjustColumnForEscapeSequences"
import config from "./config"
import OriginPathStep from "./OriginPathStep"

export default function whereDoesCharComeFrom(firstStep, callback, resolveFrameWorker){
    var steps = [];

    if (_.isArray(firstStep)) {
        firstStep = new OriginPathStep(firstStep[0], firstStep[1])
    }

    var step = firstStep;
    steps.push(step)

    nextStep(step)
    function nextStep(step){
        goUp(step, resolveFrameWorker, function(newStep){

            if (newStep !== null && !step.origin){
                throw "hmm?"
            }

            if (newStep !== null){
                if (isNaN(newStep.characterIndex)){
                    console.error("characterIndex is NaN")
                    debugger;
                }
                steps.push(newStep)
                nextStep(newStep)
            } else {
                if (config.logTracingSteps) {
                    console.log("steps are", steps)
                }
                callback(steps)
            }
        })
    }

}

window.whereDoesCharComeFrom = whereDoesCharComeFrom
export {goUp as goUpForDebugging}
function goUp(step, resolveFrameWorker, callback){

    var ret
    if (step.origin.action === "set className"){
        var characterIndex =  step.characterIndex
        var newCharIndex = characterIndex - " class='".length

        var clickedOnAttributeLeftPart = newCharIndex < 0
        var clickedOnAttributeRightPart = newCharIndex >= step.origin.inputValues[0].value.length

        if (clickedOnAttributeLeftPart || clickedOnAttributeRightPart) {
            // clicked on class=' part rather than actual class name
            callback(null)
            return;
        }
        ret = new OriginPathStep(step.origin.inputValues[0], newCharIndex)
    } else if (step.origin.action === "Assign InnerHTML" ||
        step.origin.action === "Initial Body HTML" ||
        step.origin.action === "InsertAdjacentHTML") {
        var offsetAtChar = 0;
        if (step.origin.offsetAtCharIndex){
            var index = step.characterIndex - step.origin.inputValuesCharacterIndex[0]
            offsetAtChar = step.origin.offsetAtCharIndex[index]
            if (offsetAtChar === undefined) debugger
        }
        ret = {
            origin: step.origin.inputValues[0],
            characterIndex: step.characterIndex - step.origin.extraCharsAdded + offsetAtChar
        }
    } else if (step.origin.action === "createElement" || step.origin.action === "createElementNS") {
        var characterIndex = step.characterIndex
        var elementType = step.origin.inputValues[0].value;
        var openingHtml = "<" + elementType + ">"
        var closingHtml = "<" + elementType + "/>"
        // step.origin.value is something like '<li></li>', but we need a char index for just 'li'
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
        if (characterIndex == step.origin.inputValues[0].value.length) {
            // they clicked on ">", should really end path here
            characterIndex = step.origin.inputValues[0].value.length - 1
        }
        ret = {
            origin: step.origin.inputValues[0],
            characterIndex: characterIndex
        }
    } else if (step.origin.inputValues.length === 1 && step.origin.inputValues[0].value === step.origin.value) {
        // This makes stuff work but it can be a bit misleading
        // because it suggests actions are explicitly handled even though they are not
        ret = {
            origin: step.origin.inputValues[0],
            characterIndex: step.characterIndex
        }
    } else if (step.origin.action === "Style SetProperty") {
        var inputValues = step.origin.inputValues;

        var valueMap = new ValueMap();
        valueMap.appendString(" style='", "END", 0)
        valueMap.append(inputValues[0])
        valueMap.appendString(": ", "END", 0)
        valueMap.append(inputValues[1])
        valueMap.appendString("'", "END", 0)

        ret = valueMap.getItemAt(step.characterIndex)
        if (ret.origin === "END") {
            callback(null)
            return;
        }
    } else if (step.origin.action === "RegExp.exec Match" ||
        step.origin.action === "RegExp.exec Submatch") {
        ret = {
            origin: step.origin.inputValues[0],
            characterIndex: step.origin.inputValuesCharacterIndex[0] + step.characterIndex
        }
    } else if (step.origin.action === "ToLowerCase Call" ||
        step.origin.action === "ToUpperCase Call") {
        // I'll just assume that this is always valid...
        // could there be case where one char becomes two in lower/upper case?
        ret = {
            origin: step.origin.inputValues[0],
            characterIndex: step.characterIndex
        }
    } else  if (step.origin.action === "Concat") {
        var valueMap = new ValueMap()
        valueMap.append(step.origin.inputValues[0])
        valueMap.append(step.origin.inputValues[1])

        ret = valueMap.getItemAt(step.characterIndex)
    } else if (step.origin.action === "Array Join Call"){
        var inputValues = step.origin.inputValues
        var separator = _.first(inputValues)
        var items = inputValues.slice(1)

        var valueMap = new ValueMap()
        items.forEach(function(item, i){
            var isLastItem = i === items.length - 1;
            valueMap.append(item)
            if (!isLastItem) {
                valueMap.append(separator)
            }
        })
        ret = valueMap.getItemAt(step.characterIndex)
    } else if (step.origin.action === "setAttribute"){
        var inputValues = step.origin.inputValues

        var valueMap = new ValueMap()
        valueMap.appendString(" ", "END", 0)
        valueMap.append(inputValues[0])
        valueMap.appendString("='", "END", 0)
        valueMap.append(inputValues[1])
        valueMap.appendString("'", "END", 0)

        ret = valueMap.getItemAt(step.characterIndex)
        if (ret.origin === "END") {
            callback(null);
            return;
        }

    } else if (step.origin.action === "Replace Call" ||
        step.origin.action === "Slice Call" ||
        step.origin.action === "Substr Call"
            ) {
        var valueMap = ValueMap.deserialize(step.origin.valueItems, step.origin.inputValues)
        ret = valueMap.getItemAt(step.characterIndex)
    }
    else if (step.origin.action === "JSON.parse"){
        if (step.origin.inputValues.length === 1) {
            ret = {
                origin: step.origin.inputValues[0],
                characterIndex: step.characterIndex + step.origin.inputValuesCharacterIndex[0]
            }
        } else {
            throw "need to handle"
        }
    }
    else if (step.origin.action === "Split Call") {
        ret = new OriginPathStep(
            step.origin.inputValues[0],
            step.characterIndex + step.origin.inputValuesCharacterIndex[0]
        )
    }
    else if (step.origin.action === "Match Call"){
        if (step.origin.value === step.origin.inputValues[0].value) {
            ret = {
                origin: step.origin.inputValues[0],
                characterIndex: step.characterIndex
            }
        } else {
            throw "not handled match call"
        }
    }
    else if (step.origin.action === "Read Element innerHTML" ||
        step.origin.action === "Read Element outerHTML"){

        // var el = $("*").filter(function(){return this.innerHTML == step.origin.value})[0]
        var el = step.origin.inputValues[0]

        var charIndexIsInInnerHTML = step.origin.action === "Read Element innerHTML"

        // using an el reference is fragile, because it will create the current
        // contents of the element rather than a snapshot from when the value was read,
        // but oh well
        var origin = getRootOriginAtChar(el, step.characterIndex, charIndexIsInInnerHTML);

        callback({
            origin: origin.origin,
            characterIndex: origin.characterIndex
        })
        return;
    }
    else if (step.origin.action === "Replace Call Submatch"){
        ret = {
            origin: step.origin.inputValues[0],
            characterIndex: step.characterIndex + step.origin.inputValuesCharacterIndex[0]
        }
    }
    else if (step.origin.action === "String Literal"){
        if (!step.origin.getStackFrames) {
            // This is the case in some test specs
            callback(null)
            return;
        }
        resolveFrameWorker.send("resolveFrame", step.origin.getStackFrames()[0], function(err, frame){
            if (fileIsDynamicCode(frame.fileName)){
                resolveFrameWorker.send("getSourceFileContent", frame.fileName, function(content){
                    var lines = content.split("\n")
                    var linesBeforeCurrentLine = lines.slice(0, frame.lineNumber - 1)
                    var characterIndex = 0;
                    linesBeforeCurrentLine.forEach(function(line){
                        characterIndex += line.length + "\n".length;
                    })

                    characterIndex += frame.columnNumber
                    characterIndex += "'".length

                    var contentFromThisLine = content.substr(characterIndex);

                    characterIndex += adjustColumnForEscapeSequences(contentFromThisLine, step.characterIndex)

                    callback({
                        origin: fromJSDynamicFileOrigins[frame.fileName],
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
        if (config.logTracingSteps) {
            console.log("not handling step", step)
        }
        callback(null)
        return
    }

    if (ret.origin.action === "set className") {
        ret.characterIndex = ret.characterIndex - " class='".length
        if (ret.characterIndex < 0) {
            ret.characterIndex = 0;
            console.log("todo: really this means that this is the end of the path")
        }
    }

    if (ret.characterIndex <0 ){
        debugger
    }

    callback(ret);
}
