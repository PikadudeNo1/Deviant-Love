/*
	This file is part of Deviant Love.
	Copyright 2010-2012 Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
"use strict";
chrome.extension.onRequest.addListener( function(thing, buddy, callback) {switch (thing.action) {
	case "showLove":
		chrome.pageAction.show(buddy.tab.id);
	break;
	case "popupSetup":
		chrome.tabs.sendRequest(buddy.tab.id, {action: "getFulfillPurposeParams"}, function(pageType) {
			callback({"pageType": pageType});
		} );
		chrome.tabs.sendRequest(buddy.tab.id, {action: "popupReady"})
	break;
	case "getMessage":
		callback(chrome.i18n.getMessage(thing.msgName, thing.replacements));
	break;
	case "sendTip":
		getTip(function(tip) {chrome.tabs.sendRequest(buddy.tab.id,
			{action: "changeTip", "tip": tip}, callback)});
	break;
	case "showArtistLove":
		chrome.contextMenus.create({
			title: chrome.i18n.getMessage("artistCheck", thing.artist),
			contexts: ["link"],
			onclick: function() {
				chrome.tabs.sendRequest(buddy.tab.id, {action: "artistRequested", artist: thing.artist});
			}
		});
	break;
	case "noArtistLove":
		chrome.contextMenus.removeAll();
	break;
}} );
chrome.pageAction.onClicked.addListener( function(buddy) {
	chrome.tabs.sendRequest(buddy.id, {action: "spark"});
} );
chrome.tabs.onSelectionChanged.addListener( function() {
	chrome.contextMenus.removeAll();
} );
var l10n = {};
function getL10nFile(fileName, callback) {
// Currently used only by getTip, but it doesn't seem worth it to merge the two
	if (l10n[fileName]) {
		callback(l10n[fileName]);
	} else {
		$.getJSON(chrome.i18n.getMessage("l10nFolder") + fileName + ".json", function(data) {
			l10n[fileName] = data;
			callback(data);
		})
	}
}
function getTip(callback) {
	// localStorage.nextTip is 1-based, but JavaScript array indexes are 0-based. Oh well.
	var nextTip = localStorage.nextTip || 1;
	getL10nFile("TipOfTheMoment", function(tips) {
		callback(tips[nextTip - 1]);
		nextTip++;
		if (nextTip > tips.length) {nextTip = 1}
		localStorage.nextTip = nextTip;
	} );
}
chrome.extension.onConnect.addListener( function(port) {
	chrome.tabs.sendRequest(port.sender.tab.id, {action: "getResearchLoveParams"}, function(params) {
		var scannerController = researchLove(params.feedHref, params.maxDeviations, {
			faves: function(data) { port.postMessage({whatsUp: "faves", "data": data}); },
			progress: function() { port.postMessage({whatsUp: "progress", args: $.makeArray(arguments)}) },
			onFavesError: function() {
				chrome.extension.onRequest.addListener( function scanRetry(thing, buddy, callback) {
					if (buddy.tab.id == port.sender.tab.id && thing.action == "scanRetry") {
						scannerController.favesRetry();
						chrome.extension.onRequest.removeListener(scanRetry);
					}
				} );
				port.postMessage({whatsUp: "scanError"});
			},
			watched: function(data) { port.postMessage({whatsUp: "watched", "data": data}); },
			onWatchError: function() { port.postMessage({whatsUp: "watchError"}); },
			onDone: function() {
				getTip(function(tip) {
					chrome.extension.onRequest.removeListener(stateChangeReaction);
					chrome.tabs.sendRequest(port.sender.tab.id, {action: "scanningComplete", "tip": tip});
					port.disconnect();
				});
			}
		});
		chrome.extension.onRequest.addListener(stateChangeReaction);
		function stateChangeReaction(thing, buddy) {if (buddy.tab.id == port.sender.tab.id) {
			if (thing.action == "pauseScan") {
				scannerController.pause();
			} else if (thing.action == "resumeScan") {
				scannerController.resume();
			}
		}}
		port.onDisconnect.addListener(function() {
			scannerController.cancel();
			chrome.extension.onRequest.removeListener(stateChangeReaction);
		})
	} );
} );
// No way to opt out of the console spam this creates if there's no preview version installed. Tried try/catch, tried a callback parameter, nothing stopped it.
chrome.extension.sendRequest("hibomgnjacfmgijhjlhagemclnkijlcj", {action: "obsolete", reachedFinal: 2.0});