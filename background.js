let context = 'all';
let title = 'Easy Web Blur: ';
let isEnabled = false;


chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ isEnabled: isEnabled });
  chrome.contextMenus.create({
    title: `${title}${isEnabled ? '無効にする' : '有効にする'}`,
    contexts: [context],
    id: "easyWebBlur"
  });
});


chrome.storage.onChanged.addListener((changes) => {
  if (changes.isEnabled) {
    isEnabled = changes.isEnabled.newValue;
  }
  updateContextMenu();
});


chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "easyWebBlur") {
    isEnabled = !isEnabled;
    chrome.storage.local.set({ isEnabled: isEnabled });
    updateContextMenu();
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.keyEnabled) {
    isEnabled = !isEnabled;
    chrome.storage.local.set({ isEnabled: isEnabled });
    updateContextMenu();
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    chrome.storage.local.get('isEnabled', (data) => {
      isEnabled = data.isEnabled ? data.isEnabled : isEnabled;
      updateContextMenu();
    });
  }
});


function updateContextMenu() {
  chrome.contextMenus.remove("easyWebBlur", () => {
    if (!chrome.runtime.lastError) {
      chrome.contextMenus.create({
        title: `${title}${isEnabled ? '無効にする' : '有効にする'}`,
        contexts: [context],
        id: "easyWebBlur"
      });
    }
  });
}