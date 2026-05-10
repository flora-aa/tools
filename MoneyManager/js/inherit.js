const GIST_API = 'https://api.github.com/gists';
const TOKEN_STORAGE_KEY = 'mm_github_token';
const PIN_EXPIRY_MS = 5 * 60 * 1000;

let currentExport = null;
let expiryTimer = null;

function generatePin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function translateApiError(status, body) {
  const msg = body && body.message;
  if (status === 401) return 'Token 无效或已过期，请在 GitHub 重新生成';
  if (status === 403) {
    if (msg && /rate|limit/i.test(msg)) return 'API 请求过于频繁，请等待几分钟后重试';
    return 'Token 权限不足，需勾选 gist 权限（创建 Gist 所需的最小权限）';
  }
  if (status === 404) return '未找到指定的 Gist，请检查 ID 是否正确';
  if (status === 410) return '该 Gist 已被删除或已过期';
  if (status === 422) return '数据格式有误，导出失败';
  if (status >= 500) return 'GitHub 服务器暂时不可用，请稍后重试';
  return msg || `请求失败（HTTP ${status}）`;
}

function translateNetworkError(err) {
  if (!(err instanceof TypeError)) return null;
  return '网络连接失败，无法访问 GitHub API，请检查网络或防火墙设置';
}

function translateCryptoError(err) {
  if (err.name === 'OperationError') {
    if (err.message.includes('decrypt')) return 'PIN 码错误或数据已损坏';
    return '加密/解密操作失败，请重试';
  }
  if (err.name === 'NotSupportedError') {
    return '浏览器不支持加密功能，请使用现代浏览器（Chrome/Firefox/Edge）';
  }
  return null;
}

function translateJsonError(err) {
  if (err instanceof SyntaxError && err.message.includes('JSON')) {
    return '数据解析失败，文件可能已损坏或被篡改';
  }
  return null;
}

function getErrorMessage(err) {
  return translateNetworkError(err)
    || translateCryptoError(err)
    || translateJsonError(err)
    || err.message
    || '操作失败，请重试';
}

async function encryptData(plaintext, pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(pin), 'PBKDF2', false, ['deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
  const binary = String.fromCharCode(...combined);
  return btoa(binary);
}

async function decryptData(encoded, pin) {
  const binary = atob(encoded);
  const combined = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    combined[i] = binary.charCodeAt(i);
  }
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(pin), 'PBKDF2', false, ['deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(decrypted);
}

async function deleteGist(token, gistId) {
  const response = await fetch(`${GIST_API}/${gistId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  if (!response.ok && response.status !== 404) {
    const body = await response.json().catch(() => ({}));
    throw new Error(translateApiError(response.status, body));
  }
}

function buildExportData() {
  saveData();
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      mm_transactions: JSON.parse(localStorage.getItem('mm_transactions') || '[]'),
      mm_memos: {},
      mm_budgets: JSON.parse(localStorage.getItem('mm_budgets') || '{}'),
      mm_lastAmounts: JSON.parse(localStorage.getItem('mm_lastAmounts') || '{}')
    }
  };
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('mm_memo_')) {
      data.data.mm_memos[key.replace('mm_memo_', '')] = localStorage.getItem(key) || '';
    }
  }
  return data;
}

function getDataOverview() {
  const txCount = transactions.length;
  let dateRange = '';
  let budgetCount = 0;
  if (txCount > 0) {
    let minDate = transactions[0].date;
    let maxDate = transactions[0].date;
    for (const t of transactions) {
      if (t.date < minDate) minDate = t.date;
      if (t.date > maxDate) maxDate = t.date;
    }
    const fmt = (d) => {
      const parts = d.split('-');
      return `${parts[0]}.${parts[1]}`;
    };
    dateRange = `${fmt(minDate)} - ${fmt(maxDate)}`;
  }
  try {
    const budgets = JSON.parse(localStorage.getItem('mm_budgets') || '{}');
    budgetCount = Object.keys(budgets).length;
  } catch {}
  return { txCount, dateRange, budgetCount };
}

async function exportToGist(token, pin) {
  const exportData = buildExportData();
  const jsonContent = JSON.stringify(exportData, null, 2);
  const encrypted = await encryptData(jsonContent, pin);
  const response = await fetch(`${GIST_API}`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    },
    body: JSON.stringify({
      description: 'MoneyManager Data Export',
      public: true,
      files: {
        'mm-data.json': { content: encrypted }
      }
    })
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(translateApiError(response.status, body));
  }
  const result = await response.json();
  return result.id;
}

async function importFromGist(gistId, pin) {
  const response = await fetch(`${GIST_API}/${gistId}`, {
    headers: {
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(translateApiError(response.status, body));
  }
  const result = await response.json();
  const file = result.files && result.files['mm-data.json'];
  if (!file || !file.content) {
    throw new Error('该 Gist 中未找到记账数据文件（mm-data.json）');
  }
  const jsonContent = await decryptData(file.content.trim(), pin);
  let parsed;
  try {
    parsed = JSON.parse(jsonContent);
  } catch (e) {
    throw new Error('PIN 码错误或数据已损坏');
  }
  if (!parsed.data) {
    throw new Error('数据格式异常：缺少 data 字段');
  }
  if (parsed.data.mm_transactions && !Array.isArray(parsed.data.mm_transactions)) {
    throw new Error('数据格式异常：交易记录格式不正确');
  }
  return parsed.data;
}

function initInheritPanel() {
  const overview = getDataOverview();
  document.getElementById('inheritTxCount').textContent = `${overview.txCount} 笔`;
  document.getElementById('inheritDateRange').textContent = overview.dateRange || '暂无数据';
  document.getElementById('inheritBudgetCount').textContent = `${overview.budgetCount} 个月`;
}

function switchInheritTab(tab) {
  const exportTab = document.getElementById('btnExportTab');
  const importTab = document.getElementById('btnImportTab');
  const exportPanel = document.getElementById('exportPanel');
  const importPanel = document.getElementById('importPanel');
  if (tab === 'export') {
    exportTab.classList.add('active');
    importTab.classList.remove('active');
    exportPanel.style.display = '';
    importPanel.style.display = 'none';
  } else {
    importTab.classList.add('active');
    exportTab.classList.remove('active');
    importPanel.style.display = '';
    exportPanel.style.display = 'none';
  }
}

function stopExpiryTimer() {
  if (expiryTimer) {
    clearInterval(expiryTimer);
    expiryTimer = null;
  }
}

function startExpiryCountdown() {
  if (!currentExport) return;
  stopExpiryTimer();
  const update = () => {
    const remaining = Math.max(0, currentExport.expiresAt - Date.now());
    const el = document.getElementById('exportExpiry');
    if (remaining <= 0) {
      el.textContent = '已过期';
      el.className = 'inherit-expiry inherit-expiry-expired';
      document.getElementById('exportPinValue').className = 'inherit-pin-value inherit-pin-expired';
      stopExpiryTimer();
      if (currentExport.token && currentExport.gistId) {
        deleteGist(currentExport.token, currentExport.gistId).catch(() => {});
      }
      currentExport = null;
      return;
    }
    const secs = Math.ceil(remaining / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    el.textContent = `${m}:${String(s).padStart(2, '0')}`;
    el.className = 'inherit-expiry';
  };
  update();
  if (currentExport) {
    expiryTimer = setInterval(update, 1000);
  }
}

function resetExportForm() {
  stopExpiryTimer();
  document.getElementById('exportSuccess').style.display = 'none';
  document.getElementById('exportForm').style.display = '';
  const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY) || '';
  document.getElementById('exportToken').value = savedToken;
  document.getElementById('exportToken').disabled = false;
  document.getElementById('btnExport').disabled = false;
  document.getElementById('btnExport').textContent = '导出并上传到 Gist';
  document.getElementById('exportStatus').style.display = 'none';
  if (currentExport) {
    document.getElementById('exportForm').style.display = 'none';
    document.getElementById('exportSuccess').style.display = '';
    document.getElementById('exportGistId').textContent = currentExport.gistId;
    document.getElementById('exportPinValue').textContent = currentExport.pin;
    document.getElementById('exportPinValue').className = 'inherit-pin-value';
    startExpiryCountdown();
  }
}

function handleExport() {
  const token = document.getElementById('exportToken').value.trim();
  if (!token) {
    document.getElementById('exportStatus').textContent = '请输入 GitHub Token';
    document.getElementById('exportStatus').className = 'inherit-status inherit-status-error';
    document.getElementById('exportStatus').style.display = '';
    return;
  }
  const pin = generatePin();
  const btn = document.getElementById('btnExport');
  btn.disabled = true;
  btn.textContent = '正在加密并上传...';
  const statusEl = document.getElementById('exportStatus');
  statusEl.textContent = '正在加密并上传数据到 Gist...';
  statusEl.className = 'inherit-status';
  statusEl.style.display = '';
  initInheritPanel();
  exportToGist(token, pin).then(gistId => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    currentExport = { gistId, pin, token, expiresAt: Date.now() + PIN_EXPIRY_MS };
    document.getElementById('exportForm').style.display = 'none';
    document.getElementById('exportSuccess').style.display = '';
    document.getElementById('exportGistId').textContent = gistId;
    document.getElementById('exportPinValue').textContent = pin;
    document.getElementById('exportPinValue').className = 'inherit-pin-value';
    startExpiryCountdown();
  }).catch(err => {
    statusEl.textContent = getErrorMessage(err);
    statusEl.className = 'inherit-status inherit-status-error';
    statusEl.style.display = '';
    btn.disabled = false;
    btn.textContent = '导出并上传到 Gist';
  });
}

function handleCopyGistId() {
  const gistId = document.getElementById('exportGistId').textContent;
  navigator.clipboard.writeText(gistId).then(() => {
    showToast('已复制 Gist ID');
  }).catch(() => {
    showToast('复制失败，请手动复制');
  });
}

function handleCopyPin() {
  const pin = document.getElementById('exportPinValue').textContent;
  navigator.clipboard.writeText(pin).then(() => {
    showToast('已复制 PIN');
  }).catch(() => {
    showToast('复制失败，请手动复制');
  });
}

function handleImport() {
  const gistId = document.getElementById('importGistId').value.trim();
  const pin = document.getElementById('importPin').value.trim();
  const statusEl = document.getElementById('importStatus');
  if (!gistId) {
    statusEl.textContent = '请输入 Gist ID';
    statusEl.className = 'inherit-status inherit-status-error';
    statusEl.style.display = '';
    return;
  }
  if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    statusEl.textContent = '请输入 6 位 PIN 码';
    statusEl.className = 'inherit-status inherit-status-error';
    statusEl.style.display = '';
    return;
  }
  if (!confirm('确认数据继承\n\n此操作将：\n• 清空本设备上的所有记账数据\n• 替换为旧设备导出的数据\n\n此操作不可撤销！\n\n确认继承？')) {
    return;
  }
  const btn = document.getElementById('btnImport');
  btn.disabled = true;
  btn.textContent = '正在下载...';
  statusEl.textContent = '正在下载并解密数据...';
  statusEl.className = 'inherit-status';
  statusEl.style.display = '';
  importFromGist(gistId, pin).then(data => {
    const savedTheme = localStorage.getItem('mm_theme');
    localStorage.clear();
    if (savedTheme) {
      localStorage.setItem('mm_theme', savedTheme);
    }
    if (data.mm_transactions) {
      localStorage.setItem('mm_transactions', JSON.stringify(data.mm_transactions));
    }
    if (data.mm_budgets) {
      localStorage.setItem('mm_budgets', JSON.stringify(data.mm_budgets));
    }
    if (data.mm_lastAmounts) {
      localStorage.setItem('mm_lastAmounts', JSON.stringify(data.mm_lastAmounts));
    }
    if (data.mm_memos) {
      for (const [key, value] of Object.entries(data.mm_memos)) {
        localStorage.setItem(`mm_memo_${key}`, value);
      }
    }
    location.reload();
  }).catch(err => {
    statusEl.textContent = getErrorMessage(err);
    statusEl.className = 'inherit-status inherit-status-error';
    statusEl.style.display = '';
    btn.disabled = false;
    btn.textContent = '导入并继承数据';
  });
}
