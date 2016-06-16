var vms = reducerthread({
    files: ["vmA.js", "vmB.js"],
    maxTime: 10,
    onFrameComplete: function () {
        console.log("frame complete: every script was run once this frame")
    },
    onError: function (err) {
        console.log("there was an error: probably one of the vms timed out");
        console.log(err);
    }
})
