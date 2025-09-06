const STORAGE_KEY = 'collab_codes';

export function saveCodesToLocal(codes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
}

export function loadCodesFromLocal() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearCodesFromLocal() {
  localStorage.removeItem(STORAGE_KEY);
}