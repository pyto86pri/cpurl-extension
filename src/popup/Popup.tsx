import React, { useCallback, useEffect, useRef, useState } from "react";
import Mousetrap from "mousetrap";

export const Popup: React.VFC = () => {
  const [tabInfo, setTabInfo] = useState<TabInfo | undefined>(undefined);
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs.length === 0) return;

      const tab = tabs[0];
      if (tab.title && tab.url) {
        setTabInfo({ title: tab.title, url: tab.url });
      }
    });
  }, []);

  const [style, setStyle] = useState<LinkStyle | undefined>(undefined);
  const copyLinkText = useCallback(
    (style: LinkStyle) => {
      if (!tabInfo) return;

      const text = toLinkText(style, tabInfo);
      copyText(text);
      setStyle(style);
    },
    [tabInfo]
  );
  useShortcut("c m", () => copyLinkText("markdown"));
  useShortcut("c s", () => copyLinkText("scrapbox"));
  useShortcut("c h", () => copyLinkText("hatena"));

  const lastStyle = useRef<LinkStyle | undefined>(undefined);
  const timerIdRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (style !== undefined && style !== lastStyle.current) {
      if (timerIdRef.current !== undefined) {
        window.clearTimeout(timerIdRef.current);
      }
      timerIdRef.current = window.setTimeout(() => {
        setStyle(undefined);
      }, 3000);
    }
    lastStyle.current = style;
  }, [style]);

  return (
    <>
      {style === undefined ? (
        <div>
          Commands:
          <ul>
            <li>
              <kbd>c</kbd>+<kbd>m</kbd>: Copy URL as <strong>Markdown</strong>
            </li>
            <li>
              <kbd>c</kbd>+<kbd>s</kbd>: Copy URL as <strong>Scrapbox</strong>
            </li>
            <li>
              <kbd>c</kbd>+<kbd>h</kbd>: Copy URL as <strong>Hatena</strong>
            </li>
          </ul>
        </div>
      ) : (
        <div>
          Copied as <strong>{style.toUpperCase()}</strong>
        </div>
      )}
    </>
  );
};

type TabInfo = Readonly<{
  title: string;
  url: string;
}>;

function copyText(text: string): void {
  navigator.clipboard.writeText(text).catch(() => {});
}

type LinkStyle = "markdown" | "scrapbox" | "hatena";

function toLinkText(style: LinkStyle, tabInfo: TabInfo): string {
  switch (style) {
    case "markdown":
      return `[${escape(tabInfo.title)}](${escape(tabInfo.url)})`;
    case "scrapbox":
      return `[${escape(tabInfo.title)} ${escape(tabInfo.url)}]`;
    case "hatena":
      return `[${escape(tabInfo.url)}:title=${escape(tabInfo.title)}]`;
  }
}

function escape(s: string): string {
  return s.replace(
    /[!*'()] /g,
    (char) => `%${char.charCodeAt(0).toString(16)}`
  );
}

function useShortcut(keys: string, handler: () => void): void {
  useEffect(() => {
    Mousetrap.bind(keys, handler);
    return () => {
      Mousetrap.unbind(keys);
    };
  }, [keys, handler]);
}
