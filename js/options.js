function saveOptions(e) {
  e.preventDefault();
  chrome.storage.local.set({
    domains: document.querySelector("#domains").value,
	pldomains: document.querySelector("#pldomains").value,
    bigtl: document.querySelector("#bigtl").value
  });
}

function restoreOptions() {
	chrome.storage.local.get(["domains", "pldomains", "bigtl"], function(data) {
		document.querySelector("#domains").value = data.domains || "mastodon.social,mstdn.io,niu.moe,mastodon.art";
		document.querySelector("#pldomains").value = data.pldomains || "kawen.space,pleroma.soykaf.com"
		document.querySelector("#bigtl").value = data.bigtl || "true";
	});
}

document.addEventListener("DOMContentLoaded", restoreOptions());
document.querySelector("form").addEventListener("submit", saveOptions);
