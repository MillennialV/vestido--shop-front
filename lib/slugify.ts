export const slugify = (title: string): string => {
  if (!title) {
    return 'prenda';
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
