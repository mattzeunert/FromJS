import Origin from "../origin"

export default function addElOrigin(el, what, originInfo){
    if (!originInfo) debugger
    if (!el.__elOrigin) {
        el.__elOrigin = {}
    }



    if (what === "replaceContents") {
        el.__elOrigin.contents = originInfo.children
    } else if(what==="appendChild") {
        if (!el.__elOrigin.contents) {
            el.__elOrigin.contents = []
        }
        el.__elOrigin.contents.push(originInfo.child)
    } else if (what === "prependChild") {
        if (!el.__elOrigin.contents) {
            el.__elOrigin.contents = []
        }

        el.__elOrigin.contents.push(originInfo.child)
    } else if (what === "prependChildren") {
        originInfo.children.forEach((child) => {
            addElOrigin(el, "prependChild", {child})
        })
    } else {
        var origin = new Origin(originInfo)
        el.__elOrigin[what] = origin;
    }
}
