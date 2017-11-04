/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
"use strict";

var panel = document.createElement("iframe");
panel.id = "DeviantLovePanel";
panel.hidden = true;
document.body.appendChild(panel);
var shield = document.createElement("div");
shield.id = "DeviantLoveShield";
shield.hidden = true;
document.body.appendChild(shield);
var panelState = "inactive";
var panelStage = "uninitialized";

chrome.runtime.onMessage.addListener( function(thing, buddy, callback) {switch (thing.action) {
	case "spark":
		if (panelState == "inactive") {activate()} else
		if (panelState == "active") {deactivate()};
	break;
	case "artistRequested":
		activate(thing.artist);
	break;
	case "scanningComplete":
		panelStage = "love";
	break;
}} );

function activate(firstDeviant) {
	panel.hidden = false;
	shield.hidden = false;
	panelState = "preparing";
	if (panelStage == "uninitialized") {
		chrome.runtime.onMessage.addListener( function panelReady(thing) {
			if (thing.action == "panelReady") {
				panelStage = "scanning";
				reveal();
				chrome.runtime.onMessage.removeListener(panelReady);
			}
		} );
		panel.src = chrome.runtime.getURL("report/popup.html" + (firstDeviant ? "#" + firstDeviant : ""));
	} else if (panelStage == "scanning") {
		chrome.runtime.sendMessage({action: "echo", echoAction: "resumeScan"});
		// http://timtaubert.de/blog/2012/09/css-transitions-for-dynamically-created-dom-elements/
		window.getComputedStyle(panel).display;
		window.getComputedStyle(shield).display;
		// With our elements' display truly set, we are free to transition them! Thanks, Tim! ♡
		reveal();
	} else {
		chrome.runtime.sendMessage({action: "echoWithCallback", echoAction: "changeTip"}, reveal);
	}
	function reveal() {
		panel.classList.add("reveal");
		shield.classList.add("reveal");
		panelState = "active";
		chrome.runtime.sendMessage({action: "showX"});
		shield.addEventListener("click", deactivate, false);
	}
}
function deactivate() {
	shield.removeEventListener("click", deactivate, false);
	if (panelStage == "scanning") {
		chrome.runtime.sendMessage({action: "echo", echoAction: "pauseScan"})
	}
	panel.addEventListener("transitionend", function hide() {
		panel.hidden = true;
		shield.hidden = true;
		panel.removeEventListener("transitionend", hide, false);
		panelState = "inactive";
	}, false);
	panel.classList.remove("reveal");
	shield.classList.remove("reveal");
	panelState = "deactivating";
	chrome.runtime.sendMessage({action: "noX"});
}