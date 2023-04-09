'use strict';

console.log("Background script running");

// Event to run execute.js content when extension's button is clicked
chrome.action.onClicked.addListener(execScript);

chrome.runtime.onConnect.addListener((port) => {
    console.assert(port.name == "changeCSS");

    port.onMessage.addListener((request) => {
        if (request.action === 'changeCSS') {
            const { previousCssFile, cssFile, selectedOption } = request;
            console.log("previousCssFile: " + previousCssFile);
            console.log("cssFile: " + cssFile);

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const tabId = tabs[0].id;

                if (previousCssFile !== 'styles/none.css') {
                    chrome.scripting.removeCSS({
                        target: { tabId },
                        files: [previousCssFile]
                    }, () => {
                        if (chrome.runtime.lastError) {
                            port.postMessage({ success: false, error: chrome.runtime.lastError.message });
                            return;
                        }
                    });
                }

                if (cssFile !== 'styles/none.css') {
                    chrome.scripting.insertCSS({
                        target: { tabId },
                        files: [cssFile]
                    }, () => {
                        if (chrome.runtime.lastError) {
                            port.postMessage({ success: false, error: chrome.runtime.lastError.message });
                        } else {
                            port.postMessage({ success: true, selectedOption: selectedOption });
                        }
                    });
                }
            });
        }
    });
});

async function getActiveTabId() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return (tabs.length > 0) ? tabs[0].id : null;
}

async function execScript() {
    const tabId = await getActiveTabId();
    if (!tabId) return;
    chrome.scripting.executeScript({
        target: { tabId },
        files: ["contentScript.js"]
    }, function () {
        console.log("Content script loaded.");
    });
}
