document.addEventListener('DOMContentLoaded', () => {
    // Shared Navbar Updates
    const currentUser = DB.getCurrentUser();
    const navLinks = document.getElementById('nav-links');
    if (navLinks) {
        if (!currentUser) {
            navLinks.innerHTML = `
                <a href="index.html">Home</a>
                <a href="auth.html" class="btn btn-primary">Sign In</a>
            `;
        } else {
            navLinks.innerHTML = `
                <a href="index.html">Catalog</a>
                <a href="${currentUser.role === 'admin' ? 'admin.html' : 'user-dashboard.html'}">Dashboard</a>
                <a href="#" id="logout-btn" class="btn btn-outline">Logout</a>
            `;
            document.getElementById('logout-btn').addEventListener('click', (e) => {
                e.preventDefault();
                DB.logout();
                window.location.href = 'index.html';
            });
        }
    }

    // Page Specific Logic based on body ID
    const pageId = document.body.id;

    if (pageId === 'auth-page') {
        if(currentUser) { window.location.href = 'index.html'; return; } // Redirect if logged in

        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const toggleBtn = document.getElementById('toggle-auth');
        const formTitle = document.getElementById('form-title');

        let isLogin = true;

        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            isLogin = !isLogin;
            loginForm.classList.toggle('hidden');
            registerForm.classList.toggle('hidden');
            formTitle.textContent = isLogin ? 'Welcome Back' : 'Create Account';
            toggleBtn.textContent = isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in';
        });

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = e.target.email.value;
            const password = e.target.password.value;
            if (DB.authenticate(email, password)) {
                const user = DB.getCurrentUser();
                window.location.href = user.role === 'admin' ? 'admin.html' : 'user-dashboard.html';
            } else {
                alert('Invalid email or password');
            }
        });

        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = e.target.name.value;
            const email = e.target.email.value;
            const password = e.target.password.value;
            if (DB.addUser({ name, email, password })) {
                alert('Registration successful! Please login.');
                toggleBtn.click(); // Switch to login form
            } else {
                alert('Email already exists. Try logging in.');
            }
        });
    }

    if (pageId === 'admin-page') {
        if (!currentUser || currentUser.role !== 'admin') {
            window.location.href = 'index.html'; // Protect route
            return;
        }
        
        const addBookBtn = document.getElementById('tab-add-book');
        const viewTxsBtn = document.getElementById('tab-view-txs');
        const addBookSection = document.getElementById('add-book-section');
        const viewTxsSection = document.getElementById('view-txs-section');
        
        // Tab switching logic
        addBookBtn.addEventListener('click', () => {
            addBookSection.classList.remove('hidden');
            viewTxsSection.classList.add('hidden');
            addBookBtn.classList.replace('btn-outline', 'btn-primary');
            viewTxsBtn.classList.replace('btn-primary', 'btn-outline');
        });

        viewTxsBtn.addEventListener('click', () => {
            viewTxsSection.classList.remove('hidden');
            addBookSection.classList.add('hidden');
            viewTxsBtn.classList.replace('btn-outline', 'btn-primary');
            addBookBtn.classList.replace('btn-primary', 'btn-outline');
            renderTransactionsAdmin();
        });

        // Add Book Form Handler
        const addBookForm = document.getElementById('add-book-form');
        addBookForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newBook = {
                title: e.target.title.value,
                author: e.target.author.value,
                category: e.target.category.value,
                quantity: parseInt(e.target.quantity.value),
                cover: e.target.cover.value || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'
            };
            DB.addBook(newBook);
            alert('Book added to inventory!');
            addBookForm.reset();
            renderAdminInventory(); // Refresh table view
        });

        function renderAdminInventory() {
            const tableBody = document.getElementById('inventory-table-body');
            tableBody.innerHTML = '';
            const books = DB.getBooks();
            books.forEach((book, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td><strong>${book.title}</strong><br><small>${book.author}</small></td>
                    <td>${book.category}</td>
                    <td><b>${book.quantity}</b></td>
                    <td>
                        <button class="btn btn-danger btn-sm" style="padding: 0.4rem 0.8rem" onclick="deleteBook('${book.id}')">Remove</button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        }
        
        window.deleteBook = (id) => {
            if(confirm("Are you sure you want to completely remove this book from inventory?")) {
                DB.deleteBook(id);
                renderAdminInventory();
            }
        };

        function renderTransactionsAdmin() {
            const tableBody = document.getElementById('tx-table-body');
            tableBody.innerHTML = '';
            const txs = DB.getTransactions();
            const users = DB.getUsers();
            
            // Need a fresh pull of all books in case they were deleted but still in tx history,
            // we will handle unknown books gracefully.
            const rawBooksStr = localStorage.getItem(DB_KEYS.BOOKS);
            const books = rawBooksStr ? JSON.parse(rawBooksStr) : [];

            txs.forEach(tx => {
                const user = users.find(u => u.id === tx.userId);
                const book = books.find(b => b.id === tx.bookId);
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${user ? user.name : 'Unknown User'}</td>
                    <td>${book ? book.title : 'Deleted Book'}</td>
                    <td>${new Date(tx.issueDate).toLocaleDateString()}</td>
                    <td><span class="status-badge status-${tx.status}">${tx.status.toUpperCase()}</span></td>
                    <td>
                        ${tx.status === 'issued' ? `<button class="btn btn-outline btn-sm" style="padding:0.4rem 0.8rem; border-color:var(--success); color:var(--success)" onclick="returnBook('${tx.id}')">Verify Return</button>` : tx.returnDate ? new Date(tx.returnDate).toLocaleDateString() : '-'}
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        }
        
        window.returnBook = (id) => {
           if(confirm("Confirm user has returned the book?")) {
               if(DB.returnBook(id)){
                   alert("Book successfully returned to inventory.");
                   renderTransactionsAdmin();
                   renderAdminInventory();
               }
           }
        };

        renderAdminInventory(); // Initialize inventory on load
    }

    if (pageId === 'user-page' || pageId === 'index-page') {
        const catalogContainer = document.getElementById('catalog');
        
        function renderCatalog() {
            if(!catalogContainer) return;
            catalogContainer.innerHTML = '';
            const books = DB.getBooks();
            
            books.forEach(book => {
                const isAvailable = book.quantity > 0;
                const card = document.createElement('div');
                card.className = 'book-card';
                card.innerHTML = `
                    <img src="${book.cover}" alt="${book.title}" class="book-cover" onerror="this.src='https://via.placeholder.com/400x600/1e293b/6366f1?text=Book+Cover'">
                    <div class="book-info">
                        <h3 class="book-title">${book.title}</h3>
                        <div class="book-author">By ${book.author}</div>
                        ${book.description ? `<div class="book-description">${book.description}</div>` : ''}
                        <div class="book-meta">
                            <span class="book-badge">${book.category}</span>
                            <span>Stock: <strong>${book.quantity}</strong></span>
                        </div>
                        <button class="btn ${isAvailable ? 'btn-primary' : 'btn-outline'}" 
                            onclick="handleBorrowClick('${book.id}')" 
                            ${!isAvailable ? 'disabled' : ''} 
                            style="width: 100%; margin-top: auto;">
                            ${isAvailable ? 'Borrow Book' : 'Out of Stock'}
                        </button>
                    </div>
                `;
                catalogContainer.appendChild(card);
            });
        }
        
        renderCatalog();

        window.handleBorrowClick = (bookId) => {
            if (!currentUser) {
                alert("Please log in to borrow books.");
                window.location.href = 'auth.html';
                return;
            }
            if (currentUser.role !== 'user') {
                alert("Only standard library members can borrow books.");
                return;
            }
            
            if(confirm("Do you want to check out this book?")) {
                if(DB.issueBook(currentUser.id, bookId)) {
                    alert("Book checked out successfully! Enjoy your reading.");
                    renderCatalog();
                    if(pageId === 'user-page') renderUserHistory();
                } else {
                    alert("Sorry, an error occurred or the book went out of stock.");
                }
            }
        };

        if (pageId === 'user-page') {
            if (!currentUser || currentUser.role !== 'user') {
                window.location.href = 'index.html'; 
                return;
            }
            
            document.getElementById('user-welcome-name').textContent = currentUser.name.split(' ')[0];

            window.renderUserHistory = function() {
                const historyBody = document.getElementById('history-table-body');
                if(!historyBody) return;
                historyBody.innerHTML = '';
                const txs = DB.getTransactions().filter(t => t.userId === currentUser.id);
                // Get fresh copy including potential deleted ones since we saved array locally
                const rawBooksStr = localStorage.getItem(DB_KEYS.BOOKS);
                const books = rawBooksStr ? JSON.parse(rawBooksStr) : [];

                if (txs.length === 0) {
                    historyBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">You haven\'t borrowed any books yet.</td></tr>';
                    return;
                }

                txs.forEach(tx => {
                    const book = books.find(b => b.id === tx.bookId);
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${book ? book.title : 'Deleted Title'}</strong></td>
                        <td>${new Date(tx.issueDate).toLocaleDateString()}</td>
                        <td><span class="status-badge status-${tx.status}">${tx.status.toUpperCase()}</span></td>
                        <td>${tx.returnDate ? new Date(tx.returnDate).toLocaleDateString() : 'Pending'}</td>
                    `;
                    historyBody.appendChild(tr);
                });
            }
            renderUserHistory();
        }
    }
});
