import { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Camera, Grid2X2, Search, Sparkles, Upload } from 'lucide-react';
import { addComment, addMember, createAlbum, deletePhoto, fileUrl, getAlbum, listAlbums, listComments, listMembers, logout, reorderPhotos, replacePhoto, storedUser, updateComment, updatePhotoCaption, uploadPhoto } from './api';
import { AuthScreen } from './components/AuthScreen';
import { AlbumBook, EmptyBook } from './components/AlbumBook';
import { AlbumShelf } from './components/AlbumShelf';
import { AlbumSidePanel } from './components/AlbumSidePanel';
import type { Album, Comment, Member, User } from './types';
import type { ApiAlbum, ApiAlbumPhoto } from './api';

const demoAlbums = [
  ['https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=900&q=85', '#d7794f'],
  ['https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=900&q=85', '#80916c'],
  ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=85', '#b88a61'],
];
const demoPhotos = [
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=85',
];

function App() {
  const [user, setUser] = useState<User | null>(() => storedUser());
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumPhotos, setAlbumPhotos] = useState<ApiAlbumPhoto[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState<'next' | 'previous'>('next');
  const [showLibrary, setShowLibrary] = useState(true);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);
  const [showNewAlbum, setShowNewAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [panel, setPanel] = useState<'comments' | 'members' | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('VIEWER');
  const [uploadMode, setUploadMode] = useState<'add' | 'replace'>('add');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toAlbum = (album: ApiAlbum, index = 0): Album => ({
    id: album.id,
    title: album.name,
    date: new Date(album.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    count: album._count?.photos ?? album.photos?.length ?? 0,
    cover: demoAlbums[index % demoAlbums.length][0],
    accent: demoAlbums[index % demoAlbums.length][1],
  });

  async function loadAlbums(userId: string) {
    const response = await listAlbums(userId);
    const mapped = response.items.map((album, index) => toAlbum(album, index));
    setAlbums(mapped);
    if (mapped.length) {
      setSelectedAlbum(mapped[0]);
      const detail = await getAlbum(mapped[0].id);
      setAlbumPhotos(detail.photos ?? []);
    }
  }

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    loadAlbums(user.id).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to connect to the album API.')).finally(() => setLoading(false));
  }, [user]);

  if (!user) return <AuthScreen onAuthenticated={setUser} />;
  const currentUser = user;

  const totalPages = Math.max(2, Math.ceil(albumPhotos.length / 3));
  const photoAt = (index: number) => albumPhotos[index] ? fileUrl(albumPhotos[index].photo.originalKey) : demoPhotos[index % demoPhotos.length];
  const selectedPhoto = albumPhotos.find(({ photo }) => photo.id === selectedPhotoId);

  async function selectAlbum(album: Album) {
    setSelectedAlbum(album); setShowLibrary(false); setPage(0); setSelectedPhotoId(null);
    try { const detail = await getAlbum(album.id); setAlbumPhotos(detail.photos ?? []); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to open this album.'); }
  }

  function turnPage(next: boolean) {
    setDirection(next ? 'next' : 'previous');
    setPage((current) => Math.max(0, Math.min(current + (next ? 1 : -1), totalPages - 1)));
  }

  async function submitAlbum(event: React.FormEvent) {
    event.preventDefault();
    if (!newAlbumName.trim()) return;
    try {
      const created = toAlbum(await createAlbum(newAlbumName.trim(), currentUser.id));
      setAlbums((current) => [created, ...current]); setSelectedAlbum(created); setAlbumPhotos([]); setShowLibrary(false); setShowNewAlbum(false); setNewAlbumName('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to create the album.'); }
  }

  function chooseUpload(mode: 'add' | 'replace') { setUploadMode(mode); fileInputRef.current?.click(); }
  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !selectedAlbum) return;
    try {
      if (uploadMode === 'replace' && selectedPhotoId) await replacePhoto(selectedAlbum.id, selectedPhotoId, file);
      else await uploadPhoto(selectedAlbum.id, file);
      const detail = await getAlbum(selectedAlbum.id); setAlbumPhotos(detail.photos ?? []);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save this photograph.'); }
    finally { event.target.value = ''; }
  }

  async function movePhoto(delta: number) {
    if (!selectedAlbum || !selectedPhotoId) return;
    const currentIndex = albumPhotos.findIndex(({ photo }) => photo.id === selectedPhotoId);
    const nextIndex = currentIndex + delta;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= albumPhotos.length) return;
    const ordered = [...albumPhotos]; [ordered[currentIndex], ordered[nextIndex]] = [ordered[nextIndex], ordered[currentIndex]];
    try { await reorderPhotos(selectedAlbum.id, ordered.map(({ photo }) => photo.id)); setAlbumPhotos(ordered); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to move this photograph.'); }
  }

  async function erasePhoto() {
    if (!selectedAlbum || !selectedPhotoId) return;
    try { await deletePhoto(selectedAlbum.id, selectedPhotoId); const detail = await getAlbum(selectedAlbum.id); setAlbumPhotos(detail.photos ?? []); setSelectedPhotoId(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to erase this photograph.'); }
  }

  async function saveCaption(photoId: string, caption: string) {
    if (!selectedAlbum) return;
    try {
      await updatePhotoCaption(selectedAlbum.id, photoId, caption);
      setAlbumPhotos((current) => current.map((link) => link.photo.id === photoId ? { ...link, photo: { ...link.photo, caption } } : link));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to update caption.'); }
  }

  async function openComments() {
    if (!selectedAlbum || !selectedPhoto) return;
    try { setComments(await listComments(selectedAlbum.id, selectedPhoto.photo.id)); setPanel('comments'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load comments.'); }
  }
  async function submitComment(body: string) {
    if (!selectedAlbum || !selectedPhoto) return;
    try { await addComment(selectedAlbum.id, selectedPhoto.photo.id, currentUser.id, body); setComments(await listComments(selectedAlbum.id, selectedPhoto.photo.id)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to add comment.'); }
  }
  async function editComment(commentId: string, body: string) {
    if (!selectedAlbum || !selectedPhotoId) return;
    try { await updateComment(selectedAlbum.id, selectedPhotoId, commentId, body); setComments(await listComments(selectedAlbum.id, selectedPhotoId)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to update comment.'); }
  }
  async function openMembers() {
    if (!selectedAlbum) return;
    try { setMembers(await listMembers(selectedAlbum.id)); setPanel('members'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load collaborators.'); }
  }
  async function inviteMember(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedAlbum || !memberEmail.trim()) return;
    try { await addMember(selectedAlbum.id, memberEmail.trim(), memberRole); setMembers(await listMembers(selectedAlbum.id)); setMemberEmail(''); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to invite collaborator.'); }
  }

  return <main className="app-shell">
    <header className="topbar"><button className="brand" aria-label="Folio home" onClick={() => setShowLibrary(true)}><span className="brand-mark"><BookOpen size={18} strokeWidth={1.8} /></span><span>folio</span></button><div className="topbar-actions"><button className="icon-button" aria-label="Search albums"><Search size={19} /></button><button className="profile-button" aria-label="Sign out" onClick={() => { logout(); setUser(null); }}>{user.email.charAt(0).toUpperCase()}</button></div></header>
    <div className="content-wrap">
      <section className="intro-row"><div><p className="eyebrow"><Sparkles size={14} /> Your personal archive</p><h1>Keep the good<br /><em>close.</em></h1></div><button className="new-album-button" onClick={() => setShowNewAlbum(true)}>+ <span>New album</span></button></section>
      {error && <div className="api-notice" role="alert">{error}<button onClick={() => setError(null)} aria-label="Dismiss error">×</button></div>}
      {loading && <div className="loading-note">Opening your shelf...</div>}
      {showNewAlbum && <form className="new-album-form" onSubmit={submitAlbum}><label htmlFor="album-name">Name your new album</label><div><input id="album-name" autoFocus value={newAlbumName} onChange={(event) => setNewAlbumName(event.target.value)} placeholder="A year in places" maxLength={120} /><button type="submit">Create</button><button type="button" className="cancel-button" onClick={() => setShowNewAlbum(false)}>Cancel</button></div></form>}
      {showLibrary && <AlbumShelf albums={albums} selectedAlbum={selectedAlbum} onSelect={(album) => void selectAlbum(album)} onCreate={() => setShowNewAlbum(true)} />}
      {selectedAlbum ? <AlbumBook selectedAlbum={selectedAlbum} albumPhotos={albumPhotos} page={page} totalPages={totalPages} direction={direction} showLibrary={showLibrary} selectedPhotoId={selectedPhotoId} photoAt={photoAt} onSaveCaption={saveCaption} onBack={() => setShowLibrary(true)} onTurnPage={turnPage} onSelectPhoto={setSelectedPhotoId} onComments={() => void openComments()} onMembers={() => void openMembers()} onMovePhoto={(delta) => void movePhoto(delta)} onErasePhoto={() => void erasePhoto()} onReplacePhoto={() => chooseUpload('replace')} onAddPhoto={() => chooseUpload('add')} /> : <EmptyBook onCreate={() => setShowNewAlbum(true)} />}
      <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/*" onChange={handleUpload} />
      {panel && <AlbumSidePanel panel={panel} comments={comments} members={members} onClose={() => setPanel(null)} onSubmitComment={submitComment} onEditComment={editComment} memberEmail={memberEmail} memberRole={memberRole} onMemberEmailChange={setMemberEmail} onMemberRoleChange={setMemberRole} onInvite={inviteMember} />}
      <section className="quick-actions"><button><Camera size={19} /><span>Capture a moment</span><ArrowRight size={16} /></button><button><Grid2X2 size={19} /><span>Browse all memories</span><ArrowRight size={16} /></button><button onClick={() => chooseUpload('add')}><Upload size={19} /><span>Import from camera roll</span><ArrowRight size={16} /></button></section>
    </div><footer className="footer-note">Folio / a softer way to remember</footer>
  </main>;
}

export default App;
