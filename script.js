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
document.getElementById('registerForm')?.addEventListener('submit', function(e) {
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
    this.reset();
    showPage('login');
});

// Login Form
document.getElementById('login
