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
	style = document.createTextNode('.drawer__tab { padding: 0px; } .drawer__tab > .fa-fw { padding: 15px 9px 13px; } .drawer .drawer__inner { display: none; } .drawer__inner.darker { display:none; position: relative; overflow: visible; } .searchdiv .search { position: absolute; width: 300px; border: 1px solid #1f232b; } .composerdiv { width: 400px; } .composerdiv, .searchdiv { display: none; position: absolute; background: #313543; border: 1px solid #1f232b; } .drawer__header { flex-direction: column; } .drawer { width: auto; min-width: 0; padding-left: 0px !important; flex: 0 0 auto; } .drawer__tab:hover { cursor: pointer; } .search-results__section { float: left;} .reply-indicator { display: none; } .column { flex: 1 1 auto }');
	sheet.appendChild(style);
	// Retrieve current setting of the autoincreasing timelines
	chrome.storage.local.get("bigtl", function(data) {
		if (data.bigtl) {
			enable = data.bigtl;
		}
		// Only disable it if we especifically changed the preference
		if (enable == "false") {
			disablebigtl = document.createTextNode('.column { flex: 0 0 auto }');
			sheet.appendChild(disablebigtl);
		}
	});
	// Add the the stylesheet to the head of the webpage
	document.getElementsByTagName('head')[0].appendChild(sheet);

	// Some general elements to refer them just once rather than retrieving everytime
	header = document.getElementsByClassName("drawer__header")[0];
	textarea = document.getElementsByClassName("autosuggest-textarea__textarea")[0];
	forms = document.getElementsByClassName("search")[0];
	formd = document.getElementsByClassName("drawer__inner darker")[0];
	inputs = document.getElementsByClassName("search__input")[0];
	formw = document.getElementsByClassName("compose-form")[0];
	iconm = document.getElementsByClassName("fa fa-fw fa-ellipsis-v")[0];
	send = document.getElementsByClassName("button button--block")[0];

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
	iconw.className = "fa fa-fw fa-pencil";
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
		// FIXME: On keycode 82 (Reply shortcut) the composer box is spawned but doesn't move on another keypress if it's visible. For now we hide on keydown, before moving and displaying again on keyup.
		case 82:
			clase = event.target.className;
			if (clase.includes("status__wrapper") || (clase == "focusable" && event.target.firstChild.className == "detailed-status")) {
				formw.style.display = "none";
			}
			break;
		// END of FIXME
		case 13:
			// If we use the Ctrl+Enter key combo, we are focused on the composer textarea and the send button is not disabled we expect to send the toot and pull back to its container
			if (event.ctrlKey && document.activeElement == textarea && !send.disabled) {
				undoMinimalScroll(send);
				containerw.appendChild(formw);
				containerw.style.display = "none";
			}
			// If we are focused on the search input, we make preparations to display results
			if (document.activeElement == inputs) {
				formd.style.display = "block";
				// We need to wait until results appear
				wait(".search-results__section");
				// We increase the search box size to almost fill the top
				forms.style.width = "99%";
				// We hook the close button to hide results, bring search box to original size and focus on input
				document.getElementsByClassName("fa fa-times-circle active")[0].addEventListener('click', function() { 
					formd.style.display = "none";
					forms.style.width = "300px";
					inputs.focus();
				});
			}
			break;
	}
}

function checkkeyup(event) {
	switch (event.keyCode) {
		case 78:
			// We pressed the N (compose shortcut). If we are not focusing on search and the composer is inside it's container but hidden we show it
			if (document.activeElement.tagName != "INPUT" && containerw.style.display != 'block'
				&& formw.parentElement == containerw) {
				opencontainer(containerw, iconw);
			}
			break;
		case 82:
			clase = event.target.className;
			// We pressed the R (reply shorcut). If the targetted element is a status we append the composer below that and scroll to prevent streaming timelines from overruning our focus
			if (clase.includes("status__wrapper") || (clase == "focusable"
				&& event.target.firstChild.className == "detailed-status")) {
				event.target.appendChild(formw);
				formw.style.display = "block";
				textarea.focus();
				scrollIfNeeded(event.target);
			}
			break;
		case 77:
			clase = event.target.className;
			// We pressed the M (mention shorcut). If the targetted element is one containing a remote user we open the composer container with it's name/s
			if (clase.includes("status__wrapper") || clase.includes("notification-favourite") || clase.includes("notification-reblog") || (clase == "focusable" && event.target.firstChild.className == "detailed-status")) {
				opencontainer(containerw, iconw);
			}
			break;
		case 27:
			// We pressed Esc. This way we have a quick way of navigating the page
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
			grandpa = target;
			while (!grandpa.className.includes("focusable")) {
				grandpa = grandpa.parentElement;
			}
			undoMinimalScroll(grandpa);
			// If the parent element is somewhere else we move the form to that status
			if (formw.parentElement != grandpa) {
				containerw.style.display = "none";
				grandpa.appendChild(formw);
				// Scroll into the element if required
				scrollIfNeeded(grandpa);
			// If we clicked on the same status we make the form hide
			} else {
				containerw.appendChild(formw);
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
		case "fa fa-fw fa-pencil":
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
		case ".search-results__section":
			sections = document.getElementsByClassName("search-results__section");
			// We assume it's pleroma's mastodon front end if the second results columns contains toots rather than hashtags
			if (sections.length > 1 && sections[1].firstChild.firstChild.className == "fa fa-fw fa-quote-right") {
				// Specify size of said section so it doesn't grow as much as possible
				sections[1].style.width = (sections[0].clientWidth + (sections[0].clientWidth / 2)) + 'px';
				// Allow to scroll inside the box
				formd.style.overflowY = "scroll";
				containers.style.backgroundColor = "#121a24";
				// Set box height so body doesn't extend for ages
				formd.style.height = (document.getElementById("mastodon").clientHeight - formd.getBoundingClientRect().top) / 1.5 + "px";
			}
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
