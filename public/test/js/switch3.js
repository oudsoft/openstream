//switch3.js

var args = process.argv.slice(2);

(function(varName){
	//var varName = "afshin";
	console.log(varName);
	switch (varName) {
	    case (["afshin", "saeed", "larry"].indexOf(varName)+1 && varName):
	      console.log("hey");
	      break;

	    default:
	      console.log('Default case');
	}
})(args[0]);


