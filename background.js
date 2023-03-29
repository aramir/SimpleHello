// noinspection JSUnresolvedVariable,JSIgnoredPromiseFromCall,JSUnresolvedFunction
/* globals browser, messenger */

// const tabsFrozen = new Set();

async function main() {
  await browser.composeScripts.register({
    js: [
      { file: "compose/compose.js" }
    ]
  });
  // Listening for address-input events
  // browser.AddrInputListener.onEditingFinished.addListener(async function () {
  //   let window = await browser.windows.getCurrent({populate: true});
  //   await updateHelloMessage(window.tabs[0].id);
  // });
  //closed tabs cleanup
  // browser.tabs.onRemoved.addListener((tabId) => {
  //   tabsFrozen.delete(tabId);
  // });
}

main();

/**
 * Handles commands received from the compose script.
 */
async function doHandleCommand (message, sender) {
  const { command } = message;
  // console.log("Message: " + command);
  const { tab: { id: tabId } } = sender;
  switch(command.toLowerCase()) {
    case "init":
      // console.log(message);
      await updateHelloMessage(tabId);
      break;
    // case "freeze":
    //   await freezeHelloMessage(tabId);
    //   break;
  }
}

/**
 * Handles the received commands by filtering all messages where "type" property is
 * set to "command".
 */
async function handleMessage (message, sender) {
  if (message && message.hasOwnProperty("command")) {
    return doHandleCommand(message, sender);
  }
}

/**
 * Message state is changed, for example when and address is added. We track it to update
 * the hello message.
 */
// const handleStateChange = async (tab, state) => {
  // console.log("State Changed");
  // const details = await browser.compose.getComposeDetails(tab.id);
  // console.log(">> CHANGE", new Date(), details.to);
  // await updateHelloMessage(tab.id);
// }

/**
 * Create or update hello message. We need to handle 3 cases: no to-address yet, single to-address
 * and multiple to-addresses. We only extract and add the name in case of a single to-address.
 */
async function updateHelloMessage(tabId) {
  // console.log("UpdateHelloMessage > tabId: " + tabId);
  const details = await browser.compose.getComposeDetails(tabId);
  const prefComposeFontFace = await messenger.LegacyPrefs.getPref("msgcompose.font_face");
  const prefMonospaced = prefComposeFontFace === "monospace";
  // if (tabsFrozen.has(tabId)) {
  //   return;
  // }
  // console.log("ComposeDetails", details);
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
  // Checking for plain text ot HTML editing mode
  if (details.isPlainText) {
    // plain text mode
    let body = details.plainTextBody;
    // console.log(body);
    if (!body.startsWith("Hello")) {
      // Make direct modifications to the message text, and send it back to the editor.
      body = hello(firstName) + "\n\n" + body;
    } else {
      // hello message already exists: removing & re-adding first line
      body = hello(firstName) + "\n" + body.split('\n').slice(1).join('\n');
    }
    browser.compose.setComposeDetails(tabId, { plainTextBody: body });
  } else {
    // HTML mode: parse the message into an HTML document.
    const document = new DOMParser().parseFromString(details.body, "text/html");
    // console.log("Document", document);
    //check if hello message is already there
    let createHello = document.body.firstChild;
    if (!createHello.textContent.startsWith("Hello")) {
      // no hello tag - creating extra empty lines - normal DOM manipulation to modify the message
      if (prefMonospaced) {
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
        document.body.prepend(createHelloElement(firstName, prefMonospaced));
      }
    } else {
      // console.log("Updating");
      // hello message already exists: removing
      // document.body.removeChild(document.body.children[0]);
    }
    // Serialize the document back to HTML, and send it back to the editor.
    let html = new XMLSerializer().serializeToString(document);
    browser.compose.setComposeDetails(tabId, { body: html });
    // browser.compose.setComposeDetails(tabId, { priority: "low" });
    // console.log("HTML", html);
  }
}

// async function freezeHelloMessage(tabId) {
  // console.log("Freeze-Init", tabsInit);
  // if (tabsInit.has(tabId) && !tabsFrozen.has(tabId)) {
  //   console.log("freezing changes");
  //   tabsFrozen.add(tabId);
  // } else {
  //   console.log("not yet init or already frozen");
  // }
// }

browser.runtime.onMessage.addListener(handleMessage);
// browser.compose.onComposeStateChanged.addListener(handleStateChange);

/**
 * Constructs hello message text.
 */
function hello(firstName) {
  return "Hello" + (firstName ? " " + firstName : "") + ",";
}

/**
 * Constructs hello HTML element.
 */
function createHelloElement(firstName, prefMonospaced) {
  // console.log("Create Hello Element", firstName, prefMonospaced);
  let p = document.createElement("p");
  let pTarget = p;
  if (prefMonospaced) {
    // keeping the monospaced HTML Style preference
    let pFont = document.createElement("font");
    pFont.setAttribute("face", "monospace");
    p.append(pFont);
    pTarget = pFont;
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