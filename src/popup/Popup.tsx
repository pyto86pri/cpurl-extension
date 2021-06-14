import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactLoading from "react-loading";
import Mousetrap from "mousetrap";
import {
  LinkStyle,
  ShortcutKeys,
  linkStyles,
  useShortcutKeys,
  labelByLinkStyle,
  toLinkText,
} from "../common";

export const Popup: React.VFC = () => {
  const tabInfo = useTabInfo();
  const { shortcutKeys } = useShortcutKeys();

  if (!tabInfo || !shortcutKeys) {
    return (
      <ReactLoading
        type="spin"
        color="#008080"
        height="10%"
        width="10%"
        className="loading"
      />
    );
  }
  return <Content tabInfo={tabInfo} shortcutKeys={shortcutKeys} />;
};

type TabInfo = Readonly<{
  title: string;
  url: string;
}>;

function useTabInfo(): TabInfo | undefined {
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

  return tabInfo;
}

type ContentProps = Readonly<{ tabInfo: TabInfo; shortcutKeys: ShortcutKeys }>;

const Content: React.VFC<ContentProps> = ({ tabInfo, shortcutKeys }) => {
  const [style, setStyle] = useState<LinkStyle | undefined>(undefined);

  const copyLinkText = useCallback(
    (style: LinkStyle) => {
      const text = toLinkText(style, tabInfo.title, tabInfo.url);
      copyText(text);
      setStyle(style);
    },
    [tabInfo]
  );
  useRegisterShortcuts(shortcutKeys, copyLinkText);

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
          Shortcuts:
          <ul>
            {linkStyles.map((s) => (
              <li key={s}>
                {shortcutKeys[s].split(" ").map((key, i) => {
                  if (i === 0) {
                    return (
                      <React.Fragment key={i}>
                        <kbd>{key}</kbd>
                      </React.Fragment>
                    );
                  }
                  return (
                    <React.Fragment key={i}>
                      +<kbd>{key}</kbd>
                    </React.Fragment>
                  );
                })}
                : Copy URL as <strong>{labelByLinkStyle[s]}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          Copied as <strong>{labelByLinkStyle[style]}</strong>
        </div>
      )}
    </>
  );
};

function copyText(text: string): void {
  navigator.clipboard.writeText(text).catch(() => {});
}

function useRegisterShortcuts(
  shortcutKeys: ShortcutKeys,
  handler: (style: LinkStyle) => void
): void {
  useEffect(() => {
    for (const style of linkStyles) {
      Mousetrap.bind(shortcutKeys[style], () => handler(style));
    }
    return () => {
      for (const style of linkStyles) {
        Mousetrap.unbind(shortcutKeys[style]);
      }
    };
  }, [shortcutKeys, handler]);
}
