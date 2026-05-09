export {}

declare global {
  interface Window {
    __smartBookmarkDrawerInit?: boolean;
    __smartBookmarkToggleDrawer?: () => void;
    __smartBookmarkCloseDrawer?: () => void;
  }
}

const ROOT_ID = "smart-bookmark-manager-drawer-root";
const PANEL_WIDTH = 468;

if (!window.__smartBookmarkDrawerInit) {
  window.__smartBookmarkDrawerInit = true;

  const getHost = () => document.getElementById(ROOT_ID);

  const closeDrawer = () => {
    const host = getHost();
    if (!host) return;

    const panel = host.shadowRoot?.querySelector(".sbm-panel");
    const backdrop = host.shadowRoot?.querySelector(".sbm-backdrop");

    panel?.classList.remove("is-open");
    backdrop?.classList.remove("is-open");

    window.setTimeout(() => {
      host.remove();
    }, 180);
  };

  const ensureDrawer = () => {
    let host = getHost();
    if (host) return host;

    host = document.createElement("div");
    host.id = ROOT_ID;
    document.documentElement.appendChild(host);

    const shadow = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        all: initial;
      }
      .sbm-shell {
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        pointer-events: none;
      }
      .sbm-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(34, 29, 23, 0.12);
        opacity: 0;
        transition: opacity 180ms ease;
        pointer-events: auto;
      }
      .sbm-backdrop.is-open {
        opacity: 1;
      }
      .sbm-panel {
        position: absolute;
        top: 0;
        right: 0;
        width: min(${PANEL_WIDTH}px, 100vw);
        height: 100dvh;
        transform: translateX(100%);
        transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
        box-shadow: -24px 0 60px rgba(49, 37, 23, 0.18);
        background: #f5efe7;
        pointer-events: auto;
      }
      .sbm-panel.is-open {
        transform: translateX(0);
      }
      .sbm-iframe {
        border: 0;
        width: 100%;
        height: 100%;
        display: block;
        background: #f5efe7;
      }
      @media (max-width: 560px) {
        .sbm-panel {
          width: 100vw;
        }
      }
    `;

    const shell = document.createElement("div");
    shell.className = "sbm-shell";

    const backdrop = document.createElement("button");
    backdrop.className = "sbm-backdrop";
    backdrop.type = "button";
    backdrop.setAttribute("aria-label", "关闭书签抽屉");
    backdrop.addEventListener("click", closeDrawer);

    const panel = document.createElement("div");
    panel.className = "sbm-panel";

    const iframe = document.createElement("iframe");
    iframe.className = "sbm-iframe";
    iframe.src = chrome.runtime.getURL("index.html?view=drawer");
    iframe.title = "智能书签管理器";
    iframe.allow = "clipboard-read; clipboard-write";

    panel.appendChild(iframe);
    shell.append(backdrop, panel);
    shadow.append(style, shell);

    window.addEventListener("message", (event) => {
      if (event.data?.source === "smart-bookmark-manager" && event.data?.type === "close-drawer") {
        closeDrawer();
      }
    });

    return host;
  };

  const toggleDrawer = () => {
    const existing = getHost();
    if (existing) {
      closeDrawer();
      return;
    }

    const host = ensureDrawer();
    const panel = host.shadowRoot?.querySelector(".sbm-panel");
    const backdrop = host.shadowRoot?.querySelector(".sbm-backdrop");

    requestAnimationFrame(() => {
      panel?.classList.add("is-open");
      backdrop?.classList.add("is-open");
    });
  };

  window.__smartBookmarkToggleDrawer = toggleDrawer;
  window.__smartBookmarkCloseDrawer = closeDrawer;

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDrawer();
    }
  });

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === "toggleDrawer") {
      toggleDrawer();
      sendResponse({ ok: true });
    }

    if (request.action === "closeDrawer") {
      closeDrawer();
      sendResponse({ ok: true });
    }

    if (request.action === "getPageInfo") {
      sendResponse({
        title: document.title,
        url: window.location.href,
        description:
          document.querySelector('meta[name="description"]')?.getAttribute("content") || "",
      });
    }

    return true;
  });
}
