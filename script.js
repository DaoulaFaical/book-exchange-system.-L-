// Data and persistence
let users = JSON.parse(localStorage.getItem('users')) || [];
let books = JSON.parse(localStorage.getItem('books')) || [];
let conversations = JSON.parse(localStorage.getItem('conversations')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

function saveUsers() { localStorage.setItem('users', JSON.stringify(users)); }
function saveBooks() { localStorage.setItem('books', JSON.stringify(books)); }
function saveConversations() { localStorage.setItem('conversations', JSON.stringify(conversations)); }
function saveCurrentUser() { localStorage.setItem('currentUser', JSON.stringify(currentUser)); }

// Demo data if empty
if (users.length === 0) {
  users = [
    { id: 1, username: 'alice', email: 'alice@example.com', password: 'pass123' },
    { id: 2, username: 'bob', email: 'bob@example.com', password: 'pass123' }
  ];
  saveUsers();
}
if (books.length === 0) {
  books = [
    { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'fiction', description: 'Classic novel', condition: 'Good', owner: 'alice', ownerId: 1 },
    { id: 2, title: 'Sapiens', author: 'Yuval Noah Harari', category: 'non-fiction', description: 'History of humankind', condition: 'Good', owner: 'bob', ownerId: 2 }
  ];
  saveBooks();
}
if (!Array.isArray(conversations)) {
  conversations = [];
  saveConversations();
}

// Utilities
function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"'`=\/]/g, function (c) {
    return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;' })[c];
  });
}
function shorten(s, n) { if (!s) return ''; return s.length > n ? s.slice(0, n) + '…' : s; }
function formatTime(ts) { return new Date(ts).toLocaleString(); }

// Auth UI switch
function switchAuthTab(tab) {
  document.getElementById('loginTab')?.classList.toggle('active', tab === 'login');
  document.getElementById('registerTab')?.classList.toggle('active', tab === 'register');
  const btns = Array.from(document.querySelectorAll('.auth-tab-btn'));
  if (btns[0]) btns[0].classList.toggle('active', tab === 'login');
  if (btns[1]) btns[1].classList.toggle('active', tab === 'register');
}

// Navigation
function updateNavigation() {
  const nav = document.getElementById('navbar');
  if (nav) nav.style.display = currentUser ? 'block' : 'none';
  updateMessagesNavBadge();
}

function showPage(pageId) {
  const protectedPages = ['home','books','profile','addBook','messages'];
  if (!currentUser && protectedPages.includes(pageId)) pageId = 'auth';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId)?.classList.add('active');

  updateNavigation();

  if (pageId === 'books') displayBooks();
  if (pageId === 'profile') loadProfileData();
  if (pageId === 'messages') {
    renderConversationsList();
    const chatArea = document.getElementById('chatArea');
    if (chatArea && chatArea.innerHTML.trim() === '') {
      chatArea.innerHTML = '<div class="empty-state"><p>Select a conversation to start messaging</p></div>';
    }
  }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  if (currentUser) showPage('home'); else showPage('auth');
  updateNavigation();

  // Register
  const registerForm = document.getElementById('registerForm');
  registerForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = (document.getElementById('regUsername')?.value || '').trim();
    const email = (document.getElementById('regEmail')?.value || '').trim();
    const password = (document.getElementById('regPassword')?.value || '');
    const confirm = (document.getElementById('regConfirmPassword')?.value || '');
    if (username.length < 3) { alert('Username must be at least 3 characters'); return; }
    if (!email.includes('@')) { alert('Enter a valid email'); return; }
    if (password.length < 6) { alert('Password must be at least 6 characters'); return; }
    if (password !== confirm) { alert('Passwords do not match'); return; }
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) { alert('Username already exists'); return; }
    const newUser = { id: users.length ? Math.max(...users.map(u => u.id)) + 1 : 1, username, email, password };
    users.push(newUser); saveUsers();
    alert('Registration successful. Please login.');
    registerForm.reset(); switchAuthTab('login');
  });

  // Login
  const loginForm = document.getElementById('loginForm');
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = (document.getElementById('loginUsername')?.value || '').trim();
    const password = (document.getElementById('loginPassword')?.value || '');
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) { alert('Invalid username or password'); return; }
    currentUser = user; saveCurrentUser(); alert(`Welcome back, ${user.username}!`);
    loginForm.reset();
    updateNavigation();
    renderConversationsList(); updateMessagesNavBadge();
    showPage('home');
  });

  // Add book
  const addBookForm = document.getElementById('addBookForm');
  addBookForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentUser) { alert('Please login to add a book'); showPage('auth'); return; }
    const title = (document.getElementById('bookTitle')?.value || '').trim();
    const author = (document.getElementById('bookAuthor')?.value || '').trim();
    const category = (document.getElementById('bookCategory')?.value || '').trim();
    const description = (document.getElementById('bookDescription')?.value || '').trim();
    const condition = (document.getElementById('bookCondition')?.value || '').trim();
    if (!title || !author || !category) { alert('Please fill required fields'); return; }
    const newBook = {
      id: books.length ? Math.max(...books.map(b => b.id)) + 1 : 1,
      title, author, category,
      description: description || 'No description',
      condition: condition || 'Not specified',
      owner: currentUser.username,
      ownerId: currentUser.id
    };
    books.push(newBook); saveBooks();
    alert('Book added'); addBookForm.reset(); showPage('books');
  });

  // initial message list
  renderConversationsList(); updateMessagesNavBadge();
});

// Logout
function logout() {
  currentUser = null; localStorage.removeItem('currentUser'); updateNavigation(); alert('Logged out'); showPage('auth');
}

// Books display
function displayBooks() {
  const booksList = document.getElementById('booksList');
  if (!booksList) return;
  booksList.innerHTML = '';
  if (books.length === 0) { booksList.innerHTML = '<div class="empty-state"><p>No books yet.</p></div>'; return; }
  books.forEach(book => {
    const owner = users.find(u => u.id === book.ownerId) || { username: book.owner || 'Unknown' };
    const card = document.createElement('div'); card.className = 'book-card';
    card.innerHTML = `
      <h3>${escapeHtml(book.title)}</h3>
      <p><strong>Author:</strong> ${escapeHtml(book.author)}</p>
      <p><strong>Category:</strong> <span class="badge">${escapeHtml(book.category)}</span></p>
      <p><strong>Description:</strong> ${escapeHtml(book.description)}</p>
      <p><strong>Condition:</strong> ${escapeHtml(book.condition)}</p>
      <p class="book-owner">📖 Listed by: ${escapeHtml(owner.username)}</p>
      <div class="book-actions"></div>
    `;
    const actions = card.querySelector('.book-actions');
    if (currentUser && currentUser.id === book.ownerId) {
      const del = document.createElement('button'); del.className = 'delete-btn'; del.textContent = 'Delete';
      del.onclick = () => { if (confirm('Delete this book?')) deleteBook(book.id); };
      actions.appendChild(del);
    } else {
      const contact = document.createElement('button'); contact.className = 'btn btn-secondary'; contact.textContent = 'Contact owner';
      contact.onclick = () => contactOwner(book.id);
      actions.appendChild(contact);
    }
    booksList.appendChild(card);
  });
}

function filterBooks() {
  const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const cat = (document.getElementById('categoryFilter')?.value || '').toLowerCase();
  document.querySelectorAll('#booksList .book-card').forEach(card => {
    const title = (card.querySelector('h3')?.textContent || '').toLowerCase();
    const text = card.textContent.toLowerCase();
    const badge = (card.querySelector('.badge')?.textContent || '').toLowerCase();
    const show = (title.includes(q) || text.includes(q)) && (!cat || badge === cat);
    card.style.display = show ? 'block' : 'none';
  });
}

function deleteBook(id) {
  books = books.filter(b => b.id !== id); saveBooks(); displayBooks();
}

// Profile
function loadProfileData() {
  if (!currentUser) { showPage('auth'); return; }
  document.getElementById('profileUsername').textContent = currentUser.username;
  document.getElementById('profileEmail').textContent = currentUser.email;
  const myBooks = books.filter(b => b.ownerId === currentUser.id);
  document.getElementById('profileBooksCount').textContent = myBooks.length;
  displayUserBooks(myBooks);
}

function displayUserBooks(myBooks) {
  const el = document.getElementById('myBooksList');
  if (!el) return;
  el.innerHTML = '';
  if (!myBooks || myBooks.length === 0) {
    el.innerHTML = '<div class="empty-state"><p>You have no books yet. <a href="#" onclick="showPage(\'addBook\')">Add one</a></p></div>';
    return;
  }
  myBooks.forEach(book => {
    const card = document.createElement('div'); card.className = 'book-card';
    card.innerHTML = `
      <h3>${escapeHtml(book.title)}</h3>
      <p><strong>Author:</strong> ${escapeHtml(book.author)}</p>
      <p><strong>Category:</strong> <span class="badge">${escapeHtml(book.category)}</span></p>
      <p><strong>Description:</strong> ${escapeHtml(book.description)}</p>
      <p><strong>Condition:</strong> ${escapeHtml(book.condition)}</p>
      <div class="book-actions"></div>
    `;
    const actions = card.querySelector('.book-actions');
    const del = document.createElement('button'); del.className = 'delete-btn'; del.textContent = 'Delete';
    del.onclick = () => { if (confirm('Delete this book?')) deleteBook(book.id); };
    actions.appendChild(del);
    el.appendChild(card);
  });

  // Messaging helpers
function getOrCreateConversation(userA, userB, meta = {}) {
  const participants = [userA, userB].sort((a, b) => a - b);
  let convo = conversations.find(c => c.participants[0] === participants[0] && c.participants[1] === participants[1]);
  if (!convo) {
    convo = { id: Date.now() + Math.floor(Math.random() * 1000), participants, messages: [], meta };
    conversations.unshift(convo); saveConversations();
  } else {
    convo.meta = Object.assign(convo.meta || {}, meta); saveConversations();
  }
  return convo;
}

function addMessageToConversation(convoId, fromId, toId, text) {
  const convo = conversations.find(c => c.id === convoId); if (!convo) return null;
  const msg = { id: Date.now() + Math.floor(Math.random() * 1000), fromId, toId, text, timestamp: Date.now(), read: false };
  convo.messages.push(msg);
  conversations = conversations.filter(c => c.id !== convoId); conversations.unshift(convo); saveConversations(); updateMessagesNavBadge();
  return msg;
} 
  
// renderConversationsList
function renderConversationsList() {
  const listEl = document.getElementById('conversationsList'); if (!listEl) return;
  listEl.innerHTML = '';
  if (!currentUser) { listEl.innerHTML = '<p class="empty-state">Login to see conversations</p>'; updateMessagesNavBadge(); return; }
  const userConvos = conversations.filter(c => c.participants.includes(currentUser.id));
  if (userConvos.length === 0) { listEl.innerHTML = '<p class="empty-state">No conversations yet. Contact an owner to start.</p>'; updateMessagesNavBadge(); return; }
  userConvos.forEach(convo => {
    const otherId = convo.participants.find(id => id !== currentUser.id);
    const other = users.find(u => u.id === otherId) || { username: 'Deleted user' };
    const last = convo.messages.length ? convo.messages[convo.messages.length - 1] : null;
    const unread = convo.messages.filter(m => m.toId === currentUser.id && !m.read).length;
    const item = document.createElement('div'); item.className = 'conversation-item'; item.onclick = () => openConversation(convo.id);
    item.innerHTML = `
      <div style="flex:1">
        <div style="font-weight:800;color:var(--primary)">${escapeHtml(other.username)}</div>
        <div style="color:var(--muted);font-size:.95rem">${last ? escapeHtml(shorten(last.text, 60)) : 'Start a conversation'}</div>
      </div>
      <div style="text-align:right;min-width:80px">
        <div style="font-size:.75rem;color:var(--muted)">${last ? formatTime(last.timestamp) : ''}</div>
        ${unread ? `<div class="unread-badge">${unread}</div>` : ''}
      </div>
    `;
    listEl.appendChild(item);
  });
  updateMessagesNavBadge();
}

// openConversation
function openConversation(convoId) {
  const chatArea = document.getElementById('chatArea'); if (!chatArea) return;
  const convo = conversations.find(c => c.id === convoId); if (!convo) return;
  if (!currentUser) { alert('Please login'); showPage('auth'); return; }
  const otherId = convo.participants.find(id => id !== currentUser.id);
  const other = users.find(u => u.id === otherId) || { username: 'Deleted user' };
  // mark read
  convo.messages.forEach(m => { if (m.toId === currentUser.id) m.read = true; });
  saveConversations(); renderConversationsList();
  chatArea.innerHTML = `
    <div class="chat-header">
      <div>
        <div style="font-weight:800;color:var(--primary)">${escapeHtml(other.username)}</div>
        <div style="font-size:.9rem;color:var(--muted)">${convo.meta && convo.meta.title ? 'About: ' + escapeHtml(convo.meta.title) : ''}</div>
      </div>
      <div style="font-size:.85rem;color:var(--muted)">${convo.messages.length} message(s)</div>
    </div>
    <div id="chatMessages" class="chat-messages"></div>
    <div class="chat-input">
      <input id="chatMessageInput" type="text" placeholder="Write a message..." />
      <button id="chatSendBtn" class="btn btn-primary">Send</button>
    </div>
  `;
  const chatMessages = document.getElementById('chatMessages');
  convo.messages.forEach(m => {
    const el = document.createElement('div'); el.className = 'msg ' + (m.fromId === currentUser.id ? 'me' : 'them');
    el.innerHTML = `<div>${escapeHtml(m.text)}</div><div class="msg-meta">${m.fromId === currentUser.id ? 'You' : escapeHtml(other.username)} • ${formatTime(m.timestamp)}</div>`;
    chatMessages.appendChild(el);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
  const input = document.getElementById('chatMessageInput'); const btn = document.getElementById('chatSendBtn');
  btn.onclick = () => { const text = (input.value || '').trim(); if (!text) return; addMessageToConversation(convo.id, currentUser.id, otherId, text); openConversation(convo.id); input.value = ''; };
  input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); btn.click(); } };
}

// contactOwner
function contactOwner(bookId) {
  if (!currentUser) { alert('Please login to contact owner'); showPage('auth'); return; }
  const book = books.find(b => b.id === bookId); if (!book) { alert('Book not found'); return; }
  if (book.ownerId === currentUser.id) { alert('This is your book'); return; }
  const convo = getOrCreateConversation(currentUser.id, book.ownerId, { bookId: book.id, title: book.title });
  convo.meta = Object.assign(convo.meta || {}, { bookId: book.id, title: book.title }); saveConversations();
  const intro = `Hi ${book.owner}, I'm interested in your book "${book.title}". Are you available to discuss?`;
  addMessageToConversation(convo.id, currentUser.id, book.ownerId, intro);
  showPage('messages'); renderConversationsList(); openConversation(convo.id);
}

// Part8B — badge + expose globals
function updateMessagesNavBadge() {
  const nav = document.getElementById('messagesNav'); if (!nav) return;
  if (!currentUser) { nav.innerHTML = 'Messages'; return; }
  const totalUnread = conversations.reduce((sum, c) => sum + c.messages.filter(m => m.toId === currentUser.id && !m.read).length, 0);
  nav.innerHTML = totalUnread > 0 ? `Messages <span class="unread-badge" style="margin-left:6px;vertical-align:middle">${totalUnread}</span>` : 'Messages';
}

// Expose functions globally for HTML onClick usage
window.showPage = showPage;
window.switchAuthTab = switchAuthTab;
window.logout = logout;
window.contactOwner = contactOwner;
window.displayBooks = displayBooks;
window.filterBooks = filterBooks;
window.deleteBook = deleteBook;
window.openConversation = openConversation;
window.renderConversationsList = renderConversationsList;
window.updateMessagesNavBadge = updateMessagesNavBadge;
window.loadProfileData = loadProfileData;
