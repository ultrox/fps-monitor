/**
 * FPS Monitor - Chrome Extension Popup
 */

const toggleBtn = document.getElementById('toggle') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLSpanElement;

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function updateStatus() {
  const tab = await getCurrentTab();
  if (!tab.id) return;
  
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'status' });
    statusEl.textContent = response.active ? 'Active' : 'Inactive';
    statusEl.dataset.active = String(response.active);
    toggleBtn.textContent = response.active ? 'Hide Monitor' : 'Show Monitor';
  } catch {
    statusEl.textContent = 'Inactive';
    statusEl.dataset.active = 'false';
    toggleBtn.textContent = 'Show Monitor';
  }
}

toggleBtn.addEventListener('click', async () => {
  const tab = await getCurrentTab();
  if (!tab.id) return;
  
  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
  } catch {
    // Content script not loaded, inject it first
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    await chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
  }
  
  await updateStatus();
});

// Init
updateStatus();
