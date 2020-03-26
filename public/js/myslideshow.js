//myslideshow.js

const delay = t => new Promise(resolve => setTimeout(resolve, t));
const extFileName = '.jpg';
let delayTime = 15;
let delayToggle = 5000;

function padZero(num, size) {
	var s = num+"";
	while (s.length < size) s = "0" + s;
	return s;
}

const GeeGeePath = '/openstream/geegee/geegeefile';

let geegeePath = GeeGeePath;

let isShow = true;

let imgs = [];
let startNum = 1;
let endNum = 239;
let currentShow = 1;

let imgWidth = 0;
let imgHeight = 0;

let timer = null;
let zoomIn = {"zoom": "-=50%"};
let zoomOut = {"zoom": "+=50%"};

function view(i) {
	if (imgs[i] !== undefined){
		let imgFileName = geegeePath + '/' + imgs[i];
		//$('#ControlPanel').hide();
		$('#NumberPreview').empty();
		$('#NumberPreview').html('<b>' + i + '/' + endNum + '</b>');
		$('.backgroundTransition').empty();

		let wz = (screen.width * 0.01);
		$('.backgroundTransition').css("width",  wz + 'px');
		$('.backgroundTransition').css("height", 'auto');
		
		/*		
		$('.backgroundTransition').css("width", '100%');
		$('.backgroundTransition').css("height", '100%');
		*/

		let img = new Image();
		img.className = 'hide';
		img.src = imgFileName;
		img.onload = function(){
			imgWidth = img.width;
			imgHeight = img.height;
			//console.log(imgWidth + ":" + imgHeight);
			if (isShow) {
				//$('.backgroundTransition').animate(zoomOut, 2500);
			} else {
				//$('.backgroundTransition').animate(null);
			}

			if(imgWidth > imgHeight){
				img.classList.add("landscape");
			}else{
				img.classList.add("portrait");
			}
			delay(500).then(()=>{	
				img.classList.remove("hide");
				//$('#ControlPanel').show();
			});
		};
		img.onclick = function() { 
			img.className  = "fullview";
			$('.backgroundTransition').css("width", '100%');
			$('.backgroundTransition').css("height", '100%');
		};
		img.ondblclick = function() { 
			img.className  = "fullview";
			toggleFullView();
			window.open(img.src, "_blank");
		};

		$('.backgroundTransition').append(img);
		$('#filename').text(imgs[i]);		
	}
}
let toggleFullView = function (){
	let imgW = $('img').css("width");
	if (parseInt(imgW) <= screen.width) {
		$('.backgroundTransition').css("width", imgWidth + 'px');
		$('.backgroundTransition').css("height", imgHeight + 'px');
		$('img').css("width", '100%');
	} else {
		$('.backgroundTransition').css("width", '100%');
		$('.backgroundTransition').css("height", '100%');
		$('img').css("width", '100%');
	}
}
let doFullView = function() {
	delay(2500).then(()=>{	
		$("img").attr('class', 'fullview');
		$('.backgroundTransition').css("width", '100%');
		$('.backgroundTransition').css("height", '100%');
	});
}
function doShowTimeCountdown(countdownTo){
	$('#countdown').show();
	$('#countdown').timeTo(countdownTo, function(){
        $('#countdown').hide();
    });
}
function show() {
	isShow = true;
	currentShow = 1;
	let i=currentShow;

	(function doSlideShow (i) { 
		doShowTimeCountdown((delayTime));
		view(i);	         
		timer = window.setTimeout(function () { 
			//console.log(imgHeight);
			//console.log(screen.height);

			$('.backgroundTransition').animate(zoomIn, 2500);
			if (i < endNum) {
				if (isShow)	{ i++; currentShow = i;	 doSlideShow(i); } else { window.clearTimeout(timer); }
			} else {
				if (isShow)	{ i = 1; currentShow = i; doSlideShow(i); }  else { window.clearTimeout(timer); }
			}
		}, delayTime * 1000)
	})(i);     
}
function check() {
	let i = 1;
	currentShow = i;
	view(i);
}
function stop() {
	isShow = false;
	window.clearTimeout(timer);
}
function showcontinue() {
	isShow = true;
	let i=currentShow;

	(function doSlideShow (i) {
		doShowTimeCountdown((delayTime));
		view(i);		
		timer = window.setTimeout(function () { 
			$('.backgroundTransition').animate(zoomIn, 2500);
				if (i < endNum) {
					if (isShow)     { i++; currentShow = i;  doSlideShow(i); } else { window.clearTimeout(timer); }
				} else {
					if (isShow)     { i = 1; currentShow = i; doSlideShow(i); }  else { window.clearTimeout(timer); }
				} 
		}, delayTime * 1000)
	})(i);     
}

function previous(){
	stop();
	currentShow--;
	if (currentShow > 0) {
		view(currentShow);
		//$('.backgroundTransition').animate({"zoom": "-=50%"}, 5500);
		//$('.backgroundTransition').animateRotate(360, 5500, null, doFullView);
		delay(delayToggle).then(()=>{	
			doFullView();
		});
	} else {
		currentShow = 1;
		view(currentShow);
		//$('.backgroundTransition').animate({"zoom": "-=50%"}, 5500);
		//$('.backgroundTransition').animateRotate(-360, 5500, null, doFullView);
		delay(delayToggle).then(()=>{	
			doFullView();
		});
	}
	doShowTimeCountdown((delayToggle / 1000));
}

function next(){
	stop();
	currentShow++;
	if (currentShow < imgs.length) {
		view(currentShow);
		//$('.backgroundTransition').animate({"zoom": "-=50%"}, 5500);
		//$('.backgroundTransition').animateRotate(360, 5500, null, doFullView);
		delay(delayToggle).then(()=>{	
			doFullView();
		});
	} else {
		currentShow = 1;
		view(currentShow);
		//$('.backgroundTransition').animate({"zoom": "-=50%"}, 5500);		
		//$('.backgroundTransition').animateRotate(-360, 5500, null, doFullView);
		delay(delayToggle).then(()=>{	
			doFullView();
		});
	}
	doShowTimeCountdown((delayToggle / 1000));
}

document.onkeydown = function (e) {
	e = e || window.event;
	console.log(e.keyCode);
	if (e.keyCode == '38') {
		// up arrow
		//$('img').click();
		toggleFullView();
	}
	else if (e.keyCode == '40') {
		// down arrow

	}
	else if (e.keyCode == '37') {
		// left arrow
		previous();
	}
	else if (e.keyCode == '39') {
	   // right arrow
	   next();
	}
	else if ((e.keyCode == '48') || (e.keyCode == '96')){
		//key number 0
		//$('#NumberPreview').toggle();
		$("#NumberPreview").toggleClass("display-inline");
	}
	else if ((e.keyCode == '49') || (e.keyCode == '97')) {
		//key number 1
		stop();
	}
	else if ((e.keyCode == '50') || (e.keyCode == '98')) {
		//key number 2
		showcontinue();
	}
	else if ((e.keyCode == '51') || (e.keyCode == '99')) {
		//key number 3
		show();
	}
	else if ((e.keyCode == '110') || (e.keyCode == '190')){
		//key . full stop key
		$('#ControlPanel').toggle();
	}
	else if ((e.keyCode == '84')){
		delayTime = Number(prompt('Please type your new delay time', delayTime));
	}
	else if ((e.keyCode == '89')){
		delayToggle = Number(prompt('Please type your new delay toggle', delayToggle));
	}
};

(function ( $ ) {
	$.fn.animateRotate = function(angle, duration, easing, complete) {
		return this.each(function() {
			var $elem = $(this);

			$({deg: 0}).animate({deg: angle}, {
				duration: duration,
				easing: easing,
				step: function(now) {
					$elem.css({
						transform: 'rotate(' + now + 'deg)'
					});
				},
				complete: complete || $.noop
			});
		});
	};

	$.fn.animateZoomIn = function(size, duration, easing, complete) {
		return this.each(function() {
			var $elem = $(this);

			$elem.animate({"zoom": "-=" + size + "%"}, {
				duration: duration,
				easing: easing,
				/*
				step: function(now) {
					$elem.css({
						transform: 'rotate(' + now + 'deg)'
					});
				},
				*/
				complete: complete || $.noop
			});
		});
	};

}( jQuery ));