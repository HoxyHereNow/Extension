const htmlInput = document.getElementById('html');
const cssInput = document.getElementById('css');
const jsInput = document.getElementById('js');
const saveBtn = document.getElementById('saveBtn');

async function getCurrentDomain() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = new URL(tab.url);
  return url.hostname;
}

async function loadSavedCode() {
  const domain = await getCurrentDomain();
  chrome.storage.local.get(domain, (result) => {
    if (result[domain]) {
      htmlInput.value = result[domain].html || '';
      cssInput.value = result[domain].css || '';
      jsInput.value = result[domain].js || '';
    }
  });
}

saveBtn.onclick = async () => {
  const domain = await getCurrentDomain();
  const data = {
    html: htmlInput.value,
    css: cssInput.value,
    js: jsInput.value
  };
  chrome.storage.local.set({ [domain]: data }, () => {
    injectCode(domain);
  });
};

async function injectCode(domain) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (domain) => {
      chrome.storage.local.get(domain, (result) => {
        const code = result[domain];
        if (!code) return;

        // Inject HTML
        if (code.html) {
          const container = document.createElement('div');
          container.innerHTML = code.html;
          document.body.appendChild(container);
        }

        // Inject CSS
        if (code.css) {
          const style = document.createElement('style');
          style.textContent = code.css;
          document.head.appendChild(style);
        }

        // Inject JS
        if (code.js) {
          const script = document.createElement('script');
          script.textContent = code.js;
          document.body.appendChild(script);
        }
      });
    },
    args: [domain]
  });
}

// Load saved code on popup open
loadSavedCode();
