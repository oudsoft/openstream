//merger.js
define(function (require) {
	//console.log(urlParams.roomname);

	var VideoStreamMerger = require('lib/video-stream-merger.js');

	var mixOption = {
		width: 550,   // Width of the output video
		height: 300,  // Height of the output video
		fps: 25,       // Video capture frames per second
		clearRect: true, // Clear the canvas every frame
		audioContext: null, // Supply an external AudioContext (for audio effects)
	};

	var merger = new VideoStreamMerger(mixOption);

	var AdXmedia = document.createElement("video");

	document.addEventListener("MergeStreamCmd", function(e) {
		let streams = {localStream: e.detail.localStream, localMediaStream: e.detail.localMediaStream};
		mixedStream = doMergeStream(streams);
		mixedVideo.srcObject = mixedStream;
		doConnect();
	});

	function doMergeStream(streams) {
		//console.log(displayMediaStreamConstraints);
		//console.log(mixOption);
		mixOption.width = displayMediaStreamConstraints.video.width;
		mixOption.height = displayMediaStreamConstraints.video.height;
		//mixOption.width = 3840;
		//mixOption.height = 2160;
		console.log(mixOption);
		if ((streams.localStream) && (streams.localMediaStream)) {
			merger.addStream(localStream, {
			  x: 0, // position of the topleft corner
			  y: 0,
			  width: merger.width,
			  height: merger.height,
			  mute: true // we don't want sound from the screen (if there is any)
			})

			// Add the webcam stream. Position it on the bottom left and resize it to 100x100.
			let xmepos = merger.width * 0.19;
			let ymepos = merger.height * 0.25;
			merger.addStream(localMediaStream, {
			  x: merger.width - xmepos,
			  y: merger.height - ymepos,
			  width: xmepos,
			  height: ymepos,
			  mute: false
			});

			// Start the merging. Calling this makes the result available to us
			merger.start();

			/* Add AdX Stream */
			/*
			let AdXStream = doGetAdXStream();
			setTimeout(() => {
				merger.addStream(AdXStream, {
					x: 0,
					y: merger.height - ymepos,
					width: xmepos,
					height: ymepos,
					mute: false
				});
				AdXmedia.play();
			}, 60000);
			*/

			// We now have a merged MediaStream!
			return merger.result;
		} else {
			return;
		}
	}	
	
	function doGetAdXStream() {
		var AdXstream;

		//AdXmedia.src = "https://nickdesaulniers.github.io/netfix/demo/frag_bunny.mp4";
		//AdXmedia.src = "/openstream/simplevideo";
		//AdXmedia.src = "/openstream/video/adult/ala011SRS_217033001_sd.mp4";
		//AdXmedia.src = "/openstream/video/adult/jessica-weding.mp4";
		//AdXmedia.src = "/openstream/video/adult/jessica-dogman.mp4";
		//AdXmedia.src = "/openstream/video/adult/jessica-weding.mp4";
		AdXmedia.src = "/openstream/video/adult/ala011SRS_217034001_sd.mp4";
		//AdXmedia.src = "/openstream/video/AdVideo.mp4";
		AdXmedia.oncanplay = function() {
			AdXstream = AdXmedia.captureStream();
		}
		return AdXmedia.captureStream();
	}

});
