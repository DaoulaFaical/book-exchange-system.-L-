// ==================== DATA MODULE ====================
const Data = {
    users: [],
    books: [],
    conversations: [],
    currentUser: null,
    currentConversation: null,
    
    init() {
        // Load data from localStorage
        const storedUsers = localStorage.getItem('book_users');
        const storedBooks = localStorage.getItem('book_books');
        const storedConversations = localStorage.getItem('book_conversations');
        
        this.users = storedUsers ? JSON.parse(storedUsers) : [];
        this.books = storedBooks ? JSON.parse(storedBooks) : [];
        this.conversations = storedConversations ? JSON.parse(storedConversations) : [];
        
        // Add demo users if empty
        if (this.users.length === 0) {
            this.users = [
                { id: 1, username: 'john_doe', email: 'john@example.com', password: '123456' },
                { id: 2, username: 'jane_smith', email: 'jane@example.com', password: '123456' },
                { id: 3, username: 'mike_wilson', email: 'mike@example.com', password: '123456' }
            ];
            this.saveUsers();
        }
        
        // Add demo books if empty
        if (this.books.length === 0) {
            this.books = [
                { id: 1, title: "The Little Prince", author: "Antoine de Saint-Exupéry", category: "fiction", description: "A classic of literature", condition: "Good condition", ownerId: 1, ownerName: "john_doe" },
                { id: 2, title: "Sapiens", author: "Yuval Noah Harari", category: "history", description: "A brief history of humankind", condition: "Like new", ownerId: 2, ownerName: "jane_smith" },
                { id: 3, title: "1984", author: "George Orwell", category: "fiction", description: "Dystopian novel", condition: "Very good", ownerId: 1, ownerName: "john_doe" }
            ];
            this.saveBooks();
        }
    },
    
    saveUsers() {
        localStorage.setItem('book_users', JSON.stringify(this.users));
    },
    
    saveBooks() {
        localStorage.setItem('book_books', JSON.stringify(this.books));
    },
    
    saveConversations() {
        localStorage.setItem('book_conversations', JSON.stringify(this.conversations));
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
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
        
        return d.toLocaleDateString();
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `custom-notification notification-${type}`;
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 80px;
                right: 20px;
                background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'};
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                animation: slideInRight 0.3s ease;
                max-width: 350px;
            ">
                ${this.escapeHtml(message)}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },
    
    validateMessage(message) {
        return message && message.trim().length > 0 && message.length <= 2000;
    }
};

// ==================== AUTH MODULE ====================
const Auth = {
    login(username, password) {
        const user = Data.users.find(u => u.username === username && u.password === password);
        if (user) {
            Data.currentUser = { ...user };
            localStorage.setItem('book_current_user', JSON.stringify(Data.currentUser));
            this.updateUIAfterLogin();
            Helpers.showNotification(`Welcome ${user.username}!`, 'success');
            return true;
        }
        Helpers.showNotification('Invalid username or password', 'error');
        return false;
    },
    
    register(username, email, password, confirmPassword) {
        if (password !== confirmPassword) {
            Helpers.showNotification('Passwords do not match', 'error');
            return false;
        }
        
        if (Data.users.find(u => u.username === username)) {
            Helpers.showNotification('Username already exists', 'error');
            return false;
        }
        
        if (Data.users.find(u => u.email === email)) {
            Helpers.showNotification('Email already registered', 'error');
            return false;
        }
        
        const newUser = {
            id: Date.now(),
            username: username,
            email: email,
            password: password
        };
        
        Data.users.push(newUser);
        Data.saveUsers();
        
        Helpers.showNotification('Registration successful! Please login', 'success');
        return true;
    },
    
    logout() {
        Data.currentUser = null;
        Data.currentConversation = null;
        localStorage.removeItem('book_current_user');
        this.updateUIAfterLogout();
        Helpers.showNotification('Logged out successfully', 'success');
    },
    
    updateUIAfterLogin() {
        document.getElementById('auth').classList.remove('active');
        document.getElementById('navbar').style.display = 'block';
        document.getElementById('home').classList.add('active');
        
        // Update profile
        document.getElementById('profileUsername').textContent = Data.currentUser.username;
        document.getElementById('profileEmail').textContent = Data.currentUser.email;
        
        // Load user's books
        this.loadUserBooks();
        
        // Load conversations
        Notification.updateNotificationBadge();
    },
    
    updateUIAfterLogout() {
        document.getElementById('navbar').style.display = 'none';
        document.getElementById('auth').classList.add('active');
        
        // Hide all other pages
        const pages = ['home', 'books', 'addBook', 'messages', 'profile'];
        pages.forEach(page => {
            document.getElementById(page).classList.remove('active');
        });
        
        // Reset forms
        document.getElementById('loginForm').reset();
        document.getElementById('registerForm').reset();
    },
    
    loadUserBooks() {
        const myBooks = Data.getUserBooks(Data.currentUser.id);
        document.getElementById('profileBooksCount').textContent = myBooks.length;
        
        const container = document.getElementById('myBooksList');
        if (myBooks.length === 0) {
            container.innerHTML = '<p class="empty-state">You don\'t have any books yet</p>';
        } else {
            container.innerHTML = myBooks.map(book => `
                <div class="book-card">
                    <h3>${Helpers.escapeHtml(book.title)}</h3>
                    <p>${Helpers.escapeHtml(book.author)}</p>
                    <p><strong>Category:</strong> ${book.category}</p>
                    <p><strong>Condition:</strong> ${book.condition}</p>
                    <button onclick="Data.deleteBook(${book.id}, ${Data.currentUser.id})" class="delete-btn">
                        Delete
                    </button>
                </div>
            `).join('');
        }
    }
};

// ==================== NOTIFICATION MODULE ====================
const Notification = {
    initRendering() {
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
        
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
                messagesLink.innerHTML = `Messages (${totalUnread})`;
            } else {
                messagesLink.innerHTML = `Messages`;
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
                Helpers.showNotification(`New message from ${this.getOtherUserName(conv)}: ${lastMessage.content.substring(0, 50)}`, 'info');
            }
        });
        
        this.updateNotificationBadge();
    },
    
    getOtherUserName(conversation) {
        const otherUserId = conversation.userId === Data.currentUser.id ? conversation.recipientId : conversation.userId;
        const user = Data.getUserById(otherUserId);
        return user ? user.username : 'User';
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
        const otherUser = Data.getUserById(conversation.userId === Data.currentUser.id ? conversation.recipientId : conversation.userId);
        
        chatArea.innerHTML = `
            <div class="chat-header">
                <h3>${Helpers.escapeHtml(otherUser.username)} - Book: ${Helpers.escapeHtml(conversation.bookTitle)}</h3>
            </div>
            <div class="chat-messages" id="chatMessages">
                ${this.renderMessages(conversation.messages)}
            </div>
            <div class="chat-input">
                <input type="text" id="messageInput" placeholder="Type your message..." onkeypress="if(event.key === 'Enter') Conversation.sendMessage()">
                <button onclick="Conversation.sendMessage()" class="btn btn-primary">Send</button>
            </div>
        `;
        
        // Scroll to bottom
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    },
    
    renderMessages(messages) {
        if (!messages || messages.length === 0) {
            return '<div class="empty-state"><p>No messages yet. Start the conversation!</p></div>';
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
        const content = input.value.trim();
        
        if (!Helpers.validateMessage(content)) {
            Helpers.showNotification('Invalid message (1-2000 characters)', 'error');
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
            Helpers.showNotification('Please login to contact the owner', 'error');
            showPage('auth');
            return;
        }
        
        if (Data.currentUser.id === ownerId) {
            Helpers.showNotification('You cannot contact yourself', 'error');
            return;
        }
        
        const conversation = Data.getOrCreateConversation(Data.currentUser.id, ownerId, bookId, bookTitle);
        this.openConversation(conversation.id);
        showPage('messages');
    }
};

// ==================== BOOKS MODULE ====================
const BooksModule = {
    displayBooks() {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const category = document.getElementById('categoryFilter')?.value || '';
        
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
        
        if (filteredBooks.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No books found</p></div>';
        } else {
            container.innerHTML = filteredBooks.map(book => `
                <div class="book-card">
                    <h3>${Helpers.escapeHtml(book.title)}</h3>
                    <p><strong>Author:</strong> ${Helpers.escapeHtml(book.author)}</p>
                    <p><strong>Category:</strong> ${book.category}</p>
                    <p><strong>Condition:</strong> ${book.condition}</p>
                    <p class="book-owner"><strong>Owner:</strong> ${Helpers.escapeHtml(book.ownerName)}</p>
                    <button onclick="Conversation.startConversation(${book.id}, ${book.ownerId}, '${Helpers.escapeHtml(book.title).replace(/'/g, "\\'")}')" 
                            class="btn btn-primary contact-btn">
                        Contact Owner
                    </button>
                </div>
            `).join('');
        }
    },
    
    addBook(event) {
        event.preventDefault();
        
        if (!Data.currentUser) {
            Helpers.showNotification('Please login to add a book', 'error');
            showPage('auth');
            return;
        }
        
        const book = {
            title: document.getElementById('bookTitle').value,
            author: document.getElementById('bookAuthor').value,
            category: document.getElementById('bookCategory').value,
            description: document.getElementById('bookDescription').value,
            condition: document.getElementById('bookCondition').value,
            ownerId: Data.currentUser.id,
            ownerName: Data.currentUser.username
        };
        
        if (!book.title || !book.author || !book.category) {
            Helpers.showNotification('Please fill all required fields', 'error');
            return;
        }
        
        Data.addBook(book);
        Helpers.showNotification('Book added successfully!', 'success');
        
        // Reset form and navigate to books page
        document.getElementById('addBookForm').reset();
        showPage('books');
        BooksModule.displayBooks();
        Auth.loadUserBooks();
    }
};

// ==================== CONVERSATION LIST MODULE ====================
const ConversationList = {
    displayConversations() {
        if (!Data.currentUser) return;
        
        const conversatconst conversations = Data.getConversationsByUser(Data.currentUser.id);
        const container = document.getElementById('conversationsList');
        
        if (conversations.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No conversations yet</p></div>';
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
                        <div class="conversation-user">${Helpers.escapeHtml(otherUser?.username || 'User')}</div>
                        <div class="conversation-last">
                            ${lastMessage ? Helpers.escapeHtml(lastMessage.content.substring(0, 50)) : 'No messages yet'}
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
        if (!Data.currentConversation) {
            document.getElementById('chatArea').innerHTML = `
                <div class="empty-state">
                    <p>Select a conversation to start messaging</p>
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
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginBtn.classList.add('active');
        registerBtn.classList.remove('active');
    } else {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerBtn.classList.add('active');
        loginBtn.classList.remove('active');
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

// ==================== EVENT LISTENERS ====================
// Login form handler
document.getElementById('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    if (Auth.login(username, password)) {
        showPage('home');
    }
});

// Register form handler
document.getElementById('registerForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    if (Auth.register(username, email, password, confirmPassword)) {
        switchAuthTab('login');
        document.getElementById('registerForm').reset();
    }
});

// Add book form handler
document.getElementById('addBookForm')?.addEventListener('submit', (e) => {
    BooksModule.addBook(e);
});

// ==================== INIT MODULE ====================
const Init = {
    init() {
        // Initialize data
        Data.init();
        
        // Check for existing session
        const storedUser = localStorage.getItem('book_current_user');
        if (storedUser) {
            Data.currentUser = JSON.parse(storedUser);
            Auth.updateUIAfterLogin();
            showPage('home');
        } else {
            showPage('auth');
        }
        
        // Initialize notifications
        Notification.initRendering();
        
        // Set up message polling
        setInterval(() => {
            if (Data.currentUser && document.getElementById('messages').classList.contains('active')) {
                ConversationList.displayConversations();
            }
        }, 3000);
        
        // Load books if on books page
        if (document.getElementById('books').classList.contains('active')) {
            BooksModule.displayBooks();
        }
    }
};

// Start the application
document.addEventListener('DOMContentLoaded', () => {
    Init.init();
});

