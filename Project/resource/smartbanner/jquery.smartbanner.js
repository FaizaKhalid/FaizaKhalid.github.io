
(function (root, factory) {
    if (typeof define == 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        factory(root.jQuery);
    }
})(this, function ($) {
    var UA = navigator.userAgent;
    var isEdge = /Edge/i.test(UA);

    var SmartBanner = function (options) {
        // Get the original margin-top of the HTML element so we can take that into account.
        this.origHtmlMargin = parseFloat($('html').css('margin-top'));
        this.options = $.extend({}, $.smartbanner.defaults, options);

        if (UA.match(/Safari/i) !== null && UA.match(/iPhone|iPod/i) !== null || (UA.match(/iPad/))) {
                this.type = 'ios';
        }
        else if (UA.match(/Android/i) !== null) {
            this.type = 'android';
        }
        // Don't show banner if device isn't iOS or Android, website is loaded in app or user dismissed banner.
        if (!this.type || this.getCookie('sb-closed') || this.getCookie('sb-installed')) {
            return;
        }

        // Set default onInstall callback if not set in options.
        if (typeof this.options.onInstall == 'function') {
            this.options.onInstall = this.options.onInstall;
        } else {
            this.options.onInstall = function () { };
        }
        // Set default onClose callback if not set in options.
        if (typeof this.options.onClose == 'function') {
            this.options.onClose = this.options.onClose;
        } else {
            this.options.onClose = function () { };
        }
        // Create banner.
        this.create();
        this.show();
        this.listen();
    };

    SmartBanner.prototype = {

        constructor: SmartBanner,

        create: function () {
            var iconURL;
            var link;

            switch (this.type) {
                case 'android':
                    link = 'market://details?id=' + this.options.googleplayID;
                    break;
                case 'ios':
                    link = 'https://itunes.apple.com/' + this.options.appStoreLanguage + '/app/id' + this.options.itunesID;
                    break;
            }

            var banner = (
                '<div id="smartbanner">' +
                '<div class="sb-container">' +
                '<a href="#" class="sb-close">&times;</a>' +
                '<img src="' + this.options.icon +'">' +
                '<span>' + this.options.message + '</span>' +
                '<a href="' + link + '" class="sb-button sb-app">' + this.options.button +
                '</a>' +
                '</div>' +
                '</div>'
            );

            $(this.options.appendToSelector).prepend(banner);
           
        },

        listen: function () {
            $('#smartbanner .sb-close').on('click', $.proxy(this.close, this));
            $('#smartbanner .sb-button').on('click', $.proxy(this.install, this));
        },

        show: function () {
            var banner = $('#smartbanner');
            banner.addClass("shown", 1000);
            setTimeout(function () {
                $(window).scroll(function () {
                    var banner = $('#smartbanner');
                    if ($(this).scrollTop() >= banner.height()) {
                        banner.addClass("sticky");
                    }
                    else {
                        banner.removeClass("sticky");
                    }
                });
            }, 1000);
        },

        hide: function () {
            var banner = $('#smartbanner');
            banner.stop();
            banner.animate({ height: 0, padding: 0 }, {
                duration: 500,
                complete: function () {
                    $(window).off('scroll');
                }
            }).removeClass('shown');
        },

        close: function (e) {
            e.preventDefault();
            this.hide();
            this.setCookie('sb-closed', 'true', this.options.daysHidden);
            this.options.onClose(e);
        },

        install: function (e) {
            this.hide();
            this.setCookie('sb-installed', 'true', this.options.daysReminder);
            this.options.onInstall(e);
        },

        setCookie: function (name, value, exdays) {
            var exdate = new Date();
            exdate.setDate(exdate.getDate() + exdays);
            value = encodeURI(value) + ((exdays == null) ? '' : '; expires=' + exdate.toUTCString());
            document.cookie = name + '=' + value + '; path=/;';
        },

        getCookie: function (name) {
            var i, x, y, ARRcookies = document.cookie.split(';');
            for (i = 0; i < ARRcookies.length; i++) {
                x = ARRcookies[i].substr(0, ARRcookies[i].indexOf('='));
                y = ARRcookies[i].substr(ARRcookies[i].indexOf('=') + 1);
                x = x.replace(/^\s+|\s+$/g, '');
                if (x == name) {
                    return decodeURI(y);
                }
            }
            return null;
        }
    };

    $.smartbanner = function (option) {
        var $window = $(window);
        var data = $window.data('smartbanner');
        var options = typeof option == 'object' && option;
        if (!data) {
            $window.data('smartbanner', (data = new SmartBanner(options)));
        }
        if (typeof option == 'string') {
            data[option]();
        }
    };

    $.smartbanner.defaults = {
        message: 'Uygulamayı kullan, hızlı ve kolay bağış yap.', 
        appStoreLanguage: 'tr',
        icon: 'https://www.ihh.org.tr/public/banner.png', 
        button: 'Uygulamaya Git',
        googleplayID: 'org.ihh.mobilbagis',
        itunesID: 1362619641,
        daysHidden: 15, 
        appendToSelector: 'body' 
    };

    $.smartbanner.Constructor = SmartBanner;

});