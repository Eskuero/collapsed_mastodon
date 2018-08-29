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
		// If we found a match we wait for DOM to be fully loaded and then do things
		if (document.location.toString().includes(array[i])) {
			document.addEventListener('DOMContentLoaded', work());
			break;
		}
	}
});

// Once DOM is loaded we create any required HTML elements, inject custom CSS and register for events
function work() {
	// Create the base stylesheet
	sheet = document.createElement('style');
	// Print the classes inside the element
	style = document.createTextNode('.drawer__tab { padding: 0px; } .drawer__tab > .fa-fw { padding: 15px 9px 13px; } .drawer__inner { display: none; position: relative; overflow: visible; } .search { position: absolute; width: 300px; border: 1px solid #1f232b; } .composerdiv { width: 400px; } .composerdiv, .searchdiv { display: none; position: absolute; background: #313543; border: 1px solid #1f232b; } .drawer__header { flex-direction: column; } .drawer { width: inherit; padding-left: 0px !important; } .drawer__tab:hover { cursor: pointer; } .search-results__section { float: left;}');
	sheet.appendChild(style);
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
				containerw.appendChild(formw);
				containerw.style.display = "none";
			}
			// If we are focused on the search input, we make preparations to display results
			if (document.activeElement == inputs) {
				formd.style.display = "block";
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
			if (document.activeElement != inputs && containerw.style.display != 'block'
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
				// We hook the cancel button to collapse the composer
				wait(".reply-indicator__cancel");
				formw.style.display = "block";
				textarea.focus();
				event.target.scrollIntoView();
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
	console.log(target);
	switch (target.className) {
		// FIXME: On Chrome the event target is the <i> but on Firefox is the parent button, so we go down
		case "status__action-bar-button icon-button":
			target = target.firstChild;
			if (!target.className.includes("fa fa-fw fa-reply")) {
				break;
			}
		// END of FIXME
		// If we clicked on the reply button we append the composer below the target toot
		case "fa fa-fw fa-reply":
		case "fa fa-fw fa-reply-all":
			// FIXME: Incredible long recursive element retrieval. Ugly but necessary
			grandpa = target.parentElement.parentElement.parentElement.parentElement.parentElement;
			// END of FIXME
			// If the parent element is somewhere else we move the form to that status
			if (formw.parentElement != grandpa) {
				containerw.style.display = "none";
				// We hook the cancel button to collapse the composer
				wait(".reply-indicator__cancel");
				grandpa.appendChild(formw);
				grandpa.scrollIntoView();
			// If we clicked on the same status we make the form hide
			} else {
				containerw.appendChild(formw);
			}
			break;
		// Everytime we press the TOOT! button we collapse the composer back to the main container
		case "button button--block":
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
		case ".dropdown-menu":
			// If we are targetting the dropdown menu we put it on the proper place by using the position of the header icon menu. We also hide the arrow as it looks very ugly
			info = iconm.getBoundingClientRect();
			y = info.y + "px";
			x = (info.x + info.width)  + "px";
			document.getElementsByClassName("dropdown-menu")[0].style.top = y;
			document.getElementsByClassName("dropdown-menu")[0].style.left = x;
			document.getElementsByClassName("dropdown-menu__arrow")[0].style.display = "none";
			break;
		case ".reply-indicator__cancel":
			// Hook the cancel indicator to collapse the composer
			document.getElementsByClassName("reply-indicator__cancel")[0].addEventListener("click", function() {
				containerw.appendChild(formw);
			});
			break;
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
