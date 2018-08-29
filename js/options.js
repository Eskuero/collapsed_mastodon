function saveOptions(e) {
  e.preventDefault();
  chrome.storage.local.set({
    domains: document.querySelector("#domains").value
  });
}

function restoreOptions() {
	chrome.storage.local.get("domains", function(data) {
		document.querySelector("#domains").value = data.domains || "mastodon.social,mstdn.io,niu.moe,mastodon.art";
	});
}

document.addEventListener("DOMContentLoaded", restoreOptions());
document.querySelector("form").addEventListener("submit", saveOptions);
