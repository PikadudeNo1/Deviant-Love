var templateContents = {};
fillL10n(document);
for (let elem of Array.from( document.getElementsByTagName("template") )) {
	fillL10n(elem.content);
	templateContents[elem.id] = document.importNode(elem.content, true);
}
var subaccounts;
apiAdapter.retrieve(["subaccounts"]).then((data) => {
	({subaccounts} = data);
	for (let owner in subaccounts) {
		$(".newOwner").before( makeOwnerElem(owner) );
	}
});
function makeOwnerElem(owner) {
	var ownerElem = $(templateContents["subaccountOwner"]).clone();
	ownerElem.find(".subaccountOwnerLine .accountName").text(owner);
	for (let subaccount of subaccounts[owner]) {
		addSubaccountLine(ownerElem, subaccount);
	}
	return ownerElem;
}
function addSubaccountLine(ownerElem, subaccount) {
	var subaccountElem = $(templateContents["subaccountLine"]).clone();
	subaccountElem.find(".accountName").text(subaccount);
	ownerElem.find(".addSubaccount").before(subaccountElem);
}
$("#subaccountsEditor").delegate("button.addSubaccount", "click", function() {
	this.hidden = true;
	this.nextElementSibling.hidden = false;
	this.nextElementSibling.querySelector(".addSubaccountNameInput").focus();
}).delegate(".addSubaccountForm", "submit", function(event) {
	event.preventDefault();
	// TODO: Verify name casing and check for errors
	var ownerElem = $(this).closest(".subaccountOwner");
	var owned = $(this).find(".addSubaccountNameInput").val();
	var ownerInput = ownerElem.find(".newSubaccountOwnerNameInput");
	if (ownerInput.length == 1) {
		// TODO: Process adding a new owner
	} else {
		var owner = ownerElem.find(".subaccountOwnerLine > .accountName").text();
	}
	subaccounts[owner].push(owned);
	apiAdapter.store("subaccounts", subaccounts);
	addSubaccountLine(ownerElem, owned);
	this.hidden = true;
	this.previousElementSibling.hidden = false;
}).delegate("button.removeSubaccount", "click", function() {
	var ownerElem = $(this).closest(".subaccountOwner");
	var owner = ownerElem.find(".subaccountOwnerLine > .accountName").text();
	var unownedElem = $(this).closest(".subaccountLine").remove();
	var unowned = unownedElem.find(".accountName").text(); // got a faceful of Hidden Power
	subaccounts[owner].splice(subaccounts[owner].indexOf(unowned), 1);
	if (subaccounts[owner].length == 0) {
		ownerElem.remove();
		delete subaccounts[owner];
	}
	apiAdapter.store("subaccounts", subaccounts);
});
function fillL10n(parent) {
	for (let elem of Array.from( parent.querySelectorAll("[data-l10n]") )) {
		var message = apiAdapter.getL10nMsg( elem.dataset.l10n );
		if (elem.dataset.l10nAttr) {
			elem.setAttribute(elem.dataset.l10nAttr, message);
		} else {
			elem.textContent = message;
		}
	}
}