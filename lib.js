(function() {
    window.UDT = {};
    var aud = new (window.AudioContext || window.webkitAudioContext);
// Transmission
    (function() {
        function tone(freq, dur, amp, c) {
            c = c || function() {};
            var o = aud.createOscilator();
            var g = aud.createGain();
            o.connect(g);
            g.connect(aud.destination);
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
                    tone(writeData[i], toneDur, v, (i == writeData.length) ? (isTransmiting = false, function() {}) : a);
                    i++;
                }
            }
            a();
        }
        function emergencyTransmitFree() {
            isTransmiting = false;
        }
        window.UDT.transmit = transmit;
        window.UDT.emergencyTransmitFree = emergencyTransmitFree;
    })();
// Receiver
    (function() {
        var any = aud.createAnalyser();
        any.fftsize = 2048; // default
        any.
        
