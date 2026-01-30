// This hook is deprecated and no longer needed.
// With the Supabase integration, the app now uses direct public URLs for videos
// instead of resolving them from IndexedDB.
// This file is kept to avoid breaking existing imports but can be safely removed
// after updating all components that used it.
export function usePersistentVideoUrl(url: string | null): string | null {
  return url;
}
