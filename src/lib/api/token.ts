let tokenGetter: () => string | null = () => null;

export function setTokenGetter(getter: () => string | null) {
  tokenGetter = getter;
}

export function getAuthToken() {
  return tokenGetter();
}
