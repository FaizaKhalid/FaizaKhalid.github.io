$(function () {

    window.criteo_email = "";	// Bulunuyorsa, kullanici emailini buraya yazin
    window.criteo_q = window.criteo_q || [];
    window.criteoDeviceType = /iPad/.test(navigator.userAgent) ? "t" : /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Silk/.test(navigator.userAgent) ? "m" : "d";

    // Criteo onekiyle cerez kaydetme
    var criteoCreateCookie = function (name, value) {
        var expires;
        var date = new Date();
        date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
        document.cookie = "criteo_" + name + "=" + value + expires + "; path=/";
    }

    // Criteo onekiyle cerez okuma
    var getCriteoCookie = function (name) {
        name = "criteo_" + name.toString();
        if (document.cookie.length > 0) {
            c_start = document.cookie.indexOf(name + "=");
            if (c_start != -1) {
                c_start = c_start + name.length + 1;
                c_end = document.cookie.indexOf(";", c_start);
                if (c_end == -1) {
                    c_end = document.cookie.length;
                }
                return unescape(document.cookie.substring(c_start, c_end));
            }
        }
        return "";
    }

    // Criteo anasayfa tag'ini calistirir
    var fireCriteoHomepageTag = function () {
        window.criteo_q.push(
            { event: "setAccount", account: 43465 },
            { event: "setEmail", email: window.criteo_email },
            { event: "setSiteType", type: window.criteoDeviceType },
            { event: "viewHome" });
    }

    // Criteo urun listeleme sayfasi tag'ini calistirir
    var fireCriteoListingTag = function () {
        var list = document.getElementsByName("criteoid");
        var products = [list.length];
        for (i = 0; i < list.length; i++) {
            products[i] = list[i].value;
        }

        window.criteo_q.push(
            { event: "setAccount", account: 43465}, 
            { event: "setEmail", email: window.criteo_email }, 
            { event: "setSiteType", type: window.criteoDeviceType },
            { event: "viewList", item: products });
    }

    // Criteo urun ayrinti sayfasi tag'ini calistirir
    var fireCriteoProductTag = function () {
        var productId = document.getElementsByName("id")[0].value;

        window.criteo_q.push(
            { event: "setAccount", account: 43465 },
            { event: "setEmail", email: window.criteo_email },
            { event: "setSiteType", type: window.criteoDeviceType },
            { event: "viewItem", item: productId });
    }

    // Criteo sepet tag'ini calistirir
    var fireCriteoBasketTag = function () {
        var productIds = new Array();
        var amounts = new Array();

        $(".css-payment .css-clone").each(function () {
            productIds.push($(this).data("id"));
        })

        $(".css-payment td.css-right").each(function () {
            amounts.push(parseFloat($(this).text().split(" ")[0].replace(".", "").replace(",", ".")));
        })

        var basketInfo = productIds.map(function (productId, i) {
            return { id: productId, quantity: 1, price: amounts[i] };
        });

        // Sepeti cookie'de sakla
        criteoCreateCookie("basket", JSON.stringify(basketInfo));

        window.criteo_q.push(
            { event: "setAccount", account: 43465 },
            { event: "setEmail", email: window.criteo_email },
            { event: "setSiteType", type: window.criteoDeviceType },
            { event: "viewBasket", item: basketInfo });
    }

    // Criteo ödeme tag'ini calistirir
    var fireCriteoTransactionTag = function () {
        if (document.getElementsByClassName("css-missing").length == 0) {
            var basketInfo = [{ id: "no_info", price: 1, quantity: 1 }]
            var basketLoaded = false;

            try {
                basketInfo = JSON.parse(getCriteoCookie("basket"));
                basketLoaded = true;
            } catch (e) {
                ;
            }

            var pathPieces = window.location.pathname.split("/");
            var transactionId = pathPieces[pathPieces.length - 1];

            if (!basketLoaded)
                transactionId = transactionId + "_no_info";

            window.criteo_q.push(
                { event: "setAccount", account: 43465 },
                { event: "setEmail", email: window.criteo_email },
                { event: "setSiteType", type: window.criteoDeviceType },
                { event: "trackTransaction", id: transactionId, item: basketInfo });
        }
    }

    // Odeme onay sayfasinda satis onay kodunu calistir
    if (window.location.pathname.match(/\/bagis\/odeme\/sonuc|\/donate\/payment\/result|\/(en|ar)\/donate\/payment\/result/)) {
        fireCriteoTransactionTag();
    }
    // Bagis odeme sayfalarinda sepet kodunu calistir
    else if (window.location.pathname.match(/\/bagis\/odeme|\/donate\/payment|\/(en|ar)\/donate\/payment/)) {
        fireCriteoBasketTag();
    }
    // Urun ayrinti sayfalarinda urun kodunu calistir
    else if (window.location.pathname.match(/\/bagis\/|\/donate\/|\/en\/donate\/|\/ar\/donate\//)) {
        if (document.getElementsByName("id").length > 0) {
            fireCriteoProductTag();
        }
    }
    //Bagis listeleme sayfalarında liste kodunu calistir
    else if (window.location.pathname.match(/\/bagis|\/donate|\/en\/donate|\/ar\/donate/) && !window.location.pathname.match(/\/bagisci|\/donor|\/en\/donor|\/ar\/donor/)) {
        fireCriteoListingTag();
    }
    // Aksi halde anasayfa kodunu calistir
    else {
        fireCriteoHomepageTag();
    }

});