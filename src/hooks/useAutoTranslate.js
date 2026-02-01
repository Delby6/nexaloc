import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

export default function useAutoTranslate() {
  const { i18n, t } = useTranslation();
  const observerRef = useRef(null);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const shouldTranslate = i18n.language && i18n.language !== "en";

    const translateTextNode = (node) => {
      if (!node || node.nodeType !== Node.TEXT_NODE) return;
      const parent = node.parentElement;
      if (!parent) return;
      if (parent.closest("[data-no-translate='true']")) return;
      const tag = parent.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") return;

      const rawText = (node.__i18nOriginal ?? node.nodeValue ?? "").toString();
      const text = rawText.trim();
      if (!text) return;

      if (node.__i18nOriginal === undefined && !shouldTranslate) {
        node.__i18nOriginal = rawText;
      }

      if (!shouldTranslate) {
        node.nodeValue = node.__i18nOriginal ?? rawText;
        return;
      }

      const baseText = node.__i18nOriginal ?? rawText;
      if (i18n.exists(baseText)) {
        node.nodeValue = t(baseText);
      }
    };

    const translateAttributes = (el) => {
      if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
      if (el.closest("[data-no-translate='true']")) return;

      const attrs = ["placeholder", "title", "aria-label"];
      attrs.forEach((attr) => {
        if (!el.hasAttribute(attr)) return;
        const raw = el.getAttribute(attr);
        if (!raw || !raw.trim()) return;
        if (i18n.exists(raw)) {
          el.setAttribute(attr, t(raw));
        }
      });
    };

    const walk = (root) => {
      const treeWalker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      let current = treeWalker.nextNode();
      while (current) {
        translateTextNode(current);
        current = treeWalker.nextNode();
      }

      if (root.nodeType === Node.ELEMENT_NODE) {
        translateAttributes(root);
        root.querySelectorAll("*").forEach(translateAttributes);
      }
    };

    const run = () => walk(document.body);

    run();

    if (observerRef.current) observerRef.current.disconnect();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            translateTextNode(node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            walk(node);
          }
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    observerRef.current = observer;

    return () => observer.disconnect();
  }, [i18n.language, t, i18n]);
}
