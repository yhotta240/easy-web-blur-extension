let mouse = { startX: 0, startY: 0, selecting: false };
let blurSize = 5;
let overlays = []; 
let tooltip = null; 
let selectStyle; 
let isEnabled = false;

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
};

chrome.storage.local.get(['settings', 'isEnabled'], (data) => {
  blurSize = data.settings ? data.settings.blurValue : blurSize;
  handleBlurTool(data.isEnabled ?? false);
});

document.addEventListener('keydown', (e) => { 
  if (e.key === 'b' && e.ctrlKey && !e.shiftKey && !e.altKey) {
    if (chrome.runtime.lastError) {
      chrome.storage.local.get(['settings', 'isEnabled'], (data) => {
        blurSize = data.settings ? data.settings.blurValue : blurSize;
        isEnabled = !data.isEnabled;
        chrome.storage.local.set({ settings: data.settings, isEnabled: isEnabled });
        handleBlurTool(isEnabled);
      });
    }
  }
});

chrome.storage.onChanged.addListener((changes) => {
  isEnabled = changes.isEnabled ? changes.isEnabled.newValue : isEnabled;
  blurSize = changes.settings ? changes.settings.newValue.blurValue : blurSize;
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
  // 既存の選択無効化スタイルの設定
  if (!selectStyle) {
    selectStyle = document.createElement('style');
    selectStyle.id = 'disable-selection-style';
    selectStyle.innerHTML = `
      * {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }`;
    document.head.appendChild(selectStyle);
  }
}

function removeSelect() {
  const styleElement = document.getElementById('disable-selection-style');
  if (styleElement) {
    document.head.removeChild(styleElement); // スタイルを削除
    selectStyle = null; // 参照をクリア
  }
}



// 選択範囲のオーバーレイ作成と初期設定
const selBox = document.createElement('div');

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

// ブラー効果を適用する
function applyBlur(rect) {
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
  if (!isEnabled) return;
  const target = e.target;
  if (overlays.includes(target)) {
    target.remove();
    overlays = overlays.filter((ov) => ov !== target);
  }
});

// Ctrl+Zで最後のオーバーレイ削除リスナー
document.addEventListener('keydown', (e) => {
  if (!isEnabled || !(e.ctrlKey && e.key === 'z')) return;
  const lastOverlay = overlays.pop();
  if (lastOverlay) lastOverlay.remove();
});






