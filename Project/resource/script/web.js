'use strict';

var isAjax = false;
var $timeout;
var $rtl;

document.addEventListener("DOMContentLoaded", function (event) {
    fn_charsize();
});

$(document).ready(function () {
    $rtl = $("body").attr("dir") === "rtl";

    $(".image-picker").imagepicker({
        show_label: true,
        selected: function () {
            fn_popup_pdfcontent($(".image-picker").attr("data-popup"));
        }
    });

    $(document).keydown(function (e) {
        var $keycode = e.which || e.keyCode || e.keyChar;
        var $src = $(e.target || e.originalEvent.srcElement);
        var $frm = $("form").last();

        var $enter = 13;
        if ($keycode === $enter && $("#warn").css("display") === "block") {
            $("#warn").hide("fast");
            return false;
        }

        var $esc = 27;
        if ($keycode === $esc) {
            if ($("#lightbox:visible").length === 0) {
                if ($("#warn").css("display") === "block") {
                    $("#warn").hide("fast");
                } else if ($("div[data-pop-div]").length > 0) {
                    $("div[data-pop-div]").last().remove();
                }
            }
        }

    });

    $(document).ajaxStart(function () {
        isAjax = true;
        $timeout = setTimeout(function () {
            $("#spinwait").fadeIn();
        }, 250);
    });

    $(document).ajaxStop(function () {
        isAjax = false;
        clearTimeout($timeout);
        $("#spinwait").fadeOut();
    });

    $(document).on("click", "#warn input, #warn-lock", function () {
        $("#warn").hide("fast");
    });

    $(document).on("click", "[data-popup]", function () {
        fn_popup($(this).attr("data-popup") || $(this).attr("data-popup"));
        return false;
    });

    $(document).on("click", "[data-blank]", function () {
        if (!fn_wait()) return false;

        var n = $(this).attr("data-blank") || $(this).attr("href");
        window.open(n, "_blank");
        return false;
    });

    $(document).on("click", "[data-close], div[data-pop-close], div[data-pop-lock]", function () {
        $(this).closest("div[data-pop-div]").remove();
    });

    $(document).on("click", "[data-url]", function () {
        fn_redirect($(this).attr("data-url"));
    });

    // ----

    $(document).on("click", "#go:button", function () {
        $(this).closest("form").submit();
        return false;
    });

    $(document).on("click", "[data-ajaxnow]:not(select)", function () {
        if (!fn_wait()) return false;

        var $frm = $(this).closest("form");
        var $ajx = $(this);
        if ($ajx.attr("data-ajaxnow-confirm")) {
            if (!confirm($ajx.attr("data-ajaxnow-confirm"))) return false;
        }

        $.ajax({
            type: "POST",
            url: $ajx.attr("data-ajaxnow-action") == null ? ($frm.length === 0 ? window.location : $frm.attr("action")) : $ajx.attr("data-ajaxnow-action"),
            data: $ajx.attr("data-ajaxnow") == "" && $frm.length > 0 ? $frm.serialize() : $ajx.attr("data-ajaxnow"),
            dataType: "json",
            error: function (xhr, textStatus, errorThrown) {
                fn_xhr_error(xhr, textStatus, errorThrown);
            },
            success: function (respond) {
                fn_parse(respond);
            }
        });

        return false;
    });

    $(document).on("change", "select[data-ajaxnow]", function () {
        if (!fn_wait()) return false;

        $.ajax({
            type: "POST",
            data: $(this).attr("data-ajaxnow") + "&id=" + $(this).val(),
            dataType: "json",
            error: function (xhr, textStatus, errorThrown) {
                fn_xhr_error(xhr, textStatus, errorThrown);
            },
            success: function (respond) {
                fn_parse(respond);
            }
        });
    });

    $(document).on("change", "select[data-action]", function () {
        if (!fn_wait()) return false;

        var callback = $(this).attr("data-action-after");

        $.ajax({
            type: "POST",
            data: "action=" + $(this).attr("data-action") + "&id=" + $(this).val(),
            dataType: "json",
            error: function (xhr, textStatus, errorThrown) {
                fn_xhr_error(xhr, textStatus, errorThrown);
            },
            success: function (respond) {
                fn_parse(respond);
                if (callback) window[callback]();
            }
        });
    });

    // ----

    $(document).on("focus", ":text[data-complete]", function () {
        if ($(this).attr("data-handler") == null && $.fn.autocomplete != null) {
            var $complete = $(this).attr("data-complete");
            $(this).attr("data-handler", "");
            $(this).autocomplete({
                source: "?complete=" + $complete,
                minLength: 2,
                select: function (event, ui) {
                    if (ui.item) {
                        var $frm = $(this).closest('form');
                        var $div = $(this).closest('div');
                        var $input = $("input[type=text]", $div);

                        $("input[type=hidden]", $div).val(ui.item.key).trigger("change");
                        $input.attr("readonly", "readonly");
                        $(".css-complete", $div).css("display", "block");

                        if ($("#go", $frm).length > 0) {
                            $("#go", $frm).removeAttr('disabled');
                            $frm.attr("data-formchange", "");
                        }

                        if ($input.attr("data-complete-after") !== undefined) {
                            $.ajax({
                                type: "POST",
                                data: "action=" + $input.attr("data-complete-after") + "&id=" + ui.item.key + "&" + $("[data-ajax-include]", $frm).serialize(),
                                dataType: "json",
                                success: function (respond) {
                                    fn_parse(respond, $frm);
                                }
                            });
                        }
                    }
                },
                change: function (event, ui) {
                    if ($(this).attr("name") === undefined) $(this).val(ui.item ? ui.item.value : "");
                }
            });
        }
    });

    $(document).on("click", "a.css-complete", function () {
        var $frm = $(this).closest('form');
        var $div = $(this).closest('div');
        var $input = $("input[type=text]", $div);

        $("input[type=hidden]", $div).val("").trigger("change");
        $input.val("").removeAttr("readonly");
        $(".css-complete", $div).hide();

        if ($("#go", $frm).length > 0) {
            $("#go", $frm).removeAttr('disabled');
            $frm.attr("data-formchange", "");
        }

        if ($input.attr("data-complete-clear") !== undefined) {
            var $select = $("[name='" + $input.attr("data-complete-clear") + "']", $frm);
            if ($select.attr["data-action"] != null) {
                $select.trigger("change");
            } else {
                $select.find('option').remove().end();
            }
        }
    });


    // ----

    $(document).on("click", ".uploader-button > button[type=button]", function () {
        if (!fn_wait()) return false;
        $(this).next().trigger("click");
    });

    $(document).on("change", ":text[data-iban]", function () {
        $(this).val($(this).val() == "" ? "" : $(this).val().replace(/\s/g, "").match(/.{1,4}/g).join(" "));
    });

    $(document).on("change", "[data-ranger]", function () {
        if ($(this).val() === "between") {
            $(this).next().show();
        } else {
            $(this).next().hide();
            $(this).next().val("");
        }
    });

    $(document).on("focus", "[data-relation-focus] input", function () {
        var $focus = $(".css-onfocusdiv", $(this).closest("[data-relation-focus]"));
        if ($focus.css("display") === "block") return;
        if ($('div[data-relation-focus] .css-onfocusdiv').is(":visible")) {
            $('div[data-relation-focus] .css-onfocusdiv').slideUp("fast");
        }
        $focus.slideDown("fast");

        $(".script-group-select input[type=radio]", $focus).prop("checked", false).removeAttr("checked");
        $(".script-corporate-select input[type=radio]", $focus).prop("checked", false).removeAttr("checked");
    });

    $(document).on("click", ".script-group-select input[type=radio]", function () {
        var $input = $("[name=group_new]", $(this).closest(".css-onfocusdiv-parent"));

        $input.next().val($(this).val());
        $input.val($(this).next().html()).removeAttr("data-handler");
    });

    $(document).on("click", ".script-corporate-select input[type=radio]", function () {
        var $input = $("[name=corporate]", $(this).closest(".css-onfocusdiv-parent"));
        $input.val($(this).next().html());
    });

    $(document).on("change", ":text[data-double]", function () {
        $(this).val($(this).val() == "" ? "" : parseFloat($(this).val().replace(/[^0-9-$,]/g, '').replace(",", ".")).toFixed(2).replace(".", ",").replace(/(\d)(?=(\d{3})+\,)/g, "$1.").toString());
    });

    $(document).on("keyup", "[data-numeric]", function () {
        this.value = this.value.replace(/[^0-9$,]/g, '');
    });

    $(document).on("keypress", "[data-numeric]", function (e) {
        var keycode = e.which || e.keyCode || e.keyChar;
        if (e.ctrlKey) {
            if (keycode === 65) return;
        } else {
            if (keycode === 46 || keycode === 8 || keycode === 9 || keycode === 27 || keycode === 13) return;
        }
        if (String.fromCharCode(keycode).match(/[^0-9$,]/g)) return false;
    });

    $(document).on("change", "[data-numeric]", function () {
        this.value = this.value.replace(/[^0-9$,]/g, '');
    });

    $(document).on("focus", "[data-picker]", function () {
        if (!$(this).attr("data-handler")) {
            $(this).attr("data-handler", "")
                .mask('99.99.9999')
                .datepicker({
                    dateFormat: "dd.mm.yy",
                    showOtherMonths: true,
                    selectOtherMonths: true,
                    changeMonth: true,
                    changeYear: true
                });
        }
    });

    $(document).on("focus", "[data-timer]", function () {
        if (!$(this).attr("data-handler")) {
            $(this).attr("data-handler", "").mask('99:99');
        }
    });

    $(document).on("focus", "[data-year]", function () {
        if (!$(this).attr("data-handler")) {
            $(this).attr("data-handler", "").mask('9999');
        }
    });

    $(document).on("focus", "[data-identity]", function () {
        if (!$(this).attr("data-handler")) {
            var l = $(this).attr("data-identity");
            var m = '';
            for (var i = 0; i < l; i++) m += '9';
            if (m === '') {
                $(this).attr("data-handler", "");
            } else {
                $(this).attr("data-handler", "").mask(m);
            }
        }
    });

    $(document).on("focus", "[data-phone]", function () {
        if (!$(this).attr("data-handler")) {
            $(this).attr("data-handler", "").mask('599 999 99 99', { 'translation': { 5: { pattern: /[5]/ } } });
        }
    });

    $(document).on("focus", "[data-phone-code]", function () {
        if (!$(this).attr("data-handler")) {
            $(this).attr("data-handler", "").mask('999');
        }
    });

    $(document).on("focus", "[data-phone-short]", function () {
        if (!$(this).attr("data-handler")) {
            $(this).attr("data-handler", "").mask('999 99 99');
        }
    });

    $(document).on("click", ".css-clipboard", function () {
        $(this).selectText();
        document.execCommand('copy');
        $(this).selectTextClear();
        $(".css-clipboard-complete").fadeIn(200).delay(500).fadeOut(100);
    });

    if ($.fn.ajaxForm && $.fn.validate) {
        $("#form").ajaxForm(window.location);
    }

    fn_loop_build();
    fn_tooltip();

    $("[data-lightbox]").each(function () {
        if (!$(this).attr("data-handler")) {
            $(this).attr("data-handler", "");
            $(".lightbox", $(this)).lightbox();
        }
    });

    fn_creditcard();

    // ----

    if ($.fn.hoverIntent) {
        $("#nav > ul > li").hoverIntent(function () {
            if (screen.width <= 1024 && $("#responsive").length > 0) {
                return;
            }
            var $d = $("> div", this);
            $("div[data-nav-box]:first", $d).show();
            $d.animate({ height: "toggle" }, 250);
        }, function () {
            if (screen.width <= 1024 && $("#responsive").length > 0) {
                return;
            }
            $("> div", this).hide();
            $("div[data-nav-box]", this).hide();
            $("div[data-nav-box]:first", this).show();
        });

        $("#header-user").hoverIntent(function () {
            $("> div", this).animate({ height: "toggle" }, 250);
        }, function () {
            $("> div", this).hide();
        });

        $("#header-donate").hoverIntent(function () {
            $("> div", this).animate({ height: "toggle" }, 250);
        }, function () {
            $("> div", this).hide();
            });

        $("#header-search").hoverIntent(function () {
            if ($("> form", this).is(':hidden')) $("> form", this).animate({ height: "toggle" }, 250);
        }, function () {
            
        });
    }

    $("#nav li").hover(function (e) {
        if (screen.width <= 1024 && $("#responsive").length > 0) {
            return;
        }

        var $item = $("#" + $(this).attr("id") + "-box");
        if ($item.length === 1) {
            $("#nav div[data-nav-box]").hide();
            $item.show();
        } else {
            $("#nav div[data-nav-box]").hide();
            $("#nav div[data-nav-box]:first").show();
        }
    });

    $("#hamburger").click(function () {
        if ($(this).hasClass("css-selected")) {
            $(this).removeClass("css-selected");
            $("#nav").animate({ width: "toggle" }, "fast");
        } else {
            $(this).addClass("css-selected");
            $("#nav").animate({ width: "toggle" }, "fast");
        }
    });

    $(document).click(function (event) {
        if (!$(event.target).closest('#header-search').length) {
            if ($('#header-search form').is(":visible")) {
                $('#header-search form').fadeOut();
            }
        }

        if ($("div[data-relation-focus]").length !== 0) {
            if (!$(event.target).closest('[data-relation-focus], .ui-autocomplete').length) {
                if ($('div[data-relation-focus] .css-onfocusdiv').is(":visible")) {
                    $('div[data-relation-focus] .css-onfocusdiv').slideUp("fast");
                }
            }
        }
    });

    $("ul[data-faq] > li > a").click(function () {
        var $s = $("ul[data-faq] > li > a.css-selected");
        if ($(this).parent().index() !== $s.parent().index()) $s.next().slideToggle(200).end().toggleClass('css-selected');
        $s = $(this);
        $s.next().slideToggle(200).end().toggleClass('css-selected');

        setTimeout(function () {
            var $i = $s.parent().offset().top - $(window).scrollTop();
            if ($i < 0) {
                $('html,body').animate({
                    scrollTop: $s.parent().offset().top
                }, 700);
            }
        }, 250);

        return false;
    });

    $("[data-player]").click(function () {
        var h = $(this).width() / 16 * 9;
        if ($(this).parent().height() < h) $(this).parent().animate({ height: h }, 200);
        $(this).html($(this).attr("data-player"));
    });

    $(window).on('scroll', function () {
        if ($(window).scrollTop() > 100) {
            $('#back-to-top').addClass("css-selected");
        } else {
            $('#back-to-top').removeClass("css-selected");
        }
    });

    $('#back-to-top').on('click', function (e) {
        e.preventDefault();
        $('html,body').animate({
            scrollTop: 0
        }, 700);
    });

    if ($("#breaking").length === 1) {
        var $breaking = $("#breaking");
        var $breaking_a;
        $("a", $breaking).first().attr("class", $breaking.attr("data-show"));

        window.setInterval(function () {
            $breaking = $('#breaking');
            $breaking_a = $('#breaking a:visible');
            $breaking_a.attr("class", $breaking.attr("data-hide"));
            if ($breaking_a.next().length === 0) {
                $breaking_a.parent().children().first().attr("class", $breaking.attr("data-show"));
            } else {
                $breaking_a.next().attr("class", $breaking.attr("data-show"));
            }
        }, 5000);
    }

    $(".css-button-donate-popup").click(function () {
        var url = $(this).attr("href");
        $.ajax({
            type: "GET",
            url: url,
            dataType: "html",
            error: function (xhr, textStatus, errorThrown) {
                fn_xhr_error(xhr, textStatus, errorThrown);
            },
            success: function (respond) {
                fn_popup_content(url, respond);
            }
        });

        return false;
    });

    $(document).on("click", ".css-filter-button", function () {
        $(this).toggleClass('css-filter-button-open');
        $("#block-left").fadeToggle(100);
    });

    if ($(".css-main-fixheight").length > 0) {
        var $max;
        $('.css-main-fixheight').each(function () {
            $max = 0;
            $('> article', $(this)).each(function () {
                if ($max < $(this).height()) $max = $(this).height();
            });

            $('> article', $(this)).each(function () {
                $(this).height($max);
            });
        });
    }
});

jQuery.fn.ajaxForm = function (action) {
    var $frm = $(this);
    if ($frm.attr("action") === "") $frm.attr("action", action);

    $frm.validate({
        focusInvalid: false,
        errorPlacement: function (error, element) {
            
        },
        invalidHandler: function (event, validator) {
            if (validator.numberOfInvalids() > 0) {
                var warn = "";
                var $first = null;
                $.each(validator.invalidElements(), function () {
                    if (!$first) $first = $(this);
                    var $td = $(this).closest('tr').find('td:first');
                    if ($td.length === 0) {
                        var $header = $(this).attr("data-complete") !== undefined ? $(this).closest('div').parent().find('header') : $(this).closest('div').find('header');
                        if ($header.length === 0) {
                            if ($(this).attr("data-label") == "") {
                                warn += "- " + $(this).attr("name") + "<br />";
                            } else {
                                warn += "- " + $(this).attr("data-label") + "<br />";
                            }
                        } else {
                            warn += "- " + $header.text() + "<br />";
                        }
                    } else {
                        warn += "- " + $td.text() + "<br />";
                    }
                });

                fn_warn(lang.valid, warn);
            }
        },
        submitHandler: function (form) {
            $frm = $(form);

            if ($("[data-delete]", $frm).prop("checked")) {
                if (!confirm(lang.deleting)) {
                    return false;
                }
            }

            if ($("#success").is(":visible")) {
                $("#success").hide("fast");
            }

            $.ajax({
                type: "POST",
                url: $frm.attr("action"),
                data: $frm.serialize(),
                dataType: "json",
                error: function (xhr, textStatus, errorThrown) {
                    fn_xhr_error(xhr, textStatus, errorThrown);
                },
                success: function (respond) {
                    fn_parse(respond);
                }
            });
        }
    });
};

jQuery.fn.selectText = function () {
    var doc = document;
    var range;
    var element = this[0];
    if (doc.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(element);
        range.select();
    } else if (window.getSelection) {
        var selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }
};

jQuery.fn.selectTextClear = function () {
    var sel = window.getSelection ? window.getSelection() : document.selection;
    if (sel) {
        if (sel.removeAllRanges) {
            sel.removeAllRanges();
        } else if (sel.empty) {
            sel.empty();
        }
    }
};

function fn_xhr_error(xhr, textStatus, errorThrown) {
    switch (xhr.status) {
        case 404:
            $.ajax({
                type: "POST",
                data: "action=jscript&msg=" + xhr.status + " " + textStatus + "&error=" + errorThrown + "&location=" + encodeURIComponent(window.location),
                dataType: "json"
            });

            document.body.innerHTML = xhr.responseText;
            break;

        case 500:
            document.body.innerHTML = xhr.responseText;
            break;

        case 0:
            break;

        default:
            $.ajax({
                type: "POST",
                data: "action=jscript&msg=" + xhr.status + " " + textStatus + "&error=" + errorThrown + "&location=" + encodeURIComponent(window.location),
                dataType: "json"
            });

            document.body.innerHTML = xhr.responseText;
            break;
    }
}

function fn_loop_build() {
    $(".css-textrotator").each(function () {
        if (!$(this).attr("data-handler")) {
            $(this).attr("data-handler", "");
            fn_loop($(this));
        }
    });
}

function fn_loop($parent) {
    $("span:first-child", $parent).delay(1750).animate({
        marginTop: "-=18px"
    }, 250, 'linear', function () {
        $(this).css("marginTop", "0");
        $parent.append($(this));
        fn_loop($parent);
    });
}

function fn_creditcard() {
    if ($("[data-creditcard]").length === 0) return;

    $('#card_a').keyup(function (e) {
        $(".css-visacard").hide();
        $(".css-mastercard").hide();
        $(".css-amexcard").hide();
        $(".css-troycard").hide();
        $(".css-ccv-tip").hide();
        $(".css-ccv-amex").hide();

        var $amex = false;
        if (this.value.substr(0, 1) === "4") {
            $(".css-visacard").show();
        } else if (this.value.substr(0, 1) === "5" || this.value.substr(0, 1) === "6") {
            $(".css-mastercard").show();
        } else if (this.value.substr(0, 2) === "37") {
            $amex = true;
            $(".css-amexcard").show();
        } else if (this.value.substr(0, 2) === "97") {
            $(".css-troycard").show();
        }

        if ($amex) {
            $(".css-ccv-amex").show();
            $("#card_b").attr("minlength", 6).attr("maxlength", 6).css("width", "7ch");
            $("#card_c").attr("minlength", 5).attr("maxlength", 5).css("width", "6ch");
            $("#card_d").hide().removeClass("required");
            $("#card_d_span").hide();
            $('#card_b_span').width("80px");
            $('#card_c_span').width("75px");
            $('#card_b_span .css-checkout-mask').html("••••••");
            $('#card_c_span .css-checkout-mask').html("•••••");
            $(".css-checkout-cid").show();
            $("#cvv").attr("minlength", 4).attr("maxlength", 4).css("width", "5ch");
        } else {
            $(".css-ccv-tip").show();
            $("#card_b").attr("minlength", 4).attr("maxlength", 4).css("width", "5ch");
            $("#card_c").attr("minlength", 4).attr("maxlength", 4).css("width", "5ch");
            if (!$("#card_d").show().hasClass("required")) $("#card_d").addClass("required");
            $("#card_d_span").show();
            $('#card_b_span').width("55px");
            $('#card_c_span').width("55px");
            $('#card_b_span .css-checkout-mask').html("••••");
            $('#card_c_span .css-checkout-mask').html("••••");
            $(".css-checkout-cid").hide();
            $("#cvv").attr("minlength", 3).attr("maxlength", 3).css("width", "4ch");
        }

        if ($("#card_a").val() == "") {
            $('#card_a_span span').first().html("");
            $('#card_a_span .css-checkout-mask').show();
        } else {
            $('#card_a_span span').first().html($("#card_a").val());
            $('#card_a_span .css-checkout-mask').hide();
        }
        
        if (this.value.length == 4) $('#card_b').focus().select();
    });

    $('#card_b').keyup(function (e) {

        if ($("#card_b").val() == "") {
            $('#card_b_span span').first().html("");
            $('#card_b_span .css-checkout-mask').show();
        } else {
            $('#card_b_span span').first().html($("#card_b").val());
            $('#card_b_span .css-checkout-mask').hide();
        }

        if (this.value.length == $(this).attr("minlength")) {
            $('#card_c').focus().select();
        }
    });

    $('#card_c').keyup(function (e) {
        if ($("#card_c").val() == "") {
            $('#card_c_span span').first().html("");
            $('#card_c_span .css-checkout-mask').show();
        } else {
            $('#card_c_span span').first().html($("#card_c").val());
            $('#card_c_span .css-checkout-mask').hide();
        }

        if (this.value.length == $(this).attr("minlength")) {
            if ($('#card_d').is(":visible")) {
                $('#card_d').focus().select();
            } else {
                $('#month').focus().select();
            }
        }
    });

    $('#card_d').keyup(function (e) {
        if ($("#card_d").val() == "") {
            $('#card_d_span span').first().html("");
            $('#card_d_span .css-checkout-mask').show();
        } else {
            $('#card_d_span span').first().html($("#card_d").val());
            $('#card_d_span .css-checkout-mask').hide();
        }

        if (this.value.length == 4) {
            $('#month').focus().select();
        }
    });

    $('#month').change(function (e) {
        if ($("#month").val() == "") {
            $('#month_span span').first().html("");
            $('#month_span .css-checkout-mask').show();
        } else {
            $('#month_span span').first().html($("#month").val().length == 1 ? "0" + $("#month").val() : $("#month").val());
            $('#month_span .css-checkout-mask').hide();
        }
    });

    $('#year').change(function (e) {
        if ($("#year").val() == "") {
            $('#year_span span').first().html("");
            $('#year_span .css-checkout-mask').show();
        } else {
            $('#year_span span').first().html($("#year").val().substr(2, 2));
            $('#year_span .css-checkout-mask').hide();
        }
    });

    $('#cvv').keyup(function (e) {
        if ($("#cvv").val() == "") {
            $('#cid_span span').first().html("");
            $('#cid_span .css-checkout-mask').show();
            $('#cvv_span span').first().html("");
            $('#cvv_span .css-checkout-mask').show();
        } else {
            $('#cid_span span').first().html($("#cvv").val());
            $('#cid_span .css-checkout-mask').hide();
            $('#cvv_span span').first().html($("#cvv").val());
            $('#cvv_span .css-checkout-mask').hide();
        }

        if (this.value.length == 3) {
            $('#cvv').focusout();
            $('#numpad').hide();
        }
    });

    $("#day").change(function () {
        if ($("#day").val() === "") return;
        if ($("#day").val() > 28) {
            $("#day").val(28);
        }
    });

    $("#recurring").change(function () {
        if ($("#recurring").val() === "") return;
        if ($("#recurring").val() > 24) {
            $("#recurring").val(24);
        }
    });

    $("#creditcard input[type=text]").focus(function () {
        var $i = $(this).offset();
        $("#numpad").show().css({ "left": $i.left, "top": $i.top + 30 }).attr("data-focus", $(this).attr("id"));
    });

    $('#cvv').on('focus', function () {
        if ($('#card_a').val().substr(0, 2) !== "37") $('.css-checkout-card').addClass('hover');
    });

    $(document).click(function (event) {
        if (!$(event.target).closest('#numpad, .css-numbers, .css-ccv').length) {
            if ($('#numpad').is(":visible")) {
                $('#numpad').hide();
            }
        }

        if (!$(event.target).closest('#numpad, #cvv').length) {
            $('.css-checkout-card').removeClass('hover');
        }

    });

    $("#numpad div").click(function () {
        var $input = $("#" + $(this).parent().attr("data-focus"));
        var $k = $(this).html();
        if ($k == "C") {
            $input.val("");
        } else {
            var $m = $input.attr("maxlength");
            if ($m == $input.val().length) $input.val("");
            $input.val($input.val() + $k);
            $input.trigger("keyup");
        }
    });
}

function fn_charsize() {
    $("input[size]").each(function () {
        $(this).css("width", (parseInt($(this).attr("size")) + 1) + "ch");
    });

    $("textarea[cols]").each(function () {
        $(this).css("width", (parseInt($(this).attr("cols")) + 1) + "ch");
    });
}

function fn_redirect($url) {
    if ($url.indexOf("http") !== 0 && $url.indexOf("#") !== 0 && $url.indexOf("ihh://") < 0) {
        if ($url.indexOf("/") !== 0) $url = "/" + $url;
        $url = location.protocol + "//" + location.host + $url;
    }
    window.location = $url;
}

function fn_parse(respond) {
    if (!respond || !respond.action) {
        fn_warn(lang.servercontact, lang.serverrespond);
        return;
    }
    else if (respond.action === "html") {
        $.each(respond.data, function (i, field) {
            if ($("#" + field.key).length === 0) throw lang.targethtml + " " + field.key;
            $("#" + field.key).html(field.value.replace(/%0A/g, "\n"));
        });
    }
    else if (respond.action === "fill") {
        var $select;
        $.each(respond.data, function (i, field) {
            $select = $("[name='" + field.key + "']", $frm);
            if ($select.length === 0) {
                throw lang.targetcombo + " " + field.key;
            } else {
                if (typeof field.value === "string") {
                    if ($select.find('option').length === 0) {
                        if ($select.attr("type") === "hidden") {
                            var $input = $select.prev();
                            if ($input != null && $input.attr("data-complete") != null) {
                                $select.next().trigger("click");
                            } else {
                                $select.val(field.value.replace(/%0A/g, "\n")).trigger("change");
                            }
                        } else if ($select.attr("type") === "radio" || $select.attr("type") === "checkbox") {
                            $select.each(function () {
                                if ($(this).val() == field.value) {
                                    $(this).attr("checked", "checked").prop("checked", true);
                                } else {
                                    $(this).removeAttr("checked").prop("checked", false);
                                }
                            });
                        } else {
                            $select.val(field.value.replace(/%0A/g, "\n"));
                        }
                    } else {
                        $select.val(field.value.replace(/%0A/g, "\n"));
                    }
                } else {
                    if ($select.attr("type") === "hidden") {
                        var $input = $select.prev();
                        if ($input != null && $input.attr("data-complete") != null) {
                            $input.val(field.value[0].value);
                            $input.attr("readonly", "readonly");
                            $select.val(field.value[0].key);
                            $select.next().css("display", "block");
                        } else {
                            $select.val(field.value[0].value);
                        }
                    } else if ($select.attr("type") === "text") {
                        $select.val(field.value[0].value);
                    } else {
                        var exist = $select.val();
                        $select.find('option').remove().end();
                        $.each(field.value, function (i, subfield) {
                            $select.append('<option value="' + subfield.key + '">' + subfield.value + '</option>');
                        });

                        if ($select.find('option').length === 1) {
                            $($select.find('option')[0]).attr("selected", "selected");
                        } else if ($select.find('option[value="' + exist + '"]').length === 1) {
                            $select.val(exist);
                            $select.find('option[value="' + exist + '"]').attr('selected', '');
                        }
                    }
                }
            }
        });
    }
    else if (respond.action === "redirectlocation") {
        window.location = respond.data;
    }
    else if (respond.action === "redirect") {
        fn_redirect(respond.data);
    }
    else if (respond.action === "reload" || respond.action === "refresh") {
        window.location.reload();
    }
    else if (respond.action === "deleted") {
        fn_redirect(respond.data);
    }
    /*else if (respond.action == "refresh") {
        $.ajax({
            type: "GET",
            url: window.location,
            dataType: "html",
            error: function (xhr, textStatus, errorThrown) {
                fn_xhr_error(xhr, textStatus, errorThrown);
            },
            success: function (respond) {
                var s = $("body").scrollTop();
                $("body").html(respond);
                $("body").scrollTop(s);

                fn_charsize();
            }
        });
    }*/
    else if (respond.action === "createform") {
        $("<div class='css-lock'></div>").appendTo('body');
        $("<div class='css-lockwait'>" + lang.createform + "</div>").appendTo('body');

        $(respond.data).appendTo('body').submit();
    }
    else if (respond.action === "crash") {
        fn_redirect("/error");
    }
    else if (respond.action === "transaction") {
        alert(lang.transaction);
        window.location.reload();
    }
    else if (respond.action === "alert") {
        fn_warn(lang.info, decodeURIComponent(respond.data.replace(/\+/g, '%20')).replace(/%0A/g, "\n"));
    }
    else if (respond.action === "nationality") {
        var $frm = $("form").last();
        var l, m;
        var $select;
        $.each(respond.data, function (i, field) {
            $select = $("[name='" + field.key + "']", $frm);
            if ($select.prop("tagName") === "DIV") {
                $select.html(field.value);
            } else {
                l = field.value;
                if (l == 0) {
                    $select.attr("data-handler", "").unmask();
                } else {
                    m = '';
                    for (var j = 0; j < l; j++) m += '9';
                    if (m == '') {
                        $select.attr("data-handler", "").unmask();
                    } else {
                        $select.attr("data-handler", "").unmask().mask(m);
                    }
                }
            }
        });
    }
    else if (respond.action !== "complete") {
        fn_warn(lang.serverdefine, respond.action);
    }
    else if (respond.action === "complete") {
        if ($("#success").length > 0 && respond.data != null) {
            $('#back-to-top').trigger("click");
            $("#success").html(respond.data).show("fast");
            $("#success-hide").hide("fast");
            $("input[type=password]").val("");
            $('form input').blur();
        }
    }
}

jQuery.fn.centered = function () {
    var p = 60;
    if (this.outerWidth() > $(window).width() - p) {
        this.css("max-width", $(window).width() - p);
    }

    var h = $(document).height() > $(window).height() ? $(document).height() : $(window).height();
    if (this.outerHeight() > h - p) {
        this.css("max-height", h - p);
    }

    var t =(($(window).height() - this.outerHeight()) / 2) + $(window).scrollTop();
    if (t < p / 2) t = p / 2;
    if ($(window).scrollTop() > 0 && t < $(window).scrollTop()) t = $(window).scrollTop() + (p / 2);

    this.css("position", "absolute");
    this.css($rtl ? "right" : "left", ($(window).width() - this.outerWidth()) / 2 + "px");
    this.css("top", t + "px");

    return this;
};

jQuery.fn.leftcenter = function () {
    this.css("position", "fixed");
    this.css($rtl ? "right" : "left", ($(window).width() - this.outerWidth()) / 2 + "px");
    return this;
};

function fn_wait() {
    if (isAjax) {
        fn_warn(lang.warning, lang.wait);
        return false;
    } else {
        return true;
    }
}

function fn_warn(title, message) {
    $("#warn-title").html(title == null ? "" : title);
    $("#warn-message").html(message == null ? "" : message);

    $("#warn").show("fast");
    $("#warn-body").leftcenter();
}

function fn_popup(url) {
    $.ajax({
        type: "GET",
        url: url,
        dataType: "html",
        error: function (xhr, textStatus, errorThrown) {
            fn_xhr_error(xhr, textStatus, errorThrown);
        },
        success: function (respond) {
            fn_popup_content(url, respond);
        }
    });
}

function fn_popup_content(url, content, cssclass) {
    var c = $("div[data-pop-div]").length;
    var z = (c * 4) + 1;

    c += 1;

    $("body").append('<div data-pop-div class="css-pop">' +
                        '<div style="z-index: ' + (z + 1) + ';" data-pop-lock class="css-poplock"></div>' +
                        '<div style="z-index: ' + (z + 2) + ';" data-pop-content class="css-popcontent' + (cssclass == null ? "" : " " + cssclass) + '">' + content + '</div>' +
                        '<div style="z-index: ' + (z + 3) + ';" data-pop-close class="css-popclose"></div>' +
                     '</div>');

    fn_charsize();

    var $c = $("div[data-pop-content]").last();
    $c.centered();

    $("form", $c).attr("action", url).ajaxForm(url);

    $("div[data-pop-close]").last().css($rtl ? "right" : "left", ($c.offset().left + $c.outerWidth() - 15) + "px")
                                   .css("top", ($c.offset().top - 4) + "px");


    $("[data-lightbox]").each(function () {
        if ($(this).attr("data-handler") == null) {
            $(this).attr("data-handler", "");
            $(".lightbox", $(this)).lightbox();
        }
    });

    fn_loop_build();
    fn_tooltip();
}

function fn_popup_pdfcontent(url) {
    var c = $("div[data-pop-div]").length;
    var z = (c * 4) + 1;

    c += 1;

    $("body").append('<div data-pop-div class="css-pop">' +
        '<div style="z-index: ' + (z + 1) + ';" data-pop-lock class="css-poplock"></div>' +
        '<div style="z-index: ' + (z + 2) + ';width:90%;height:90%" data-pop-content class="css-popcontent"><iframe style="width:100%;height:100%" src="' + url + '"></iframe></div>' +
        '<div style="z-index: ' + (z + 3) + ';" data-pop-close class="css-popclose"></div>' +
        '</div>');

    var $c = $("div[data-pop-content]").last();
    $c.centered();


    $("div[data-pop-close]").last().css($rtl ? "right" : "left", ($c.offset().left + $c.outerWidth() - 15) + "px")
        .css("top", ($c.offset().top - 4) + "px");

}

function fn_tooltip() {
    $(".css-popup").each(function () {
        if ($(this).attr("data-handler") == null) {
            $(this).attr("data-handler", "").hoverIntent(function (e) {
                var $d = $(".css-popup-tip", $(this).parent());
                if ($d.hasClass("css-popup-tip-right") || $rtl) {
                    $d.css({
                        "top": e.pageY - e.offsetY - 15 - $(document).scrollTop(),
                        "right": $(document).width() - e.pageX + e.offsetX + 15
                    });
                } else {
                    $d.css({
                        "top": e.pageY - e.offsetY - 15 - $(document).scrollTop(),
                        "left": e.pageX - e.offsetX + 30
                    });
                }
                $d.show();
            }, function (e) {
                var $d = $(".css-popup-tip", $(this).parent());
                $d.hide();
            });
        }
    });
}

function fn_opentab(evt, tabname) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabname).style.display = "block";
    evt.currentTarget.className += " active";
    $("[name='paymentmethod']").val(tabname);
}

function fn_get(value) {
    return value === "" ? 0 : parseFloat(value.replace(/[^0-9-$,]/g, '').replace(",", "."));
}

function fn_set(value, fixed) {
    return value.toFixed(fixed).replace(".", ",").replace(/(\d)(?=(\d{3})+\,)/g, "$1.").toString();
}