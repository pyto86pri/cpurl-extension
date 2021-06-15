import { useCallback, useEffect, useState } from "react";
import { escapeForHtml, escapeForUrl } from "../lib";
import { syncGet, syncSet } from "./storage";

export const linkStyles = ["markdown", "scrapbox", "hatena"] as const;
export type LinkStyle = typeof linkStyles[number];

export const labelByLinkStyle: Readonly<{ [S in LinkStyle]: string }> = {
  markdown: "Markdown",
  scrapbox: "Scrapbox",
  hatena: "Hatena",
};

export type LinkSource = Readonly<{ title: string; url: string }>;

export function toLink(style: LinkStyle, source: LinkSource): string {
  switch (style) {
    case "markdown":
      return `[${escapeForHtml(source.title)}](${escapeForUrl(source.url)})`;
    case "scrapbox":
      // In Scrapbox, `[` and `]` cannot be escaped.
      // So replace them with `|` for an alternative.
      return `[${source.title.replace(/[\[\]]/g, "|")} ${escapeForUrl(
        source.url
      )}]`;
    case "hatena":
      return `[${escapeForUrl(source.url)}:title=${escapeForHtml(
        source.title
      )}]`;
  }
}

const defaultShortcutKeyByLinkStyle: Readonly<{ [S in LinkStyle]: string }> = {
  markdown: "c m",
  scrapbox: "c s",
  hatena: "c h",
};

const storageKey = (style: LinkStyle) => `shortcutKey:${style}`;

async function getShortcutKeyFromStorage(style: LinkStyle): Promise<string> {
  const shortcutKey = await syncGet(storageKey(style));
  if (typeof shortcutKey === "string") {
    return shortcutKey;
  }
  return defaultShortcutKeyByLinkStyle[style];
}

async function setShortcutKeyToStorage(
  style: LinkStyle,
  shortcutKey: string
): Promise<void> {
  return syncSet(storageKey(style), shortcutKey);
}

export type ShortcutKeys = Readonly<{ [S in LinkStyle]: string }>;

type UseShortcutKeys = Readonly<{
  shortcutKeys: Readonly<ShortcutKeys | undefined>;
  setShortcutKeys: (shortcuts: Readonly<ShortcutKeys>) => void;
}>;

export function useShortcutKeys(): UseShortcutKeys {
  const [shortcutKeys, setShortcutKeys] =
    useState<Readonly<{ [S in LinkStyle]: string } | undefined>>(undefined);

  useEffect(() => {
    const refresh = () => {
      Promise.all<[style: LinkStyle, shortcutKey: string]>(
        linkStyles.map(async (style) => {
          const shortcut = await getShortcutKeyFromStorage(style);
          return [style, shortcut];
        })
      ).then((entries) =>
        setShortcutKeys(
          Object.fromEntries(entries) as Readonly<{ [S in LinkStyle]: string }>
        )
      );
    };

    refresh();
    const handler = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: "sync" | "local" | "managed"
    ) => {
      if (
        areaName === "sync" &&
        linkStyles.map(storageKey).some((key) => key in changes)
      ) {
        refresh();
      }
    };
    chrome.storage.onChanged.addListener(handler);
    return () => {
      chrome.storage.onChanged.removeListener(handler);
    };
  }, []);

  return { shortcutKeys, setShortcutKeys };
}

export function useUpdateShortcutKeys(): (
  shortcutKeys: ShortcutKeys
) => Promise<void> {
  const update = useCallback(async (shortcutKeys: ShortcutKeys) => {
    await Promise.all(
      (
        Object.entries(shortcutKeys) as ReadonlyArray<
          [style: LinkStyle, shortcutKey: string]
        >
      ).map(([style, shortcutKey]) => {
        setShortcutKeyToStorage(style, shortcutKey);
      })
    );
  }, []);
  return update;
}
