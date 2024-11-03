// チェックボックスの状態の初期化
let isEnabled = false;
let blurValue = 5;
const blurEnabledElement = document.getElementById('blur-enabled');
const blurElement = document.getElementById('blur-value');
const panelButton = document.getElementById('panelButton');
const messagePanel = document.getElementById('messagePanel');
const messageDiv = document.getElementById('message');


blurEnabledElement.addEventListener('change', (event) => {
  isEnabled = event.target.checked;
  chrome.storage.local.set({ isEnabled: isEnabled }, () => {
    messageOutput(dateTime(), isEnabled ? 'Easy Web Blurは有効になっています' : 'Easy Web Blurは無効になっています');
  });
});

blurElement.addEventListener('change', (event) => {
  blurValue = event.target.value;
  document.getElementById('blur-intensity').innerHTML = blurValue;
  const message = `ぼかしの強さ ${blurValue}px が保存されました`;
  saveSettings(dateTime(), message, event.target.value);
});


chrome.storage.local.get(['settings', 'isEnabled'], (data) => {

  let message;
  if (blurElement) {
    blurElement.value = data.settings ? data.settings.blurValue : 5;
    document.getElementById('blur-intensity').innerHTML = blurElement.value;
    message = `ぼかしの強さ ${blurElement.value}px`;
  }
  if (blurEnabledElement) {
    isEnabled = data.isEnabled || false;
    blurEnabledElement.checked = isEnabled;
  }
  messageOutput(dateTime(), isEnabled ? 'Easy Web Blurは有効になっています' : 'Easy Web Blurは無効になっています');
  messageOutput(dateTime(), message);
});


document.addEventListener('DOMContentLoaded', function () {

  panelButton.addEventListener('click', function () {
    const panelHeight = '170px';

    if (messagePanel.style.height === panelHeight) {
      // パネルが開いている場合は閉じる
      messagePanel.style.height = '0';
      panelButton.textContent   = 'メッセージパネルを開く';
    } else {
      // パネルが閉じている場合は開く
      messagePanel.style.height = panelHeight;
      panelButton.textContent   = 'メッセージパネルを閉じる';
    }
  });

  blurValue = document.getElementById('blur-intensity').value;
  // console.log(blurValue);

  const storeLink = document.getElementById('store_link');
  if (storeLink) clickURL(storeLink);
  // manifest.jsonの情報を取得
  const manifestData = chrome.runtime.getManifest();
  // 各情報を要素に反映
  document.getElementById('extension-id').textContent = `${chrome.runtime.id}`;
  document.getElementById('extension-name').textContent = `${manifestData.name}`;
  document.getElementById('extension-version').textContent = `${manifestData.version}`;
  document.getElementById('extension-description').textContent = `${manifestData.description}`;
  chrome.extension.isAllowedIncognitoAccess((isAllowedAccess) => {
    document.getElementById('incognito-enabled').textContent = `${isAllowedAccess ? '有効' : '無効'}`;
  });

  const githubLink = document.getElementById('github-link');
  if (githubLink) clickURL(githubLink);

});


function saveSettings(datetime, message, value) {
  const settings = {
    blurValue: value,
  };
  chrome.storage.local.set({ settings: settings }, () => {
    messageOutput(datetime, message);
  });

}


function clickURL(link) {
  const url = link.href ? link.href : link;
  if (link instanceof HTMLElement) {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      chrome.tabs.create({ url });
    });
  }
}


function messageOutput(datetime, message) {
  messageDiv.innerHTML += '<p class="m-0">' + datetime + ' ' + message + '</p>';
}

document.getElementById('messageClearButton').addEventListener('click', () => {
  messageDiv.innerHTML = '<p class="m-0">' + '' + '</p>';
});

function dateTime() {
  const now = new Date();
  const year = now.getFullYear();           // 年
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 月
  const day = String(now.getDate()).padStart(2, '0');         // 日
  const hours = String(now.getHours()).padStart(2, '0');       // 時
  const minutes = String(now.getMinutes()).padStart(2, '0');   // 分
  const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}`;
  return formattedDateTime;
}
