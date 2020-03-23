/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var decoder;

(function(undefined) {
    "use strict";

    function Q(el) {
        if (typeof el === "string") {
            var els = document.querySelectorAll(el);
            return typeof els === "undefined" ? undefined : els.length > 1 ? els : els[0];
        }
        return el;
    }
    var txt = "innerText" in HTMLElement.prototype ? "innerText" : "textContent";
    var scannerLaser = Q(".scanner-laser"),
            imageUrl = new Q("#image-url"),
            play = Q("#play"),
            scannedImg = Q("#scanned-img"),
            scannedQR = Q("#scanned-QR"),
            grabImg = Q("#grab-img"),
            decodeLocal = Q("#decode-img"),
            pause = Q("#pause"),
            stop = Q("#stop"),
            contrast = Q("#contrast"),
            contrastValue = Q("#contrast-value"),
            zoom = Q("#zoom"),
            zoomValue = Q("#zoom-value"),
            brightness = Q("#brightness"),
            brightnessValue = Q("#brightness-value"),
            threshold = Q("#threshold"),
            thresholdValue = Q("#threshold-value"),
            sharpness = Q("#sharpness"),
            sharpnessValue = Q("#sharpness-value"),
            grayscale = Q("#grayscale"),
            grayscaleValue = Q("#grayscale-value"),
            flipVertical = Q("#flipVertical"),
            flipVerticalValue = Q("#flipVertical-value"),
            flipHorizontal = Q("#flipHorizontal"),
            flipHorizontalValue = Q("#flipHorizontal-value"),
            videoSourceSelect = $("#camera-select"),
            webcodecamcanvas = Q("#webcodecamcanvas");
    var args = {
        autoBrightnessValue: 100,
        resultFunction: function(res) {
            [].forEach.call(scannerLaser, function(el) {
                fadeOut(el, 0.5);
                setTimeout(function() {
                    fadeIn(el, 0.5);
                }, 500);
            });
            scannedImg.src = res.imgData;
            scannedQR[txt] = res.format + ": " + res.code;
            //for mobile device
            mybeep();
            //alert(res.code);


            $.post("${pageContext.request.contextPath}/contents/middle/do_genproductsaleform.jsp", {bc: res.code},
            function(data) {
                var $response = $(data);
                var notfoundmsg = $response.filter('#not-found-product-message').text();
                if (notfoundmsg) {
                    $("#product-bc-4sale-dg").html(data);
                    $("#product-bc-4sale-dg").popup('open');
                    setTimeout(function() {
                        $("#product-bc-4sale-dg").popup('close');
                    }, 800);
                } else {
                    $("#product-bc-4sale-dg").html(data);
                    $("#product-bc-4sale-dg").popup('open');
                }
            });

        }
    };

    decoder = new WebCodeCamJS("webcodecamcanvas").buildSelectMenu(videoSourceSelect, "environment|back").init(args);
    //decoder = new WebCodeCamJQuery("#webcodecamcanvas").WebCodeCamJQuery(args).data().plugin_WebCodeCamJQuery;


/*
    decodeLocal.addEventListener("click", function() {
        Page.decodeLocalImage();
        grabImg.classList.remove("disabled");
    }, false);
*/
    play.addEventListener("click", function() {
        if (!decoder.isInitialized()) {
            scannedQR[txt] = "Scanning ...";
        } else {
            scannedQR[txt] = "Scanning ...";
            decoder.play();
        }
        grabImg.classList.remove("disabled");
    }, false);

    grabImg.addEventListener("click", function() {
        if (!decoder.isInitialized()) {
            return;
        }
        var src = decoder.getLastImageSrc();
        scannedImg.setAttribute("src", src);
    }, false);

    pause.addEventListener("click", function(event) {
        scannedQR[txt] = "Paused";
        decoder.pause();
    }, false);

    stop.addEventListener("click", function(event) {
        grabImg.classList.add("disabled");
        scannedQR[txt] = "Stopped";
        decoder.stop();
    }, false);

    /*
     Page.changeZoom = function(a) {
     if (decoder.isInitialized()) {
     var value = typeof a !== "undefined" ? parseFloat(a.toPrecision(2)) : zoom.value / 10;
     zoomValue[txt] = zoomValue[txt].split(":")[0] + ": " + value.toString();
     decoder.options.zoom = value;
     if (typeof a !== "undefined") {
     zoom.value = a * 10;
     }
     }
     };
     
     Page.changeContrast = function() {
     if (decoder.isInitialized()) {
     var value = contrast.value;
     contrastValue[txt] = contrastValue[txt].split(":")[0] + ": " + value.toString();
     decoder.options.contrast = parseFloat(value);
     }
     };
     
     Page.changeBrightness = function() {
     if (decoder.isInitialized()) {
     var value = brightness.value;
     brightnessValue[txt] = brightnessValue[txt].split(":")[0] + ": " + value.toString();
     decoder.options.brightness = parseFloat(value);
     }
     };
     
     Page.changeThreshold = function() {
     if (decoder.isInitialized()) {
     var value = threshold.value;
     thresholdValue[txt] = thresholdValue[txt].split(":")[0] + ": " + value.toString();
     decoder.options.threshold = parseFloat(value);
     }
     };
     
     Page.changeSharpness = function() {
     if (decoder.isInitialized()) {
     var value = sharpness.checked;
     if (value) {
     sharpnessValue[txt] = sharpnessValue[txt].split(":")[0] + ": on";
     decoder.options.sharpness = [0, -1, 0, -1, 5, -1, 0, -1, 0];
     } else {
     sharpnessValue[txt] = sharpnessValue[txt].split(":")[0] + ": off";
     decoder.options.sharpness = [];
     }
     }
     };
     
     Page.changeVertical = function() {
     if (decoder.isInitialized()) {
     var value = flipVertical.checked;
     if (value) {
     flipVerticalValue[txt] = flipVerticalValue[txt].split(":")[0] + ": on";
     decoder.options.flipVertical = value;
     } else {
     flipVerticalValue[txt] = flipVerticalValue[txt].split(":")[0] + ": off";
     decoder.options.flipVertical = value;
     }
     }
     };
     
     Page.changeHorizontal = function() {
     if (decoder.isInitialized()) {
     var value = flipHorizontal.checked;
     if (value) {
     flipHorizontalValue[txt] = flipHorizontalValue[txt].split(":")[0] + ": on";
     decoder.options.flipHorizontal = value;
     } else {
     flipHorizontalValue[txt] = flipHorizontalValue[txt].split(":")[0] + ": off";
     decoder.options.flipHorizontal = value;
     }
     }
     };
     
     Page.changeGrayscale = function() {
     if (decoder.isInitialized()) {
     var value = grayscale.checked;
     if (value) {
     grayscaleValue[txt] = grayscaleValue[txt].split(":")[0] + ": on";
     decoder.options.grayScale = true;
     } else {
     grayscaleValue[txt] = grayscaleValue[txt].split(":")[0] + ": off";
     decoder.options.grayScale = false;
     }
     }
     };
     
     var getZomm = setInterval(function() {
     var a;
     try {
     a = decoder.getOptimalZoom();
     } catch (e) {
     a = 0;
     }
     if (!!a && a !== 0) {
     Page.changeZoom(a);
     clearInterval(getZomm);
     }
     }, 500);
     
     */

    Page.decodeLocalImage = function() {
        if (decoder.isInitialized()) {
            decoder.decodeLocalImage(imageUrl.value);
        }
        imageUrl.value = null;
    };

    function fadeOut(el, v) {
        el.style.opacity = 1;
        (function fade() {
            if ((el.style.opacity -= 0.1) < v) {
                el.style.display = "none";
                el.classList.add("is-hidden");
            } else {
                requestAnimationFrame(fade);
            }
        })();
    }

    function fadeIn(el, v, display) {
        if (el.classList.contains("is-hidden")) {
            el.classList.remove("is-hidden");
        }
        el.style.opacity = 0;
        el.style.display = display || "block";
        (function fade() {
            var val = parseFloat(el.style.opacity);
            if (!((val += 0.1) > v)) {
                el.style.opacity = val;
                requestAnimationFrame(fade);
            }
        })();
    }

    document.querySelector("#camera-select").addEventListener("change", function() {
        if (decoder.isInitialized()) {
            decoder.stop().play();
        }
    });

}).call(window.Page = window.Page || {});