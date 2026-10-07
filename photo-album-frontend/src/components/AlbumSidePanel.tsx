import { useState } from 'react';
import type { Comment, Member } from '../types';

type Props = {
  panel: 'comments' | 'members';
  comments: Comment[];
  members: Member[];
  onClose: () => void;
  onSubmitComment: (body: string) => Promise<void>;
  onEditComment: (commentId: string, body: string) => Promise<void>;
  memberEmail: string;
  memberRole: string;
  onMemberEmailChange: (value: string) => void;
  onMemberRoleChange: (value: string) => void;
  onInvite: (event: React.FormEvent) => Promise<void>;
};

export function AlbumSidePanel({ panel, comments, members, onClose, onSubmitComment, onEditComment, memberEmail, memberRole, onMemberEmailChange, onMemberRoleChange, onInvite }: Props) {
  const [commentText, setCommentText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!commentText.trim()) return;
    await onSubmitComment(commentText.trim());
    setCommentText('');
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!editingId || !editingText.trim()) return;
    await onEditComment(editingId, editingText.trim());
    setEditingId(null);
  }

  return <aside className="side-panel">
    <div className="side-panel-heading"><div><span className="section-kicker">This album</span><h2>{panel === 'comments' ? 'Notes on the page' : 'People around the table'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close panel">×</button></div>
    {panel === 'comments' ? <>
      <div className="comment-list">
        {comments.length === 0 && <p className="panel-empty">No notes yet. Leave the first one.</p>}
        {comments.map((comment) => <article className="comment-item" key={comment.id}><span>{comment.author.email.slice(0, 2).toUpperCase()}</span><div><strong>{comment.author.email}</strong>{editingId === comment.id ? <form className="comment-edit-form" onSubmit={save}><input value={editingText} onChange={(event) => setEditingText(event.target.value)} /><button type="submit">Save</button></form> : <><p>{comment.body}</p><button className="comment-edit-button" onClick={() => { setEditingId(comment.id); setEditingText(comment.body); }}>Edit</button></>}</div></article>)}
      </div>
      <form className="panel-form" onSubmit={submit}><input value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Write a note..." /><button className="new-album-button">Send</button></form>
    </> : <>
      <div className="comment-list">{members.length === 0 && <p className="panel-empty">You are the first keeper of this album.</p>}{members.map((member) => <article className="member-item" key={member.user.id}><span>{member.user.email.slice(0, 2).toUpperCase()}</span><div><strong>{member.user.email}</strong><small>{member.role.toLowerCase()}</small></div></article>)}</div>
      <form className="panel-form invite-form" onSubmit={onInvite}><input type="email" required value={memberEmail} onChange={(event) => onMemberEmailChange(event.target.value)} placeholder="friend@example.com" /><select value={memberRole} onChange={(event) => onMemberRoleChange(event.target.value)}><option value="VIEWER">Can view</option><option value="EDITOR">Can edit</option></select><button className="new-album-button">Invite</button></form>
    </>}
  </aside>;
}
