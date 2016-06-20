// reducerthread.js
// repo    : https://github.com/richardanaya/reducerthread
// license : MIT
(function (window, module, Vm) {
    "use strict";

    window.reducerthread = module.exports = function reducerthread(config) {
        var files = config.files;
        var sources = config.sources;
        var maxTime = config.maxTime || 1000;
        var frameComplete = config.onFrameComplete;
        var error = config.onError;
        var vms = [];
        var ps = [];
        var deltaTime = 0;
        var d = new Date();
        var time = performance.now()

        function go(codes) {
            codes.forEach(function (code) {
                vms.push(
                    {
                        state: null,
                        compiled: Vm.compile(code + ";state"),
                        executionTime: 0
                    }
                )
            })
            var currentVM = 0;
            var vm = new Vm();

            function run(i) {
                vm.realm.global.time = d.getTime();
                vm.realm.global.deltaTime = deltaTime;
                vm.realm.global.state = vms[i].state;
                var startTime = performance.now();
                var newState = null;
                try {
                    newState = vm.run(vms[i].compiled, 'timeout.js', maxTime)
                }
                catch (e) {
                    if (error)
                        error({file: files[i], vm: vms[i], vms: vms})
                    return;
                }
                var completeTime = performance.now();
                vms[i].state = newState;
                vms[i].executionTime = completeTime - startTime;
                var nexti = (i + 1) % vms.length;
                if (nexti == 0) {
                    if (frameComplete)
                        frameComplete({vms: vms})
                    setTimeout(function () {
                        var newtime = performance.now()
                        deltaTime = newtime - time;
                        time = newtime;
                        run(nexti);
                    }, 1000 / 60);
                }
                else {
                    run(nexti);
                }
            }

            run(currentVM);
        }

        if (files) {
            for (var f in files) {
                ps.push(fetch(files[f]).then(function (response) {
                    return response.text();
                }))
            }
            Promise.all(ps).then(function (codes) {
                go(codes);
            })
        }
        else if (sources) {
            go(sources);
        }
    }
})(
    typeof window !== "undefined" ? window : {},
    typeof module !== "undefined" ? module : {},
    typeof require !== "undefined" ? require("vm.js") : Vm
);
