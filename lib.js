(function(freqInterval, baud) {
    var promises = {
        transmit : {
            s : [],
            f : [],
            v : 0
        },
        receive : {
            s : [],
            f : [],
            v : 0
        }
    };
    var newUDT = {
        getTransmitter : function() {
            return {
                then : function(s, f) {
                    switch (promises.transmit.v) {
                        case 0:
                            if (s) {
                                promises.transmit.s.push(s);
                            }
                            if (f) {
                                promises.transmit.f.push(f);
                            }
                            break;
                        case 1:
                            s(promises.transmit.lib);
                            break;
                        case 2:
                            f();
                            break;
                    }
                }
            };
        },
        getReceiver : function() {
            return {
                then : function(s, f) {
                    switch (promises.receive.v) {
                        case 0:
                            if (s) {
                                promises.receive.s.push(s);
                            }
                            if (f) {
                                promises.receive.f.push(f);
                            }
                            break;
                        case 1:
                            try {
                                s(promises.receive.lib);
                            } catch (e);
                            break;
                        case 2:
                            try {
                                f();
                            } catch (e);
                            break;
                    }
                }
            };
        }
    }
    function postLib(name, ok) {
        if (promises[name]) {
            promises[name].v = ok ? 1 : 2;
            promises[name][ok ? "s" : "f"].forEach(function(v) {
                try {
                    if (ok) {
                        v(promises[name].lib);
                    } else {
                        v();
                    }
                } catch (e);
            });
        }
    }
    var aud = window.AudioContext || window.webkitAudioContext;
    if (!aud) {
        console.log("AudioContext not supported");
        postLib("transmit", false);
        postLib("receive", false);
        return;
    }
// Transmission
    (function() {
        var transmitAud = new aud();
        var o,g;
        (function() {
            o = aud.createOscilator();
            g = aud.createGain();
            o.connect(g);
            g.connect(aud.destination);
        })();
        function tone(freq, dur, amp, c) {
            c = c || function() {};
            g.gain.value = amp / 100;
            o.frequency.value = freq;
            o.type = 0;
            o.start();
            setTimeout(function() {
                o.stop();
                c();
            }, dur);
        }
        var isTransmiting = false;
        function transmit(data, bins, binSize, freqBase, vol) { // data is a normal string encoded in LSB, bin is a power of 2, binSize and freqBase multiples of 20
            bins = Math.log2(bins) - 1;
            if ((bins % 1) != 0) {
                return [false, "bins: not a power of 2"];
            }
            isTransmiting = true;
            vol = vol || 1;
            var writeData = [];
            do {
                var base = 1;
                var writePos = 0;
                var writeN = 0;
                for (let i = 0; i < data.length; i++) {
                    var char = data.charCodeAt(i);
                    while (true) {
                        if (char & base) {
                            writeN += (writePos ** 2);
                        }
                        writePos++;
                        if (writePos == bins) {
                            writePos = 0;
                            writeData.push(writeN);
                            writeN = 0;
                        }
                        base = base << 1;
                        if (base == 256) {
                            base = 1;
                            break;
                        }
                    }
                }
            }
            var i = 0;
            function a() {
                if (isTransmiting) {
                    tone(freqBase + (writeData[i] * binSize), 1 / baud, vol, (i == writeData.length) ? (isTransmiting = false, function() {}) : a);
                    i++;
                }
            }
            a();
            return [true, null];
        }
        function emergencyTransmitFree() {
            isTransmiting = false;
        }
        promises.transmit.lib = {
            transmit : transmit,
            emergencyTransmitFree : emergencyTransmitFree
        }
        postLib("transmit", true);
    })();
// Receiver
    (function() { // for best preformance, listen on frequencies with a multiple of freqInterval
        var mediaMode = false;
        var gum = navigator.mediaDevices.getUserMedia || (mediaMode = true, navigator.getUserMedia) || navigator.webkitGetUserMedia;
        if (!gum) {
            postLib("receive", false);
            return;
        } else if (mediaMode) {
            let og = gum;
            gum = function(op) {
                return {
                    then : function(s, f) {
                        og(op, s, f);
                    }
                };
            }
        }
        var listeners = [];
        function addListener(freqBase, bins, binSize, sensitivity) {
            listeners.push({
                freqBase : freqBase,
                bins : bins,
                binSize : binSize,
                sensitivity : sensitivity
            });
        }
        gum({audio : true, video : false}).then(function(stream) {
            var receiveAud = new aud();
            var s = receiveAud.createMediaStreamSource(stream);
            var any = receiveAud.createAnalyser();
            any.fftsize = receiveAud.sampleRate / freqInterval;
            s.connect(any);
            var data = new Uint8Array(any.frequencyBinSize);
            function a() {
                if (listeners.length > 0) {
                    any.getByteFrequencyData(data);
                    listeners.forEach(function(v) {
                        var n = 0;
                        var base = 1;
                        for (var i = 0; i < v.bins; i++) {
                            var v = 
                            base << 1;
                        }
                    });
                }
            }
            setInterval(a, 500 / baud);
        }, function() {
            postLib("receive", false);
        });
    })();
})(20, 10);
