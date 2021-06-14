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

  const [linkType, setLinkType] = useState<LinkType | undefined>(undefined);
  const copyLinkText = useCallback(
    (type: LinkType) => {
      if (!tabInfo) return;

      const text = toLinkText(type, tabInfo);
      copyText(text);
      setLinkType(type);
    },
    [tabInfo]
  );
  useCommand("c m", () => copyLinkText("markdown"));
  useCommand("c s", () => copyLinkText("scrapbox"));
  useCommand("c h", () => copyLinkText("hatena"));

  const lastLinkType = useRef<LinkType | undefined>(undefined);
  const timeoutIdRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (linkType !== undefined && linkType !== lastLinkType.current) {
      if (timeoutIdRef.current !== undefined) {
        window.clearTimeout(timeoutIdRef.current);
      }
      timeoutIdRef.current = window.setTimeout(() => {
        setLinkType(undefined);
      }, 3000);
    }
    lastLinkType.current = linkType;
  }, [linkType]);

  return (
    <>
      {linkType === undefined ? (
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
          Copied as <strong>{linkType.toUpperCase()}</strong>
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

type LinkType = "markdown" | "scrapbox" | "hatena";

function toLinkText(type: LinkType, tabInfo: TabInfo): string {
  switch (type) {
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

function useCommand(keys: string, handler: () => void): void {
  useEffect(() => {
    Mousetrap.bind(keys, handler);
    return () => {
      Mousetrap.unbind(keys);
    };
  }, [keys, handler]);
}
