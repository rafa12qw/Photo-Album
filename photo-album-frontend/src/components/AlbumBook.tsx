import { ArrowLeft, ArrowRight, BookOpen, Heart, ImagePlus, MessageCircle, MoreHorizontal, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { BookPageProps } from '../types';

export function AlbumBook(props: BookPageProps) {
  const {
    selectedAlbum, albumPhotos, page, totalPages, direction, showLibrary, selectedPhotoId,
    photoAt, onBack, onTurnPage, onSelectPhoto, onComments, onMembers, onMovePhoto,
    onErasePhoto, onReplacePhoto, onAddPhoto,
    photoCaption, onSaveCaption,
  } = props;

  const [editingCaption, setEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState(photoCaption ?? '');
  useEffect(() => setCaptionDraft(photoCaption ?? ''), [photoCaption]);

  async function saveCaption(event: React.FormEvent) {
    event.preventDefault();
    await onSaveCaption(captionDraft.trim());
    setEditingCaption(false);
  }
  return (
    <section className={`book-section ${showLibrary ? 'library-open' : ''}`}>
      <div className="book-heading">
        <div className="book-title-row">
          {!showLibrary && <button className="back-button" onClick={onBack} aria-label="Back to albums"><ArrowLeft size={18} /></button>}
          <div><span className="section-kicker">Now reading</span><h2>{selectedAlbum.title}</h2></div>
        </div>
        <div className="book-tools"><span className="page-count">{page + 1} <i>/</i> {totalPages}</span><button className="icon-button" aria-label="Open collaborators" onClick={onMembers}><MoreHorizontal size={20} /></button></div>
      </div>
      <div className="book-wrap">
        <button className="page-arrow left-arrow" onClick={() => onTurnPage(false)} disabled={page === 0} aria-label="Previous spread"><ArrowLeft size={19} /></button>
        <div className={`book-spread page-turn-${direction}`} key={page}>
          <article className="paper-page page-left">
            <div className="page-number">{page * 3 + 1}</div>
            <div className={`photo-frame large-photo ${selectedPhotoId === albumPhotos[page * 3]?.photo.id ? 'photo-selected' : ''}`} onClick={() => onSelectPhoto(albumPhotos[page * 3]?.photo.id ?? null)}>
              <img src={photoAt(page * 3)} alt={albumPhotos[page * 3]?.photo.filename ?? 'A photograph from this album'} />
            </div>
            <div className="caption-block"><span>{page * 3 + 1} / {albumPhotos.length || selectedAlbum.count}</span>{editingCaption ? <form className="caption-edit-form" onSubmit={saveCaption}><input value={captionDraft} onChange={(event) => setCaptionDraft(event.target.value)} placeholder="Write a caption..." maxLength={500} /><button type="submit">Save</button></form> : <><p>{photoCaption ?? 'Add a caption to this photograph.'}</p><button className="comment-edit-button" onClick={() => setEditingCaption(true)}>Edit caption</button></>}</div>
          </article>
          <div className="book-gutter" />
          <article className="paper-page page-right">
            <div className="page-number">{page * 3 + 2}</div>
            <div className="photo-grid">
              {[1, 2].map((offset) => <div className={`photo-frame ${selectedPhotoId === albumPhotos[page * 3 + offset]?.photo.id ? 'photo-selected' : ''}`} key={offset} onClick={() => onSelectPhoto(albumPhotos[page * 3 + offset]?.photo.id ?? null)}><img src={photoAt(page * 3 + offset)} alt="Album photograph" /></div>)}
            </div>
            <div className="caption-block aligned-right"><span>FOLIO / {page + 1}</span><p>Postcards we never had to send.</p></div>
          </article>
        </div>
        <button className="page-arrow right-arrow" onClick={() => onTurnPage(true)} disabled={page === totalPages - 1} aria-label="Next spread"><ArrowRight size={19} /></button>
      </div>
      <div className="mobile-page-dots">{Array.from({ length: totalPages }, (_, index) => <span key={index} className={page === index ? 'active' : ''} />)}</div>
      <div className="book-footer">
        <span><Heart size={15} /> Made with care</span>
        <div className="book-footer-actions">
          <button className="edit-button" onClick={onComments}><MessageCircle size={16} /> Comments</button>
          <button className="edit-button" onClick={onMembers}><Users size={16} /> Collaborators</button>
          <button className="edit-button" disabled={!selectedPhotoId} onClick={() => onMovePhoto(-1)}>Move left</button>
          <button className="edit-button" disabled={!selectedPhotoId} onClick={() => onMovePhoto(1)}>Move right</button>
          <button className="edit-button danger-button" disabled={!selectedPhotoId} onClick={onErasePhoto}>Erase</button>
        </div>
        <button className="edit-button" onClick={selectedPhotoId ? onReplacePhoto : onAddPhoto}><ImagePlus size={16} /> {selectedPhotoId ? 'Replace photo' : 'Add photographs'}</button>
      </div>
    </section>
  );
}

export function EmptyBook({ onCreate }: { onCreate: () => void }) {
  return <section className="book-section"><div className="empty-book"><BookOpen size={30} /><h2>Your first album is waiting</h2><p>Create an album, then fill its pages with photographs from your camera roll.</p><button className="new-album-button" onClick={onCreate}><ImagePlus size={18} /> Create an album</button></div></section>;
}
