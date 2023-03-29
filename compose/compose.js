// noinspection JSUnresolvedVariable,JSUnresolvedFunction,JSIgnoredPromiseFromCall
/* globals browser, messenger */

async function main() {
	browser.runtime.sendMessage({ command: "init" });
	//freezing hello updates: any keypress, paste, drop or delete/backspace
/*
	document.addEventListener("keypress", (evt) => {
		browser.runtime.sendMessage({ command: "freeze" });
	});
	document.addEventListener("paste", (evt) => {
		browser.runtime.sendMessage({ command: "freeze" });
	});
	document.addEventListener("drop", (evt) => {
		browser.runtime.sendMessage({ command: "freeze" });
	});
	document.addEventListener("keyup", (evt) => {
		if (evt.key === "Backspace" || evt.key === "Delete") {
			browser.runtime.sendMessage({ command: "freeze" });
		}
	});
*/
}

/*
function addEventListenerAll(target, listener, ...otherArguments) {
	// install listeners for all natively triggered events
	for (const key in target) {
		if (/^on/.test(key)) {
			const eventType = key.substr(2);
			target.addEventListener(eventType, listener, ...otherArguments);
		}
	}
}
*/

main();

