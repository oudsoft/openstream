// Need this to make IE happy
// see http://soledadpenades.com/2007/05/17/arrayindexof-in-internet-explorer/
if(!Array.indexOf){
    Array.prototype.indexOf = function(obj){
	for(var i=0; i<this.length; i++){
	    if(this[i]==obj){
	        return i;
	    }
	}
	return -1;
    }
}


var chatboxManager = function() {

    // list of all opened boxes
    var boxList = new Array();
    // list of boxes shown on the page
    var showList = new Array();
    // list of first names, for in-page demo
    var nameList = new Array();

    var config = {
		width : 250, //px
		gap : 20,
		maxBoxes : 5,
		messageSent : function(id, user, msg, type) {
			// override this
			console.log(id, user, msg, type);
			$("#" + id).chatbox("option", "boxManager").addMsg(user.name, msg, type);
		}
    };

    var init = function(options) {
		$.extend(config, options)
    };


    var delBox = function(id) {
	// TODO
    };

    var getNextOffset = function() {
		return (config.width + config.gap) * showList.length;
    };

    var boxClosedCallback = function(id) {
		// close button in the titlebar is clicked
		var showId = showList[id]; 
		var idx = showList.indexOf(showId);
		if(idx != -1) {
			var manager = $("#" + showList[id]).chatbox("option", "boxManager");
			manager.removeBox();

			showList.splice(idx, 1);
			nameList.splice(idx, 1);
			boxList.splice(idx, 1);

			diff = config.width + config.gap;
			for(var i = idx; i < showList.length; i++) {
				offset = $("#" + showList[i]).chatbox("option", "offset");
				$("#" + showList[i]).chatbox("option", "offset", offset - diff);
			}
		} else {
			alert("should not happen: " + id);
		}
    };

    // caller should guarantee the uniqueness of id
    var addBox = function(id, user, name) {
		console.log(id, user, name);
		var idx1 = showList.indexOf(id);
		var idx2 = boxList.indexOf(id);
		if(idx1 != -1) {
			// found one in show box, do nothing
		}
		else if(idx2 != -1) {
			// exists, but hidden
			// show it and put it back to showList
			$("#"+id).chatbox("option", "offset", getNextOffset());
			var manager = $("#"+id).chatbox("option", "boxManager");
			manager.toggleBox();
			showList.push(id);
		}
		else{
			var el = document.createElement('div');
			el.setAttribute('id', id);
			$(el).chatbox({id : id,
				   user : user.user,
				   title : user.user.name,
				   hidden : false,
				   width : config.width,
				   offset : getNextOffset(),
				   messageSent : messageSentCallback,
				   boxClosed : boxClosedCallback
			});
			boxList.push(id);
			showList.push(id);
			nameList.push(user.user.name);
		}
    };

    var messageSentCallback = function(id, user, msg, msgtype) {
		var idx = boxList.indexOf(id);
		config.messageSent(showList[idx], user, msg, msgtype);
    };

    // not used in demo
    var dispatch = function(id, user, msg) {
		$("#" + id).chatbox("option", "boxManager").addMsg(user.first_name, msg);
    }

	var searchRoom = function (roomname) {
		return nameList.indexOf(roomname);
	}

	var getRoomBox = function(id) {
		return boxList[id];
	}

    return {
		init : init,
		addBox : addBox,
		removeBox: boxClosedCallback,
		delBox : delBox,
		dispatch : dispatch,
		search: searchRoom,
		roomBox: getRoomBox
    };
}();
