//merger.js
define(function (require) {
	//console.log(urlParams.roomname);

	var VideoStreamMerger = require('lib/video-stream-merger.js');
	var streamMerger;
	var vconfMerger;

	var mixOption = {
		width: 550,   // Width of the output video
		height: 280,  // Height of the output video
		fps: 25,       // Video capture frames per second
		clearRect: true, // Clear the canvas every frame
		audioContext: null, // Supply an external AudioContext (for audio effects)
	};

	document.addEventListener("MergeStreamCmd", function(e) {
		let streams = {localStream: e.detail.localStream, localMediaStream: e.detail.localMediaStream, roomtype: e.detail.roomtype, roomname: e.detail.roomname, isMuted: e.detail.isMuted};
		streamMerger = new StreamMerger(streams);
		mixedStream = streamMerger.getMerger().result;
		mixedVideo.srcObject = mixedStream;
		doConnect();
	});
	document.addEventListener("ReMergeStreamCmd", function(e) {
		let streams = {localStream: e.detail.localStream, localMediaStream: e.detail.localMediaStream, roomtype: e.detail.roomtype, roomname: e.detail.roomname, isMuted: e.detail.isMuted};
		streamMerger = new StreamMerger(streams);
		mixedStream = streamMerger.getMerger().result;
		mixedVideo.srcObject = mixedStream;
	});

	document.addEventListener("ResetLayerStreamCmd", function(e) {

		let streams = {localStream: e.detail.localStream, localMediaStream: e.detail.localMediaStream, roomtype: e.detail.roomtype, roomname: e.detail.roomname, isMuted: e.detail.isMuted, streamIndex: e.detail.streamIndex};

		let meMerger = streamMerger.getMerger();
		
		meMerger.updateIndex(streams.localStream, streams.streamIndex[0]);
		meMerger.updateIndex(streams.localMediaStream, streams.streamIndex[1]);

		mixedStream = meMerger.result;
		mixedVideo.srcObject = mixedStream;

	});

	var vconfMixOption = {
		width: 520,   // Width of the output video
		height: 360,  // Height of the output video
		fps: 25,       // Video capture frames per second
		clearRect: true, // Clear the canvas every frame
		audioContext: null, // Supply an external AudioContext (for audio effects)
	};

	document.addEventListener("MergeJoinStreamCmd", function(e) {
		let stream = {joinStream: e.detail.joinStream};

		let meMerger = streamMerger.getMerger();
		console.log(stream.joinStream.stream);
		meMerger.addStream(stream.joinStream.stream, {
			x: 0, // position of the topleft corner
			y: meMerger.height - ymepos,
			index: 4,
			width: xmepos,
			height: ymepos,
			mute: false // we don't want sound from the screen (if there is any)
		})

		mixedStream = meMerger.result;
		mixedVideo.srcObject = mixedStream;
	});

	document.addEventListener("RemoveJoinStreamCmd", function(e) {
		let stream = {joinStream: e.detail.joinStream};
		let meMerger = streamMerger.getMerger();
		meMerger.removeStream(stream.joinStream.stream);
	});

	document.addEventListener("MergeVconfStreamCmd", function(e) {
		let streams = {bgStream: e.detail.bgStream, streams: e.detail.streams};
		vconfMerger = new VconfMerger(streams);
		vchatRemoteVideo.srcObject = vconfMerger.getMerger().result;;
	});

	document.addEventListener("ReleaseStreamMergerCmd", function(e) {
		streamMerger = null;
		vconfMerger = null;
	});

	var AdXVideo = document.createElement("video");
	AdXVideo.style.display = 'none';
	AdXVideo.oncanplay = function() {
		AdXVideo.play();
	}

	var AdXmedia;
	var AdXstream;

	let xmepos;
	let ymepos;

	const StreamMerger = function(streams) {
		//console.log(mixOption);
		mixOption.width = displayMediaStreamConstraints.video.width;
		mixOption.height = displayMediaStreamConstraints.video.height;
		//console.log(mixOption);

		/* Beware, Do not remove this line */
		/* If remove go anothe there, the resolution of mixedStream not bueatiful */

		this.merger = new VideoStreamMerger(mixOption);

		/**********************/

		let audioTracks = streams.localStream.getAudioTracks();
		let isMute = true;
		//console.log(audioTracks.length);
		if (audioTracks.length > 0){
			isMute = false;
		}
		this.merger.addStream(streams.localStream, {
			x: 0, // position of the topleft corner
			y: 0,
			index: (streams.streamIndex)? streams.streamIndex[0] : 0,
			width: this.merger.width,
			height: this.merger.height,
			mute: isMute // we don't want sound from the screen (if there is any)
		})

		// Add the webcam stream. Position it on the bottom left and resize it to 100x100.

		xmepos = this.merger.width * 0.19;
		ymepos = this.merger.height * 0.25;
		this.merger.addStream(streams.localMediaStream, {
			x: this.merger.width - xmepos,
			y: this.merger.height - ymepos,
			index: (streams.streamIndex)? streams.streamIndex[1] : 1,
			width: xmepos,
			height: ymepos,
			mute: streams.isMuted
		})
		
		// Start the merging. Calling this makes the result available to us
		this.merger.start();

		/* Add AdX Stream */
		if (streams.roomtype === 'Standard') {
			//console.log(streams.roomname);

			ymepos = ymepos * 2;
			xmepos = xmepos * 2;
			let timeAd = null;

			/*
			function playAd() {
				AdXmedia = document.createElement("video");
				//AdXmedia.src = "/openstream/simplevideo";
				//AdXmedia.src = "/openstream/video/adult/ala011SRS_217034001_sd.mp4";
				//AdXmedia.src = "/openstream/video/adult/jessica-weding.mp4";
				AdXmedia.src = "/openstream/video/adult/jessica-dogman.mp4";
				//AdXmedia.src = "/openstream/video/adult/jessica4-bg-1.wmv";
				//AdXmedia.src = "/openstream/video/AdVideo.mp4";

				AdXmedia.oncanplay = function() {
					console.log('Play It.');

					AdXStream = AdXmedia.captureStream();
					AdXVideo.srcObject = AdXStream;

					this.merger.addStream(AdXStream, {
						x: 0,
						y: this.merger.height - ymepos,
						index: 2,
						width: xmepos,
						height: ymepos,
						mute: true
					});

				}


				AdXmedia.onended = function () {
					this.merger.removeStream(AdXStream);
					window.clearTimeout(timeAd);

					timeAd = window.setTimeout(() => {
						playAd();
					}, (2.5 * 60 * 1000));
				}


				AdXmedia.play();
			}

			timeAd = window.setTimeout(() => {
				playAd();
			}, 55000);
			*/

			const helper = require("./mod/helper.js");
			let maker = helper.doStart();
			let AdXCanvas = document.querySelector("#AdXCanvas");
			let AdXTextStream = AdXCanvas.captureStream(25);
			let oldymepos = ymepos; 
			ymepos = 80;
			this.merger.addStream(AdXTextStream, {
				x: 0,
				y: this.merger.height - ymepos,
				index: 3,
				width: this.merger.width,
				height: ymepos,
				mute: true
			});
			ymepos = oldymepos; 
		}
	}

	StreamMerger.prototype.getMerger = function() {
		return this.merger;
	};

	const VconfMerger = function(streams) {
		this.merger = new VideoStreamMerger(vconfMixOption);

		this.merger.addStream(streams.bgStream, {
			x: 0, 
			y: 0,
			index: 0,
			width: this.merger.width,
			height: this.merger.height,
			mute: true
		});

		streams.streams.forEach((item, i) => {
			let Index = (i+1);
			this.merger.addStream(item.stream, {
				x: item.vx, 
				y: item.vy,
				index: Index,
				width: item.w,
				height: item.h,
				mute: true
			});
		});

		this.merger.start();
	}

	VconfMerger.prototype.getMerger = function() {
		return this.merger;
	};

});
