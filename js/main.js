// Retrieve the current list of avalaible domains
chrome.storage.local.get(["domains", "pldomains"], function(data) {
	// Keep a fallback list around in case no setting is found
	domains = "mastodon.social,mstdn.io,niu.moe,mastodon.art";
	pldomains = "kawen.space,pleroma.soykaf.com";
	if (data.domains) {
		domains = data.domains;
	}
	if (data.pldomains) {
		pldomains = data.pldomains;
	}
	// Create an array out of the original list splitting by commas
	domains = domains.replace(/ /g, "").split(",");
	pldomains = pldomains.replace(/ /g, "").split(",");
	// If current domain is inside the array we wait for the interface to be loaded
	domain = document.location.toString().split("/")[2]
	if (domains.includes(domain)) {
		wait(".drawer__header");
	} else if (pldomains.includes(domain)) {
		wait(".drawer--header");
	}
});

// Once DOM is loaded we create any required HTML elements, inject custom CSS and register for events
function work(version) {
	// Create the base stylesheet
	sheet = document.createElement('style');
	// Print the classes inside the element
	if (version == "mastodon") {
		style = document.createTextNode('.drawer__header { flex-direction: column } .drawer__header > * { padding: 0 } .drawer__header > *:hover { cursor: pointer } .drawer__header > * > * { padding: 0.9em 0.6em 0.8em } .drawer .drawer__inner { display: none } .search-results { display: none; position: relative; flex-wrap: wrap } .search { position: absolute; width: 25em } .composerdiv { width: 30em } .composerdiv, .searchdiv { display: none; position: absolute; background: inherit } .drawer { width: auto; min-width: 0; padding-left: 0px !important; flex: 0 0 auto } .reply-indicator { display: none } .search-results__header { flex: 0 1 100% } .search-results__section { width: 50% }');
	} else if (version == "pleroma") {
		style = document.createTextNode('.drawer--header { flex-direction: column } .drawer--header > * { padding: 0 } .drawer--header > *:hover { cursor: pointer } .drawer--header > * > * { padding: 0.9em 0.6em 0.8em } .drawer.mbstobon { min-width: 3.5em; max-width: 0 } .drawer .drawer__inner { display: none } .drawer--results { display: none; overflow-y: scroll; width: 60em; height: 30em; position: relative; flex-wrap: wrap } .drawer--search { position: absolute; width: 25em } .composerdiv { width: 30em } .composerdiv, .searchdiv { display: none; position: absolute; background: inherit } .drawer { padding-left: 0px !important } .composer--reply { display: none } .drawer--results > header { flex: 0 1 100% } .drawer--results > section { width: 50% }');
	}
	sheet.appendChild(style);
	if (version == "mastodon") {
		// Retrieve current setting of the autoincreasing timelines
		chrome.storage.local.get("bigtl", function(data) {
			enable = "true";
			if (data.bigtl) {
				enable = data.bigtl;
			}
			// Only disable it if we especifically changed the preference
			if (enable == "false") {
				style = document.createTextNode('.column { flex: 0 0 auto }');
			} else {
				style = document.createTextNode('.column { flex: 1 1 auto }');
			}
			sheet.appendChild(style);
		});
	}
	// Add the the stylesheet to the head of the webpage
	document.getElementsByTagName('head')[0].appendChild(sheet);

	// Some general elements to refer them just once rather than retrieving everytime
	// Textarea to write toots
	textarea = document.getElementsByClassName("autosuggest-textarea__textarea")[0];
	// Search form
	forms = document.getElementsByClassName("search")[0];
	// Container for video and image expanding
	modalcontainer = document.getElementsByClassName("modal-root")[0]
	if (version == "mastodon") {
		header = document.getElementsByClassName("drawer__header")[0];
		formd = document.getElementsByClassName("search-results")[0];
		inputs = document.getElementsByClassName("search__input")[0];
		formw = document.getElementsByClassName("compose-form")[0];
		iconm = document.getElementsByClassName("compose__action-bar-dropdown")[0].firstChild.firstChild.firstChild;
		send = document.getElementsByClassName("button button--block")[0];
		user = document.getElementsByClassName("navigation-bar__profile-account")[0].parentElement.href;
		replyname = "reply-indicator__display-name";
		replyindicator = "reply-indicator";
		replycancel = "reply-indicator__cancel";
		closesearch = "fa fa-times-circle active";
		hackyscroll = false;
		enableredraft = true;
		// Menu entry that corresponds to redraft on each status type
		redraftindex = {"status-direct": 5, "status-public": 8, "status-unlisted": 8, "status-private": 6};
	} else if (version == "pleroma") {
		header = document.getElementsByClassName("drawer--header")[0];
		formd = document.getElementsByClassName("drawer--results")[0];
		inputs = forms.firstChild.children[1];
		formw = document.getElementsByClassName("composer")[0];
		send = document.getElementsByClassName("button primary")[0];
		user = document.getElementsByClassName("permalink acct")[0].href;
		replyname = "permalink account small";
		replyindicator = "composer--reply";
		replycancel = "cancel icon-button inverted";
		closesearch = "icon fa fa-times-circle";
		hackyscroll = true;
		enableredraft = false;
	}

	// Create a new element on the menu for the search box
	search = document.createElement('a');
	if (version == "mastodon") {
		search.className = "drawer__tab";
	}
	// Insert the search icon inside the new entry
	icons = document.createElement('i');
	if (version == "mastodon") {
		icons.className = "fa fa-fw fa-search";
	} else if (version == "pleroma") {
		icons.className = "icon fa fa-search";
	}
	search.appendChild(icons);
	header.appendChild(search);
	// Create the search container
	containers = document.createElement('div');
	containers.className = "searchdiv";
	containers.appendChild(forms);
	containers.appendChild(formd);
	document.body.appendChild(containers);

	// Create a new element on the menu for the composer form
	write = document.createElement('a');
	if (version == "mastodon") {
		write.className = "drawer__tab";
	}
	// Insert the write icon inside the new entry
	iconw = document.createElement('i');
	if (version == "mastodon") {
		iconw.className = "fa fa-fw fa-pencil fa-pencil-alt";
	} else if (version == "pleroma") {
		iconw.className = "icon fa fa-pencil fa-pencil-alt";
	}
	write.appendChild(iconw);
	header.appendChild(write);
	// Create the composer container
	containerw = document.createElement('div');
	containerw.className = "composerdiv";
	containerw.appendChild(formw);
	document.body.appendChild(containerw);

	if (version == "mastodon") {
		// Create a new element on the menu for the more options dropdown
		more = document.createElement('a');
		more.className = "drawer__tab";
		// Insert the more icon inside the new entry.
		more.appendChild(iconm);
		header.appendChild(more);
	}

	// Retrieve all the clicks to understand where to act
	document.body.addEventListener('click', function(event) { checkclick(event); });
	// Listen to certain key combinations to fix interactions
	document.body.addEventListener('keyup', function(event) { checkkeyup(event); });
	document.body.addEventListener('keydown', function(event) { checkkeydown(event); });
}

function checkkeydown(event) {
	switch (event.keyCode) {
		case 13:
			// If we use the Ctrl+Enter key combo, we are focused on the composer textarea and the send button is not disabled we expect to send the toot and pull back to its container
			if (event.ctrlKey && document.activeElement == textarea && !send.disabled) {
				undoMinimalScroll(formw);
				containerw.appendChild(formw);
				containerw.style.display = "none";
			}
			// If we are focused on the search input, we make preparations to display results
			if (document.activeElement == inputs) {
				formd.style.display = "flex";
				// We increase the search box size to fill the top
				forms.style.width = "100%";
				// We hook the close button to hide results, bring search box to original size and focus on input
				document.getElementsByClassName(closesearch)[0].addEventListener('click', function() {
					formd.style.display = "none";
					forms.style.width = "25em";
					inputs.focus();
				});
			}
			break;
		case 82:
			destiny = event.target;
			clase = event.target.className;
			// We pressed the R (reply shorcut). If the targetted element is a status we append the composer below that and scroll to prevent streaming timelines from overruning our focus
			if (clase.includes("status") || (clase.includes("focusable") && destiny.firstChild.firstChild.className == "detailed-status")) {
				// Also if textarea is not empty (due composing or replying) we must wait for user interaction
				writer = "";
				if (document.querySelector("." + replyname.replace(/ /g, "."))) {
					writer = document.getElementsByClassName(replyname)[0].href;
				}
				if ((document.querySelector("." + replyindicator) && user != writer) || textarea.value != "") {
					wait(".confirmation-modal__action-bar", 1);
				} else {
					spawncomposerreply(destiny);
				}
			}
			break;
	}
}

function checkkeyup(event) {
	target = event.target;
	clase = target.className;
	switch (event.keyCode) {
		case 78:
			// We pressed the N (compose shortcut). If we are not focusing on search and the composer is inside it's container but hidden we show it
			if (document.activeElement.tagName != "INPUT" && containerw.style.display != 'block' && formw.parentElement == containerw) {
				opencontainer(containerw, iconw);
			}
			break;
		case 77:
			// We pressed the M (mention shorcut). If the targetted element is one containing a remote user we open the composer container with it's name/s
			if (clase.includes("status__wrapper") || clase.includes("notification-favourite") || clase.includes("notification-reblog")) {
				opencontainer(containerw, iconw);
			}
			break;
		case 27:
			// If we are viewing video or images in expanded mode we should not close anything on Esc
			if (modalcontainer.style.opacity == 1) {
				break;
			}
			// We pressed Esc. This way we have a quick way of navigating the page
			undoMinimalScroll(formw);
			if (document.getElementsByClassName(replycancel).length > 0) {
				document.getElementsByClassName(replycancel)[0].firstChild.click();
			}
			textarea.innerHTML = "";
			containerw.appendChild(formw);
			containerw.style.display = "none";
			document.body.focus();
			break;
	}
}

function checkclick(event) {
	target = event.target;
	// Clicks on menu items return the <a> element as target, which is empty
	if (target.className == "" && target.parentElement.className == "dropdown-menu__item") {
		target = target.parentElement;
	}
	switch (target.className) {
		// If we clicked on the reply button we append the composer below the target toot
		case "status__action-bar-button icon-button":
		case "icon-button":
			if (!target.firstChild.className.includes("fa-reply")) {
				break;
			}
		case "fa fa-fw fa-reply":
		case "fa fa-fw fa-reply-all":
		case "fa fa-reply fa-fw":
		case "fa fa-reply-all fa-fw":
			// Iteratively go up until we find the status_wrapper and then append it
			while (!target.className.includes("focusable")) {
				target = target.parentElement;
			}
			// If the parent element is somewhere else we move the form to that status
			if (formw.parentElement != target) {
				destiny = target;
				writer = "";
				if (document.querySelector("." + replyname.replace(/ /g, "."))) {
					writer = document.getElementsByClassName(replyname)[0].href;
				}
				if ((document.querySelector("." + replyindicator) && user != writer) || textarea.value != "") {
					wait(".confirmation-modal__action-bar", 1);
				} else {
					spawncomposerreply(destiny);
				}
			}
			break;
		// Everytime we press the TOOT! button we collapse the composer back to the main container
		case "button button--block":
		case "button primary":
			undoMinimalScroll(formw);
			containerw.appendChild(formw);
			containerw.style.display = "none";
			break;
		// Decide if we should show or hide the search box based on it's corrent status
		case "fa fa-fw fa-search":
		case "icon fa fa-search":
			opencontainer(containers, icons);
			break;
		// Decide if we should show or hide the main composer based on it's corrent status
		case "fa fa-fw fa-pencil fa-pencil-alt":
		case "icon fa fa-pencil fa-pencil-alt":
			opencontainer(containerw, iconw);
			break;
		// Decide what we do with the preferences dropdown
		case iconm.className:
			wait(".dropdown-menu");
			break;
		// Listen to more button to allow redraft
		case "dropdown-menu__item":
			// Pleroma's mastofe has no redraft feature
			if (!enableredraft) {
				break;
			}
			// Get the button that produced the menu, only one at a time can have an ellipsis as child
			if (document.querySelector("button.icon-button.active > i.fa.fa-ellipsis-h.fa-fw")) {
				post = document.querySelector("button.icon-button.active > i.fa.fa-ellipsis-h.fa-fw");
				// Iteratively go up until we find the post we are targetting
				while (post.className.slice(0,7) != "status ") {
					post = post.parentElement;
				}
				// URL of the user that wrote the post, if it's not our user we stop
				writer = post.children[1].children[1].href;
				if (writer != user) {
					break;
				}
				// Type of post (public, unlisted, private, direct).
				type = post.className.split(" ")[1]
				//  We only proceed if the index of the menuentry clicked corresponds to the hardcoded index of the redraft entry for each type of post
				if (redraftindex[type] != target.firstChild.getAttribute("data-index")) {
					break;
				}
				// Only hook the button if the composer is not visible
				if (containerw.style.display != "block") {
					wait(".confirmation-modal__action-bar", 2);
				}
			}
			break;
	}
}

async function wait(element, option = 0) {
	// FIXME: Probably a resource hog, we check every 0,1s if the element is finally alive
	while (!document.querySelector(element)) {
		await new Promise(r => setTimeout(r, 100));
	}
	switch (element) {
		case ".drawer__header":
			// The header is here so it's time to get work done
			work("mastodon");
			break;
		case ".drawer--header":
			// The same but plemora same
			work("pleroma");
			break;
		case ".dropdown-menu":
			// If we are targetting the dropdown menu we put it on the proper place by using the position of the header icon menu. We also hide the arrow as it looks very ugly
			info = iconm.getBoundingClientRect();
			y = info.y + "px";
			x = (info.x + info.width)  + "px";
			document.getElementsByClassName("dropdown-menu")[0].style.top = y;
			document.getElementsByClassName("dropdown-menu")[0].style.left = x;
			document.getElementsByClassName("dropdown-menu__arrow")[0].style.display = "none";
			break;
		case ".confirmation-modal__action-bar":
			if (option == 1) {
				document.getElementsByClassName("confirmation-modal__action-bar")[0].children[1].addEventListener('click', function() {spawncomposerreply(destiny)});
			} else if (option == 2) {
				document.getElementsByClassName("confirmation-modal__action-bar")[0].children[1].addEventListener('click', function() {opencontainer(containerw, iconw)});
			}
			break;
		case "textarea":
			while (scrollable.scrollTop == previousscroll) {
				await new Promise(r => setTimeout(r, 100));
			}
			scrollable.scrollTop = previousscroll;
			scrollIfNeeded(destiny);
			break;
	}
}

function spawncomposerreply(destiny) {
	containerw.style.display = "none";
	undoMinimalScroll(formw);
	// FIXME: For some reason pleroma scroll backs the TL as soon as the composer is appended, so we need to store the previous offset and restore it after spawning the textarea
	if (hackyscroll) {
		scrollable = destiny;
		while (!scrollable.className.includes("scrollable")) {
			scrollable = scrollable.parentElement;
		}
		previousscroll = scrollable.scrollTop;
		destiny.appendChild(formw);
		wait("textarea");
	} else {
		destiny.appendChild(formw);
		// Scroll into the element if required
		scrollIfNeeded(destiny);
	}
}

function undoMinimalScroll(scrollable) {
	// Ignore if the composer is on the container
	if (formw.parentElement != containerw) {
		// Get the closer scrollable element
		while (!scrollable.className.includes("scrollable")) {
			scrollable = scrollable.parentElement;
		}
		// Move only if the amount scrolled is smaller (Chromium reports decimal values even if we hardcoded 
		if (scrollable.scrollTop <= 1) {
			scrollable.scrollTop = 0;
		}
	}
}

function scrollIfNeeded(status) {
	// Iteratively go up until we find the scrollable, two elements below is the article
	scrollable = status;
	while (!scrollable.className.includes("scrollable")) {
		if (scrollable.parentElement.parentElement.className.includes("scrollable")) {
			article = scrollable;
		}
		scrollable = scrollable.parentElement;
	}
	// Viewport and offset of the scrollable
	frontier = scrollable.clientHeight;
	scrolled = scrollable.scrollTop;
	// Size and absolute position of the article inside the item-list
	length = article.clientHeight;
	fall = article.offsetTop;
	// Relative position of the article to the scrollable viewport
	distance = fall - scrolled;
	// If the article is not fully visible we scroll the bare minimum to entirely display it
	if (distance + length > frontier) {
		destiny = scrolled + (distance + length - frontier);
		scrollable.scrollTop = destiny;
	// If we are already at the top we move just a little to prevent streaming from pushing timeline
	} else if (scrolled == 0) {
		scrollable.scrollTop = 1;
	}
}

function opencontainer(container, icon) {
	// If the targetted container is visible we always hide it
	if (container.style.display == "block") {
		container.style.display = "none";
	} else {
		// We need the position of the icon to resolve where to draw the container
		info = icon.getBoundingClientRect();
		container.style.top = info.y + "px";
		container.style.left = (info.x + info.width)  + "px";
		container.style.display = "block";
		switch (container.className) {
			case "composerdiv":
				// Always scroll back the columns in case is needed.
				scrollables = document.getElementsByClassName("scrollable");
				for (i = 0; i < scrollables.length; i++) {
					undoMinimalScroll(scrollables[i]);
				}
				// If the target is the composer we append the textarea back
				container.appendChild(formw);
				// If we are opening it we always close previous mentions
				if (document.getElementsByClassName(replycancel).length > 0) {
					document.getElementsByClassName(replycancel)[0].firstChild.click();
				}
				textarea.focus();
				break;
			case "searchdiv":
				// If the target is the search form we focus on the input
				inputs.focus();
				break;
		}
	}
}
