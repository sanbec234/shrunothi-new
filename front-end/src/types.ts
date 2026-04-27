export type TextDoc = {
  id: string;
  title: string;       // API returns "title" (not "filename")
  author: string;
  preview?: string;    // present on list endpoints
  thumbnailUrl?: string;
};