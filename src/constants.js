// constants.js

/**
 * Global namespace for the ChatGPT Virtual Scroller extension.
 */
/** @type {any} */
window.ChatGPTVirtualScroller = window.ChatGPTVirtualScroller || {};

(function initializeConstants() {
  const scroller = window.ChatGPTVirtualScroller;

  /**
   * Static configuration for the virtual scroller.
   */
  scroller.config = {
    /** CSS selector for conversation messages */
    ARTICLE_SELECTOR: 'article[data-testid^="conversation-turn-"]',
    
    /** Alternative selectors for newer ChatGPT UI */
    ALT_MESSAGE_SELECTORS: [
      'section[data-testid^="conversation-turn-"]',
      '[data-message-id]',
      '[class*="message" i]',
      'div[role="article"]',
      '[data-testid="message"]',
      '[data-testid="chat-message"]',
      'div[class*="chat-message" i]',
      'div[class*="message-container" i]',
      'section[class*="message" i]',
      'div[data-testid^="conversation-turn-"]'
    ],

    /** Extra area above/below the viewport where messages stay mounted */
    MARGIN_PX: 2000,

    /** How often we poll for URL (chat) changes, in ms */
    URL_CHECK_INTERVAL: 1000,

    /** Minimum time between scroll-driven updates, in ms */
    SCROLL_THROTTLE_MS: 50,

    /** Debounce time for DOM mutation bursts, in ms */
    MUTATION_DEBOUNCE_MS: 50
  };

  /**
   * Shared runtime state.
   */
  scroller.state = {
    lastUrl: window.location.href,
    nextVirtualId: 1,
    /** @type {Map<string, HTMLElement>} */
    articleMap: new Map(),
    enabled: true,
    debug: false,
    requestAnimationScheduled: false,

    /** @type {HTMLElement | Window | null} */
    scrollElement: null,
    /** @type {(() => void) | null} */
    cleanupScrollListener: null,

    /** @type {MutationObserver | null} */
    observer: null,
    /** @type {HTMLElement | null} */
    conversationRoot: null,

    stats: {
      totalMessages: 0,
      renderedMessages: 0
    },

    /** @type {number | null} */
    urlWatcherInterval: null,

    /** "IDLE" | "OBSERVING" */
    lifecycleStatus: /** @type {"IDLE" | "OBSERVING"} */ ("IDLE")
  };

  /**
   * Conditional debug logger used across all modules.
   * @param  {...any} logArguments
   */
  scroller.log = function logMessage(...logArguments) {
    if (!scroller.state.debug) return;
    console.log("[ChatGPT Virtual Scroller]", ...logArguments);
  };

  scroller.logPromoMessage = function logPromoMessage() {
    if (!scroller.state.debug) return;
    console.log(
      `%c
┌─────────────────────────────────────────┐
│  ChatGPT Lag Fixer (debug mode enabled) │
└─────────────────────────────────────────┘
You are seeing this message because debug mode is enabled for the chrome extension.
To disable debug mode, open the extension popup and uncheck "Enable debug mode".
`,
      "color:#4c8bf5; font-size:15px; font-weight:bold;"
    );
  };

})();
