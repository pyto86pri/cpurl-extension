import { useCallback, useEffect, useState } from "react";
import { escape } from "../lib";
import { syncGet, syncSet } from "./storage";

export const linkStyles = ["markdown", "scrapbox", "hatena"] as const;
export type LinkStyle = typeof linkStyles[number];

export const labelByLinkStyle: Readonly<{ [S in LinkStyle]: string }> = {
  markdown: "Markdown",
  scrapbox: "Scrapbox",
  hatena: "Hatena",
};

export function toLinkText(
  style: LinkStyle,
  title: string,
  url: string
): string {
  switch (style) {
    case "markdown":
      return `[${escape(title)}](${escape(url)})`;
    case "scrapbox":
      return `[${escape(title)} ${escape(url)}]`;
    case "hatena":
      return `[${escape(url)}:title=${escape(title)}]`;
  }
}

const defaultShortcutKeysByLinkStyle: Readonly<{ [S in LinkStyle]: string }> = {
  markdown: "c m",
  scrapbox: "c s",
  hatena: "c h",
};

const storageKey = (style: LinkStyle) => `shortcut:${style}`;

export async function getShortcutKeyFromStorage(
  style: LinkStyle
): Promise<string> {
  const shortcutKey = await syncGet(storageKey(style));
  if (typeof shortcutKey === "string") {
    return shortcutKey;
  }
  return defaultShortcutKeysByLinkStyle[style];
}

export async function setShortcutKeyToStorage(
  style: LinkStyle,
  shortcutKey: string
): Promise<void> {
  return syncSet(storageKey(style), shortcutKey);
}

export type ShortcutKeys = Readonly<{ [S in LinkStyle]: string }>;

type UseShortcuts = Readonly<{
  shortcutKeys: Readonly<ShortcutKeys | undefined>;
  setShortcutKeys: (shortcuts: Readonly<ShortcutKeys>) => void;
}>;

export function useShortcutKeys(): UseShortcuts {
  const [shortcutKeys, setShortcutKeys] =
    useState<Readonly<{ [S in LinkStyle]: string } | undefined>>(undefined);

  useEffect(() => {
    Promise.all<[style: LinkStyle, shortcutKey: string]>(
      linkStyles.map(async (style) => {
        const shortcut = await getShortcutKeyFromStorage(style);
        return [style, shortcut];
      })
    ).then((res) =>
      setShortcutKeys(
        Object.fromEntries(res) as Readonly<{ [S in LinkStyle]: string }>
      )
    );
  }, []);

  useEffect(() => {
    const handler = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: "sync" | "local" | "managed"
    ) => {
      if (areaName !== "sync") return;

      let changedShortCutKeys: Partial<ShortcutKeys> = {};
      for (const style of linkStyles) {
        const key = storageKey(style);
        if (key in changes) {
          const newValue = changes[key].newValue;
          if (typeof newValue !== "string") return;

          changedShortCutKeys = { ...changedShortCutKeys, [style]: newValue };
        }
      }
      setShortcutKeys(
        (shortcutKeys) =>
          shortcutKeys && {
            ...shortcutKeys,
            ...changedShortCutKeys,
          }
      );
    };
    chrome.storage.onChanged.addListener(handler);
    return () => {
      chrome.storage.onChanged.removeListener(handler);
    };
  });

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
