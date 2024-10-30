
// チェックボックスの状態の初期化
let isEnabled = false;
let blurIntensity = 5;
const blurEnabledElement = document.getElementById('blur-enabled');
const blurElement = document.getElementById('blur-value');

blurEnabledElement.addEventListener('change', (event) => {
  isEnabled = event.target.checked; // チェックボックスの状態を取得
  chrome.runtime.sendMessage({ isEnabled });
  chrome.storage.local.set({ isEnabled: isEnabled }, () => {
    messageOutput(dateTime(), isEnabled ? 'Easy Web Blurは有効になっています' : 'Easy Web Blurは無効になっています');
  });
});

blurElement.addEventListener('change', (event) => {
  blurIntensity = event.target.value;
  document.getElementById('blur-intensity').innerHTML = blurIntensity;
  const message = `ぼかしの強さ ${blurIntensity}px が保存されました`;
  saveSettings(dateTime(), message, event.target.value);
});


document.addEventListener('DOMContentLoaded', function () {
  const toggleButton = document.getElementById('toggleButton');
  const bottomPanel = document.getElementById('bottomPanel');

  toggleButton.addEventListener('click', function () {
    // パネルが開いている場合は閉じる
    if (bottomPanel.style.height === '150px') {
      bottomPanel.style.height = '0';
      toggleButton.textContent = 'メッセージパネルを開く';
    }
    // パネルが閉じている場合は開く
    else {
      bottomPanel.style.height = '150px'; // 必要に応じて高さを調整
      toggleButton.textContent = 'メッセージパネルを閉じる';
    }
  });

  blurIntensity = document.getElementById('blur-intensity').value;
  // console.log(blurIntensity);

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

// 設定を保存する関数
function saveSettings(datetime, message, value) {
  // console.log(value);
  const settings = {
    blurValue: value,
  };

  // chrome.storage.localに保存
  chrome.storage.local.set({ settings: settings }, () => {
    messageOutput(datetime, message);
  });

}

function clickURL(link) {
  const url = link.href ? link.href : link;
  console.log(url);
  if (link instanceof HTMLElement) {
    link.addEventListener('click', (event) => {
      event.preventDefault(); // デフォルトの動作を防止

      chrome.tabs.create({ url });
      // console.log("OK");
    });
  }
}


const messageDiv = document.getElementById('message');
function messageOutput(datetime, message) {
  messageDiv.innerHTML += '<p class="m-0">' + datetime + ' ' + message + '</p>'; // <p> タグで囲んで新しい行にする
}

document.getElementById('messageClearButton').addEventListener('click', () => {
  messageDiv.innerHTML = '<p class="m-0">' + '' + '</p>';
});

function dateTime() {
  // 現在の日付と時刻を取得
  const now = new Date();
  const year = now.getFullYear();           // 年
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 月
  const day = String(now.getDate()).padStart(2, '0');         // 日
  const hours = String(now.getHours()).padStart(2, '0');       // 時
  const minutes = String(now.getMinutes()).padStart(2, '0');   // 分
  const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}`;
  // console.log(formattedDateTime);
  return formattedDateTime;
}

// 保存された設定を読み込む関数
function loadSettings() {

  chrome.storage.local.get(['settings', 'isEnabled'], (data) => {

    let message;
    if (blurElement) {
      blurElement.value = data.settings ? data.settings.blurValue : 5;
      document.getElementById('blur-intensity').innerHTML = blurElement.value;
      message = `ぼかしの強さ ${blurElement.value}px`;
    }
    if (blurEnabledElement) {
      isEnabled = data.isEnabled || false; // デフォルトはfalse
      blurEnabledElement.checked = isEnabled; // チェックボックスの状態を設定
    }
    messageOutput(dateTime(), isEnabled ? 'Easy Web Blurは有効になっています' : 'Easy Web Blurは無効になっています');
    messageOutput(dateTime(), message);
  });
}
loadSettings();