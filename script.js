// =====================
// DATA STORAGE (LocalStorage)
// =====================

let users = JSON.parse(localStorage.getItem('users')) || [];
let books = JSON.parse(localStorage.getItem('books')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let conversations = JSON.parse(localStorage.getItem('conversations')) || [];

// Sample demo data (only if empty)
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
        { id: 2, title: 'Sapiens', author: 'Yuval Noah Harari', category: 'non-fiction', description: 'A brief history of humankind', condition: 'Good', owner: 'jane_smith', ownerId: 2 }
    ];
    localStorage.setItem('books', JSON.stringify(books));
}
if (conversations.length === 0) {
    // start empty
    localStorage.setItem('conversations', JSON.stringify(conversations));
}

// Helpers to persist
function saveUsers() { localStorage.setItem('users', JSON.stringify(users)); }
function saveBooks() { localStorage.setItem('books', JSON.stringify(books)); }
function saveCurrentUser() { localStorage.setItem('currentUser', JSON.stringify(currentUser)); }
function saveConversations() { localStorage.setItem('conversations', JSON.stringify(conversations)); }

// =====================
// AUTH TABS SWITCHING
// =====================

function switchAuthTab(tab) {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const tabBtns = document.querySelectorAll('.auth-tab-btn');

    if (loginTab) loginTab.classList.remove('active');
    if (registerTab) registerTab.classList.remove('active');
    tabBtns.forEach(btn => btn.classList.remove('active'));

    if (tab === 'login') {
        if (loginTab) loginTab.classList.add('active');
        if (tabBtns[0]) tabBtns[0].classList.add('active');
    } else {
        if (registerTab) registerTab.classList.add('active');
        if (tabBtns[1]) tabBtns[1].classList.add('active');
    }
}

// =====================
// PAGE NAVIGATION
// =====================

function showPage(pageId) {
    // If not logged in and page is protected, redirect to auth
    const protectedPages = ['home', 'books', 'profile', 'addBook', 'messages'];
    if (!currentUser && protectedPages.includes(pageId)) {
        pageId = 'auth';
    }

    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));

    const selected = document.getElementById(pageId);
    if (selected) selected.classList.add('active');

    updateNavigation();

    // Load dynamic content
    if (pageId === 'books') displayBooks();
    if (pageId === 'profile') loadProfileData();
    if (pageId === 'messages') {
        renderConversationsList();
        // show placeholder if nothing selected
        const chatArea = document.getElementById('chatArea');
        if (chatArea && chatArea.innerHTML.trim() === '') {
            chatArea.innerHTML = '<div class="empty-state"><p>Sélectionnez une conversation pour commencer</p></div>';
        }
    }
}

function updateNavigation() {
    const navbar = document.getElementById('navbar');
    if (navbar) {
        navbar.style.display = currentUser ? 'block' : 'none';
    }
    updateMessagesNavBadge();
}

// =====================
// INITIALIZATION
// =====================

document.addEventListener('DOMContentLoaded', function () {
    // Show auth or home depending on login
    if (currentUser) showPage('home');
    else showPage('auth');

    updateNavigation();

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const username = (document.getElementById('regUsername')?.value || '').trim();
            const email = (document.getElementById('regEmail')?.value || '').trim();
            const password = (document.getElementById('regPassword')?.value || '');
            const confirmPassword = (document.getElementById('regConfirmPassword')?.value || '');

            if (username.length < 3) { alert('Le nom d\'utilisateur doit contenir au moins 3 caractères'); return; }
            if (!email.includes('@')) { alert('Entrez une adresse email valide'); return; }
            if (password.length < 6) { alert('Le mot de passe doit contenir au moins 6 caractères'); return; }
            if (password !== confirmPassword) { alert('Les mots de passe ne correspondent pas'); return; }
            if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) { alert('Nom d\'utilisateur déjà utilisé'); return; }

            const newUser = {
                id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
                username,
                email,
                password
            };
            users.push(newUser);
            saveUsers();
            alert('Inscription réussie. Connectez-vous maintenant.');
            registerForm.reset();
            switchAuthTab('login');
        });
    }

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const username = (document.getElementById('loginUsername')?.value || '').trim();
            const password = (document.getElementById('loginPassword')?.value || '');

            const user = users.find(u => u.username === username && u.password === password);
            if (user) {
                currentUser = user;
                saveCurrentUser();
                alert(`Bienvenue ${user.username} !`);
                loginForm.reset();
                updateNavigation();
                // ensure messages list and badge updated
                renderConversationsList();
                updateMessagesNavBadge();
                showPage('home');
            } else {
                alert('Nom d\'utilisateur ou mot de passe invalide');
            }
        });
    }

    // Add book form
    const addBookForm = document.getElementById('addBookForm');
    if (addBookForm) {
        addBookForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!currentUser) { alert('Veuillez vous connecter pour ajouter un livre'); showPage('auth'); return; }
            const title = (document.getElementById('bookTitle')?.value || '').trim();
            const author = (document.getElementById('bookAuthor')?.value || '').trim();
            const category = (document.getElementById('bookCategory')?.value || '').trim();
            const description = (document.getElementById('bookDescription')?.value || '').trim();
            const condition = (document.getElementById('bookCondition')?.value || '').trim();

            if (!title || !author || !category) { alert('Remplissez les champs requis'); return; }

            const newBook = {
                id: books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1,
                title,
                author,
                category,
                description: description || 'Pas de description',
                condition: condition || 'Non spécifié',
                owner: currentUser.username,
                ownerId: currentUser.id
            };
            books.push(newBook);
            saveBooks();
            alert('Livre ajouté avec succès');
            addBookForm.reset();
            showPage('books');
        });
    }

    // initial render for messages nav
    renderConversationsList();
    updateMessagesNavBadge();
});

// =====================
// LOGOUT
// =====================

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateNavigation();
    alert('Déconnecté');
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
        booksList.innerHTML = '<div class="empty-state"><p>Aucun livre disponible pour le moment.</p></div>';
        return;
    }

    books.forEach(book => {
        const owner = users.find(u => u.id === book.ownerId) || { username: book.owner || 'Inconnu' };
        const card = document.createElement('div');
        card.className = 'book-card';
        card.innerHTML = `
            <h3>${escapeHtml(book.title)}</h3>
            <p><strong>Auteur:</strong> ${escapeHtml(book.author)}</p>
            <p><strong>Catégorie:</strong> <span class="badge">${escapeHtml(book.category)}</span></p>
            <p><strong>Description:</strong> ${escapeHtml(book.description)}</p>
            <p><strong>Etat:</strong> ${escapeHtml(book.condition)}</p>
            <p class="book-owner">📖 Listé par: ${escapeHtml(owner.username)}</p>
            <div class="book-actions"></div>
        `;
        const actions = card.querySelector('.book-actions');

        if (currentUser && currentUser.id === book.ownerId) {
            const del = document.createElement('button');
            del.className = 'delete-btn';
            del.textContent = 'Supprimer';
            del.onclick = () => {
                if (confirm('Supprimer ce livre ?')) {
                    deleteBook(book.id);
                }
            };
            actions.appendChild(del);
        } else {
            const contact = document.createElement('button');
            contact.className = 'btn btn-secondary';
            contact.textContent = 'Contacter le propriétaire';
            contact.onclick = () => contactOwner(book.id);
            actions.appendChild(contact);
        }

        booksList.appendChild(card);
    });
}

function filterBooks() {
    const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const category = (document.getElementById('categoryFilter')?.value || '').toLowerCase();
    const booksList = document.getElementById('booksList');
    if (!booksList) return;

    const cards = booksList.querySelectorAll('.book-card');
    cards.forEach(card => {
        const title = (card.querySelector('h3')?.textContent || '').toLowerCase();
        const text = card.textContent.toLowerCase();
        const cat = (card.querySelector('.badge')?.textContent || '').toLowerCase();

        const matchesSearch = title.includes(search) || text.includes(search);
        const matchesCategory = !category || cat === category;

        card.style.display = (matchesSearch && matchesCategory) ? 'block' : 'none';
    });
}

function deleteBook(bookId) {
    books = books.filter(b => b.id !== bookId);
    saveBooks();
    displayBooks();
}

// =====================
// PROFILE
// =====================

function loadProfileData() {
    if (!currentUser) { showPage('auth'); return; }
    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profileEmail').textContent = currentUser.email;
    const userBooks = books.filter(b => b.ownerId === currentUser.id);
    document.getElementById('profileBooksCount').textContent = userBooks.length;
    displayUserBooks(userBooks);
}

function displayUserBooks(userBooks) {
    const myBooksList = document.getElementById('myBooksList');
    if (!myBooksList) return;
    myBooksList.innerHTML = '';
    if (userBooks.length === 0) {
        myBooksList.innerHTML = '<div class="empty-state"><p>Vous n\'avez pas encore listé de livres. <a href="#" onclick="showPage(\\'addBook\\')">Ajoutez-en un</a></p></div>';
        return;
    }
    userBooks.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.innerHTML = `
            <h3>${escapeHtml(book.title)}</h3>
            <p><strong>Auteur:</strong> ${escapeHtml(book.author)}</p>
            <p><strong>Catégorie:</strong> <span class="badge">${escapeHtml(book.category)}</span></p>
            <p><strong>Description:</strong> ${escapeHtml(book.description)}</p>
            <p><strong>Etat:</strong> ${escapeHtml(book.condition)}</p>
            <div class="book-actions"></div>
        `;
        const actions = card.querySelector('.book-actions');
        const del = document.createElement('button');
        del.className = 'delete-btn';
        del.textContent = 'Supprimer';
        del.onclick = () => {
            if (confirm('Supprimer ce livre ?')) deleteBook(book.id);
        };
        actions.appendChild(del);
        myBooksList.appendChild(card);
    });
}

// =====================
// MESSAGING DATA + HELPERS
// =====================

function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleString();
}

function getOrCreateConversation(userAId, userBId, createMeta = {}) {
    const participants = [userAId, userBId].sort((a, b) => a - b);
    let convo = conversations.find(c => c.participants[0] === participants[0] && c.participants[1] === participants[1]);
    if (!convo) {
        convo = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            participants,
            messages: [],
            meta: createMeta
        };
        conversations.unshift(convo);
        saveConversations();
    } else {
        // ensure meta from createMeta merged if provided
        convo.meta = Object.assign(convo.meta || {}, createMeta);
        saveConversations();
    }
    return convo;
}

function addMessageToConversation(convoId, fromId, toId, text) {
    const convo = conversations.find(c => c.id === convoId);
    if (!convo) return null;
    const msg = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        fromId,
        toId,
        text,
        timestamp: Date.now(),
        read: false
    };
    convo.messages.push(msg);
    // move to top
    conversations = conversations.filter(c => c.id !== convoId);
    conversations.unshift(convo);
    saveConversations();
    updateMessagesNavBadge();
    return msg;
}

// =====================
// MESSAGING UI FUNCTIONS
// =====================

function renderConversationsList() {
    const listEl = document.getElementById('conversationsList');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (!currentUser) {
        listEl.innerHTML = '<p class="empty-state">Connectez-vous pour voir vos conversations</p>';
        updateMessagesNavBadge();
        return;
    }

    const userConvos = conversations.filter(c => c.participants.includes(currentUser.id));
    if (userConvos.length === 0) {
        listEl.innerHTML = '<p class="empty-state">Aucune conversation pour le moment. Contacter un propriétaire pour commencer.</p>';
        updateMessagesNavBadge();
        return;
    }

    userConvos.forEach(convo => {
        const otherId = convo.participants.find(id => id !== currentUser.id);
        const otherUser = users.find(u => u.id === otherId) || { username: 'Utilisateur supprimé' };
        const lastMsg = convo.messages.length > 0 ? convo.messages[convo.messages.length - 1] : null;
        const unreadCount = convo.messages.filter(m => m.toId === currentUser.id && !m.read).length;

        const item = document.createElement('div');
        item.className = 'conversation-item';
        item.onclick = () => openConversation(convo.id);
        item.innerHTML = `
            <div class="conversation-main">
                <div class="conversation-user">${escapeHtml(otherUser.username)}</div>
                <div class="conversation-last">${lastMsg ? escapeHtml(shorten(lastMsg.text, 60)) : 'Démarrer une conversation'}</div>
            </div>
            <div class="conversation-meta">
                <div style="font-size:.75rem;color:#7f8c8d">${lastMsg ? formatTime(lastMsg.timestamp) : ''}</div>
                ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
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
    if (!currentUser) { alert('Veuillez vous connecter'); showPage('auth'); return; }

    const otherId = convo.participants.find(id => id !== currentUser.id);
    const otherUser = users.find(u => u.id === otherId) || { username: 'Utilisateur supprimé' };

    // mark as read for messages to currentUser
    convo.messages.forEach(m => { if (m.toId === currentUser.id) m.read = true; });
    saveConversations();
    renderConversationsList();

    // Build chat UI
    chatArea.innerHTML = `
        <div class="chat-header">
            <div>
                <div style="font-weight:800;color:var(--primary-color)">${escapeHtml(otherUser.username)}</div>
                <div style="font-size:.9rem;color:#7f8c8d">${convo.meta && convo.meta.title ? 'À propos: ' + escapeHtml(convo.meta.title) : ''}</div>
            </div>
            <div style="font-size:.85rem;color:#7f8c8d">${convo.messages.length} message(s)</div>
        </div>
        <div id="chatMessages" class="chat-messages"></div>
        <div class="chat-input">
            <input id="chatMessageInput" type="text" placeholder="Écrire un message..." />
            <button id="chatSendBtn" class="btn btn-primary">Envoyer</button>
        </div>
    `;

    const chatMessagesEl = document.getElementById('chatMessages');
    convo.messages.forEach(m => {
        const msgEl = document.createElement('div');
        msgEl.className = 'msg ' + (m.fromId === currentUser.id ? 'me' : 'them');
        msgEl.innerHTML = `<div>${escapeHtml(m.text)}</div><div class="msg-meta">${m.fromId === currentUser.id ? 'Vous' : escapeHtml(otherUser.username)} • ${formatTime(m.timestamp)}</div>`;
        chatMessagesEl.appendChild(msgEl);
    });
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;

    const input = document.getElementById('chatMessageInput');
    const sendBtn = document.getElementById('chatSendBtn');
    sendBtn.onclick = () => {
        const text = (input.value || '').trim();
        if (!text) return;
        addMessageToConversation(convo.id, currentUser.id, otherId, text);
        openConversation(convo.id); // refresh
    };
    input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); sendBtn.click(); } };
}

// =====================
// INTEGRATION BOOKS <-> MESSAGES
// =====================

function contactOwner(bookId) {
    if (!currentUser) { alert('Veuillez vous connecter pour contacter le propriétaire.'); showPage('auth'); return; }
    const book = books.find(b => b.id === bookId);
    if (!book) { alert('Livre introuvable'); return; }
    if (book.ownerId === currentUser.id) { alert('Ceci est votre livre'); return; }

    const convo = getOrCreateConversation(currentUser.id, book.ownerId, { bookId: book.id, title: book.title });
    // attach meta
    convo.meta = Object.assign(convo.meta || {}, { bookId: book.id, title: book.title });
    saveConversations();

    const intro = `Bonjour ${book.owner}, je suis intéressé(e) par votre livre "${book.title}". Êtes-vous disponible pour en discuter ?`;
    addMessageToConversation(convo.id, currentUser.id, book.ownerId, intro);

        showPage('messages');
    renderConversationsList();
    openConversation(convo.id);
}

function updateMessagesNavBadge() {
    const nav = document.getElementById('messagesNav');
    if (!nav) return;
    if (!currentUser) {
        nav.innerHTML = 'Messages';
        return;
    }
    const totalUnread = conversations.reduce((sum, c) => {
        return sum + c.messages.filter(m => m.toId === currentUser.id && !m.read).length;
    }, 0);
    nav.innerHTML = totalUnread > 0
        ? `Messages <span class="unread-badge" style="margin-left:6px;vertical-align:middle">${totalUnread}</span>`
        : 'Messages';
}

// =====================
// UTIL / MISC
// =====================

function shorten(text, n) {
    if (!text) return '';
    return text.length > n ? text.slice(0, n) + '…' : text;
}

function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe).replace(/[&<>"'`=\/]/g, function (s) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;' })[s];
    });
}

// expose functions to global (so onclick in HTML works)
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
