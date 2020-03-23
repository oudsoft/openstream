//checkmobile.js

//var resultDiv = document.getElementById("result");

//if (!resultDiv) {alert(resultDiv);}

//constraints for desktop browser 
var desktopConstraints = { 

   video: { 
      mandatory: { 
         maxWidth:800,
         maxHeight:600   
      }  
   }, 
	
   audio: true 
}; 
 
//constraints for mobile browser 
var mobileConstraints = { 

   video: { 
      mandatory: { 
         maxWidth: 480, 
         maxHeight: 320, 
      } 
   }, 
	
   audio: true 
}
  
//if a user is using a mobile browser 
if(/Android|iPhone|iPad/i.test(navigator.userAgent)) { 
	  var constraints = mobileConstraints;   
	  resultDiv.innerHTML = "Android";
} else { 
   	  var constraints = desktopConstraints; 
	  resultDiv.innerHTML = "Not Android";   
}
  
function hasUserMedia() { 
   //check if the browser supports the WebRTC 
   return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia); 
}
  
/*
if (hasUserMedia()) {
  
   navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
*/
   //enabling video and audio channels 
   navigator.getUserMedia(constraints, function (stream) { 
	  var resultDiv = document.querySelector('#result');
	  resultDiv.innerHTML = "OK";
      var video = document.querySelector('video');
		
      //inserting our stream to the video tag     
      //video.src = window.URL.createObjectURL(stream);
      if (!video){
	  video.srcObject = stream;
	  } else {
	  	alert();
	  }


	  if (resultDiv) {
      	resultDiv.innerHTML = "<h1>Congratulation!!</h1><p>Your Mobile is Support WebRTC</p>";
      } else {
      	alert('support webrtc');
      }
		
   }, function (err) {
   		var resultDiv = document.querySelector('#result');
   		resultDiv.innerHTML = "<h1>Sorry</h1><p>Check Error => " + JSON.stringify(err) + "</p>";
   }); 
   /*
} else { 
   	//alert("WebRTC is not supported"); 
  	var resultDiv = document.querySelector('#result');
  	if (resultDiv) {
   		resultDiv.innerHTM = "<h1>Your Mobile is not Support WebRTC</h1>";
	} else {
      	alert('not support webrtc');
    }
}
*/