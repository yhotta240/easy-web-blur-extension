let mouse = { startX: 0, startY: 0, selecting: false };
let blurSize = 5;
let overlays = []; // 追加されたモザイクオーバーレイを保持する配列
let tooltip = null; // ツールチップ要素を保持する変数
let selectStyle; // ユーザー選択を無効化するスタイルを保持する変数
let isToolActive = false;

const handleBlurTool = (isEnabled) => {
  if (isEnabled) {
    showToolTip();
    addSelect();
    activateBlurTool();
  } else {
    hideToolTip();
    removeSelect();
    stopBlurTool();
  }
  isToolActive = isEnabled;
};

chrome.storage.local.get(['settings', 'isEnabled'], (data) => {
  blurSize = data.settings ? data.settings.blurValue : blurSize;
  handleBlurTool(data.isEnabled ?? false);
});

document.addEventListener('keydown', (e) => { // ショートカットキー（Ctrl+B）で起動
  if (e.key === 'b' && e.ctrlKey && !e.shiftKey && !e.altKey) {
    chrome.storage.local.get(['settings', 'isEnabled'], (data) => {
      blurSize = data.settings ? data.settings.blurValue : blurSize;
      const isEnabled = !data.isEnabled;
      chrome.storage.local.set({ settings: data.settings, isEnabled: isEnabled });
      handleBlurTool(isEnabled);
    });
  }
});

chrome.storage.onChanged.addListener((changes) => {
  const isEnabled = changes.isEnabled ? changes.isEnabled.newValue : isToolActive;
  blurSize = changes.settings ? changes.settings.newValue.blurValue : blurSize;
  // console.log(`Change storage: ${isEnabled}`);
  // console.log(`blurSize: ${blurSize}`);
  handleBlurTool(isEnabled);

});



function showToolTip() {
  // 既にツールチップが存在している場合は何もしない
  if (tooltip) return;

  // ツールチップ用の要素を作成
  tooltip = document.createElement('div');
  tooltip.innerHTML = `
    <div style="text-align: center;">
      <strong>ぼかし:</strong> ON<br>
      <p> </p>
    </div>
    <div>
      - アクティブ: <code>Ctrl+B</code><br>
      - 前に戻す: <code>Ctrl+Z</code><br>
      - ぼかし解除: 直接クリック<br>
    </div>
  `;
  Object.assign(tooltip.style, {
    position: 'fixed',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '5px 10px',
    margin: '10px',
    borderRadius: '5px',
    fontSize: '12px',
    pointerEvents: 'none',
    zIndex: '2147483648'
  });
  // ページに追加
  document.body.appendChild(tooltip);
  // マウス移動イベントでツールチップの位置を更新
  document.addEventListener('mousemove', updateTooltipPosition);
}

function hideToolTip() {
  if (tooltip) {
    // ツールチップを削除
    tooltip.remove();
    tooltip = null;
    // マウス移動イベントリスナーを削除
    document.removeEventListener('mousemove', updateTooltipPosition);
  }
}

function updateTooltipPosition(event) {
  const offsetX = 10;
  const offsetY = 10;
  tooltip.style.left = `${event.clientX + offsetX}px`;
  tooltip.style.top = `${event.clientY + offsetY}px`;
}



function addSelect() {
  // 選択無効化スタイルの設定
  selectStyle = document.createElement('style');
  selectStyle.innerHTML = `
        * {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }`;
  document.head.appendChild(selectStyle);
}
function removeSelect() {
  if (selectStyle) {
    document.head.removeChild(selectStyle); // スタイルを削除
    selectStyle = null; // 参照をクリア
  }
}


// 選択範囲のオーバーレイ作成と初期設定
const selBox = document.createElement('div');
// const overlay = document.createElement('div');

function activateBlurTool() {
  // 選択範囲ボックスの初期設定
  Object.assign(selBox.style, {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: '2147483647',
    border: '1px dashed blue',
  });
  document.body.appendChild(selBox);

  // マウスイベントリスナーの設定
  document.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

function stopBlurTool() {
  document.removeEventListener('mousedown', onMouseDown);
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  selBox.style.width = '0px';
  selBox.style.height = '0px';
  // console.log('Blur tool disabled');
}

// マウスイベントリスナーの設定
function onMouseDown(e) {

  mouse.selecting = true;
  mouse.startX = e.pageX;
  mouse.startY = e.pageY;
  Object.assign(selBox.style, {
    left: `${mouse.startX}px`,
    top: `${mouse.startY}px`,
    width: '0px',
    height: '0px',
    border: '1px dashed blue'
  });
}

function onMouseMove(e) {

  if (!mouse.selecting) return;

  const width = e.pageX - mouse.startX;
  const height = e.pageY - mouse.startY;
  // ボーダーを常に表示
  Object.assign(selBox.style, {
    width: `${Math.abs(width)}px`,
    height: `${Math.abs(height)}px`,
    left: `${Math.min(e.pageX, mouse.startX)}px`,
    top: `${Math.min(e.pageY, mouse.startY)}px`,
    border: '1px dashed blue'
  });
}

function onMouseUp() {
  const rect = selBox.getBoundingClientRect();
  applyBlur({
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    bottom: rect.bottom + window.scrollY,
    right: rect.right + window.scrollX
  });
  selBox.style.border = 'none';// ボーダーを再表示
  mouse.selecting = false;

}

// ブラー効果を適用する関数
function applyBlur(rect) {
  // オーバーレイのスタイル設定
  // 選択範囲が点（幅と高さが 0）なら処理を無視
  const width = rect.right - rect.left;
  const height = rect.bottom - rect.top;
  if (width <= 10 || height <= 10) return;

  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'absolute',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.right - rect.left}px`,
    height: `${rect.bottom - rect.top}px`,
    pointerEvents: 'auto',
    zIndex: '2147483646',
    backgroundColor: 'transparent',
    backdropFilter: `blur(${blurSize}px)`
  });
  // console.log(overlays);
  document.body.appendChild(overlay);
  overlays.push(overlay); // 配列に追加

}
// オーバーレイクリック削除リスナー
document.addEventListener('click', (e) => {
  if (!isToolActive) return;
  const target = e.target;
  if (overlays.includes(target)) {
    target.remove();
    overlays = overlays.filter((ov) => ov !== target);
  }
});

// Ctrl+Zで最後のオーバーレイ削除リスナー
document.addEventListener('keydown', (e) => {
  if (!isToolActive || !(e.ctrlKey && e.key === 'z')) return;
  const lastOverlay = overlays.pop();
  if (lastOverlay) lastOverlay.remove();
});






