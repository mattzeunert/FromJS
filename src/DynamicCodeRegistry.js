/*
    Keep track of
*/

import Backbone from "backbone"
import _ from "underscore"

export default class DynamicCodeRegistry {
    constructor(){
        _.extend(this, Backbone.Events)
        this._content = {};
        this._origins = {}
    }
    register(filename, content, origin){
        this._content[filename] = content
        if (origin) {
            this._origins[filename] = origin
        }
        this.trigger("register", {
            [filename]: content
        })
    }
    getContent(filename){
        return this._content[filename]
    }
    getOrigin(filename){
        return this._origins[filename]
    }
    fileIsDynamicCode(filename){
        return filename.indexOf("DynamicFunction") !== -1;
    }
}
