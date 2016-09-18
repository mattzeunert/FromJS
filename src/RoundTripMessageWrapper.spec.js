import RoundTripMessageWrapper from "./RoundTripMessageWrapper"

describe("RoundTripMessageWrapper", function(){
    it("sth", function(done){
        var onMessageFn = null;
        var onMessage = function(fn){
            onMessageFn = fn
        }
        var postMessage = function(data){
            onMessageFn2.call(null, {data})
        }
        var postMessage2 = function(data){
            onMessageFn.call(null, {data})
        }
        var onMessageFn2 = null;
        var onMessage2 = function(fn){
            onMessageFn2 = fn
        }

        var side1 = new RoundTripMessageWrapper(onMessage, postMessage)
        var side2 = new RoundTripMessageWrapper(onMessage2, postMessage2)

        side2.on("addNumbers", function(a, b, callback){
            expect(a).toBe(2)
            expect(b).toBe(3)
            callback(a + b)
        })

        side1.send("addNumbers", 2, 3, function(sum){
            expect(sum).toBe(5)
            done()
        })
    })
})
