window.onerror = function (msg, url, lineNo, columnNo, error) {
    var $msg = "";
    if (typeof msg === 'object') {
        try {
            if (msg.target.toString() === "[object HTMLScriptElement]") return;
            $msg = 'Event target:' + msg.target + ' srcElement:' + msg.srcElement;
            url = msg.srcElement.src;
        }
        catch (err) {
            $msg = "Event error: " + err;
        }
    } else {
        $msg = msg;
    }

    $.ajax({
        type: "POST",
        data: "action=jscript&msg=" + $msg + "&url=" + url + "&line=" + lineNo + "&column=" + columnNo + "&error=" + error + "&location=" + encodeURIComponent(window.location),
        dataType: "json"
    });
};


