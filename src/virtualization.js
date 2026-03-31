// virtualization.js
(function initializeVirtualizationModule() {
  const scroller = window.ChatGPTVirtualScroller;
  const config = scroller.config;
  const state = scroller.state;
  const log = scroller.log;

  // ---------------------------------------------------------------------------
  // Small activation badge
  // ---------------------------------------------------------------------------

  const BADGE_ATTRIBUTE = "data-chatgpt-virtual-scroller-badge";

  // Tracks whether we've already shown the activation badge for this chat
  let hasShownBadgeForCurrentChat = false;

  /**
   * Show a small fancy badge near the chat input for ~2 seconds.
   * Used to indicate that virtualization is active for this chat.
   */
  function showActiveBadge() {
    // Remove previous badge if any
    const existingBadge = document.querySelector(`[${BADGE_ATTRIBUTE}]`);
    if (existingBadge) existingBadge.remove();

    const badge = document.createElement("div");
    badge.setAttribute(BADGE_ATTRIBUTE, "1");

    // Little icon + text (Chinese)
    badge.innerHTML = `<span style="margin-right:4px">⚡</span><span>卡顿修复已激活</span>`;

    const inputEl = document.querySelector("#prompt-textarea");
    let targetEl = inputEl;
    
    if (inputEl) {
       const wrapper = inputEl.closest('[class*="bg-token-bg-primary"]') || inputEl.closest('form');
       if (wrapper) targetEl = wrapper;
    }

    let posStyles = {
      position: "fixed",
      left: "20px",
      bottom: "150px"
    };

    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      let bottomVal = window.innerHeight - rect.top + 10;

      // If Donation Badge is already visible, stack on top
      if (scroller.DonationBadge && scroller.DonationBadge.isVisible) {
          bottomVal = 180;
      }

      posStyles = {
        position: "fixed",
        left: `${rect.left}px`,
        bottom: `${bottomVal}px`, 
        top: "auto",
        right: "auto"
      };
    }

    Object.assign(badge.style, {
      ...posStyles,
      zIndex: "9999",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "4px",
      padding: "5px 12px",
      borderRadius: "999px",
      fontSize: "16px",
      fontWeight: "500",
      color: "#ffffff",
      background: "linear-gradient(135deg, #5c9fe7, #44a1ad)",
      boxShadow: "0 6px 18px rgba(15, 23, 42, 0.35)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      pointerEvents: "none",
      opacity: "0",
      transform: "translateY(6px) scale(0.98)",
      transition:
        "opacity 180ms ease-out, transform 180ms ease-out, filter 180ms ease-out"
    });

    document.body.appendChild(badge);

    requestAnimationFrame(() => {
      badge.style.opacity = "1";
      badge.style.transform = "translateY(0) scale(1)";
    });

    // After 5 seconds, fade out and remove
    setTimeout(() => {
      badge.style.opacity = "0";
      badge.style.transform = "translateY(6px) scale(0.98)";
      setTimeout(() => {
        if (badge.isConnected) badge.remove();
      }, 250);
    }, 5000);
  }

  // ---------------------------------------------------------------------------
  // Selectors
  // ---------------------------------------------------------------------------

  /**
   * Find the main conversation root element.
   *
   * @returns {HTMLElement}
   */
  function findConversationRoot() {
    const selectors = [
      'main[class*="conversation" i]',
      '[role="main"]',
      "main",
      '[class*="thread" i]',
      '[class*="conversation" i]',
      // New selectors for newer ChatGPT UI
      '[data-testid="conversation-container"]',
      '[class*="chat-container" i]',
      '[class*="messages-container" i]',
      '[class*="conversation-container" i]',
      'div[role="main"]'
    ];

    for (const selector of selectors) {
      const root = document.querySelector(selector);
      if (root instanceof HTMLElement) {
        log("Found conversation root via selector:", selector);
        return root;
      }
    }

    log("Conversation root not found via selectors; using <body>");
    return document.body;
  }

  /** @returns {boolean} */
  function hasAnyMessages() {
    // Check primary selector first
    if (document.querySelector(config.ARTICLE_SELECTOR)) {
      log("Found messages via primary selector:", config.ARTICLE_SELECTOR);
      return true;
    }
    
    // Check alternative selectors for newer ChatGPT UI
    if (config.ALT_MESSAGE_SELECTORS) {
      for (const selector of config.ALT_MESSAGE_SELECTORS) {
        if (document.querySelector(selector)) {
          log("Found messages via alternative selector:", selector);
          return true;
        }
      }
    }
    
    // Additional debug: log common container elements
    log("Debug: checking common container elements");
    const commonContainers = [
      'main',
      '[role="main"]',
      'div[class*="chat" i]',
      'div[class*="conversation" i]',
      'div[class*="messages" i]'
    ];
    
    for (const selector of commonContainers) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        log(`Found ${elements.length} elements for selector:`, selector);
        // Log first element's class and structure
        if (elements[0]) {
          log(`First element class:`, elements[0].className);
          log(`First element children count:`, elements[0].children.length);
        }
      }
    }
    
    log("No messages found with any selector");
    return false;
  }

  /**
   * Find the scrollable container for the conversation.
   * Returns cached container if already found and still valid.
   *
   * @returns {HTMLElement | Window | null}
   */
  function findScrollContainer() {
    // Early bail-out: if we already have a scroll element, verify it's still valid
    if (state.scrollElement && state.scrollElement !== window) {
      const el = state.scrollElement;
      if (el.isConnected) {
        return el; // Still valid, skip expensive checks
      }
    }

    // Try to find message elements using primary and alternative selectors
    let firstMessage = document.querySelector(config.ARTICLE_SELECTOR);
    
    if (!firstMessage && config.ALT_MESSAGE_SELECTORS) {
      for (const selector of config.ALT_MESSAGE_SELECTORS) {
        firstMessage = document.querySelector(selector);
        if (firstMessage) break;
      }
    }

    if (firstMessage instanceof HTMLElement) {
      let ancestor = firstMessage.parentElement;
      while (
        ancestor &&
        ancestor !== document.body &&
        ancestor !== document.documentElement
      ) {
        const styles = getComputedStyle(ancestor);
        const overflowY = styles.overflowY;
        const isScrollable =
          (overflowY === "auto" || overflowY === "scroll") &&
          ancestor.scrollHeight > ancestor.clientHeight + 10;

        if (isScrollable) {
          log(
            "Found scroll container from ancestor:",
            ancestor.tagName,
            ancestor.className
          );
          return ancestor;
        }
        ancestor = ancestor.parentElement;
      }
    }

    // Check common scroll container selectors for newer ChatGPT UI
    const scrollContainerSelectors = [
      '[class*="scroll" i]',
      '[class*="container" i]',
      '[class*="messages" i]',
      '[class*="conversation" i]'
    ];
    
    for (const selector of scrollContainerSelectors) {
      const container = document.querySelector(selector);
      if (container instanceof HTMLElement) {
        const styles = getComputedStyle(container);
        const overflowY = styles.overflowY;
        const isScrollable =
          (overflowY === "auto" || overflowY === "scroll") &&
          container.scrollHeight > container.clientHeight + 10;
        
        if (isScrollable) {
          log(
            "Found scroll container via common selector:",
            selector
          );
          return container;
        }
      }
    }

    if (state.conversationRoot) {
      if (
        state.conversationRoot.scrollHeight >
        state.conversationRoot.clientHeight + 10
      ) {
        log("Using conversation root as scroll container");
        return state.conversationRoot;
      }
    }

    const docScroll =
      document.scrollingElement || document.documentElement || document.body;

    log("Using document.scrollingElement as scroll container");
    return docScroll;
  }

  // ---------------------------------------------------------------------------
  // Core virtualization helpers
  // ---------------------------------------------------------------------------

  /**
   * Assign virtual IDs to visible <article> messages.
   */
  function ensureVirtualIds() {
    const articleList = document.querySelectorAll(config.ARTICLE_SELECTOR);

    articleList.forEach((node) => {
      if (!(node instanceof HTMLElement)) return;

      if (!node.dataset.virtualId) {
        const newId = String(state.nextVirtualId++);
        node.dataset.virtualId = newId;
        state.articleMap.set(newId, node);
      } else {
        const id = node.dataset.virtualId;
        if (id && !state.articleMap.has(id)) {
          state.articleMap.set(id, node);
        }
      }
    });
  }

  /**
   * Get viewport position/height for the scroll container.
   */
  function getViewportMetrics() {
    const scrollElement = state.scrollElement;

    if (
      scrollElement &&
      scrollElement !== document.body &&
      scrollElement !== document.documentElement &&
      scrollElement !== window &&
      scrollElement instanceof HTMLElement
    ) {
      const rect = scrollElement.getBoundingClientRect();
      return { top: rect.top, height: scrollElement.clientHeight };
    }

    return { top: 0, height: window.innerHeight };
  }

  function convertArticleToSpacer(articleElement) {
    const id = articleElement.dataset.virtualId;
    if (!id || !articleElement.isConnected) return;

    const rect = articleElement.getBoundingClientRect();
    const height = rect.height || 24;

    const spacer = document.createElement("div");
    spacer.dataset.chatgptVirtualSpacer = "1";
    spacer.dataset.virtualId = id;
    spacer.style.height = `${height}px`;
    spacer.style.pointerEvents = "none";
    spacer.style.opacity = "0";

    articleElement.replaceWith(spacer);
    state.articleMap.set(id, articleElement);
  }

  function convertSpacerToArticle(spacerElement) {
    const id = spacerElement.dataset.virtualId;
    if (!id) return;

    const original = state.articleMap.get(id);
    if (!original || original.isConnected) return;

    spacerElement.replaceWith(original);
  }

  function updateStats() {
    const nodes = document.querySelectorAll(
      `${config.ARTICLE_SELECTOR}, div[data-chatgpt-virtual-spacer="1"]`
    );

    let total = 0;
    let rendered = 0;

    nodes.forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      if (!node.dataset.virtualId) return;

      total += 1;
      if (node.tagName === "ARTICLE") rendered += 1;
    });

    state.stats.totalMessages = total;
    state.stats.renderedMessages = rendered;

    // Check for new messages to trigger Nudge
    if (scroller.DonationBadge) {
       scroller.DonationBadge.onStatsUpdate(total);
    }
  }

  /**
   * Detect if ChatGPT is currently streaming a response.
   */
  function isStreaming() {
    return !!document.querySelector('[data-testid="stop-button"]');
  }

  /**
   * Compute stats from a pre-queried node list.
   * @param {NodeListOf<Element>} nodes
   */
  function computeStats(nodes) {
    let total = 0;
    let rendered = 0;

    nodes.forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      if (!node.dataset.virtualId) return;

      total += 1;
      // Count any non-spacer element as rendered
      if (node.dataset.chatgptVirtualSpacer !== "1") rendered += 1;
    });

    state.stats.totalMessages = total;
    state.stats.renderedMessages = rendered;

    // Check for new messages to trigger Nudge
    if (scroller.DonationBadge) {
       scroller.DonationBadge.onStatsUpdate(total);
    }
  }

  function virtualizeNow() {
    if (!state.enabled) return;

    // Skip virtualization while ChatGPT is streaming a response
    if (isStreaming()) {
      log("virtualize: streaming detected, skipping");
      return;
    }

    // Build selector string including primary and alternative selectors
    let messageSelectors = config.ARTICLE_SELECTOR;
    if (config.ALT_MESSAGE_SELECTORS) {
      messageSelectors += ", " + config.ALT_MESSAGE_SELECTORS.join(", ");
    }

    log("virtualize: using message selectors:", messageSelectors);

    // Single DOM query for all nodes (messages + spacers)
    const nodes = document.querySelectorAll(
      `${messageSelectors}, div[data-chatgpt-virtual-spacer="1"]`
    );
    
    log("virtualize: found", nodes.length, "nodes total");
    
    // Count message nodes vs spacer nodes
    let messageNodeCount = 0;
    let spacerNodeCount = 0;
    nodes.forEach(node => {
      if (node.dataset.chatgptVirtualSpacer === "1") {
        spacerNodeCount++;
      } else {
        messageNodeCount++;
      }
    });
    log("virtualize: message nodes:", messageNodeCount, "spacer nodes:", spacerNodeCount);
    
    if (!nodes.length) {
      log("virtualize: no messages yet");
      return;
    }

    // Assign virtual IDs to any new messages in the list
    nodes.forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      if (node.dataset.chatgptVirtualSpacer === "1") return;
      
      if (!node.dataset.virtualId) {
        const newId = String(state.nextVirtualId++);
        node.dataset.virtualId = newId;
        state.articleMap.set(newId, node);
      } else {
        const id = node.dataset.virtualId;
        if (id && !state.articleMap.has(id)) {
          state.articleMap.set(id, node);
        }
      }
    });

    const viewport = getViewportMetrics();

    nodes.forEach((node) => {
      if (!(node instanceof HTMLElement)) return;

      const rect = node.getBoundingClientRect();
      const relativeTop = rect.top - viewport.top;
      const relativeBottom = rect.bottom - viewport.top;

      const isOutside =
        relativeBottom < -config.MARGIN_PX ||
        relativeTop > viewport.height + config.MARGIN_PX;

      if (node.dataset.chatgptVirtualSpacer === "1") {
        if (!isOutside) convertSpacerToArticle(node);
      } else {
        // Treat any non-spacer element as a message element
        if (isOutside) convertArticleToSpacer(node);
      }
    });

    // Compute stats using already-queried nodes (re-query needed as DOM may have changed)
    const updatedNodes = document.querySelectorAll(
      `${messageSelectors}, div[data-chatgpt-virtual-spacer="1"]`
    );
    computeStats(updatedNodes);
    log(
      `virtualize: total=${state.stats.totalMessages}, rendered=${state.stats.renderedMessages}`
    );

    // Show activation badge only once per chat,
    // and only after we know there are messages and virtualization has run.
    if (
      !hasShownBadgeForCurrentChat &&
      state.stats.totalMessages > 0
    ) {
      hasShownBadgeForCurrentChat = true;
      showActiveBadge();
    }
  }

  function scheduleVirtualization() {
    if (state.requestAnimationScheduled) return;
    state.requestAnimationScheduled = true;

    requestAnimationFrame(() => {
      state.requestAnimationScheduled = false;
      virtualizeNow();
    });
  }

  function getStatsSnapshot() {
    const { totalMessages, renderedMessages } = state.stats;
    const saved =
      totalMessages > 0
        ? Math.round((1 - renderedMessages / totalMessages) * 100)
        : 0;

    return {
      totalMessages,
      renderedMessages,
      memorySavedPercent: saved
    };
  }

  // ---------------------------------------------------------------------------
  // Observers
  // ---------------------------------------------------------------------------

  function setupScrollTracking(scrollContainer, onScrollChange) {
    let lastCheckTime = 0;
    let frameId = null;

    const now =
      typeof performance !== "undefined" && performance.now
        ? () => performance.now()
        : () => Date.now();

    const runCheck = () => {
      const currentTime = now();
      if (currentTime - lastCheckTime < config.SCROLL_THROTTLE_MS) return;
      lastCheckTime = currentTime;
      onScrollChange();
    };

    const handleScroll = () => {
      if (frameId !== null) return;
      frameId = requestAnimationFrame(() => {
        frameId = null;
        runCheck();
      });
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    runCheck();

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }

  function createDebouncedObserver(onMutation, delayMs) {
    let timerId = null;

    return new MutationObserver(() => {
      if (timerId !== null) clearTimeout(timerId);
      timerId = setTimeout(() => {
        timerId = null;
        onMutation();
      }, delayMs);
    });
  }

  // ---------------------------------------------------------------------------
  // Main: boot, teardown, URL watcher
  // ---------------------------------------------------------------------------

  function attachOrUpdateScrollListener() {
    if (!hasAnyMessages()) return;

    const container = findScrollContainer();
    if (!container) return;

    if (container === state.scrollElement && state.cleanupScrollListener) {
      return; // already correct
    }

    if (state.cleanupScrollListener) {
      state.cleanupScrollListener();
      state.cleanupScrollListener = null;
    }

    state.scrollElement = container;
    state.cleanupScrollListener = setupScrollTracking(container, () => {
      scheduleVirtualization();
    });

    log(
      "Scroll listener attached to:",
      container === window
        ? "window"
        : `${container.tagName} ${container.className || ""}`
    );
  }

  // Debounced resize handler
  let resizeTimeout = null;
  function handleResize() {
    if (resizeTimeout) return;
    resizeTimeout = setTimeout(() => {
      resizeTimeout = null;
      scheduleVirtualization();
    }, 100);
  }

  function bootVirtualizer() {
    if (state.lifecycleStatus !== "IDLE") {
      log("bootVirtualizer called but already active");
      return;
    }

    const root = findConversationRoot();
    state.conversationRoot = root;

    const mutationObserver = createDebouncedObserver(() => {
      attachOrUpdateScrollListener();
      scheduleVirtualization();
    }, config.MUTATION_DEBOUNCE_MS);

    mutationObserver.observe(root, { childList: true, subtree: true });

    state.lifecycleStatus = "OBSERVING";
    state.observer = mutationObserver;

    log("Virtualizer booted.");

    // Ensure we start tracking even if messages already exist
    attachOrUpdateScrollListener();
    scheduleVirtualization();
  }

  function teardownVirtualizer() {
    if (state.observer) state.observer.disconnect();
    if (state.cleanupScrollListener) state.cleanupScrollListener();

    state.scrollElement = null;
    state.observer = null;
    state.conversationRoot = null;
    state.lifecycleStatus = "IDLE";

    state.articleMap.clear();
    state.nextVirtualId = 1;

    if (scroller.DonationBadge) scroller.DonationBadge.reset();
    hasShownBadgeForCurrentChat = false;

    document
      .querySelectorAll('div[data-chatgpt-virtual-spacer="1"]')
      .forEach((spacer) => spacer.remove());
  }

  function startUrlWatcher() {
    // Clear any existing interval to prevent stacking
    if (state.urlWatcherInterval) {
      clearInterval(state.urlWatcherInterval);
    }
    
    state.urlWatcherInterval = setInterval(() => {
      if (window.location.href !== state.lastUrl) {
        state.lastUrl = window.location.href;
        log("URL changed → rebooting virtualizer");
        teardownVirtualizer();
        bootVirtualizer();
      }
    }, config.URL_CHECK_INTERVAL);
  }

  // ---------------------------------------------------------------------------
  // Export public API
  // ---------------------------------------------------------------------------

  scroller.virtualizer = {
    bootVirtualizer,
    teardownVirtualizer,
    startUrlWatcher,
    handleResize,
    getStatsSnapshot
  };
})();
