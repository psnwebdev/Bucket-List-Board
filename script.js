const catConfig = {
  adventure: { icon: '🏔', label: 'Adventure', cls: 'cat-adventure' },
  travel:    { icon: '✈️', label: 'Travel',    cls: 'cat-travel' },
  food:      { icon: '🍜', label: 'Food',      cls: 'cat-food' },
  learning:  { icon: '📚', label: 'Learning',  cls: 'cat-learning' },
  personal:  { icon: '❤️', label: 'Personal',  cls: 'cat-personal' },
  creative:  { icon: '🎨', label: 'Creative',  cls: 'cat-creative' },
  other:     { icon: '⭐', label: 'Other',     cls: 'cat-other' },
};

const priorityConfig = {
  high: { dot: 'priority-high', label: 'High priority' },
  med:  { dot: 'priority-med',  label: 'Medium priority' },
  low:  { dot: 'priority-low',  label: 'Low priority' },
};

let items = JSON.parse(localStorage.getItem('bucketlist') || '[]');
let currentFilter = 'all';
let nextId = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;



/* ── Persist & Refresh ── */
function save() {
  localStorage.setItem('bucketlist', JSON.stringify(items));
  updateStats();
  render();
}

/* ── Stats ── */
function updateStats() {
  const total = items.length;
  const done  = items.filter(i => i.done).length;
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statDone').textContent  = done;
  document.getElementById('statLeft').textContent  = total - done;
}

/* ── Filter ── */
function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

function filtered() {
  if (currentFilter === 'all')  return items;
  if (currentFilter === 'todo') return items.filter(i => !i.done);
  if (currentFilter === 'done') return items.filter(i => i.done);
  return items.filter(i => i.category === currentFilter);
}

/* ── Render Board ── */
function render() {
  const board = document.getElementById('board');
  const list  = filtered();

  if (!list.length) {
    board.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">✨</span>
        <h3>Nothing here yet</h3>
        <p>Add your first dream above!</p>
      </div>`;
    return;
  }

  board.innerHTML = list.map(item => {
    const cat = catConfig[item.category] || catConfig.other;
    const pri = priorityConfig[item.priority] || priorityConfig.med;

    return `
      <div class="card${item.done ? ' done' : ''}" id="card-${item.id}">

        <span class="category-pill ${cat.cls}">
          <span class="cat-icon">${cat.icon}</span>${cat.label}
        </span>

        <div class="card-title" id="title-${item.id}">${escHtml(item.title)}</div>

        <div class="card-note" id="note-${item.id}"
             style="${item.note ? '' : 'display:none'}">
          ${escHtml(item.note)}
        </div>

        <div class="card-footer">
          <div>
            <span class="priority-dot ${pri.dot}"></span>
            <span class="priority-label">${pri.label}</span>
            ${item.done
              ? `<span class="done-badge">
                   <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"
                        stroke-width="2.5" stroke-linecap="round">
                     <polyline points="2,8 6,12 14,4"/>
                   </svg>Done!
                 </span>`
              : ''}
          </div>

          <div class="card-actions">
            <button class="btn-icon btn-check"
                    title="${item.done ? 'Mark undone' : 'Mark done'}"
                    onclick="toggleDone(${item.id})">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round">
                <polyline points="2,8 6,12 14,4"/>
              </svg>
            </button>

            <button class="btn-icon" title="Edit" onclick="startEdit(${item.id})">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"
                   stroke-width="1.8" stroke-linecap="round">
                <path d="M11 2l3 3-8 8H3v-3l8-8z"/>
              </svg>
            </button>

            <button class="btn-icon btn-delete" title="Delete"
                    onclick="deleteItem(${item.id})">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"
                   stroke-width="1.8" stroke-linecap="round">
                <polyline points="2,4 14,4"/>
                <path d="M6,4V2h4v2M5,4v9a1,1,0,0,0,1,1h4a1,1,0,0,0,1-1V4"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Inline Edit Form -->
        <div class="edit-form" id="edit-${item.id}">
          <input type="text" id="edit-title-${item.id}"
                 value="${escAttr(item.title)}" placeholder="Title" maxlength="120"/>
          <input type="text" id="edit-note-${item.id}"
                 value="${escAttr(item.note)}" placeholder="Note (optional)"/>
          <div class="edit-selects">
            <select id="edit-cat-${item.id}">
              ${Object.entries(catConfig).map(([k, v]) =>
                `<option value="${k}"${k === item.category ? ' selected' : ''}>${v.icon} ${v.label}</option>`
              ).join('')}
            </select>
            <select id="edit-pri-${item.id}">
              <option value="high"${item.priority === 'high' ? ' selected' : ''}>🔴 High</option>
              <option value="med" ${item.priority === 'med'  ? ' selected' : ''}>🟡 Medium</option>
              <option value="low" ${item.priority === 'low'  ? ' selected' : ''}>🟢 Low</option>
            </select>
          </div>
          <div class="edit-btns">
            <button class="btn-save"   onclick="saveEdit(${item.id})">Save</button>
            <button class="btn-cancel" onclick="cancelEdit(${item.id})">Cancel</button>
          </div>
        </div>

      </div>`;
  }).join('');
}

/* ── Helpers ── */
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(s) {
  return String(s).replace(/"/g, '&quot;');
}

/* ── CRUD Actions ── */
function addItem() {
  const titleEl = document.getElementById('newTitle');
  const title   = titleEl.value.trim();
  if (!title) { titleEl.focus(); return; }

  items.unshift({
    id:       nextId++,
    title,
    category: document.getElementById('newCategory').value,
    priority: document.getElementById('newPriority').value,
    note:     document.getElementById('newNote').value.trim(),
    done:     false,
  });

  titleEl.value = '';
  document.getElementById('newNote').value = '';
  save();
}

function toggleDone(id) {
  const item = items.find(i => i.id === id);
  if (item) { item.done = !item.done; save(); }
}

function deleteItem(id) {
  const card = document.getElementById('card-' + id);
  if (card) {
    card.style.transition = 'opacity 0.25s, transform 0.25s';
    card.style.opacity    = '0';
    card.style.transform  = 'scale(0.93)';
    setTimeout(() => {
      items = items.filter(i => i.id !== id);
      save();
    }, 240);
  }
}

function startEdit(id) {
  document.querySelectorAll('.edit-form').forEach(f => f.classList.remove('visible'));
  const f = document.getElementById('edit-' + id);
  if (f) { f.classList.add('visible'); f.querySelector('input').focus(); }
}

function cancelEdit(id) {
  const f = document.getElementById('edit-' + id);
  if (f) f.classList.remove('visible');
}

function saveEdit(id) {
  const item    = items.find(i => i.id === id);
  if (!item) return;
  const titleEl = document.getElementById('edit-title-' + id);
  const title   = titleEl.value.trim();
  if (!title) { titleEl.focus(); return; }

  item.title    = title;
  item.note     = document.getElementById('edit-note-' + id).value.trim();
  item.category = document.getElementById('edit-cat-' + id).value;
  item.priority = document.getElementById('edit-pri-' + id).value;
  save();
}

/* ── Enter key shortcut on title input ── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('newTitle').addEventListener('keydown', e => {
    if (e.key === 'Enter') addItem();
  });

  updateStats();
  render();
});