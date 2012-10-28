"use strict";
var displayType = "popup";
$(document).ready( function() {
	$("body").css({
		"-webkit-box-sizing": "border-box",
		"height": $(window).height(),
		"margin": 0
	});
	chrome.extension.sendRequest({action: "popupSetup"},
		function(initData) {
			fulfillPurpose(initData.pageType);
			if (location.hash) {showDeviant(location.hash.slice(1))};
			chrome.extension.connect({name: "fetchFeedData"}).onMessage.addListener(collectResearch);
		}
	)
} );
function collectResearch(thing) {switch (thing.whatsUp) {
	case "faves": setData(thing.data); break;
	case "progress": setProgress.apply(window, thing.args); break;
	case "scanError": scanError(); break;
	case "watched": collectWatchlist(thing.data); break;
	case "watchError": watchError(); break;
}}
chrome.extension.onRequest.addListener(function(thing, buddy, callback) {switch (thing.action) {
	case "scanningComplete":
		// This message can't be received through the port because manager.js needs to receive it, too
		scanDone_startFun(thing.tip);
	break;
	case "changeTip":
		tipOfTheMoment(thing.tip);
		callback();
	break;
	case "artistRequested":
		showDeviant(thing.artist);
	break;
}});
function scanRetry() {
	chrome.extension.sendRequest({action: "scanRetry"});
}
function getL10nMsg(msgName, replacements, callback, tmpMsg) {
	if (tmpMsg) { callback(tmpMsg); };
	chrome.extension.sendRequest({
		action: "getMessage",
		"msgName": msgName,
		"replacements": replacements
	}, callback);
}
$(document).delegate("a", "click", function(event) {
	if (event.button == 0) { window.open(this.href); }
	event.preventDefault();
} );
$(window).bind("resize", function() {
	$("body").height($(window).height());
} );