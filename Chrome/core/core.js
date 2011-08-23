/*
	This file is part of Deviant Love.
	Copyright 2010 Pikadude No. 1

	Deviant Love is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	Deviant Love is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with Deviant Love.  If not, see <http://www.gnu.org/licenses/>.
*/
/* Defined elsewhere:
	- $ (jQuery)
	- New Array methods in ECMAScript 5th Edition
	- scanRetry function
	- displayType string
	- getL10nMsg function
*/
"use strict";

function fulfillPurpose(pageType, ownerOrTitle) {
	var deviantList = [];
	var deviantBag = {};
	var totalDeviations = 0;
	var firstDeviant;
	var watchedArtists;
	// When a deviant is recorded, a reference should be added to both the list and the bag.
	
	var supportsProgress = (document.createElement("progress").max !== undefined);

	$("body").css("cursor", "wait");
	var preparationScreen = $("<div>", {id: "preparationScreen"}).appendTo(document.body);
	var scanMessage = ({
		featured: "scanningFeatured",
		allFaves: "scanningAll",
		collection: "scanningCollection"
	})[pageType];
	$("<div>", {id: "scanMessage"}).l10n(scanMessage).appendTo(preparationScreen);
	var scanProgressBar;
	if (supportsProgress) {
		scanProgressBar = $("<progress>", {id: "scanProgressBar", max: 1, value: 0})
			.appendTo(preparationScreen);
	} else {
		// Make a dummy object so that when support for Firefox <6 is dropped, I don't have to change much
		scanProgressBar = { show: $.noop, hide: $.noop };
	}
	var scanProgressInfo = $("<div>", {id: "scanProgressInfo"}).appendTo(preparationScreen);
	var watchStatus = $("<div>", {id: "watchStatus"}).appendTo(preparationScreen);
	window.collectData = function(newData) {
		newData.forEach(function(item) {
			if (!deviantBag[item.artistName]) {
				var newDeviant = {};
				newDeviant.name = item.artistName;
				newDeviant.avatar = item.artistAvatar;
				newDeviant.baseURL = item.artistURL;
				newDeviant.deviations = [];
				deviantBag[item.artistName] = newDeviant;
				deviantList.push(newDeviant);
			}
			deviantBag[item.artistName].deviations.push({
				name: item.deviationName,
				URL: item.deviationPage
			});
			totalDeviations++;
		});
		scanProgressInfo.l10n("scanProgress", totalDeviations);
		if (supportsProgress) {
			if (newData.progress !== null) {
				scanProgressBar.attr("value", newData.progress);
			} else {
				scanProgressBar.removeAttr("value");
			}
		} else {
			if (newData.progress !== null) {
				scanProgressInfo[0].textContent += " (" + newData.progress + "%)";
			}
		}
	}
	window.scanError = function() {
		$("body").css("cursor", "");
		scanProgressBar.hide();
		scanProgressInfo.hide();
		watchStatus.hide();
		$("<div>", {id: "scanError"}).l10n("scanError").appendTo(preparationScreen);
		$("<button>", {id: "retryButton"}).l10n("scanErrorRetry")
			.bind("click", function() {
				$(this).add("#scanError").remove();
				scanProgressBar.hide();
				scanProgressInfo.show();
				watchStatus.show();
				$("body").css("cursor", "wait");
				scanRetry();
			} )
			.appendTo(preparationScreen);
	}
	window.showDeviant = function(deviantName) {
	// This will be replaced by scanDone_startFun.
		firstDeviant = deviantName;
	}
	window.collectWatchlist = function(list) {
		watchedArtists = list;
		watchStatus.l10n("watchSuccess");
	}
	window.watchError = function() {
		watchStatus.l10n("watchFailure");
	}
	window.restore = function(data, firstTip) {
		deviantList = data.deviantList;
		deviantList.forEach(function(deviant) {
			deviantBag[deviant.name] = deviant;
			totalDeviations += deviant.deviations.length;
		});
		watchedArtists = data.watchRetrievalOK; /*
		Only scanDone_startFun needs real information there, and restore bypasses that. So, that only need be truthy or falsey. */
		report(firstTip);
	}
	window.scanDone_startFun = function(firstTip) {
		deviantList.sort(function orderMostLoved(a, b) {
			if (a.deviations.length != b.deviations.length) {
				return b.deviations.length - a.deviations.length;
			} else {
				return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
			}
		});
		if (watchedArtists) {
			watchedArtists.forEach(function(awesome) {
				if (deviantBag[awesome]) {
					deviantBag[awesome].watched = true;
				}
			});
		}
		
		report(firstTip);
		return {"deviantList": deviantList, watchRetrievalOK: Boolean(watchedArtists)}; // Needed by the Firefox version
	}
	function report(firstTip) {
		// Construct the UI
		preparationScreen.remove();
		var mainScreen = $("<div>", {id: "mainScreen"});
		mainScreen.appendTo(document.body);
		var scanResults = $("<div>", {id: "scanResults"});
		if (!watchedArtists) {
			$("<div>", {id: "watchFailure"}).l10nTooltip("watchFailure").appendTo(scanResults);
		}
		if (displayType == "popup") {
			var scanResultsLine1 = ({
				featured: "scanFeaturedResultsPopupLine1",
				allFaves: "scanAllResultsPopupLine1",
				collection: "scanCollectionResultsPopupLine1"
			})[pageType];
			scanResults.append($("<div>").l10nHtml(scanResultsLine1,
				'<span class="dynamic">' + Number(totalDeviations) + '</span>')); // The Number call is there to help out AMO reviewers; same for the other calls below
		} else { // displayType == "sidebar"
			if (/[\<\>\&]/.test(ownerOrTitle)) {ownerOrTitle = "?????????";};
			var scanResultsLine1 = (pageType == "collection") ?
				"scanCollectionResultsSidebarLine1" :
				"scanNonCollectionResultsSidebarLine1";
			var scanResultsLine2 = (pageType == "featured") ?
				"scanFeaturedResultsSidebarLine2" :
				"scanNonFeaturedResultsSidebarLine2";
			scanResults.append($("<div>").l10nHtml(scanResultsLine1,
				'<span class="dynamic">' + ownerOrTitle + '</span>')) // ownerOrTitle is filtered for safety a few lines up
				.append($("<div>").l10nHtml(scanResultsLine2,
				'<span class="dynamic">' + Number(totalDeviations) + '</span>'))
		}
		scanResults.append($("<div>").l10nHtml("scanResultsLastLine",
			'<span class="dynamic">' + Number(deviantList.length) + '</span>'))
			.appendTo(mainScreen);
		$("<form>", {id: "findBar"})
			.append($("<input>", {type: "text", id: "query"}))
			.append($("<button>", {id: "goFind"}))
			.append($("<button>", {id: "noFind"}))
			.appendTo(mainScreen);
		// jQuery apparently refuses to set a button's type. "it causes problems in IE", they say.
		$("#goFind")[0].setAttribute("type", "submit");
		$("#noFind")[0].setAttribute("type", "button");
		if ($("#query")[0].placeholder !== undefined) {
			$("#query").l10nPlaceholder("queryPlaceholder");
		} else {
			makeL10nMethod("l10nVal", $.fn.val, "");
			$("#query").addClass("placeholder").l10nVal("queryPlaceholder");
		}
		$("<div>", {id: "queryError"}).hide().appendTo(mainScreen);
		var lovedArtists = $("<div>", {id: "lovedArtists"})
			.css({"overflow-y": "auto", "overflow-x": "hidden"})
			.append(snackOnMyWrath(deviantList))
			.appendTo(mainScreen);
		if (lovedArtists.css("position") == "static") { lovedArtists.css("position", "relative") } // Needed for scrollToDeviationList. It's as weird as it to ensure future compatibility with the skinning feature.
		$("<div>", {id: "tipOfTheMoment"})
			.append($("<img>", {id: "tOTMIcon"}))
			.append($("<div>", {id: "tOTMText"}))
			.appendTo(mainScreen);
		tipOfTheMoment(firstTip);

		// Set up interaction
		lovedArtists.delegate(".deviant:not(.opened)", "click", function() {
			$(".opened.deviant").removeClass("opened");
			$(".deviant > .closerLook").animate({height: 0}, {
				duration: 400,
				easing: "swing",
				complete: function() {$(this).remove();}
			})

			var deviant = deviantBag[$(".deviantName", this).text()];
			var closerLook = buildCloserLook(deviant, deviant.deviations);
			$(this).append(closerLook).addClass("opened");
			var closerLookHeight = closerLook.height();
			closerLook.height(0).animate({height: closerLookHeight}, {
				duration: 400,
				easing: "swing",
				step: scrollToDeviationList
			});
		} );
		if ($("#query").hasClass("placeholder")) { // Placeholder attribute emulation
			$("#query").bind("focus", function() {
				if ($(this).hasClass("placeholder")) {
					$(this).val("").removeClass("placeholder");
				}
			} ).bind("blur", function() {
				if ($(this).val() == "") {
					$(this).addClass("placeholder").l10nVal("queryPlaceholder");
				}
			} )
		}
		$("#query").bind("input", function(event) {
			var checkResult = queryTroubleCheck();
			if (typeof checkResult == "object") {
				$("#queryError").l10n(checkResult.errMsg, checkResult.offender).show();
			} else {
				$("#queryError").hide();
			}
		} );
		$("#findBar").submit(findStuff);
		$("#noFind").bind("click", normalMode);
		
		// Handle requests for a particular deviant that were made elsewhere (e.g. context menu)
		if (firstDeviant) {
			$.fx.off = true;
			$("#deviant_" + firstDeviant).trigger("click")
				.get(0).scrollIntoView();
			$.fx.off = false;
		}
		window.showDeviant = function(deviantName) {
			normalMode();
			$.fx.off = (displayType == "popup");
			$("#deviant_" + deviantName).trigger("click")
				.get(0).scrollIntoView();
			$.fx.off = false;
		}

		// All done, now go play!
		$("body").css("cursor", "");
	}
	function findStuff(event) {
		event.preventDefault();
		if (queryTroubleCheck() != false) { return };

		// Everything related to advanced operators is being disabled for the 2.0 release, to avoid delaying it even further.
		/*
		var firstSplit = $("#query").val().split("~");
		var ignoreList = firstSplit.slice(1);
		var queryChunks = firstSplit[0].split("&");
		*/
		/* Temporary replacement */ var queryChunks = [$("#query").val()];

		// ignoreList = ignoreList.map( function(ignore) {return ignore.trim().toLowerCase()} );
		queryChunks = queryChunks.map( function(chunk) {return chunk.trim().toLowerCase()} );
		var checkDeviants = queryChunks.every( function(chunk) {
			return (/[a-zA-Z0-9\-]+/).exec(chunk)[0] == chunk;
		} );

		var deviantMatches = [];
		var deviationMatches = [];
		deviantList.forEach( function(deviant) {
			if (checkDeviants && isMatch(deviant.name)) {
				deviantMatches.push(deviant);
			}
			var deviantDeviationMatches = [];
			deviant.deviations.forEach( function(deviation) {
				if (isMatch(deviation.name)) {
					deviantDeviationMatches.push(deviation);
				}
			} );
			if (deviantDeviationMatches.length > 0) {
				deviationMatches.push({"deviant": deviant, "deviations": deviantDeviationMatches});
			}
		} );
		function isMatch(needle) {
			needle = needle.toLowerCase();
			/*
			ignoreList.forEach( function(ignore) {
				// My research tells me String.replace will only replace the first instance of its first parameter, unless said parameter is a global RegExp.
				// But ignoreList doesn't consist of global RegExps, it consists of strings. The workaround?
				needle = needle.split(ignore).join("~");
			} );
			*/
			return queryChunks.every( function(chunk) {
				return needle.indexOf(chunk) != -1;
			} );
		}

		$("#mainScreen").addClass("lookWhatIFound");
		var lovedArtists = $("#lovedArtists").empty().removeClass("noResults");
		if (deviantMatches.length == 0 && deviationMatches.length == 0) {
			lovedArtists.l10n("foundNothing").addClass("noResults")
			return;
		}
		if (deviantMatches.length > 0) {
			lovedArtists.append( $("<div>", {"class": "foundHeader"})
				.l10n("foundDeviants", deviantMatches.length) )
				.append(snackOnMyWrath(deviantMatches));
		}
		if (deviationMatches.length > 0) {
			deviationMatches.forEach( function(found) {
				var closerLook = buildCloserLook(found.deviant, found.deviations);
				lovedArtists.append( $("<div>", {"class": "foundHeader"})
					.l10n("foundDeviations", found.deviant.name, found.deviations.length) )
					.append(closerLook);
				closerLook.height(closerLook.height()); // Sounds a bit silly but the CSS needs it.
			} );
		}
	}
	function normalMode() {
		if ($("#mainScreen").hasClass("lookWhatIFound")) {
			$("#mainScreen").removeClass("lookWhatIFound");
			$("#lovedArtists").removeClass("noResults").empty().append(snackOnMyWrath(deviantList));
		}
	}
}

function tipOfTheMoment(tip) {
	$("#tOTMIcon").attr("src", "core/" + tip.icon);
	$("#tOTMText").html(tip.html);
}
function scrollToDeviationList() {
// Differs from the DOM method scrollIntoView in that it doesn't align .opened.deviant with either the top or bottom of the display area unless that is necessary to keep it in view
	// It's actually easier NOT to use jQuery here.
	var lovedArtistsElem = document.getElementById("lovedArtists");
	var openedDeviantElem = document.querySelector(".opened.deviant");
	var scroll = lovedArtistsElem.scrollTop;
	if (scroll + lovedArtistsElem.clientHeight <
		openedDeviantElem.offsetTop + openedDeviantElem.offsetHeight) {
		scroll = openedDeviantElem.offsetTop + openedDeviantElem.offsetHeight
			- lovedArtistsElem.clientHeight;
	}
	if (scroll > openedDeviantElem.offsetTop) {
		scroll = openedDeviantElem.offsetTop;
	}
	lovedArtistsElem.scrollTop = scroll;
}
// snackOnMyWrath and buildCloserLook are needed by both scanDone_startFun and findStuff
function snackOnMyWrath(finkRats) {
	// "You have energy like a little angry battery with no friends."
	var rageDressing = $();
	finkRats.forEach( function(deviant) {
		var devWatchElem = $("<div>", {"class": "deviationWatch"}).html("&nbsp;");
		var deviantElem = $("<div>", {"class": "deviant", id: "deviant_" + deviant.name})
			.append(devWatchElem).append($("<span>", {"class": "deviantFaves"})
			.text(deviant.deviations.length));
		if (deviant.watched) {
			devWatchElem.addClass("true").l10nTooltip("watchingThisArtist");
		}
		deviantElem.append($("<span>", {"class": "deviantName"}).text(deviant.name));
		rageDressing = rageDressing.add(deviantElem);
	} );
	return rageDressing; // on a salad of evil
}
function buildCloserLook(deviant, deviations) {
// Anything relying on this function will need to make sure that returned element's CSS height is set to its natural height. The CSS assumes that that has been done.
	var closerLook = $("<div>", {"class": "closerLook"}).css("overflow", "hidden");

	var deviantDetails = $("<div>", {"class": "deviantDetails"});
	deviantDetails.append($("<a>", {"href": deviant.baseURL}) // Note two opening parens and only one closing paren
		.append($("<img>", {src: deviant.avatar, "class": "avatar", width: 50, height: 50})));
	deviantDetails.append($("<div>", {"class": "deviantLinks"}) // Ditto
		.append($("<a>", {"href": deviant.baseURL, "class": "profileLink"})
			.l10nTooltip("profile"))
		.append($("<a>", {"href": deviant.baseURL + "gallery/", "class": "galleryLink"})
			.l10nTooltip("gallery"))
		.append($("<a>", {"href": deviant.baseURL + "favourites/", "class": "favouritesLink"})
			.l10nTooltip("favourites")))
	deviantDetails.appendTo(closerLook);

	var deviationList = $("<div>", {"class": "deviationList"});
	deviations.forEach( function(deviation) {
		$("<div>", {"class": "deviation"})
			.append($("<a>", {href: deviation.URL}).text(deviation.name))
			.appendTo(deviationList)
	} );
	deviationList.appendTo(closerLook);

	return closerLook;
}
function queryTroubleCheck() {
// Returns false if there are no troubles, true if there is a trouble not worth reporting to the user, and an object otherwise
	var query = $("#query").val();

	if (query.length == 0 || $("#query").hasClass("placeholder")) { return true };

	var invalidChar = query.search(/[^a-zA-Z0-9 \_\'\"\+\.\,\$\?\:\-]/);
	if (invalidChar != -1) {
		return {errMsg: "findErrorForbiddenCharacter", offender: query.charAt(invalidChar)};
	}

	return false;
}
function makeL10nMethod(methodName, effect, tmpMsg) {
	$.fn[methodName] = function(msgName) {
		var replacements = $.makeArray(arguments).slice(1);
		if (replacements.length == 0) {replacements = undefined};
		var textInPlace = this.attr("data-l10n") == msgName; // Not very accurate with multiple elements, but for Deviant Love that doesn't matter
		// l10nMethod will be needed for v3.0, when the user will be able to choose a language
		this.attr("data-l10n", msgName)/*.data("l10nMethod", methodName)*/;
		getL10nMsg(msgName, replacements, $.proxy(effect, this), tmpMsg);
		return this;
	}
}
[
	["l10n", $.fn.text, " "],
	["l10nHtml", $.fn.html, "&nbsp;"],
	["l10nTooltip", function(msg) {this.attr("title", msg);}, ""],
	["l10nPlaceholder", function(msg) {this.attr("placeholder", msg);}, ""]
].forEach(function(args) {makeL10nMethod.apply(null, args);});