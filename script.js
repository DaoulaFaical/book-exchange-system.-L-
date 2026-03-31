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
// PAGE NAVIGATION
// =====================

function showPage(pageId) {
    // If not logged in and trying to access protected pages, redirect to login
    if (!currentUser && ['books', 'profile', 'addBook'].includes(pageId)) {
        alert('Please login or register first');
        showPage('login');
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
    const navMenu = document.getElementById('navMenu');
    
    if (currentUser) {
        navMenu.style.display = 'flex';
    } else {
        navMenu.style.display = 'none';
    }
}

// =====================
// AUTHENTICATION
// =====================

// Register Form
document.addEventListener('DOMContentLoaded', function() {
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
            showPage('login');
        });
    }

    // Login Form
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
                showPage('books');
                updateNavigation();
            } else {
                alert('Invalid username or password');
            }
        });
    }

    // Add Book Form
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

    // Initialize page
    if (currentUser) {
        showPage('books');
    } else {
        showPage('home');
    }
    updateNavigation();
});

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    alert('You have been logged out');
    showPage('home');
    updateNavigation();
}

// =====================
// BOOKS MANAGEMENT
// =====================

// Display all books
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

// Filter books by search and category
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

// Delete Book
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
        showPage('login');
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
                                     
