/**
 * FPS Monitor - Chrome Extension Content Script
 * Injects FPS overlay into pages, controlled via messaging
 */

import { FPSMonitor } from '../../../src/FPSMonitor';

let monitor: FPSMonitor | null = null;

// Listen for toggle messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'toggle') {
    if (monitor) {
      monitor.destroy();
      monitor = null;
      sendResponse({ active: false });
    } else {
      monitor = new FPSMonitor({ position: 'top-right', collapsed: false });
      sendResponse({ active: true });
    }
  } else if (message.action === 'status') {
    sendResponse({ active: !!monitor });
  }
  return true;
});
