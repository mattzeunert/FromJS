import {disableTracing, enableTracing} from "../src/tracing/tracing"



var _ = require("underscore")
var $ = require("jquery")


var ReactDOM = require("react-dom")
var React = require("react")

if (!window.isSerializedDomPage){
    enableTracing()
}

import initSerializedDataPage from "../src/ui/initSerializedDataPage"
import showFromJSSidebar from "../src/ui/showFromJSSidebar"


setTimeout(function(){
    if (window.isSerializedDomPage){
        initSerializedDataPage(showFromJSSidebar);
    } else {
        setTimeout(function(){
            if (window.isVis) {
                return;
            }

            showFromJSSidebar()
        }, 4000)
    }
}, 100)
