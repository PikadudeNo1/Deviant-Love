/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
"use strict";
(function() {
	var cleanupTasks = [];
	var currentFocus = 0;
	var contextMenuWhitelistingDone;
	var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
		.getService(Components.interfaces.mozIJSSubScriptLoader);
	var {l10n, prefs, browserMod, loaded} =
		Components.utils.import("chrome://DeviantLove/content/global.js", {});
	function handleMessage(name, handler) {
		messageManager.addMessageListener("deviantlove@pikadudeno1.com:" + name, handler);
		cleanupTasks.push( function() {
			messageManager.removeMessageListener("deviantlove@pikadudeno1.com:" + name, handler);
		} );
	}
	function removalTask(node) {
		return Element.prototype.removeChild.bind(node.parentNode, node);
	}
	var foundLove = new WeakMap();
	window[browserMod] = {};
	
	var stylesheet = document.createProcessingInstruction("xml-stylesheet",
		'href="chrome://DeviantLove/content/browser.css" type="text/css"');
	document.insertBefore(stylesheet, document.firstChild);
	cleanupTasks.push( removalTask(stylesheet) );
	
	// Can't explain it, but using <image> with a click event instead of <button> with a command event seems to be the best (or most common) practice
	// Doing it that way ensures consistent "button" spacing with other extensions
	var heart = document.createElement("image");
	heart.id = "DeviantLoveHeart"; heart.className = "urlbar-icon"; heart.hidden = true;
	heart.setAttribute("src", "chrome://DeviantLove/content/core/16Icon.png");
	let heartDest = document.getElementById("urlbar-icons");
	heartDest.insertBefore(heart, heartDest.firstChild);
	function updateHeart(closing) {
		if (foundLove.has(gBrowser.selectedBrowser)) {
			heart.hidden = false;
			var clickToClose = closing !== true && (content.document == currentFocus) &&
				sidebar.hasAttribute("checked");
			if (clickToClose) {
				heart.tooltipText = l10n.getString("heartX");
				heart.setAttribute("src", "chrome://DeviantLove/content/16IconClose.png");
			} else {
				heart.tooltipText = "Deviant Love";
				heart.setAttribute("src", "chrome://DeviantLove/content/core/16Icon.png");
			}
		} else {
			heart.hidden = true;
		}
	}
	heart.addEventListener("click", summonRawkitude, false);
	cleanupTasks.push( removalTask(heart) );
	
	// From https://developer.mozilla.org/en-US/docs/Code_snippets/Tabbed_browser#Detecting_tab_selection
	gBrowser.tabContainer.addEventListener("TabSelect", updateHeart, false);
	handleMessage("foundLove", function(msg) {
		foundLove.set(msg.target, msg.data);
		updateHeart();
	});
	handleMessage("lostLove", function(msg) {
		foundLove.delete(msg.target);
		updateHeart();
	});
	cleanupTasks.push( function() {
		gBrowser.tabContainer.removeEventListener("TabSelect", updateHeart, false);
	} );
	
	var sidebar = document.createElement("broadcaster");
	sidebar.id = "DeviantLoveSidebar"; sidebar.setAttribute("group", "sidebar");
	sidebar.setAttribute("sidebarurl", "chrome://DeviantLove/content/sidebar.html");
	sidebar.setAttribute("sidebartitle", "Deviant Love");
	document.getElementById("mainBroadcasterSet").appendChild(sidebar);
	cleanupTasks.push( function() {
		if (sidebar.hasAttribute("checked")) {
			toggleSidebar("DeviantLoveSidebar");
		}
	} );
	cleanupTasks.push( removalTask(sidebar) );

	// The label property won't work for freshly-made elements. Some XBL thing.
	// Deviant Love doesn't actually need a reload button, but it's the most concise way to inform the user that the sidebar's report is static.
	var reload = document.createElement("button");
	reload.id = "DeviantLoveReload"; reload.setAttribute("label", "Reload"); reload.hidden = true;
	let reloadDest = document.getElementById("sidebar-header");
	reloadDest.insertBefore(reload, reloadDest.firstChild.nextSibling);
	cleanupTasks.push( removalTask(reload) );
	
	var artistCheck = document.createElement("menuitem");
	artistCheck.id = "DeviantLoveArtistCheck"; artistCheck.className = "menuitem-iconic";
	artistCheck.setAttribute("label", l10n.get("artistCheck", ["________"])); // For Fx extensions like Menu Editor
	var webContextMenu = document.getElementById("contentAreaContextMenu");
	webContextMenu.insertBefore(artistCheck, webContextMenu.firstChild);
	artistCheck.addEventListener("command", summonRawkitude);
	cleanupTasks.push( removalTask(artistCheck) );
	handleMessage("showArtistLove", function(msg) {
		artistCheck.label = l10n.get("artistCheck", [msg.data]);
		artistCheck.hidden = false;
	});
	handleMessage("noArtistLove", hideArtistLove);
	gBrowser.tabContainer.addEventListener("TabSelect", hideArtistLove);
	function hideArtistLove() {
		artistCheck.hidden = true;
	}
	cleanupTasks.push( function() {
		gBrowser.tabContainer.removeEventListener("TabSelect", hideArtistLove);
	} );
	
	function summonRawkitude(event) {
		if (!contextMenuWhitelistingDone) {
			let whitelist = document.querySelectorAll("#context-openlinkintab, #context-openlink, " +
				"#context-openlinkprivate, #context-sep-open, #context-bookmarklink, " +
				"#context-sharelink, #context-marklinkMenu, #context-copylink, " +
				"#context-undo, #context-sep-undo, #context-cut, #context-copy, " +
				"#context-paste, #context-delete, #context-sep-paste, #context-selectall");
			for (let i = 0; i < whitelist.length; ++i) {
				whitelist[i].classList.add("DeviantLoveWhitelisted");
			}
			contextMenuWhitelistingDone = true;
			cleanupTasks.push( function() {
				let whitelisted = document.getElementsByClassName("DeviantLoveWhitelisted");
				for (let i = 0; i < whitelisted.length; ++i) {
					whitelisted[i].classList.remove("DeviantLoveWhitelisted");
				}
			} );
		}
		
		// TODO: Find multiprocess-friendly ways to track current focus and determine the requested deviant
		var doc = content.document;
		if (doc == currentFocus) {
			if (this == heart) {
				toggleSidebar("DeviantLoveSidebar");
			} else if (!document.getElementById("sidebar").contentWindow[loaded]) {
				window[browserMod].firstDeviant = gContextMenu.target.textContent;
				toggleSidebar("DeviantLoveSidebar", true);
			} else {
				document.getElementById("sidebar").contentWindow.showDeviant(gContextMenu.target.textContent);
			}
		} else {
			window[browserMod].currentPageData = foundLove.get(gBrowser.selectedBrowser);
			if (this == artistCheck) {window[browserMod].firstDeviant = gContextMenu.target.textContent;};
			delete window[browserMod].currentScanData;
			currentFocus = doc; // Thanks to Kyle Huey for making this safe! (bug 695480)
			if (document.getElementById("sidebar").contentWindow[loaded]) {
				document.getElementById("sidebar").contentWindow.restart();
			}
			toggleSidebar("DeviantLoveSidebar", true);
		}
		
		updateHeart();
	}
	window[browserMod].sidebarUnloaded = function() {
		updateHeart(true);
	}
	window[browserMod].shuttingDown = function() {
		cleanupTasks.forEach( function(task) { task(); } );
	}
})();