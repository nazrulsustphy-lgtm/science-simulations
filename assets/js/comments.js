// ── COMMENTS.JS v2 ──

async function loadComments(simId) {
  const container = document.getElementById('commentsContainer');
  const count = document.getElementById('commentCount');
  if (!container) return;

  container.innerHTML = `<div style="height:60px;border-radius:12px" class="skeleton"></div>
                         <div style="height:60px;border-radius:12px;margin-top:8px" class="skeleton"></div>`;

  if (!sb) sb = getSupabase();
  const { data, error } = await sb
    .from('comments')
    .select(`id, content, created_at, likes, parent_id, user_id, users:user_id (username, email)`)
    .eq('simulation_id', simId)
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) {
    container.innerHTML = '<p style="color:var(--dim);font-size:0.8rem;padding:12px 0">No comments yet. Be the first!</p>';
    if (count) count.textContent = '0 comments';
    return;
  }

  if (count) count.textContent = `${data.length} comment${data.length !== 1 ? 's' : ''}`;

  if (data.length === 0) {
    container.innerHTML = '<p style="color:var(--dim);font-size:0.8rem;padding:12px 0">No comments yet. Start the discussion!</p>';
    return;
  }

  const currentUser = await getCurrentUser();
  container.innerHTML = data.map(c => renderComment(c, false, currentUser)).join('');
}

function renderComment(c, isReply, currentUser) {
  const name = c.users?.username || c.users?.email?.split('@')[0] || 'Anonymous';
  const initial = name[0].toUpperCase();
  const date = new Date(c.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  const isOwn = currentUser && c.user_id === currentUser.id;

  return `
  <div class="comment ${isReply ? 'comment-reply' : ''}" id="comment-${c.id}">
    <div class="comment-avatar">${initial}</div>
    <div class="comment-body">
      <div class="comment-header">
        <span class="comment-name">${escapeHtml(name)}</span>
        <span class="comment-date">${date}</span>
      </div>
      <div class="comment-text">${escapeHtml(c.content)}</div>
      <div class="comment-actions">
        <button class="comment-action" onclick="likeComment('${c.id}')">👍 ${c.likes || 0}</button>
        <button class="comment-action" onclick="showReplyBox('${c.id}')">↩ Reply</button>
        ${isOwn ? `<button class="comment-action" onclick="deleteComment('${c.id}')" style="color:var(--red)">🗑 Delete</button>` : ''}
        ${!isOwn ? `<button class="comment-action" onclick="reportComment('${c.id}')" style="color:var(--dim)">⚑ Report</button>` : ''}
      </div>
      <div id="replyBox-${c.id}" style="display:none" class="reply-box">
        <textarea id="replyText-${c.id}" class="comment-input" placeholder="Write a reply..." rows="2"></textarea>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="comment-submit-btn" onclick="submitReply('${c.id}', currentSimId)">Post Reply</button>
          <button class="comment-cancel-btn" onclick="hideReplyBox('${c.id}')">Cancel</button>
        </div>
      </div>
    </div>
  </div>`;
}

let currentSimId = '';

async function submitComment(simId) {
  currentSimId = simId;
  const user = await getCurrentUser();
  if (!user) { window.location.href = `auth.html?redirect=${encodeURIComponent(location.href)}`; return; }

  // Rate limit: 5 comments per hour
  if (!RATE_LIMIT.check('comment_' + user.id, 5, 60)) {
    alert('Rate limit: max 5 comments per hour. Please wait.');
    return;
  }

  const input = document.getElementById('commentInput');
  const content = input?.value?.trim();
  if (!content || content.length < 2) return;
  if (content.length > 2000) { alert('Comment too long (max 2000 chars)'); return; }

  const submitBtn = document.getElementById('commentSubmitBtn');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Posting...'; }

  if (!sb) sb = getSupabase();
  const { error } = await sb.from('comments').insert({
    simulation_id: simId,
    user_id: user.id,
    content: content
  });

  if (!error) { input.value = ''; await loadComments(simId); }
  else { alert('Failed to post comment. Please try again.'); }

  if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Post Comment'; }
}

async function submitReply(parentId, simId) {
  const user = await getCurrentUser();
  if (!user) { window.location.href = `auth.html?redirect=${encodeURIComponent(location.href)}`; return; }

  if (!RATE_LIMIT.check('comment_' + user.id, 5, 60)) {
    alert('Rate limit: max 5 comments per hour.');
    return;
  }

  const input = document.getElementById(`replyText-${parentId}`);
  const content = input?.value?.trim();
  if (!content) return;

  if (!sb) sb = getSupabase();
  await sb.from('comments').insert({
    simulation_id: simId,
    user_id: user.id,
    content: content,
    parent_id: parentId
  });

  input.value = '';
  hideReplyBox(parentId);
  await loadComments(simId);
}

async function likeComment(commentId) {
  const user = await getCurrentUser();
  if (!user) { alert('Please sign in to like comments'); return; }
  if (!sb) sb = getSupabase();
  try {
    await sb.rpc('increment_comment_likes', { comment_id: commentId });
    const btn = document.querySelector(`#comment-${commentId} .comment-action`);
    if (btn) {
      const current = parseInt(btn.textContent.replace(/\D/g,'') || '0');
      btn.textContent = `👍 ${current + 1}`;
    }
  } catch(e) {}
}

async function reportComment(commentId) {
  if (!confirm('Report this comment as inappropriate?')) return;
  if (!sb) sb = getSupabase();
  await sb.from('comments').update({ is_reported: true }).eq('id', commentId);
  alert('Comment reported. Thank you!');
}

async function deleteComment(commentId) {
  if (!confirm('Delete your comment?')) return;
  if (!sb) sb = getSupabase();
  await sb.from('comments').delete().eq('id', commentId);
  await loadComments(currentSimId);
}

function showReplyBox(commentId) {
  const box = document.getElementById(`replyBox-${commentId}`);
  if (box) { box.style.display = 'block'; document.getElementById(`replyText-${commentId}`)?.focus(); }
}

function hideReplyBox(commentId) {
  const box = document.getElementById(`replyBox-${commentId}`);
  if (box) box.style.display = 'none';
}

async function renderCommentInput(simId) {
  const wrap = document.getElementById('commentInputWrap');
  if (!wrap) return;
  currentSimId = simId;

  const user = await getCurrentUser();
  if (user) {
    wrap.innerHTML = `
    <div class="comment-input-area">
      <div class="comment-avatar" style="width:36px;height:36px;font-size:0.85rem">${(user.email||'U')[0].toUpperCase()}</div>
      <div style="flex:1">
        <textarea id="commentInput" class="comment-input" placeholder="Share your thoughts or ask a question..." rows="3" maxlength="2000"></textarea>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
          <span style="font-size:0.68rem;color:var(--muted)">Be respectful · Max 2000 chars · 5/hour limit</span>
          <button id="commentSubmitBtn" class="comment-submit-btn" onclick="submitComment('${simId}')">Post Comment</button>
        </div>
      </div>
    </div>`;
  } else {
    wrap.innerHTML = `
    <div class="comment-login-prompt">
      <p style="color:var(--dim);font-size:0.85rem">
        <a href="auth.html?redirect=${encodeURIComponent(location.href)}" style="color:var(--cyan)">Sign in</a> to join the discussion
      </p>
    </div>`;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}
