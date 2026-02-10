/**
 * FPS Monitor - Background Service Worker
 * Handles keyboard shortcut commands
 */

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-fps') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
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
  }
});
