/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
"use strict";

function findLove(favesWindow) {
	var win = favesWindow || window;
	var document = win.document;
	var location = win.location;
	var love = {};

	love.feedHref = document.querySelector('link[rel="alternate"][type="application/rss+xml"]').href;
	if (location.pathname == "/favourites/" && location.search == "") {
		love.pageType = "featured";
	} else if (location.search == "?catpath=/") {
		love.pageType = "allFaves";
	} else if ((/\/\d+\//).test(location.pathname) || (/\?\d+/).test(location.search)) {
		love.pageType = "collection";
	} else {
		// Assume search results
		love.pageType = "search";
	}
	// While the mechanism for declaring RSS feeds is standardized, the dA layout is not and can change. Be careful!
	var element;
	if (love.pageType != "collection") {
		element = document.querySelector(".gruserbadge a.u");
		love.ownerOrTitle = element ? element.textContent : "???????";
	} else {
		element = document.querySelector(".folderview-top .folder-title");
		love.ownerOrTitle = element ? element.textContent : "???????";
	}
	element = document.querySelector("#gallery_pager");
	love.maxDeviations = element ? Number(element.getAttribute("gmi-limit")) : null;
	// "1" is a junk value DeviantArt uses when it doesn't know
	if (love.maxDeviations == 1) {
		love.maxDeviations = null;
	}

	return love;
}