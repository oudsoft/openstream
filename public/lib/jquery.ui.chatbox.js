/*
 * Copyright 2010, Wen Pu (dexterpu at gmail dot com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * Check out http://www.cs.illinois.edu/homes/wenpu1/chatbox.html for document
 *
 * Depends on jquery.ui.core, jquery.ui.widiget, jquery.ui.effect
 *
 * Also uses some styles for jquery.ui.dialog
 *
 */


// TODO: implement destroy()
(function($) {
    $.widget("ui.chatbox", {
        options: {
            id: null, //id for the DOM element
            title: null, // title of the chatbox
            user: null, // can be anything associated with this chatbox
            hidden: false,
            offset: 0, // relative to right edge of the browser window
            width: 300, // width of the chatbox
			rootName: 'openstream',
			roomName: null,
            messageSent: function(id, user, msg, type) {
                // override this
                this.boxManager.addMsg(user.name, msg, type);
            },
            boxClosed: function(id) {
            }, // called when the close icon is clicked
            boxManager: {
                // thanks to the widget factory facility
                // similar to http://alexsexton.com/?p=51
                init: function(elem) {
                    this.elem = elem;
                },
                addMsg: function(peer, msg, type) {
                    var self = this;
                    var box = self.elem.uiChatboxLog;
                    var e = document.createElement('div');
                     $(box).append($(e));
                    $(e).hide();

                    var systemMessage = false;

                    if (peer) {
                        var peerName = document.createElement("b");
                        $(peerName).text(peer + ": ");
                        $(e).append($(peerName));
                    } else {
                        systemMessage = true;
                    }
			var msgElement;
			if (type === 'text'){
				if (msg.indexOf('http') === 0) {
					msgElement = document.createElement("a");
					msgElement.setAttribute("href", msg);
					msgElement.setAttribute("target", "_blank");
					let textElement = document.createElement(systemMessage ? "i" : "span");
					$(textElement).text(msg);
					msgElement.appendChild(textElement);
				} else {
					msgElement = document.createElement(systemMessage ? "i" : "span");
					$(msgElement).text(msg);
				}
			} else if (type === 'image') {
				msgElement = document.createElement("a");
				msgElement.setAttribute("href", msg);
				msgElement.setAttribute("target", "_blank");
				var imgElement = document.createElement("img");
				imgElement.setAttribute("src", msg);
				imgElement.setAttribute("width", '80px');
				imgElement.setAttribute("height", 'auto');
				msgElement.appendChild(imgElement);
			}
                    $(e).append(msgElement);
                    $(e).addClass("ui-chatbox-msg");
                    $(e).css("maxWidth", $(box).width());
                    $(e).fadeIn();
                    self._scrollToBottom();

                    if (!self.elem.uiChatboxTitlebar.hasClass("ui-state-focus")
                        && !self.highlightLock) {
                        self.highlightLock = true;
                        self.highlightBox();
                    }
                },
                highlightBox: function() {
                    var self = this;
                    self.elem.uiChatboxTitlebar.effect("highlight", {}, 300);
                    self.elem.uiChatbox.effect("bounce", {times: 3}, 300, function() {
                        self.highlightLock = false;
                        self._scrollToBottom();
                    });
                },
                toggleBox: function() {
                    this.elem.uiChatbox.toggle();
                },
                removeBox: function() {
                    this.elem.uiChatbox.remove();
                },
                _scrollToBottom: function() {
                    var box = this.elem.uiChatboxLog;
                    box.scrollTop(box.get(0).scrollHeight);
                }
            }
        },
        toggleContent: function(event) {
            this.uiChatboxContent.toggle();
            if (this.uiChatboxContent.is(":visible")) {
                this.uiChatboxInputBox.focus();
            }
        },
        widget: function() {
            return this.uiChatbox
        },
        _create: function() {
            var self = this,
            options = self.options,
            title = options.title || "No Title",
            // chatbox
            uiChatbox = (self.uiChatbox = $('<div></div>'))
                .appendTo(document.body)
                .addClass('ui-widget ' +
                          'ui-corner-top ' +
                          'ui-chatbox'
                         )
                .attr('outline', 0)
                .focusin(function() {
                    // ui-state-highlight is not really helpful here
                    //self.uiChatbox.removeClass('ui-state-highlight');
                    self.uiChatboxTitlebar.addClass('ui-state-focus');
                })
                .focusout(function() {
                    self.uiChatboxTitlebar.removeClass('ui-state-focus');
                }),
            // titlebar
            uiChatboxTitlebar = (self.uiChatboxTitlebar = $('<div></div>'))
                .addClass('ui-widget-header ' +
                          'ui-corner-top ' +
                          'ui-chatbox-titlebar ' +
                          'ui-dialog-header' // take advantage of dialog header style
                         )
                .click(function(event) {
                    self.toggleContent(event);
                })
                .appendTo(uiChatbox),
            uiChatboxTitle = (self.uiChatboxTitle = $('<span></span>'))
                .html(title)
                .appendTo(uiChatboxTitlebar),
            uiChatboxTitlebarClose = (self.uiChatboxTitlebarClose = $('<a href="#"></a>'))
                .addClass('ui-corner-all ' +
                          'ui-chatbox-icon '
                         )
                .attr('role', 'button')
                .hover(function() { uiChatboxTitlebarClose.addClass('ui-state-hover'); },
                       function() { uiChatboxTitlebarClose.removeClass('ui-state-hover'); })
                .click(function(event) {
                    uiChatbox.hide();
                    self.options.boxClosed(self.options.id);
                    return false;
                })
                .appendTo(uiChatboxTitlebar),
            uiChatboxTitlebarCloseText = $('<span></span>')
                .addClass('ui-icon ' +
                          'ui-icon-closethick')
                .text('close')
                .appendTo(uiChatboxTitlebarClose),
            uiChatboxTitlebarMinimize = (self.uiChatboxTitlebarMinimize = $('<a href="#"></a>'))
                .addClass('ui-corner-all ' +
                          'ui-chatbox-icon'
                         )
                .attr('role', 'button')
                .hover(function() { uiChatboxTitlebarMinimize.addClass('ui-state-hover'); },
                       function() { uiChatboxTitlebarMinimize.removeClass('ui-state-hover'); })
                .click(function(event) {
                    self.toggleContent(event);
                    return false;
                })
                .appendTo(uiChatboxTitlebar),
            uiChatboxTitlebarMinimizeText = $('<span></span>')
                .addClass('ui-icon ' +
                          'ui-icon-minusthick')
                .text('minimize')
                .appendTo(uiChatboxTitlebarMinimize),
            // content
            uiChatboxContent = (self.uiChatboxContent = $('<div></div>'))
                .addClass('ui-widget-content ' +
                          'ui-chatbox-content '
                         )
                .appendTo(uiChatbox),
            uiChatboxLog = (self.uiChatboxLog = self.element )
                .addClass('ui-widget-content ' +
                          'ui-chatbox-log'
                         )
                .appendTo(uiChatboxContent),
            uiChatboxInput = (self.uiChatboxInput = $('<div></div>'))
                .addClass('ui-widget-content ' +
                          'ui-chatbox-input'
                         )
                .click(function(event) {
                    // anything?
                })
                .appendTo(uiChatboxContent),
            uiChatboxInputBox = (self.uiChatboxInputBox = $('<textarea></textarea>'))
                .addClass('ui-widget-content ' +
                          'ui-chatbox-input-box ' +
                          'ui-corner-all'
                         )
                .appendTo(uiChatboxInput)
                .keydown(function(event) {
                    if (event.keyCode && event.keyCode == $.ui.keyCode.ENTER) {
                        msg = $.trim($(this).val());
                        if (msg.length > 0) {
                            self.options.messageSent(self.options.id, self.options.user, msg, 'text');
                        }
                        $(this).val('');
                        return false;
                    }
                })
                .focusin(function() {
                    uiChatboxInputBox.addClass('ui-chatbox-input-focus');
                    var box = $(this).parent().prev();
                    box.scrollTop(box.get(0).scrollHeight);
                })
                .focusout(function() {
                    uiChatboxInputBox.removeClass('ui-chatbox-input-focus');
                });

	    /*************************************************/
            uiChatboxSendMsgBtn = (self.uiChatboxSendMsgBtn = $('<button>ส่ง</button>'))
                .addClass('ui-widget-content ui-chatbox-send-btn')
                .appendTo(uiChatboxInput)
		.on('click', function(event) {
 			var e = $.Event( "keydown", { keyCode: 13 } );
    			$(self.uiChatboxInputBox).trigger(e);
		});

            uiChatboxSendImageBtn = (self.uiChatboxSendImageBtn = $('<button>ส่งรูป</button>'))
                .addClass('ui-widget-content ui-chatbox-send-btn')
                .appendTo(uiChatboxInput)
		.on('click', function(event) {
			let fileBrowser = $('<input type="file"/>');
			$(fileBrowser).attr("id", 'fileupload');
			$(fileBrowser).attr("name", 'chatboxphotos');
			$(fileBrowser).attr("multiple", true);
			//fileBrowser.setAttribute("onChange", 'return uploadImage("' + screenno + '")');
			$(fileBrowser).css('display', 'none');
			$(fileBrowser).on('change', function(e) {
				console.log(e.currentTarget.files[0]);
				const defSize = 1000000;
				var fileSize = e.currentTarget.files[0].size;
				var fileType = e.currentTarget.files[0].type;
				console.log(fileType);
				if (fileSize <= defSize) {
					var uploadUrl = "/" + options.rootName + "/uploadnormal";
					$('#fileupload').simpleUpload(uploadUrl, {
						start: function(file){
							console.log(file.name);
							console.log(file.type);
							console.log(file.size);
						},
						progress: function(progress){
							//received progress
							console.log("ดำเนินการได้ : " + Math.round(progress) + "%");
							//$('#progressBar-'+ groupid).width(progress + "%");
						},
						success: function(data){
							console.log('Uploaded.', data);
							var imageUrl = data.link;
							//var imageUrl = '../imgs/logo/who.png';
							$("#fileupload").replaceWith($("#fileupload").val('').clone(true));
							self.options.messageSent(self.options.id, self.options.user, imageUrl, 'image');
						},
						error: function(error){
							//upload failed
							console.log("Failure! " + error.name + ": " + error.message);
						}
					});
				} else {
					alert('File not excess ' + defSize + ' Byte.');
				}
			});
			$(fileBrowser).appendTo(uiChatboxInput);
			$(fileBrowser).click();

		});
	    /*************************************************/
            // disable selection
            uiChatboxTitlebar.find('*').add(uiChatboxTitlebar).disableSelection();

            // switch focus to input box when whatever clicked
            uiChatboxContent.children().click(function() {
                // click on any children, set focus on input box
                self.uiChatboxInputBox.focus();
            });

            self._setWidth(self.options.width);
            self._position(self.options.offset);

            self.options.boxManager.init(self);

            if (!self.options.hidden) {
                uiChatbox.show();
            }
        },
        _setOption: function(option, value) {
            if (value != null) {
                switch (option) {
                case "hidden":
                    if (value)
                        this.uiChatbox.hide();
                    else
                        this.uiChatbox.show();
                    break;
                case "offset":
                    this._position(value);
                    break;
                case "width":
                    this._setWidth(value);
                    break;
				case "rootname" :
					this.options.rootName = value;
					break;
				case "roomname" :
					this.options.roomName = value;
					break;
				case "user" :
					this.options.user = value;
					break;

                }
            }
            $.Widget.prototype._setOption.apply(this, arguments);
        },
        _setWidth: function(width) {
            this.uiChatboxTitlebar.width(width + "px");
            this.uiChatboxLog.width(width + "px");
            this.uiChatboxInput.css("maxWidth", width + "px");
            // padding:2, boarder:2, margin:5
            this.uiChatboxInputBox.css("width", (width - 18) + "px");
        },
        _position: function(offset) {
            this.uiChatbox.css("right", offset);
        }
    });
}(jQuery));
