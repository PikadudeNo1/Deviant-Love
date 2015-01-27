/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
"use strict";
chrome.runtime.onMessage.addListener( function(thing, buddy, callback) {switch (thing.action) {
	case "showLove":
		chrome.pageAction.show(buddy.tab.id);
	break;
	case "showX":
		chrome.pageAction.setIcon({tabId: buddy.tab.id, path: "19IconClose.png"});
		chrome.pageAction.setTitle({tabId: buddy.tab.id, title: chrome.i18n.getMessage("heartX")});
	break;
	case "noX":
		chrome.pageAction.setIcon({tabId: buddy.tab.id, path: "19Icon.png"});
		chrome.pageAction.setTitle({tabId: buddy.tab.id, title: "Deviant Love"});
	break;
	case "sendTip":
		getTip(function(tip) {chrome.tabs.sendMessage(buddy.tab.id,
			{action: "changeTip", "tip": tip}, callback)});
		return true;
	break;
	case "showArtistLove":
		chrome.contextMenus.create({
			title: chrome.i18n.getMessage("artistCheck", thing.artist),
			id: "artistLove:" + thing.artist,
			contexts: ["link"]
		});
	break;
	case "noArtistLove":
		chrome.contextMenus.removeAll();
	break;
	// For communication between manager.js and popup.js
	case "echo":
		thing.action = thing.echoAction;
		chrome.tabs.sendMessage(buddy.tab.id, thing);
	break;
	case "echoWithCallback":
		thing.action = thing.echoAction;
		chrome.tabs.sendMessage(buddy.tab.id, thing, function(retVal) { callback(retVal); });
		return true;
	break;
}} );
chrome.pageAction.onClicked.addListener( function(buddy) {
	chrome.tabs.sendMessage(buddy.id, {action: "spark"});
} );
chrome.contextMenus.onClicked.addListener( function(click, buddy) {
	var artist = click.menuItemId.substr( "artistLove:".length );
	chrome.tabs.sendMessage(buddy.id, {action: "artistRequested", artist: artist});
} );

chrome.runtime.onInstalled.addListener( function onUpdate(info) {
	if (info.reason != "update") { return; }
	if (localStorage.nextTip) {
		chrome.storage.local.set({nextTip: localStorage.nextTip - 1});
		localStorage.clear();
	}
} );
chrome.runtime.onConnect.addListener( function(port) {
	if (port.name != "fetchFeedData") { return; }
	chrome.tabs.sendMessage(port.sender.tab.id, {action: "getResearchLoveParams"}, function(params) {
		var scannerController = researchLove(params.feedHref, params.maxDeviations, {
			faves: function(data) { port.postMessage({whatsUp: "faves", "data": data}); },
			progress: function() { port.postMessage({whatsUp: "progress", args: $.makeArray(arguments)}) },
			onFavesError: function() {
				chrome.runtime.onMessage.addListener( function scanRetry(thing, buddy, callback) {
					if (buddy.tab.id == port.sender.tab.id && thing.action == "scanRetry") {
						scannerController.favesRetry();
						chrome.runtime.onMessage.removeListener(scanRetry);
					}
				} );
				port.postMessage({whatsUp: "scanError"});
			},
			watched: function(data) { port.postMessage({whatsUp: "watched", "data": data}); },
			onWatchError: function() { port.postMessage({whatsUp: "watchError"}); },
			onDone: function() {
				chrome.runtime.onMessage.removeListener(stateChangeReaction);
				chrome.tabs.sendMessage(port.sender.tab.id, {action: "scanningComplete"});
				port.disconnect();
			}
		});
		chrome.runtime.onMessage.addListener(stateChangeReaction);
		function stateChangeReaction(thing, buddy) {if (buddy.tab.id == port.sender.tab.id) {
			if (thing.action == "pauseScan") {
				scannerController.pause();
			} else if (thing.action == "resumeScan") {
				scannerController.resume();
			}
		}}
		port.onDisconnect.addListener(function() {
			scannerController.cancel();
			chrome.runtime.onMessage.removeListener(stateChangeReaction);
		})
	} );
} );
// No handler needed for keepAlive ports

// No way to opt out of the console spam this creates if there's no preview version installed. Tried try/catch, tried a callback parameter, nothing stopped it.
chrome.runtime.sendMessage("hibomgnjacfmgijhjlhagemclnkijlcj", {action: "obsolete", reachedFinal: 2.0});