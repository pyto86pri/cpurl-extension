import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactLoading from "react-loading";
import Mousetrap from "mousetrap";
import {
  LinkStyle,
  ShortcutKeys,
  linkStyles,
  useShortcutKeys,
  labelByLinkStyle,
  toLink,
  LinkSource,
} from "../common";

export const Popup: React.VFC = () => {
  const source = useLinkSource();
  const { shortcutKeys } = useShortcutKeys();

  if (!source || !shortcutKeys) {
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
  return <Content source={source} shortcutKeys={shortcutKeys} />;
};

function useLinkSource(): LinkSource | undefined {
  const [source, setSource] = useState<LinkSource | undefined>(undefined);
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs.length === 0) return;

      const tab = tabs[0];
      if (tab.title && tab.url) {
        setSource({ title: tab.title, url: tab.url });
      }
    });
  }, []);

  return source;
}

type ContentProps = Readonly<{
  source: LinkSource;
  shortcutKeys: ShortcutKeys;
}>;

type CopyState =
  | Readonly<{ type: "default" }>
  | Readonly<{ type: "copied"; style: LinkStyle }>;

const Content: React.VFC<ContentProps> = ({ source, shortcutKeys }) => {
  const [state, setState] = useState<CopyState>({ type: "default" });

  const copyLink = useCallback(
    (style: LinkStyle) => {
      copyText(toLink(style, source));
      setState({ type: "copied", style });
    },
    [source]
  );
  useRegisterShortcuts(shortcutKeys, copyLink);

  const lastState = useRef<CopyState>(state);
  const timerIdRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (
      state.type !== "default" &&
      (lastState.current.type === "default" ||
        state.style !== lastState.current.style)
    ) {
      if (timerIdRef.current !== undefined) {
        window.clearTimeout(timerIdRef.current);
      }
      timerIdRef.current = window.setTimeout(() => {
        setState({ type: "default" });
      }, 3000);
    }
    lastState.current = state;
  }, [state]);

  return (
    <>
      {state.type === "default" ? (
        <div>
          Shortcuts:
          <ul>
            {linkStyles.map((s) => (
              <li key={s}>
                {shortcutKeys[s]
                  .split(/[ +]/)
                  .filter(Boolean)
                  .map((key, i) => {
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
          Copied as <strong>{labelByLinkStyle[state.style]}</strong>
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
