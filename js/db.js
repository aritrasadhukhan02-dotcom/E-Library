const DB_KEYS = {
    USERS: 'elib_users',
    BOOKS: 'elib_books',
    TRANSACTIONS: 'elib_transactions',
    CURRENT_USER: 'elib_current_user'
};

const DB = {
    init: () => {
        if (!localStorage.getItem(DB_KEYS.USERS)) {
            // Add a default admin
            localStorage.setItem(DB_KEYS.USERS, JSON.stringify([{
                id: 'admin_1',
                name: 'System Admin',
                email: 'admin@elibrary.com',
                password: 'admin', // For demo purposes only
            }]));
        }
        const defaultBooks = [
            { id: 'ind1', title: 'The Guide', author: 'R.K. Narayan', category: 'Fiction', quantity: 5, cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400', description: 'A classic novel following the life of a tour guide who transforms into a spiritual leader in the fictional town of Malgudi.' },
            { id: 'ind2', title: 'Midnight\'s Children', author: 'Salman Rushdie', category: 'Magical Realism', quantity: 3, cover: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400', description: 'The story of India\'s transition from British colonialism to independence, told through dazzling magical realism.' },
            { id: 'ind3', title: 'The God of Small Things', author: 'Arundhati Roy', category: 'Fiction', quantity: 4, cover: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=400', description: 'A tragic, beautifully lush narrative charting the childhood experiences of twin siblings in Ayemenem, Kerala.' },
            { id: 'ind4', title: 'A Fine Balance', author: 'Rohinton Mistry', category: 'Historical Fiction', quantity: 2, cover: 'images/fine_balance.png', description: 'A sprawling and deeply moving epic connecting four characters brought together during the 1975 Emergency in India.' },
            { id: 'ind5', title: 'Malgudi Days', author: 'R.K. Narayan', category: 'Short Stories', quantity: 6, cover: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400', description: 'A heartwarming collection of timeless short stories depicting ordinary life in South India.' },
            { id: 'ind6', title: 'The White Tiger', author: 'Aravind Adiga', category: 'Fiction', quantity: 5, cover: 'images/white_tiger.png', description: 'A darkly comic and fiercely satirical account of a village boy\'s ruthless journey to entrepreneurial success in modern India.' },
            { id: 'ind7', title: 'Train to Pakistan', author: 'Khushwant Singh', category: 'Historical Fiction', quantity: 4, cover: 'images/train_to_pakistan.png', description: 'A harrowing but essential novel capturing the immense human tragedy surrounding the 1947 Partition of India.' },
            { id: 'ind8', title: 'The Palace of Illusions', author: 'Chitra Banerjee Divakaruni', category: 'Mythology', quantity: 7, cover: 'images/palace_of_illusions.png', description: 'A mesmerizing retelling of the great Indian epic, the Mahabharata, from the powerful perspective of Panchaali (Draupadi).' }
        ];

        // Database reset logic to clean up old featured books
        if (localStorage.getItem(DB_KEYS.BOOKS)) {
            let existingStr = localStorage.getItem(DB_KEYS.BOOKS);
            if (existingStr.includes('The Great Gatsby') && existingStr.includes('b1')) {
                localStorage.removeItem(DB_KEYS.BOOKS); // Force migration to newly requested Indian books
            }
        }

        if (!localStorage.getItem(DB_KEYS.BOOKS)) {
            localStorage.setItem(DB_KEYS.BOOKS, JSON.stringify(defaultBooks));
        } else {
            let currentBooks = JSON.parse(localStorage.getItem(DB_KEYS.BOOKS));
            let added = false;
            defaultBooks.forEach(dbBook => {
                let existing = currentBooks.find(b => b.id === dbBook.id);
                if(!existing) {
                    currentBooks.push(dbBook);
                    added = true;
                } else {
                    if (!existing.description) {
                        existing.description = dbBook.description;
                        added = true;
                    }
                    if (existing.cover !== dbBook.cover) {
                        existing.cover = dbBook.cover;
                        added = true;
                    }
                }
            });
            if(added) localStorage.setItem(DB_KEYS.BOOKS, JSON.stringify(currentBooks));
        }
        if (!localStorage.getItem(DB_KEYS.TRANSACTIONS)) {
            localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify([]));
        }
    },
    
    getUsers: () => JSON.parse(localStorage.getItem(DB_KEYS.USERS)),
    getBooks: () => JSON.parse(localStorage.getItem(DB_KEYS.BOOKS)),
    getTransactions: () => JSON.parse(localStorage.getItem(DB_KEYS.TRANSACTIONS)),
    
    saveUsers: (users) => localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users)),
    saveBooks: (books) => localStorage.setItem(DB_KEYS.BOOKS, JSON.stringify(books)),
    saveTransactions: (txs) => localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(txs)),
    
    getCurrentUser: () => JSON.parse(localStorage.getItem(DB_KEYS.CURRENT_USER) || 'null'),
    setCurrentUser: (user) => localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user)),
    logout: () => localStorage.removeItem(DB_KEYS.CURRENT_USER),

    // Helpers
    addBook: (book) => {
        const books = DB.getBooks();
        book.id = 'b_' + Date.now();
        books.push(book);
        DB.saveBooks(books);
    },
    updateBookQuantity: (bookId, delta) => {
        const books = DB.getBooks();
        const book = books.find(b => b.id === bookId);
        if (book) {
            book.quantity += parseInt(delta);
            DB.saveBooks(books);
            return true;
        }
        return false;
    },
    deleteBook: (bookId) => {
      let books = DB.getBooks();
      books = books.filter(b => b.id !== bookId);
      DB.saveBooks(books);
    },
    authenticate: (email, password) => {
        const users = DB.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            DB.setCurrentUser({ id: user.id, name: user.name, role: user.role, email: user.email });
            return true;
        }
        return false;
    },
    addUser: (user) => {
        const users = DB.getUsers();
        if(users.find(u => u.email === user.email)) return false; // Email exists
        user.id = 'u_' + Date.now();
        user.role = 'user'; // Default role
        users.push(user);
        DB.saveUsers(users);
        return true;
    },
    issueBook: (userId, bookId) => {
        const books = DB.getBooks();
        const book = books.find(b => b.id === bookId);
        if (book && book.quantity > 0) {
            book.quantity -= 1;
            DB.saveBooks(books);
            
            const txs = DB.getTransactions();
            txs.push({
                id: 'tx_' + Date.now(),
                userId,
                bookId,
                issueDate: new Date().toISOString(),
                returnDate: null,
                status: 'issued'
            });
            DB.saveTransactions(txs);
            return true;
        }
        return false;
    },
    returnBook: (txId) => {
        const txs = DB.getTransactions();
        const tx = txs.find(t => t.id === txId);
        if (tx && tx.status === 'issued') {
            tx.status = 'returned';
            tx.returnDate = new Date().toISOString();
            DB.saveTransactions(txs);
            DB.updateBookQuantity(tx.bookId, 1);
            return true;
        }
        return false;
    }
};

DB.init();
