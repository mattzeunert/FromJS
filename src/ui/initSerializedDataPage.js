import $ from "jquery"

export default function initSerializedDataPage(doneCallback){
    window._disableTracing();
    console.log("initSerializedDataPage")

    document.body.innerHTML = "Loading data..."

    $.get("./data.json", function(data){
        handleData(data)
    })

    function handleData(data){
        document.body.parentElement.innerHTML = data.html

        $("[fromjs-id]").each(function(){
            var id = $(this).attr("fromjs-id")
            var elOrigin = data.elOrigins[id]
            elOrigin.contents = Array.prototype.slice.apply(this.childNodes, [])
            // elOrigin.contents = elOrigin.contents.map(function(origin){
            //     return $("[fromjs-id='" + origin.elId + "']")[0]
            // })
            this.__elOrigin = elOrigin
        })
        $("[fromjs-text-node-converted-to-span]").each(function(){
            var textNode = document.createTextNode(this.textContent)
            textNode.__elOrigin = this.__elOrigin
            this.replacementTextNode = textNode
            $(this).replaceWith(textNode)
        })
        $("[fromjs-id]").each(function(){
            this.__elOrigin.contents = this.__elOrigin.contents.map(function(el){
                if (el.replacementTextNode) {
                    return el.replacementTextNode
                }
                return el
            })
        })
        $("[fromjs-content-origin-id]").each(function(){
            var originId = $(this).attr("fromjs-content-origin-id");

            this.childNodes[0].__elOrigin = data.elOrigins[originId]
        })
        $("[fromjs-id]").each(function(){
            $(this).removeAttr("fromjs-id")
        });
        setDefaultSourceCache(data.sourceCache)
        window.fromJSDynamicFileOrigins = data.fromJSDynamicFileOrigins

        doneCallback()
    }
}
