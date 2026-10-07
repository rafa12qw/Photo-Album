import type { ApiAlbumPhoto } from './api';

export type Album = {
  id: string;
  title: string;
  date: string;
  count: number;
  cover: string;
  accent: string;
};

export type User = { id: string; email: string };

export type Comment = {
  id: string;
  body: string;
  author: { email: string };
  createdAt: string;
};

export type Member = {
  user: { id: string; email: string };
  role: string;
};

export type BookPageProps = {
  selectedAlbum: Album;
  albumPhotos: ApiAlbumPhoto[];
  page: number;
  totalPages: number;
  direction: 'next' | 'previous';
  showLibrary: boolean;
  selectedPhotoId: string | null;
  photoAt: (index: number) => string;
    photoCaption: string | null;
    onSaveCaption: (photoId: string, caption: string) => Promise<void>;
  onBack: () => void;
  onTurnPage: (next: boolean) => void;
  onSelectPhoto: (photoId: string | null) => void;
  onComments: () => void;
  onMembers: () => void;
  onMovePhoto: (delta: number) => void;
  onErasePhoto: () => void;
  onReplacePhoto: () => void;
  onAddPhoto: () => void;
};
