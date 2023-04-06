// noinspection JSUnresolvedVariable,JSUnresolvedFunction,JSIgnoredPromiseFromCall
/* globals browser, messenger */

const debug = true;

/**
 * Create or update hello message. We need to handle 3 cases: no to-address yet, single to-address
 * and multiple to-addresses. We only extract and add the name in case of a single to-address.
 */
async function updateHelloMessage(details) {
	let firstName;
	if (details.to.length === 1) {
		// single to-address - extracting or guessing first name
		const address = details.to[0];
		if (address.includes(',')) {
			//reverse-first name lookup for last-name-first-with-comma format
			firstName = capitalize(address.split(',')[1].trim().split(' ')[0].trim());
		} else if (address.includes(' ')) {
			//there are spaces in the address, extracting first name
			firstName = capitalize(address.split(' ')[0]);
		} else if (address.includes('@')) {
			//no spaces - email only, extracting
			firstName = capitalize(address.split('@')[0].split('.')[0]);
		}
	}
	if (debug) {
		console.log({firstName});
	}
	
	// The compose script has access to the real DOM of the compose editor. Even
	// for plaintext this is an html document. The monospace property can be
	// extracted from the computed style of the body element.
	// Is there a difference for you between isPlaintext from the ComposeDetails
	// object and the calculated isMonospaced?
	let isPlaintext = details.isPlainText;
	let isMonospaced = window.getComputedStyle(document.body).getPropertyValue("font-family") == "monospace";
	if (debug) {
		console.log(document);
		console.log("font-family:", window.getComputedStyle(document.body).getPropertyValue("font-family"));
		console.log({isMonospaced, isPlaintext});
	}

	let createHello = document.body.firstChild;
	if (!createHello.textContent.startsWith("Hello")) {
		// no hello tag - creating extra empty lines - normal DOM manipulation to modify the message
		if (isMonospaced || true) {
			// extra empty line with monospaced style (monospaced HTML-style only)
			let pExtra = document.createElement("p");
			let pExtraFont = document.createElement("font");
			pExtraFont.setAttribute("face", "monospace");
			let pExtraBr = document.createElement("br");
			pExtraFont.append(pExtraBr);
			pExtra.append(pExtraFont);
			//cleaning up and adding elements
			document.body.removeChild(document.body.children[0]);
			document.body.prepend(pExtra);
			//creating and adding hello string
			document.body.prepend(createHelloElement(firstName, isMonospaced));

			// Move the cursor behind the added introduction, but before the line
			// break, so the user can start typing. Since we set start and end of
			// the new selection to the same item, nothing is selected, but the
			// cursor has been moved.
			var selection = window.getSelection();
			var range = document.createRange();
			range.setStartBefore(pExtraBr);
			range.setEndBefore(pExtraBr);
			selection.removeAllRanges();
			selection.addRange(range);
		} else {
			// Why are you not updating the DOM for the non-monospace case? This
			// behavior is not mentioned in your add-on description and could
			// lead to "this add-on is not working" reviews.
			// To showcase that it is working, I added true to the condition so
			// we never get here.
		}
	} else {
		// console.log("Updating");
		// hello message already exists: removing
		// document.body.removeChild(document.body.children[0]);
	}
}

/**
* Constructs hello message text.
*/
function hello(firstName) {
	return "Hello" + (firstName ? " " + firstName : "") + ",";
}

/**
 * Constructs hello HTML element.
 */
function createHelloElement(firstName, isMonospaced) {
	// console.log("Create Hello Element", firstName, isMonospaced);
	let p = document.createElement("p");
	let pTarget = p;
	if (isMonospaced) {
		// Note: the monospace font face will be inherited to your added element
		//       so there is no need to explicitly provide it.

		// keeping the monospaced HTML Style preference
		//let pFont = document.createElement("font");
		//pFont.setAttribute("face", "monospace");
		//p.append(pFont);
		//pTarget = pFont;
	}
	pTarget.textContent = hello(firstName);
	return p;
}

/**
 * Capitalizes first letter of the given text.
 */
function capitalize(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

async function main() {
	let details = await browser.runtime.sendMessage({ command: "init" });
	await updateHelloMessage(details);
}

main();

