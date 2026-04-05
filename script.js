// ==================== DATA MODULE ====================
const Data = {
    users: [],
    books: [],
    conversations: [],
    currentUser: null,
    currentConversation: null,
    
    init() {
        // Load data from localStorage
        const storedUsers = localStorage.getItem('kds_users');
        const storedBooks = localStorage.getItem('kds_books');
        const storedConversations = localStorage.getItem('kds_conversations');
        
        this.users = storedUsers ? JSON.parse(storedUsers) : [];
        this.books = storedBooks ? JSON.parse(storedBooks) : [];
        this.conversations = storedConversations ? JSON.parse(storedConversations) : [];
        
        // Add demo users if empty
        if (this.users.length === 0) {
            this.users = [
                { id: 1, username: 'ahmet_yilmaz', email: 'ahmet@example.com', password: '123456', fullName: 'Ahmet Yılmaz', department: 'İşletme' },
                { id: 2, username: 'ayse_demir', email: 'ayse@example.com', password: '123456', fullName: 'Ayşe Demir', department: 'İktisat' },
                { id: 3, username: 'mehmet_kaya', email: 'mehmet@example.com', password: '123456', fullName: 'Mehmet Kaya', department: 'Yönetim Bilişim Sistemleri' },
                { id: 4, username: 'zeynep_celik', email: 'zeynep@example.com', password: '123456', fullName: 'Zeynep Çelik', department: 'İşletme' }
            ];
            this.saveUsers();
        }
        
        // Add demo books if empty
        if (this.books.length === 0) {
            this.books = [
                { id: 1, title: "Yönetim Bilişim Sistemleri", author: "Kenneth C. Laudon", category: "business", description: "Yönetim Bilişim Sistemleri ders kitabı", condition: "İyi durumda", ownerId: 1, ownerName: "ahmet_yilmaz" },
                { id: 2, title: "İşletme Yönetiminin Temelleri", author: "Stephen P. Robbins", category: "business", description: "İşletme yönetimi temel kavramlar", condition: "Yeni gibi", ownerId: 2, ownerName: "ayse_demir" },
                { id: 3, title: "Mikroekonomi", author: "Gregory Mankiw", category: "economics", description: "Ekonomiye giriş kitabı", condition: "Çok iyi", ownerId: 3, ownerName: "mehmet_kaya" },
                { id: 4, title: "Pazarlama İlkeleri", author: "Philip Kotler", category: "business", description: "Pazarlama temel kavramlar", condition: "İyi", ownerId: 1, ownerName: "ahmet_yilmaz" },
                { id: 5, title: "Veri Tabanı Yönetim Sistemleri", author: "Ramez Elmasri", category: "science", description: "Veritabanı ders kitabı", condition: "Yeni", ownerId: 4, ownerName: "zeynep_celik" }
            ];
            this.saveBooks();
        }
    },
    
    saveUsers() {
        localStorage.setItem('kds_users', JSON.stringify(this.users));
    },
    
    saveBooks() {
        localStorage.setItem('kds_books', JSON.stringify(this.books));
    },
    
    saveConversations() {
        localStorage.setItem('kds_conversations', JSON.stringify(this.conversations));
    },
    
    getBooks() {
        return this.books;
    },
    
    getUserBooks(userId) {
        return this.books.filter(book => book.ownerId === userId);
    },
    
    addBook(book) {
        book.id = Date.now();
        this.books.push(book);
        this.saveBooks();
        return book;
    },
    
    deleteBook(bookId, userId) {
        const bookIndex = this.books.findIndex(b => b.id === bookId && b.ownerId === userId);
        if (bookIndex !== -1) {
            this.books.splice(bookIndex, 1);
            this.saveBooks();
            if (typeof Auth !== 'undefined' && Auth.loadUserBooks) {
                Auth.loadUserBooks();
            }
            if (typeof BooksModule !== 'undefined' && BooksModule.displayBooks) {
                BooksModule.displayBooks();
            }
            Helpers.showNotification('Kitap başarıyla silindi', 'success');
            return true;
        }
        return false;
    },
    
    getUserById(userId) {
        return this.users.find(u => u.id === userId);
    },
    
    getConversationsByUser(userId) {
        return this.conversations.filter(c => c.userId === userId || c.recipientId === userId);
    },
    
    getConversation(conversationId) {
        return this.conversations.find(c => c.id === conversationId);
    },
    
    getOrCreateConversation(userId, recipientId, bookId, bookTitle) {
        let conversation = this.conversations.find(c => 
            ((c.userId === userId && c.recipientId === recipientId) ||
             (c.userId === recipientId && c.recipientId === userId)) &&
            c.bookId === bookId
        );
        
        if (!conversation) {
            conversation = {
                id: Date.now(),
                userId: userId,
                recipientId: recipientId,
                bookId: bookId,
                bookTitle: bookTitle,
                messages: [],
                lastUpdate: new Date().toISOString(),
                unreadCount: 0
            };
            this.conversations.push(conversation);
            this.saveConversations();
        }
        
        return conversation;
    },
    
    addMessage(conversationId, message) {
        const conversation = this.getConversation(conversationId);
        if (conversation) {
            conversation.messages.push(message);
            conversation.lastUpdate = new Date().toISOString();
            if (message.userId !== this.currentUser?.id) {
                conversation.unreadCount = (conversation.unreadCount || 0) + 1;
            }
            this.saveConversations();
            return true;
        }
        return false;
    },
    
    markConversationAsRead(conversationId) {
        const conversation = this.getConversation(conversationId);
        if (conversation) {
            conversation.unreadCount = 0;
            this.saveConversations();
        }
    }
};

// ==================== HELPERS MODULE ====================
const Helpers = {
    formatDate(date) {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        
        if (diff < 60000) return 'Şimdi';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} dakika önce`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} saat önce`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)} gün önce`;
        
        return d.toLocaleDateString('tr-TR');
    },
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        let bgColor = '#3498db';
        if (type === 'error') bgColor = '#e74c3c';
        if (type === 'success') bgColor = '#27ae60';
        if (type === 'warning') bgColor = '#f39c12';
        
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 12px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 350px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },
    
    validateMessage(message) {
        return message && message.trim().length > 0 && message.length <= 2000;
    },
    
    getCategoryTurkish(category) {
        const categories = {
            'fiction': 'Roman',
            'non-fiction': 'Akademik',
            'science': 'Bilim',
            'history': 'Tarih',
            'economics': 'Ekonomi',
            'business': 'İşletme'
        };
        return categories[category] || category;
    }
};

// ==================== AUTH MODULE ====================
const Auth = {
    login(username, password) {
        const user = Data.users.find(u => u.username === username && u.password === password);
        if (user) {
            Data.currentUser = { ...user };
            localStorage.setItem('kds_current_user', JSON.stringify(Data.currentUser));
            this.updateUIAfterLogin();
            Helpers.showNotification(`Hoş geldiniz ${user.username}!`, 'success');
            return true;
        }
        Helpers.showNotification('Kullanıcı adı veya şifre hatalı', 'error');
        return false;
    },
    
    register(username, email, password, confirmPassword) {
        if (password !== confirmPassword) {
            Helpers.showNotification('Şifreler eşleşmiyor', 'error');
            return false;
        }
        
        if (password.length < 4) {
            Helpers.showNotification('Şifre en az 4 karakter olmalıdır', 'error');
            return false;
        }
        
        if (Data.users.find(u => u.username === username)) {
            Helpers.showNotification('Bu kullanıcı adı zaten kullanılıyor', 'error');
            return false;
        }
        
        if (Data.users.find(u => u.email === email)) {
            Helpers.showNotification('Bu e-posta adresi zaten kayıtlı', 'error');
            return false;
        }
        
        const newUser = {
            id: Date.now(),
            username: username,
            email: email,
            password: password,
            fullName: username,
            department: 'İşletme'
        };
        
        Data.users.push(newUser);
        Data.saveUsers();
        
        Helpers.showNotification('Kayıt başarılı! Lütfen giriş yapın', 'success');
        return true;
    },
    
    logout() {
        Data.currentUser = null;
        Data.currentConversation = null;
        localStorage.removeItem('kds_current_user');
        this.updateUIAfterLogout();
        Helpers.showNotification('Başarıyla çıkış yapıldı', 'success');
    },
    
    updateUIAfterLogin() {
        const authPage = document.getElementById('auth');
        const navbar = document.getElementById('navbar');
        const homePage = document.getElementById('home');
        
        if (authPage) authPage.classList.remove('active');
        if (navbar) navbar.style.display = 'block';
        if (homePage) homePage.classList.add('active');
        
        // Update profile
        const profileUsername = document.getElementById('profileUsername');
        const profileEmail = document.getElementById('profileEmail');
        if (profileUsername) profileUsername.textContent = Data.currentUser.username;
        if (profileEmail) profileEmail.textContent = Data.currentUser.email;
        
        // Load user's books
        this.loadUserBooks();
        
        // Update notification badge
        if (typeof Notification !== 'undefined' && Notification.updateNotificationBadge) {
            Notification.updateNotificationBadge();
        }
    },
    
    updateUIAfterLogout() {
        const navbar = document.getElementById('navbar');
        const authPage = document.getElementById('auth');
        
        if (navbar) navbar.style.display = 'none';
        if (authPage) authPage.classList.add('active');
        
        // Hide all other pages
        const pages = ['home', 'books', 'addBook', 'messages', 'profile'];
        pages.forEach(page => {
            const element = document.getElementById(page);
            if (element) element.classList.remove('active');
        });
        
        // Reset forms
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        if (loginForm) loginForm.reset();
        if (registerForm) registerForm.reset();
    },
    
    loadUserBooks() {
        if (!Data.currentUser) return;
        
        const myBooks = Data.getUserBooks(Data.currentUser.id);
        const booksCount = document.getElementById('profileBooksCount');
        const container = document.getElementById('myBooksList');
        
        if (booksCount) booksCount.textContent = myBooks.length;
        
        if (container) {
            if (myBooks.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>Henüz kitabınız bulunmuyor. Kitap eklemek için "Kitap Ekle" sayfasını kullanın.</p></div>';
            } else {
                container.innerHTML = myBooks.map(book => `
                    <div class="book-card">
                        <h3>${Helpers.escapeHtml(book.title)}</h3>
                        <p><strong>Yazar:</strong> ${Helpers.escapeHtml(book.author)}</p>
                        <p><strong>Kategori:</strong> ${Helpers.getCategoryTurkish(book.category)}</p>
                        <p><strong>Durum:</strong> ${Helpers.escapeHtml(book.condition)}</p>
                        <button onclick="Data.deleteBook(${book.id}, ${Data.currentUser.id})" class="delete-btn">
                            Kitabı Sil
                        </button>
                    </div>
                `).join('');
            }
        }
    }
};

// ==================== NOTIFICATION MODULE ====================
const Notification = {
    initRendering() {
        // Check for new messages periodically
        setInterval(() => this.checkNewMessages(), 5000);
    },
    
    updateNotificationBadge() {
        if (!Data.currentUser) return;
        
        const conversations = Data.getConversationsByUser(Data.currentUser.id);
        const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        
        // Update counter in menu
        const messagesLink = document.querySelector('.nav-menu a[onclick*="messages"]');
        if (messagesLink) {
            if (totalUnread > 0) {
                messagesLink.innerHTML = `Mesajlar (${totalUnread})`;
            } else {
                messagesLink.innerHTML = `Mesajlar`;
            }
        }
    },
    
    checkNewMessages() {
        if (!Data.currentUser) return;
        
        const conversations = Data.getConversationsByUser(Data.currentUser.id);
        const unreadConversations = conversations.filter(conv => conv.unreadCount > 0);
        
        unreadConversations.forEach(conv => {
            const lastMessage = conv.messages[conv.messages.length - 1];
            if (lastMessage && lastMessage.userId !== Data.currentUser.id) {
                Helpers.showNotification(`${this.getOtherUserName(conv)} size yeni mesaj gönderdi: ${lastMessage.content.substring(0, 50)}`, 'info');
            }
        });
        
        this.updateNotificationBadge();
    },
    
    getOtherUserName(conversation) {
        const otherUserId = conversation.userId === Data.currentUser.id ? conversation.recipientId : conversation.userId;
        const user = Data.getUserById(otherUserId);
        return user ? user.username : 'Kullanıcı';
    }
};

// ==================== CONVERSATION MODULE ====================
const Conversation = {
    openConversation(conversationId) {
        const conversation = Data.getConversation(conversationId);
        if (!conversation) return;
        
        Data.currentConversation = conversation;
        Data.markConversationAsRead(conversationId);
        Notification.updateNotificationBadge();
        
        this.renderChatArea(conversation);
    },
    
    renderChatArea(conversation) {
        const chatArea = document.getElementById('chatArea');
        if (!chatArea) return;
        
        const otherUser = Data.getUserById(conversation.userId === Data.currentUser.id ? conversation.recipientId : conversation.userId);
        
        chatArea.innerHTML = `
            <div class="chat-header">
                <h3>📖 ${Helpers.escapeHtml(conversation.bookTitle)}</h3>
                <p><strong>${Helpers.escapeHtml(otherUser?.username || 'Kullanıcı')}</strong> ile konuşuyorsunuz</p>
            </div>
            <div class="chat-messages" id="chatMessages">
                ${this.renderMessages(conversation.messages)}
            </div>
            <div class="chat-input">
                <input type="text" id="messageInput" placeholder="Mesajınızı yazın..." onkeypress="if(event.key === 'Enter') Conversation.sendMessage()">
                <button onclick="Conversation.sendMessage()" class="btn btn-primary">Gönder</button>
            </div>
        `;
        
        // Scroll to bottom
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        // Focus on input
        const messageInput = document.getElementById('messageInput');
        if (messageInput) messageInput.focus();
    },
    
    renderMessages(messages) {
        if (!messages || messages.length === 0) {
            return '<div class="empty-state"><p>Henüz mesaj yok. Konuşmayı başlatın!</p></div>';
        }
        
        return messages.map(message => {
            const isOwn = message.userId === Data.currentUser.id;
            return `
                <div class="msg ${isOwn ? 'me' : 'them'}">
                    <div class="msg-content">${Helpers.escapeHtml(message.content)}</div>
                    <div class="msg-meta">${Helpers.formatDate(message.timestamp)}</div>
                </div>
            `;
        }).join('');
    },
    
    sendMessage() {
        const input = document.getElementById('messageInput');
        if (!input) return;
        
        const content = input.value.trim();
        
        if (!Helpers.validateMessage(content)) {
            Helpers.showNotification('Geçersiz mesaj (1-2000 karakter)', 'error');
            return;
        }
        
        const message = {
            id: Date.now(),
            conversationId: Data.currentConversation.id,
            userId: Data.currentUser.id,
            content: content,
            timestamp: new Date().toISOString()
        };
        
        if (Data.addMessage(Data.currentConversation.id, message)) {
            // Update display
            this.renderChatArea(Data.currentConversation);
            input.value = '';
        }
    },
    
    startConversation(bookId, ownerId, bookTitle) {
        if (!Data.currentUser) {
            Helpers.showNotification('Kitap sahibine mesaj göndermek için lütfen giriş yapın', 'error');
            showPage('auth');
            return;
        }
        
        if (Data.currentUser.id === ownerId) {
            Helpers.showNotification('Kendi kitabınız için mesaj gönderemezsiniz', 'error');
            return;
        }
        
        const conversation = Data.getOrCreateConversation(Data.currentUser.id, ownerId, bookId, bookTitle);
        this.openConversation(conversation.id);
        showPage('messages');
        Helpers.showNotification('Konuşma başlatıldı! Mesaj gönderebilirsiniz.', 'success');
    }
};

// ==================== BOOKS MODULE ====================
const BooksModule = {
    displayBooks() {
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const category = categoryFilter?.value || '';
        
        let filteredBooks = Data.getBooks();
        
        if (searchTerm) {
            filteredBooks = filteredBooks.filter(book => 
                book.title.toLowerCase().includes(searchTerm) || 
                book.author.toLowerCase().includes(searchTerm)
            );
        }
        
        if (category) {
            filteredBooks = filteredBooks.filter(book => book.category === category);
        }
        
        const container = document.getElementById('booksList');
        
        if (!container) return;
        
        if (filteredBooks.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Kitap bulunamadı</p></div>';
        } else {
            container.innerHTML = filteredBooks.map(book => `
                <div class="book-card">
                    <h3>${Helpers.escapeHtml(book.title)}</h3>
                    <p><strong>Yazar:</strong> ${Helpers.escapeHtml(book.author)}</p>
                    <p><strong>Kategori:</strong> ${Helpers.getCategoryTurkish(book.category)}</p>
                    <p><strong>Durum:</strong> ${Helpers.escapeHtml(book.condition)}</p>
                    <p class="book-owner"><strong>Kitap Sahibi:</strong> ${Helpers.escapeHtml(book.ownerName)}</p>
                    <button onclick="Conversation.startConversation(${book.id}, ${book.ownerId}, '${Helpers.escapeHtml(book.title).replace(/'/g, "\\'")}')" 
                            class="btn btn-primary contact-btn">
                        📩 Kitap Sahibine Mesaj Gönder
                    </button>
                </div>
            `).join('');
        }
    },
    
    addBook(event) {
        event.preventDefault();
        
        if (!Data.currentUser) {
            Helpers.showNotification('Kitap eklemek için lütfen giriş yapın', 'error');
            showPage('auth');
            return;
        }
        
        const titleInput = document.getElementById('bookTitle');
        const authorInput = document.getElementById('bookAuthor');
        const categorySelect = document.getElementById('bookCategory');
        const descriptionInput = document.getElementById('bookDescription');
        const conditionInput = document.getElementById('bookCondition');
        
        const book = {
            title: titleInput?.value || '',
            author: authorInput?.value || '',
            category: categorySelect?.value || '',
            description: descriptionInput?.value || '',
            condition: conditionInput?.value || '',
            ownerId: Data.currentUser.id,
            ownerName: Data.currentUser.username
        };
        
        if (!book.title || !book.author || !book.category) {
            Helpers.showNotification('Lütfen tüm zorunlu alanları doldurun', 'error');
            return;
        }
        
        Data.addBook(book);
        Helpers.showNotification('Kitap başarıyla eklendi!', 'success');
        
        // Reset form
        if (titleInput) titleInput.value = '';
        if (authorInput) authorInput.value = '';
        if (categorySelect) categorySelect.value = '';
        if (descriptionInput) descriptionInput.value = '';
        if (conditionInput) conditionInput.value = '';
        
        // Navigate to books page
        showPage('books');
        this.displayBooks();
        if (typeof Auth !== 'undefined') Auth.loadUserBooks();
    }
};

// ==================== CONVERSATION LIST MODULE ====================
const ConversationList = {
    displayConversations() {
        if (!Data.currentUser) return;
        
        const conversations = Data.getConversationsByUser(Data.currentUser.id);
        const container = document.getElementById('conversationsList');
        
        if (!container) return;
        
        if (conversations.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Henüz hiç konuşmanız yok. Bir kitaba mesaj göndererek başlayın!</p></div>';
            return;
        }
        
        // Sort by last update (most recent first)
        conversations.sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));
        
        container.innerHTML = conversations.map(conv => {
            const otherUserId = conv.userId === Data.currentUser.id ? conv.recipientId : conv.userId;
            const otherUser = Data.getUserById(otherUserId);
            const lastMessage = conv.messages[conv.messages.length - 1];
            
            return `
                <div class="conversation-item" onclick="Conversation.openConversation(${conv.id})">
                    <div class="conversation-main">
                        <div class="conversation-user">${Helpers.escapeHtml(otherUser?.username || 'Kullanıcı')}</div>
                        <div class="conversation-last">
                            📖 ${Helpers.escapeHtml(conv.bookTitle.substring(0, 30))}
                        </div>
                        <div class="conversation-last">
                            ${lastMessage ? Helpers.escapeHtml(lastMessage.content.substring(0, 40)) : 'Henüz mesaj yok'}
                        </div>
                    </div>
                    <div class="conversation-meta">
                        ${lastMessage ? `<div class="conversation-time">${Helpers.formatDate(lastMessage.timestamp)}</div>` : ''}
                        ${conv.unreadCount > 0 ? `<div class="unread-badge">${conv.unreadCount}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
};

// ==================== PAGE NAVIGATION ====================
function showPage(pageName) {
    // Hide all pages
    const pages = ['auth', 'home', 'books', 'addBook', 'messages', 'profile'];
    pages.forEach(page => {
        const element = document.getElementById(page);
        if (element) element.classList.remove('active');
    });
    
    // Show selected page
    const selectedPage = document.getElementById(pageName);
    if (selectedPage) selectedPage.classList.add('active');
    
    // Update content based on page
    if (pageName === 'books') {
        BooksModule.displayBooks();
    } else if (pageName === 'messages') {
        ConversationList.displayConversations();
        // Clear chat area if no conversation selected
        const chatArea = document.getElementById('chatArea');
        if (chatArea && !Data.currentConversation) {
            chatArea.innerHTML = `
                <div class="empty-state">
                    <p>Mesajlaşmak için bir konuşma seçin</p>
                </div>
            `;
        }
    } else if (pageName === 'profile' && Data.currentUser) {
        Auth.loadUserBooks();
    }
}

// ==================== AUTH TAB SWITCHING ====================
function switchAuthTab(tab) {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginBtn = document.querySelector('.auth-tab-btn:first-child');
    const registerBtn = document.querySelector('.auth-tab-btn:last-child');
    
    if (tab === 'login') {
        if (loginTab) loginTab.classList.add('active');
        if (registerTab) registerTab.classList.remove('active');
        if (loginBtn) loginBtn.classList.add('active');
        if (registerBtn) registerBtn.classList.remove('active');
    } else {
        if (registerTab) registerTab.classList.add('active');
        if (loginTab) loginTab.classList.remove('active');
        if (registerBtn) registerBtn.classList.add('active');
        if (loginBtn) loginBtn.classList.remove('active');
    }
}

// ==================== BOOK FILTERS ====================
function filterBooks() {
    BooksModule.displayBooks();
}

// ==================== LOGOUT FUNCTION ====================
function logout() {
    Auth.logout();
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize data
    Data.init();
    
    // Check for existing session
    const storedUser = localStorage.getItem('kds_current_user');
    if (storedUser) {
        Data.currentUser = JSON.parse(storedUser);
        Auth.updateUIAfterLogin();
        showPage('home');
    } else {
        showPage('auth');
    }
    
    // Initialize notifications
    Notification.initRendering();
    
    // Set up conversation refresh
    setInterval(() => {
        if (Data.currentUser) {
            const messagesPage = document.getElementById('messages');
            if (messagesPage && messagesPage.classList.contains('active')) {
                ConversationList.displayConversations();
            }
            Notification.updateNotificationBadge();
        }
    }, 3000);
});

// ==================== EVENT LISTENERS ====================
// Login form handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername')?.value || '';
        const password = document.getElementById('loginPassword')?.value || '';
        if (Auth.login(username, password)) {
            showPage('home');
        }
    });
}

// Register form handler
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername')?.value || '';
        const email = document.getElementById('regEmail')?.value || '';
        const password = document.getElementById('regPassword')?.value || '';
        const confirmPassword = document.getElementById('regConfirmPassword')?.value || '';
        
        if (Auth.register(username, email, password, confirmPassword)) {
            switchAuthTab('login');
            registerForm.reset();
        }
    });
}

// Add book form handler
const addBookForm = document.getElementById('addBookForm');
if (addBookForm) {
    addBookForm.addEventListener('submit', (e) => {
        BooksModule.addBook(e);
    });
            }
            
