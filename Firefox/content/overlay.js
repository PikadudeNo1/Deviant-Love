/*
	This file is part of Deviant Love.
	Copyright 2010 Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
/* At the cost of readability, the identifier "DeviantLove" is used a few different ways in this code. I'd rewrite it to use different identifiers for each purpose if I could think of identifiers as brief as "DeviantLove" without risking collisions with other extensions.
	- The global variable DeviantLove is used as a "message center" for communication between this file and the sidebar, as well as a second parameter for loadSubScript.
	- doc.DeviantLove stores per-page information.
	- document.getElementById("sidebar").contentWindow.DeviantLove is set by the sidebar to inform this file that it is present and loaded.
*/

var DeviantLove = {};

window.addEventListener("load", function() {
	var currentFocus = 0;
	var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
		.getService(Components.interfaces.mozIJSSubScriptLoader);
	
	gBrowser.addEventListener("DOMContentLoaded", setup, false);
	gBrowser.addEventListener("pageshow", setup, false);
	function setup(event) {
		var doc = event.originalTarget;
		if (!doc.DeviantLove &&
			(/http:\/\/[a-zA-Z\d\-]+\.deviantart\.com\/favourites\//).test(doc.URL)) {
			doc.DeviantLove = {};
			if (!DeviantLove.findLove) {
				loader.loadSubScript("chrome://DeviantLove/content/core/detector.js", DeviantLove);
			};
			doc.DeviantLove.pageData = DeviantLove.findLove(doc.defaultView);
			checkLove();
		}
	}
	gBrowser.addEventListener("pagehide", function(event) {
		var doc = event.originalTarget;
		if (doc.DeviantLove) {
			doc.DeviantLove = null;
			checkLove();
		}
	}, false);
	// From https://developer.mozilla.org/en/Code_snippets/Tabbed_browser#Detecting_tab_selection
	gBrowser.tabContainer.addEventListener("TabSelect", checkLove, false);

	var heart = document.getElementById("Deviant-Love-Heart");
	function checkLove() {
		var lovePresent = Boolean(content.document.DeviantLove);
		heart.hidden = !lovePresent;
	}
	heart.addEventListener("command", function() {
		var doc = content.document;
		if (doc.DeviantLove.focus == currentFocus) {
			toggleSidebar("DeviantLoveSidebar");
		} else {
			if (!DeviantLove.popupText) {
				loader.loadSubScript("chrome://DeviantLove/locale/popupText.js", DeviantLove);
			}
			DeviantLove.currentPageData = doc.DeviantLove.pageData;
			doc.DeviantLove.focus = ++currentFocus;
			if (document.getElementById("sidebar").contentWindow.DeviantLove) {
				document.getElementById("sidebar").contentWindow.restart();
			}
			toggleSidebar("DeviantLoveSidebar", true);
		}
	}, false);
}, false);

window.addEventListener("unload", function() {
	if (document.getElementById("sidebar").getAttribute("src") ==
		document.getElementById("DeviantLoveSidebar").getAttribute("sidebarurl")) {
		toggleSidebar();
	}
}, false);