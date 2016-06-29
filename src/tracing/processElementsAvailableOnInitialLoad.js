import addElOrigin from "./addElOrigin"

export default function processElementsAvailableOnInitialLoad(){
    processNode(document.body)
}

function processNode(el){
    var isTextNode = el.innerHTML === undefined
    if (isTextNode) {
        addElOrigin(el, "textValue", {
            "action": "initial html",
            inputValues: [],
            value: el.textContent
        })

    } else {
        var children = Array.prototype.slice.apply(el.childNodes, [])

        addElOrigin(el, "replaceContents", {
            action: "initial html",
            children: children
        })

        addElOrigin(el, "tagName", {
            action: "initial html",
            value: el.tagName,
            inputValues: []
        })

        for (var i = 0;i<el.attributes.length;i++) {
            var attr = el.attributes[i]
            addElOrigin(el, "attribute_" + attr.name, {
                action: "initial html",
                value: " " + attr.name + "='" + attr.textContent + "'",
                inputValues: []
            })
        }


        children.forEach(function(child){
            processNode(child)
        })
    }
}
