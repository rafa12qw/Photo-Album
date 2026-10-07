import { ArrowRight, Plus } from 'lucide-react';
import type { Album } from '../types';

type Props = {
  albums: Album[];
  selectedAlbum: Album | null;
  onSelect: (album: Album) => void;
  onCreate: () => void;
};

export function AlbumShelf({ albums, selectedAlbum, onSelect, onCreate }: Props) {
  return (
    <section className="library-section" aria-label="Your albums">
      <div className="section-heading">
        <div><span className="section-kicker">The shelf</span><h2>Your albums <span>{albums.length}</span></h2></div>
        <button className="text-button">View all <ArrowRight size={15} /></button>
      </div>
      <div className="album-shelf">
        {albums.map((album, index) => (
          <button className={`album-card ${selectedAlbum?.id === album.id ? 'is-selected' : ''}`} key={album.id} onClick={() => onSelect(album)}>
            <span className="album-cover" style={{ backgroundImage: `url(${album.cover})`, '--accent': album.accent } as React.CSSProperties}>
              <span className="cover-wash" />
              <span className="cover-label"><small>FOLIO / 0{index + 1}</small><strong>{album.title}</strong><i>{album.date}</i></span>
            </span>
            <span className="album-meta"><strong>{album.title}</strong><small>{album.count} photographs</small></span>
          </button>
        ))}
        <button className="album-card add-card" onClick={onCreate}>
          <span className="add-cover"><Plus size={26} strokeWidth={1.4} /></span>
          <span className="album-meta"><strong>Make a new one</strong><small>Start from a blank page</small></span>
        </button>
      </div>
    </section>
  );
}
