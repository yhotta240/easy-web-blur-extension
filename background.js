let context = 'all';
let title = 'Easy Web Blur: ';
let enabled = false;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ isEnabled: enabled });
  chrome.contextMenus.create({
    title: `${title}${enabled ? '無効にする' : '有効にする'}`,
    contexts: [context],
    id: "easyWebBlur"
  });
});

// chrome.storageの変更を監視
chrome.storage.onChanged.addListener((changes) => {
  if (changes.isEnabled) {
    enabled = changes.isEnabled ? changes.isEnabled.newValue : enabled;
  }
  updateContextMenu();
});


function updateContextMenu() {
  chrome.contextMenus.remove("easyWebBlur", () => {
    if (!chrome.runtime.lastError) {
      chrome.contextMenus.create({
        title: `${title}${enabled ? '無効にする' : '有効にする'}`,
        contexts: [context],
        id: "easyWebBlur"
      });
    }
  });
}

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "easyWebBlur") {
    enabled = !enabled;
    // console.log(`現在の状態: ${enabled ? 'ON' : 'OFF'}`);
    chrome.storage.local.set({ isEnabled: enabled });
    updateContextMenu();
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.keyEnabled) {
    enabled = !enabled;
    // console.log(`現在の状態: ${enabled ? 'ON' : 'OFF'}`);
    chrome.storage.local.set({ isEnabled: enabled });
    updateContextMenu();
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    chrome.storage.local.get('isEnabled', (data) => {
      enabled = data.isEnabled ?? false;
      // console.log("ページがリロードされました。", `現在の状態: ${enabled ? 'ON' : 'OFF'}`);
      updateContextMenu();
    });
  }
});
