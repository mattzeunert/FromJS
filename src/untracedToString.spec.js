import untracedToString from "./untracedToString"
import {enableTracing, disableTracing} from "./tracing/tracing"

describe("untracedToString", function(){
    beforeEach(function(){
        enableTracing();
    })
    afterEach(function(){
        disableTracing()
    })

    it("Doesn't break objects with a custom toString method", function(){
        var obj = {
            toString: () => "cake"
        }

        expect(untracedToString(obj)).toBe("cake")
    })
})
