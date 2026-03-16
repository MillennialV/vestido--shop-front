export const slugify = (title: string, id?: number): string => {
  // Slug sin ID visible al final. El ID solo se usa como fallback interno si no hay título.
  if (!title) {
    return id != null ? `prenda-${id}` : 'prenda';
  }
  return title
    .toLowerCase()
    .replace(/"/g, '') // remove quotes
    .replace(/'/g, '') // remove apostrophes
    .replace(/[^\w\s-]/g, '') // remove non-word chars except spaces and hyphens
    .trim()
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/-+/g, '-'); // remove consecutive hyphens
};
