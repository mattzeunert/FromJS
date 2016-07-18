import $ from "jquery"
import {getDefaultSourceCache} from "../resolve-frame"
import async from "async"

export default function saveAndSerializeDOMState(){
    $("*").off()
    var sourceCache = getDefaultSourceCache();

    $("link").each(function(){
        var href = $(this).attr("href")
        $(this).attr("href", _.last(href.split("/")))
    })

    $("#fromjs-initial-html").remove();
    $(".fromjs-outer-container").remove()

    $("html").find("*")
      .contents()
      .filter(function() {
        return this.nodeType === 3; //Node.TEXT_NODE
      }).each(function(){
          if (this.parentElement.tagName ==="SCRIPT") {
              if (this.parentElement.contentElOrigin) {
                  throw "two text nodes inside script tag?"
              }
              this.parentElement.__contentElOrigin = this.__elOrigin
          } else {
              var span = $("<span>")
              span.attr("fromjs-text-node-converted-to-span", "true")
              span[0].textContent = this.textContent
              span[0].__elOrigin = this.__elOrigin

              $(this).replaceWith(span)
          }
      });

    var elsWithOrigin = jQuery("*").filter(function(){
        return this.__elOrigin
    })
    var id=1;

    elsWithOrigin.each(function(){
        var el = this;
        $(el).attr("fromjs-id", id)
        id++;
    })
    var elOrigins = {}
    function storeOrigin(origin, id){
        var serializedElOrigin = {};
        for (var key in origin) {
            if (key === "contents") {
                var contents = origin[key];
                serializedElOrigin[key] = contents.map(function(el){
                    return {elId: $(el).attr("fromjs-id")}
                })
            } else {
                serializedElOrigin[key] = origin[key]
            }
        }
        elOrigins[id] = serializedElOrigin
    }
    elsWithOrigin.each(function(){
        var el = this;
        storeOrigin(el.__elOrigin, $(el).attr("fromjs-id"))
    })
    jQuery("*").filter(function(){
        return this.__contentElOrigin
    }).each(function(){
        var contentOriginId = id++;
        storeOrigin(this.__contentElOrigin, contentOriginId)
        $(this).attr("fromjs-content-origin-id", contentOriginId)
    })

    var additionalFilesToCache = [];
    additionalFilesToCache.push("/demos/index.html?dontprocess=yes")
    $("script:not([type])").each(function(){
        if ($(this).attr("src") === "http://localhost:8080/dist/from.js") {
            return
        }

        var urlParts = location.href.replace(location.hash, "").split("/")
        urlParts.pop(); // remove html file path
        var urlPrefix = urlParts.join("/") + "/"

        additionalFilesToCache.push(urlPrefix + $(this).attr("src"))
        additionalFilesToCache.push(urlPrefix + $(this).attr("src") + ".map")
        additionalFilesToCache.push(urlPrefix + $(this).attr("src") + "?dontprocess=yes")

    })
    async.each(additionalFilesToCache, function(path, callback){
        $.get(path).then(function(res){
            sourceCache[path] = res;
            callback(null, {});
        })
    }, finish)

    function finish(){
        var serializedState = {
            html: document.body.parentElement.innerHTML,
            elOrigins: elOrigins,
            sourceCache: sourceCache,
            fromJSDynamicFileOrigins: window.fromJSDynamicFileOrigins
        }
        console.log("state size", JSON.stringify(serializedState).length)
        window.serializedState = serializedState

        var str = JSON.stringify(serializedState)
        var url = URL.createObjectURL(new Blob([str], {type: 'text/plain'}))

        document.body.innerHTML = "<a download='data.json' href='" + url + "'>Done</a>"
    }
}
