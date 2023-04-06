// noinspection JSUnresolvedVariable,JSIgnoredPromiseFromCall,JSUnresolvedFunction
/* globals browser, messenger */

/**
 * This function is awaiting the register process of the compose
 * script, but there is no action queued behind it, so there is no
 * real need for this construct. You could just place the register
 * command into the top file scope code, without awaiting it and
 * remove main() - compare that you do not await main() as well.
 */
async function main() {
  await browser.composeScripts.register({
    js: [
      { file: "compose/compose.js" }
    ]
  });
}

/**
 * Handles commands received from the compose script.
 */
async function doHandleCommand (message, sender) {
  const { command } = message;
  const { tab: { id: tabId } } = sender;
  switch(command.toLowerCase()) {
    case "init":
      return browser.compose.getComposeDetails(tabId);
      break;
  }
}

/**
 * Handles the received commands by filtering all messages where "type" property
 * is set to "command".
 */
async function handleMessage (message, sender) {
  if (message && message.hasOwnProperty("command")) {
    return doHandleCommand(message, sender);
  }
}

browser.runtime.onMessage.addListener(handleMessage);

main();
