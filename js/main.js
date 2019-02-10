// Retrieve the current list of avalaible domains
chrome.storage.local.get("domains", function(data) {
	// Keep a fallback list around in case no setting is found
	domains = "mastodon.social,mstdn.io,niu.moe,mastodon.art";
	if (data.domains) {
		domains = data.domains;
	}
	// Create an array out of the original list splitting by commas
	array = domains.replace(/ /g, "").split(",");
	for (i = 0; i < array.length; i++) {
		// If we found a match we wait for the drawer header to appear, as we do most of the work there.
		if (document.location.toString().includes(array[i])) {
			wait(".drawer__header");
			break;
		}
	}
});

// Once DOM is loaded we create any required HTML elements, inject custom CSS and register for events
function work() {
	// Create the base stylesheet
	sheet = document.createElement('style');
	// Print the classes inside the element
	style = document.createTextNode('.drawer__header { flex-direction: column } .drawer__header > * { padding: 0 } .drawer__header > *:hover { cursor: pointer } .drawer__header > * > * { padding: 0.9em 0.6em 0.8em } .drawer .drawer__inner { display: none } .search-results { display: none; overflow-y: scroll; position: relative; flex-wrap: wrap } .search { position: absolute; width: 25em } .composerdiv { width: 30em } .composerdiv, .searchdiv { display: none; position: absolute; background: inherit } .drawer { width: auto; min-width: 0; padding-left: 0px !important; flex: 0 0 auto } .reply-indicator { display: none } .search-results__header { flex: 0 1 100% } .search-results__section { width: 50% }');
	sheet.appendChild(style);
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
	// Add the the stylesheet to the head of the webpage
	document.getElementsByTagName('head')[0].appendChild(sheet);

	// Some general elements to refer them just once rather than retrieving everytime
	header = document.getElementsByClassName("drawer__header")[0];
	textarea = document.getElementsByClassName("autosuggest-textarea__textarea")[0];
	forms = document.getElementsByClassName("search")[0];
	formd = document.getElementsByClassName("search-results")[0];
	inputs = document.getElementsByClassName("search__input")[0];
	formw = document.getElementsByClassName("compose-form")[0];
	iconm = document.getElementsByClassName("fa fa-fw fa-ellipsis-v")[0];
	send = document.getElementsByClassName("button button--block")[0];
	user = document.getElementsByClassName("navigation-bar__profile-account")[0].parentElement.href;

	// Create a new element on the menu for the search box
	search = document.createElement('a');
	search.className = "drawer__tab";
	// Insert the search icon inside the new entry
	icons = document.createElement('i');
	icons.className = "fa fa-fw fa-search";
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
	write.className = "drawer__tab";
	// Insert the write icon inside the new entry
	iconw = document.createElement('i');
	iconw.className = "fa fa-fw fa-pencil fa-pencil-alt";
	write.appendChild(iconw);
	header.appendChild(write);
	// Create the composer container
	containerw = document.createElement('div');
	containerw.className = "composerdiv";
	containerw.appendChild(formw);
	document.body.appendChild(containerw);

	// Create a new element on the menu for the more options dropdown
	more = document.createElement('a');
	more.className = "drawer__tab";
	// Insert the more icon inside the new entry.
	more.appendChild(iconm);
	header.appendChild(more);

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
				undoMinimalScroll(send);
				containerw.appendChild(formw);
				containerw.style.display = "none";
			}
			// If we are focused on the search input, we make preparations to display results
			if (document.activeElement == inputs) {
				formd.style.display = "flex";
				// We increase the search box size to fill the top
				forms.style.width = "100%";
				// We hook the close button to hide results, bring search box to original size and focus on input
				document.getElementsByClassName("fa fa-times-circle active")[0].addEventListener('click', function() { 
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
			if (clase.includes("status__wrapper") || (clase == "focusable" && destiny.firstChild.className == "detailed-status")) {
				// Also if textarea is not empty (due composing or replying) we must wait for user interaction
				writer = "";
				if (document.querySelector(".reply-indicator__display-name")) {
					writer = document.getElementsByClassName("reply-indicator__display-name")[0].href;
				}
				if ((document.querySelector(".reply-indicator") && user != writer) || textarea.value != "") {
					wait(".confirmation-modal__action-bar");
				} else {
					containerw.style.display = "none";
					destiny.appendChild(formw);
					// Scroll into the element if required
					scrollIfNeeded(destiny);
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
			if (clase.includes("status__wrapper") || clase.includes("notification-favourite") || clase.includes("notification-reblog") || (clase == "focusable" && target.firstChild.className == "detailed-status")) {
				opencontainer(containerw, iconw);
			}
			break;
		case 27:
			// We pressed Esc. This way we have a quick way of navigating the page
			undoMinimalScroll(send);
			if (document.getElementsByClassName("reply-indicator__cancel").length > 0) {
				document.getElementsByClassName("reply-indicator__cancel")[0].firstChild.click();
			}
			containerw.appendChild(formw);
			containerw.style.display = "none";
			document.body.focus();
			break;
	}
}

function checkclick(event) {
	target = event.target;
	switch (target.className) {
		// If we clicked on the reply button we append the composer below the target toot
		case "status__action-bar-button icon-button":
		case "icon-button":
			if (!target.firstChild.className.includes("fa fa-fw fa-reply")) {
				break;
			}
		case "fa fa-fw fa-reply":
		case "fa fa-fw fa-reply-all":
			// Iteratively go up until we find the status_wrapper and then append it
			while (!target.className.includes("focusable")) {
				target = target.parentElement;
			}
			undoMinimalScroll(target);
			// If the parent element is somewhere else we move the form to that status
			if (formw.parentElement != target) {
				destiny = target;
				writer = "";
				if (document.querySelector(".reply-indicator__display-name")) {
					writer = document.getElementsByClassName("reply-indicator__display-name")[0].href;
				}
				if ((document.querySelector(".reply-indicator") && user != writer) || textarea.value != "") {
					wait(".confirmation-modal__action-bar");
				} else {
					containerw.style.display = "none";
					destiny.appendChild(formw);
					// Scroll into the element if required
					scrollIfNeeded(destiny);
				}
			}
			break;
		// Everytime we press the TOOT! button we collapse the composer back to the main container
		case "button button--block":
			undoMinimalScroll(target);
			containerw.appendChild(formw);
			containerw.style.display = "none";
			break;
		// Decide if we should show or hide the search box based on it's corrent status
		case "fa fa-fw fa-search":
			opencontainer(containers, icons);
			break;
		// Decide if we should show or hide the main composer based on it's corrent status
		case "fa fa-fw fa-pencil fa-pencil-alt":
			opencontainer(containerw, iconw);
			break;
		// Decide what we do with the dropdown
		case "fa fa-fw fa-ellipsis-v":
			wait(".dropdown-menu");
			break;
	}
}

async function wait(element) {
	// FIXME: Probably a resource hog, we check every 0,1s if the element is finally alive
	while (!document.querySelector(element)) {
		await new Promise(r => setTimeout(r, 100));
	}
	switch (element) {
		case ".drawer__header":
			// The header is here so it's time to get work done
			work();
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
			document.getElementsByClassName("confirmation-modal__action-bar")[0].children[1].addEventListener('click', function() {
				containerw.style.display = "none";
				destiny.appendChild(formw);
				// Scroll into the element if required
				scrollIfNeeded(destiny);
			});
			break;
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
				if (document.getElementsByClassName("reply-indicator__cancel").length > 0) {
					document.getElementsByClassName("reply-indicator__cancel")[0].firstChild.click();
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
