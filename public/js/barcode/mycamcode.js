/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


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
            scannedImg = Q("#scanned-img"),
            scannedQR = Q("#scanned-QR"),
            decodeLocal = Q("#decode-img");
    grabImg = Q("#grab-img");
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
            //scannedQR[txt] = res.format + ": " + res.code;
            //for mobile device
            $("#bc-box").val(res.code);
            mybeep();
            //alert(res.code);

        }
    };

    decoder = new WebCodeCamJS("#webcodecamcanvas").buildSelectMenu("#camera-select", "environment|back").init(args);

    decodeLocal.addEventListener("click", function() {
        Page.decodeLocalImage();
        grabImg.classList.remove("disabled");
    }, false);

    grabImg.addEventListener("click", function() {
        if (!decoder.isInitialized()) {
            return;
        }
        var src = decoder.getLastImageSrc();
        scannedImg.setAttribute("src", src);
    }, false);

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