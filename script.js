// =====================
// DATA STORAGE (LocalStorage)
// =====================

let users = JSON.parse(localStorage.getItem('users')) || [];
let books = JSON.parse(localStorage.getItem('books')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// Sample data for demo
if (users.length === 0) {
    users = [
        { id: 1, username: 'john_doe', email: 'john@example.com', password: 'password123' },
        { id: 2, username: 'jane_smith', email: 'jane@example.com', password: 'password123' }
    ];
    localStorage.setItem('users', JSON.stringify(users));
}

if (books.length === 0) {
    books = [
        { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'fiction', description: 'A classic novel about the American Dream', condition: 'Like New', owner: 'john_doe', ownerId: 1 },
        { id: 2, title: 'Sapiens', author: 'Yuval Noah Harari', category: 'non-fiction', description: 'A brief history of humankind', condition: 'Good', owner: 'jane_smith', ownerId: 2 },
        { id: 3, title: 'A Brief History of Time', author: 'Stephen Hawking', category: 'science', description: 'Exploring the universe and black holes', condition: 'Good', owner: 'john_doe', ownerId: 1 }
    ];
    localStorage.setItem('books', JSON.stringify(books));
}

// =====================
// AUTH TABS SWITCHING
// =====================

function switchAuthTab(tab) {
    // Hide all tabs
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('registerTab').classList.remove('active');

    // Remove active class from all buttons
    document.querySelectorAll('.auth-tab-btn').forEach(btn => btn.classList.remove('active'));

    // Show selected tab
    if (tab === 'login') {
        document.getElementById('loginTab').classList.add('active');
        document.querySelectorAll('.auth-tab-btn')[0].classList.add('active');
    } else {
        document.getElementById('registerTab').classList.add('active');
        document.querySelectorAll('.auth-tab-btn')[1].classList.add('active');
    }
}

// =====================
// PAGE NAVIGATION
// =====================

function showPage(pageId) {
    // If not logged in and trying to access protected pages, redirect to auth
    if (!currentUser && ['home', 'books', 'profile', 'addBook'].includes(pageId)) {
        showPage('auth');
        return;
    }

    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));

    // Show selected page
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.classList.add('active');

        // Update navigation based on login status
        updateNavigation();

        // Load data when showing books or profile
        if (pageId === 'books') {
            displayBooks();
        } else if (pageId === 'profile') {
            loadProfileData();
        }
    }
}

function updateNavigation() {
    const navbar = document.getElementById('navbar');
    
    if (currentUser) {
        navbar.style.display = 'block';
    } else {
        navbar.style.display = 'none';
    }
}
// =====================
// INITIALIZATION
// =====================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize page based on login status
    if (currentUser) {
        showPage('home');
    } else {
        showPage('auth');
    }
    updateNavigation();

    // =====================
    // REGISTER FORM
    // =====================
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('regUsername').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;

            // Validation
            if (username.length < 3) {
                alert('Username must be at least 3 characters long');
                return;
            }

            if (!email.includes('@')) {
                alert('Please enter a valid email');
                return;
            }

            if (password.length < 6) {
                alert('Password must be at least 6 characters long');
                return;
            }

            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }

            // Check if user already exists
            if (users.some(u => u.username === username)) {
                alert('Username already exists');
                return;
            }

            // Create new user
            const newUser = {
                id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
                username: username,
                email: email,
                password: password
            };

            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));

            alert('Registration successful! Please login.');
            registerForm.reset();
            switchAuthTab('login');
        });
    }

    // =====================
    // LOGIN FORM
    // =====================
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;

            // Find user
            const user = users.find(u => u.username === username && u.password === password);

            if (user) {
                currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                alert(`Welcome back, ${user.username}!`);
                loginForm.reset();
                updateNavigation();
                showPage('home');
            } else {
                alert('Invalid username or password');
            }
        });
    }

    // =====================
    // ADD BOOK FORM
    // =====================
    const addBookForm = document.getElementById('addBookForm');
    if (addBookForm) {
        addBookForm.addEventListener('submit', function(e) {
            e.preventDefault();

            if (!currentUser) {
                alert('Please login to add a book');
                return;
            }

            const title = document.getElementById('bookTitle').value.trim();
            const author = document.getElementById('bookAuthor').value.trim();
            const category = document.getElementById('bookCategory').value;
            const description = document.getElementById('bookDescription').value.trim();
            const condition = document.getElementById('bookCondition').value.trim();

            // Validation
            if (!title || !author || !category) {
                alert('Please fill in all required fields');
                return;
            }

            // Create new book
            const newBook = {
                id: books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1,
                title: title,
                author: author,
                category: category,
                description: description || 'No description',
                condition: condition || 'Not specified',
                owner: currentUser.username,
                ownerId: currentUser.id
            };

            books.push(newBook);
            localStorage.setItem('books', JSON.stringify(books));

            alert('Book added successfully!');
            addBookForm.reset();
            showPage('books');
        });
    }
});
// =====================
// LOGOUT
// =====================

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    alert('You have been logged out');
    updateNavigation();
    showPage('auth');
}

// =====================
// BOOKS MANAGEMENT
// =====================

function displayBooks() {
    const booksList = document.getElementById('booksList');
    if (!booksList) return;
    
    booksList.innerHTML = '';

    if (books.length === 0) {
        booksList.innerHTML = '<div class="empty-state"><p>No books available yet. Be the first to add one!</p></div>';
        return;
    }

    books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        bookCard.innerHTML = `
            <h3>${book.title}</h3>
            <p><strong>Author:</strong> ${book.author}</p>
            <p><strong>Category:</strong> <span class="badge">${book.category}</span></p>
            <p><strong>Description:</strong> ${book.description}</p>
            <p><strong>Condition:</strong> ${book.condition}</p>
            <p class="book-owner">📖 Listed by: ${book.owner}</p>
            ${currentUser && currentUser.id === book.ownerId ? `<button class="delete-btn" onclick="deleteBook(${book.id})">Delete Book</button>` : ''}
        `;
        booksList.appendChild(bookCard);
    });
}

function filterBooks() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;

    const booksList = document.getElementById('booksList');
    const bookCards = booksList.querySelectorAll('.book-card');

    bookCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const author = card.textContent.toLowerCase();
        const category = card.querySelector('.badge')?.textContent.toLowerCase() || '';

        const matchesSearch = title.includes(searchInput) || author.includes(searchInput);
        const matchesCategory = categoryFilter === '' || category === categoryFilter;

        if (matchesSearch && matchesCategory) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function deleteBook(bookId) {
    if (confirm('Are you sure you want to delete this book?')) {
        books = books.filter(b => b.id !== bookId);
        localStorage.setItem('books', JSON.stringify(books));
        displayBooks();
        alert('Book deleted successfully');
    }
}

// =====================
// PROFILE
// =====================

function loadProfileData() {
    if (!currentUser) {
        showPage('auth');
        return;
    }

    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profileEmail').textContent = currentUser.email;

    const userBooks = books.filter(b => b.ownerId === currentUser.id);
    document.getElementById('profileBooksCount').textContent = userBooks.length;

    displayUserBooks(userBooks);
}

function displayUserBooks(userBooks) {
    const myBooksList = document.getElementById('myBooksList');
    myBooksList.innerHTML = '';

    if (userBooks.length === 0) {
        myBooksList.innerHTML = '<div class="empty-state"><p>You haven\'t listed any books yet. <a href="#" onclick="showPage(\'addBook\')">Add one now</a></p></div>';
        return;
    }

    userBooks.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        bookCard.innerHTML = `
            <h3>${book.title}</h3>
            <p><strong>Author:</strong> ${book.author}</p>
            <p><strong>Category:</strong> <span class="badge">${book.category}</span></p>
            <p><strong>Description:</strong> ${book.description}</p>
            <p><strong>Condition:</strong> ${book.condition}</p>
            <button class="delete-btn" onclick="deleteBook(${book.id})">Delete Book</button>
        `;
        myBooksList.appendChild(bookCard);
    });
}
// ======= Data, helpers, auth, navigation, init =======
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

// Navigation helpers
function updateNavigation() {
  const nav = document.getElementById('navbar');
  if (nav) nav.style.display = currentUser ? 'block' : 'none';
  // updateMessagesNavBadge may be defined later (Part C)
  if (typeof updateMessagesNavBadge === 'function') updateMessagesNavBadge();
}

function showPage(pageId) {
  const protectedPages = ['home','books','profile','addBook','messages'];
  if (!currentUser && protectedPages.includes(pageId)) pageId = 'auth';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId)?.classList.add('active');

  updateNavigation();

  if (pageId === 'books' && typeof displayBooks === 'function') displayBooks();
  if (pageId === 'profile' && typeof loadProfileData === 'function') loadProfileData();
  if (pageId === 'messages') {
    if (typeof renderConversationsList === 'function') renderConversationsList();
    const chatArea = document.getElementById('chatArea');
    if (chatArea && chatArea.innerHTML.trim() === '') {
      chatArea.innerHTML = '<div class="empty-state"><p>Select a conversation to start messaging</p></div>';
    }
  }
}

// Init: set up event listeners for register/login/add-book and initial rendering
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
    if (!email.includes('@')) { return; }
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
    if (typeof renderConversationsList === 'function') renderConversationsList();
    if (typeof updateMessagesNavBadge === 'function') updateMessagesNavBadge();
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
    alert('Book added'); addBookForm.reset(); if (typeof displayBooks === 'function') displayBooks(); showPage('books');
  });

  // initial message list + badge (if parts B/C already loaded they will run)
  if (typeof renderConversationsList === 'function') renderConversationsList();
  if (typeof updateMessagesNavBadge === 'function') updateMessagesNavBadge();
});
// ======= Conversations (render / open / send) =======
function renderConversationsList() {
  const listEl = document.getElementById('conversationsList');
  if (!listEl) return;
  listEl.innerHTML = '';

  if (!currentUser) {
    listEl.innerHTML = '<p class="empty-state">Login to see conversations</p>';
    updateMessagesNavBadge();
    return;
  }

  const userConvos = conversations.filter(c => c.participants.includes(currentUser.id));
  if (userConvos.length === 0) {
    listEl.innerHTML = '<p class="empty-state">No conversations yet. Contact an owner to start.</p>';
    updateMessagesNavBadge();
    return;
  }

  userConvos.forEach(convo => {
    const otherId = convo.participants.find(id => id !== currentUser.id);
    const other = users.find(u => u.id === otherId) || { username: 'Deleted user' };
    const last = convo.messages.length ? convo.messages[convo.messages.length - 1] : null;
    const unread = convo.messages.filter(m => m.toId === currentUser.id && !m.read).length;

    const item = document.createElement('div');
    item.className = 'conversation-item';
    item.onclick = () => openConversation(convo.id);
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

function openConversation(convoId) {
  const chatArea = document.getElementById('chatArea');
  if (!chatArea) return;
  const convo = conversations.find(c => c.id === convoId);
  if (!convo) return;
  if (!currentUser) { alert('Please login'); showPage('auth'); return; }

  const otherId = convo.participants.find(id => id !== currentUser.id);
  const other = users.find(u => u.id === otherId) || { username: 'Deleted user' };

  // Mark messages to current user as read
  convo.messages.forEach(m => { if (m.toId === currentUser.id) m.read = true; });
  saveConversations();
  renderConversationsList();

  // Build chat UI
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
  // render messages
  convo.messages.forEach(m => {
    const el = document.createElement('div');
    el.className = 'msg ' + (m.fromId === currentUser.id ? 'me' : 'them');
    el.innerHTML = `<div>${escapeHtml(m.text)}</div><div class="msg-meta">${m.fromId === currentUser.id ? 'You' : escapeHtml(other.username)} • ${formatTime(m.timestamp)}</div>`;
    chatMessages.appendChild(el);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Send handler
  const input = document.getElementById('chatMessageInput');
  const btn = document.getElementById('chatSendBtn');
  btn.onclick = () => {
    const text = (input.value || '').trim();
    if (!text) return;
    addMessageToConversation(convo.id, currentUser.id, otherId, text);
    // refresh conversation view
    openConversation(convo.id);
    input.value = '';
  };
  input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); btn.click(); } };
}
// ======= Integration book -> messages + badge + initial render =======
function contactOwner(bookId) {
  if (!currentUser) { alert('Please login to contact owner'); showPage('auth'); return; }
  const book = books.find(b => b.id === bookId);
  if (!book) { alert('Book not found'); return; }
  if (book.ownerId === currentUser.id) { alert('This is your book'); return; }

  // create or reuse conversation between currentUser and owner
  const convo = getOrCreateConversation(currentUser.id, book.ownerId, { bookId: book.id, title: book.title });
  convo.meta = Object.assign(convo.meta || {}, { bookId: book.id, title: book.title });
  saveConversations();

  // initial intro message
  const intro = `Hi ${book.owner}, I'm interested in your book "${book.title}". Are you available to discuss?`;
  addMessageToConversation(convo.id, currentUser.id, book.ownerId, intro);

  // navigate to messages and open that convo
  showPage('messages');
  renderConversationsList();
  openConversation(convo.id);
}

// updates unread count in nav (call often after changes)
function updateMessagesNavBadge() {
  const nav = document.getElementById('messagesNav');
  if (!nav) return;
  if (!currentUser) { nav.innerHTML = 'Messages'; return; }
  const totalUnread = conversations.reduce((sum, c) =>
    sum + c.messages.filter(m => m.toId === currentUser.id && !m.read).length
  , 0);
  nav.innerHTML = totalUnread > 0
    ? `Messages <span class="unread-badge" style="margin-left:6px;vertical-align:middle">${totalUnread}</span>`
    : 'Messages';
}

// small helper to ensure conversation list + badge are rendered (call on load or after modifications)
function initMessagesRendering() {
  renderConversationsList && renderConversationsList();
  updateMessagesNavBadge && updateMessagesNavBadge();
}
// call this once after script load / after login
initMessagesRendering();
