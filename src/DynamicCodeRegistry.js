/*
    Keep track of
*/

import Backbone from "backbone"
import _ from "underscore"

export default class DynamicCodeRegistry {
    constructor(){
        _.extend(this, Backbone.Events)
    }
    register(filename, content, origin){
        fromJSDynamicFiles[filename] = content
        if (origin) {
            fromJSDynamicFileOrigins[filename] = origin
        }
        this.trigger("register", {
            [filename]: content
        })
    }
    getContent(filename){
        return fromJSDynamicFiles[filename]
    }
    getOrigin(filename){
        return fromJSDynamicFileOrigins[filename]
    }
}
