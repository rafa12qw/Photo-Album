const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
export const fileUrl = (key: string) =>
  `${API_URL.replace(/\/api$/, "")}/uploads/${key}`;

export type ApiPhoto = {
  id: string;
  originalKey: string;
  thumbnailKey: string | null;
  filename: string;
  caption: string | null;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
};

export type ApiAlbumPhoto = {
  position: number;
  photo: ApiPhoto;
};

export type ApiAlbum = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  photos?: ApiAlbumPhoto[];
  _count?: { photos: number };
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const token = localStorage.getItem("folio-access-token");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export type Session = {
  accessToken: string;
  user: { id: string; email: string };
};

export async function login(email: string, password: string) {
  const session = await request<Session>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem("folio-access-token", session.accessToken);
  localStorage.setItem("folio-user", JSON.stringify(session.user));
  return session;
}

export async function register(email: string, password: string) {
  const session = await request<Session>("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem("folio-access-token", session.accessToken);
  localStorage.setItem("folio-user", JSON.stringify(session.user));
  return session;
}

export function storedUser() {
  const value = localStorage.getItem("folio-user");
  return value ? (JSON.parse(value) as { id: string; email: string }) : null;
}

export function logout() {
  localStorage.removeItem("folio-access-token");
  localStorage.removeItem("folio-user");
}

export async function listAlbums(ownerId: string) {
  return request<{ items: ApiAlbum[] }>(
    `/albums?ownerId=${encodeURIComponent(ownerId)}&page=1&limit=100`,
  );
}

export async function getAlbum(id: string) {
  return request<ApiAlbum>(`/albums/${id}`);
}

export async function createAlbum(name: string, ownerId: string) {
  return request<ApiAlbum>("/albums", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, ownerId }),
  });
}

export async function uploadPhoto(albumId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return request<ApiPhoto>(`/albums/${albumId}/photos/upload`, {
    method: "POST",
    body: formData,
  });
}

export async function replacePhoto(
  albumId: string,
  photoId: string,
  file: File,
) {
  const formData = new FormData();
  formData.append("file", file);
  return request<ApiPhoto>(`/albums/${albumId}/photos/${photoId}`, {
    method: "PUT",
    body: formData,
  });
}

export function deletePhoto(albumId: string, photoId: string) {
  return request<{ deleted: boolean }>(`/albums/${albumId}/photos/${photoId}`, {
    method: "DELETE",
  });
}

export function updatePhotoCaption(albumId: string, photoId: string, caption: string) {
  return request<ApiPhoto>(`/albums/${albumId}/photos/${photoId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caption }),
  });
}

export function reorderPhotos(albumId: string, photoIds: string[]) {
  return request(`/albums/${albumId}/photos/order`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ photoIds }),
  });
}

export function listMembers(albumId: string) {
  return request<Array<{ user: { id: string; email: string }; role: string }>>(
    `/albums/${albumId}/members`,
  );
}

export function addMember(albumId: string, email: string, role: string) {
  return request(`/albums/${albumId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, role }),
  });
}

export function listComments(albumId: string, photoId: string) {
  return request<
    Array<{
      id: string;
      body: string;
      author: { email: string };
      createdAt: string;
    }>
  >(`/albums/${albumId}/photos/${photoId}/comments`);
}

export function addComment(
  albumId: string,
  photoId: string,
  authorId: string,
  body: string,
) {
  return request(`/albums/${albumId}/photos/${photoId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ authorId, body }),
  });
}

export function updateComment(albumId: string, photoId: string, commentId: string, body: string) {
  return request(`/albums/${albumId}/photos/${photoId}/comments/${commentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
}
