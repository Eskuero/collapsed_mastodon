function saveOptions(e) {
  e.preventDefault();
  chrome.storage.local.set({
    domains: document.querySelector("#domains").value,
    bigtl: document.querySelector("#bigtl").value
  });
}

function restoreOptions() {
	chrome.storage.local.get(["domains", "bigtl"], function(data) {
		document.querySelector("#domains").value = data.domains || "mastodon.social,mstdn.io,niu.moe,mastodon.art";
		document.querySelector("#bigtl").value = data.bigtl || "true";
	});
}

document.addEventListener("DOMContentLoaded", restoreOptions());
document.querySelector("form").addEventListener("submit", saveOptions);
