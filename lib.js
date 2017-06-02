(function() {
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
        function transmit(data, bins, freqMin, freqMax, toneDur, v) { // data is a normal string, bin is in bits, LSB
            isTransmiting = true;
            v = v || 1;
            var writeData = [];
            do {
                var base = 1;
                var writePos = 0;
                var writeN = 0;
                for (let i = 0; i < data.length; i++) {
                    var v = data.charCodeAt(i);
                    while (true) {
                        if (v & base) {
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
                    tone(freqMin + (writeData[i] * (freqMax - freqMin) / (2 ** (bins + 1))), toneDur, v, (i == writeData.length) ? (isTransmiting = false, function() {}) : a);
                    i++;
                }
            }
            a();
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
    (function() {
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
        gum({audio : true, video : false}).then(function(stream) {
            
        }, function() {
            postLib("receive", false);
        });
