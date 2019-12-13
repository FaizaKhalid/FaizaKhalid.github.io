/*!
 * jquery.lightbox.js
 * https://github.com/duncanmcdougall/Responsive-Lightbox
 * Copyright 2013 Duncan McDougall and other contributors; @license Creative Commons Attribution 2.5
 *
 * Options: 
 * margin - int - default 50. Minimum margin around the image
 * nav - bool - default true. enable navigation
 * blur - bool - default true. Blur other content when open using css filter
 * minSize - int - default 0. Min window width or height to open lightbox. Below threshold will open image in a new tab.
 *
 */
(function ($) {

    'use strict';

    $.fn.lightbox = function (options) {

        var opts = {
            margin: 50,
            nav: true,
            blur: false,
            minSize: 0
        };

        var plugin = {

            items: [],
            lightbox: null,
            image: null,
            current: null,
            locked: true,
            caption: null,

            init: function (items) {
                plugin.items = items;
                plugin.selector = "lightbox-" + Math.random().toString().replace('.', '');

                if (!plugin.lightbox) {
                    $('body').append(
                      '<div id="' + plugin.selector + '" class="lightboxmain" style="display:none;">' +
                      '<a href="#" class="lightbox-close lightbox-button"></a>' +
                      '<a href="#" class="lightbox-zoom lightbox-button"></a>' +
                      '<div class="lightbox-nav">' +
                      '<a href="#" class="lightbox-previous lightbox-button"></a>' +
                      '<a href="#" class="lightbox-next lightbox-button"></a>' +
                      '</div>' +
                      '<div href="#" class="lightbox-caption"><p></p></div>' +
                      '</div>'
                    );

                    plugin.lightbox = $("#" + plugin.selector);
                    plugin.caption = $('.lightbox-caption', plugin.lightbox);
                }

                if (plugin.items.length > 1 && opts.nav) {
                    $('.lightbox-nav', plugin.lightbox).show();
                } else {
                    $('.lightbox-nav', plugin.lightbox).hide();
                }

                plugin.bindEvents();

            },

            loadImage: function () {
                if (opts.blur) {
                    $("body").addClass("blurred");
                }
                $("img", plugin.lightbox).remove();
                plugin.lightbox.fadeIn('fast').append('<span class="lightbox-loading"></span>');

                var img = $('<img src="' + $(plugin.current).attr('href') + '" draggable="false">');
                $(img).on('load', function () {
                    $('.lightbox-loading').remove();
                    plugin.lightbox.append(img);
                    plugin.image = $("img", plugin.lightbox).hide();
                    plugin.resizeImage();
                    plugin.setCaption();
                });
            },

            setCaption: function () {
                var caption = $(plugin.current).data('caption');
                if (!!caption && caption.length > 0) {
                    plugin.caption.fadeIn();
                    $('p', plugin.caption).text(caption);
                } else {
                    plugin.caption.hide();
                }
            },

            resizeImage: function () {
                if (plugin && plugin.image) {
                    if ($(plugin.lightbox).prop("zoomed") == undefined) {
                        var ratio, wHeight, wWidth, iHeight, iWidth;
                        wHeight = $(window).height() - opts.margin;
                        wWidth = $(window).outerWidth(true) - opts.margin;
                        plugin.image.width('').height('');
                        iHeight = plugin.image.height();
                        iWidth = plugin.image.width();
                        if (iWidth > wWidth) {
                            ratio = wWidth / iWidth;
                            iWidth = wWidth;
                            iHeight = Math.round(iHeight * ratio);
                        }
                        if (iHeight > wHeight) {
                            ratio = wHeight / iHeight;
                            iHeight = wHeight;
                            iWidth = Math.round(iWidth * ratio);
                        }

                        plugin.image.width(iWidth).height(iHeight).css({
                            'top': ($(window).height() - plugin.image.outerHeight()) / 2 + 'px',
                            'left': ($(window).width() - plugin.image.outerWidth()) / 2 + 'px'
                        }).show();
                    } else {
                        plugin.reposImage();
                    }
                    plugin.locked = false;
                }
            },

            reposImage: function () {
                if (plugin && plugin.image) {
                    plugin.image.width('').height('');
                    var iPosX = ($(window).width()  - plugin.image.outerWidth()) / 2;
                    var iPosY = ($(window).height() - plugin.image.outerHeight()) / 2;
                    plugin.image.css({
                        'left': (iPosX > 0 ? iPosX : 0) + 'px',
                        'top':  (iPosY > 0 ? iPosY : 0) + 'px'
                    }).show();
                }
            },

            getCurrentIndex: function () {
                return $.inArray(plugin.current, plugin.items);
            },

            next: function () {
                if (plugin.locked) {
                    return false;
                }
                plugin.locked = true;

                if (plugin.getCurrentIndex() >= plugin.items.length - 1) {
                    $(plugin.items[0]).click();
                } else {
                    $(plugin.items[plugin.getCurrentIndex() + 1]).click();
                }
            },

            previous: function () {
                if (plugin.locked) {
                    return false;
                }
                plugin.locked = true;

                if (plugin.getCurrentIndex() <= 0) {
                    $(plugin.items[plugin.items.length - 1]).click();
                } else {
                    $(plugin.items[plugin.getCurrentIndex() - 1]).click();
                }
            },

            keyDownEvent: function (e) {
                // Close lightbox with ESC
                if (e.keyCode === 27) {
                    plugin.close();
                }
                // Go to next image pressing the right key
                if (e.keyCode === 39) {
                    plugin.next();
                }
                // Go to previous image pressing the left key
                if (e.keyCode === 37) {
                    plugin.previous();
                }
            },

            bindEvents: function () {
                $(plugin.items).click(function (e) {
                    if (!$("#" + plugin.selector).is(":visible") && ($(window).width() < opts.minSize || $(window).height() < opts.minSize)) {
                        $(this).attr("target", "_blank");
                        return;
                    }
                    var self = $(this)[0];
                    e.preventDefault();
                    plugin.current = self;
                    plugin.loadImage();

                    // Bind Keyboard Shortcuts
                    $(document).on('keydown', plugin.keyDownEvent);
                });

                // Add click state on overlay background only
                plugin.lightbox.on('click', function (e) {
                    if (this === e.target) {
                        plugin.close();
                    } else {
                        plugin.next();
                        return false;
                    }
                });

                // Previous click
                $(plugin.lightbox).on('click', '.lightbox-previous', function () {
                    plugin.previous();
                    return false;
                });

                // Next click
                $(plugin.lightbox).on('click', '.lightbox-next', function () {
                    plugin.next();
                    return false;
                });

                // Close click
                $(plugin.lightbox).on('click', '.lightbox-close', function () {
                    plugin.close();
                    return false;
                });

                // Zoom click
                $(plugin.lightbox).on('click', '.lightbox-zoom', function () {
                    if ($(plugin.lightbox).prop("zoomed") == undefined) {
                        $(plugin.lightbox).prop("zoomed", "");
                    } else {
                        $(plugin.lightbox).removeProp("zoomed")
                    }
                    plugin.resizeImage();
                    return false;
                });

                $(window).resize(function () {
                    if (!plugin.image) {
                        return;
                    }
                    plugin.resizeImage();
                });
            },

            close: function () {
                $(document).unbind('keydown', plugin.keyDownEvent); // Sadece kendi event function ı unbind edildi
                $(plugin.lightbox).fadeOut('fast');
                $('body').removeClass('blurred');
            }
        };

        $.extend(opts, options);

        plugin.init(this);
    };

})(jQuery);