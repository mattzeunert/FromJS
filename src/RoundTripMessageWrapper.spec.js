import RoundTripMessageWrapper from "./RoundTripMessageWrapper"

describe("RoundTripMessageWrapper", function(){
    var side1, side2;
    beforeEach(function(){
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

        side1 = new RoundTripMessageWrapper(onMessage, postMessage)
        side2 = new RoundTripMessageWrapper(onMessage2, postMessage2)
    })

    it("Allows callbacks to be called across iframe/page/webworker contexts", function(done){
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

    it("Lets you cancel requests after they are made", function(done){
        side1.on("doSomething", function(callback){
            setTimeout(function(){
                callback("Test")
            }, 0)
        })

        var callback = jasmine.createSpy();
        var cancel = side2.send("doSomething", callback);
        cancel()

        setTimeout(function(){
            expect(callback).not.toHaveBeenCalled()
            done()
        }, 0)
    })

    it("Lets you do non-roundtrip messages", function(){
        var side1Callback = jasmine.createSpy()
        side1.on("Hello", side1Callback)

        side2.send("Hello")

        expect(side1Callback).toHaveBeenCalled()
    })
})
