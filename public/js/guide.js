/*
https://stackoverflow.com/questions/53029708/how-to-set-remote-description-for-a-webrtc-caller-in-chrome-without-errors

Step 1: caller creates offer

Step 2: caller sets localDescription

Step 3: caller sends the description to the callee

//------------------------------------------------------//

Step 4: callee receives the offer sets remote description

Step 5: callee creates answer

Step 6: callee sets local description

Step 7: callee send the description to caller

//------------------------------------------------------//

Step 8: caller receives the answer and sets remote description

*/
/*
	Caller	= local
	Callee	= remote
*/
const socket = io();
const constraints = {
  audio: true,
  video: true
};
const configuration = {
  iceServers: [{
    "url": "stun:23.21.150.121"
  }, {
    "url": "stun:stun.l.google.com:19302"
  }]
};

const selfView = $('#selfView')[0];
const remoteView = $('#remoteView')[0];

var pc = new RTCPeerConnection(configuration);

pc.onicecandidate = ({
  candidate
}) => {
  socket.emit('message', {
    to: $('#remote').val(),
    candidate: candidate
  });
};

pc.onnegotiationneeded = async () => {
  try {
    await pc.setLocalDescription(await pc.createOffer());
    socket.emit('message', {
      to: $('#remote').val(),
      desc: pc.localDescription
    });
  } catch (err) {
    console.error(err);
  }
};

pc.ontrack = (event) => {
  // don't set srcObject again if it is already set.
  if (remoteView.srcObject) return;
  remoteView.srcObject = event.streams[0];
};

socket.on('message', async ({
  from,
  desc,
  candidate
}) => {
  $('#remote').val(from);
  try {
    if (desc) {
      // if we get an offer, we need to reply with an answer
      if (desc.type === 'offer') {
        await pc.setRemoteDescription(desc);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        selfView.srcObject = stream;
        await pc.setLocalDescription(await pc.createAnswer());
        console.log(pc.localDescription);
        socket.emit({
          to: from,
          desc: pc.localDescription
        });
      } else if (desc.type === 'answer') {
        await pc.setRemoteDescription(desc).catch(err => console.log(err));
      } else {
        console.log('Unsupported SDP type.');
      }
    } else if (candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(err => console.log(err));
    }
  } catch (err) {
    console.error(err);
  }
});


async function start() {
  try {
    // get local stream, show it in self-view and add it to be sent
    const stream = await requestUserMedia(constraints);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    attachMediaStream(selfView, stream);
  } catch (err) {
    console.error(err);
  }
}

socket.on('id', (data) => {
  $('#myid').text(data.id);
});


// this function is called once the caller hits connect after inserting the unique id of the callee
async function connect() {
  try {
    await pc.setLocalDescription(await pc.createOffer());
    socket.emit('message', {
      to: $('#remote').val(),
      desc: pc.localDescription
    });
  } catch (err) {
    console.error(err);
  }
}

socket.on('error', data => {
  console.log(data);
});