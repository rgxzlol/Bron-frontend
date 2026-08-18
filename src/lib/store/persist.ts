type PersistApi = {
  hasHydrated: () => boolean;
  onFinishHydration: (fn: () => void) => () => void;
};

type PersistableStore = {
  persist?: PersistApi;
};

export function hasStoreHydrated(store: PersistableStore) {
  return store.persist?.hasHydrated?.() ?? false;
}

export function onStoreHydrated(store: PersistableStore, callback: () => void) {
  const persist = store.persist;

  if (!persist) {
    callback();
    return undefined;
  }

  if (persist.hasHydrated()) {
    callback();
    return undefined;
  }

  return persist.onFinishHydration(callback);
}
