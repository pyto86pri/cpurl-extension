export function syncGet(key: string): Promise<unknown> {
  return new Promise((resolve) =>
    chrome.storage.sync.get([key], (items) => {
      if (key in items) {
        resolve(items[key]);
      }
      resolve(undefined);
    })
  );
}

export function syncSet(key: string, value: unknown): Promise<void> {
  return new Promise((resolve) =>
    chrome.storage.sync.set({ [key]: value }, () => resolve())
  );
}
