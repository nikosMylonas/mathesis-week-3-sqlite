import { sequelize, Book, Author, Editor, User, BookUser } from '../models/models.mjs';

Author.hasMany(Book);
Book.belongsTo(Author);
Editor.hasMany(Book);
Book.belongsTo(Editor);
Book.belongsToMany(User, { through: BookUser });
User.belongsToMany(Book, { through: BookUser });

await sequelize.sync();

class BookList {
    myBooks = [];
    constructor(username) {
        if (username === undefined) {
            throw new Error('Ο χρήστης δεν έχει οριστεί!');
        }
        this.username = username;
    }

    async loadBooks() {
        try {
            const books = await Book.findAll({
                include: [Author, Editor,
                    {
                        model: User,
                        where: { name: this.username }
                    }],
                raw: true
            });
            this.myBooks = books.map(book => {
                return (
                    {
                        bookId: book.id,
                        bookTitle: book.title,
                        year: book.year,
                        authorName: book['Author.name'],
                        editor: book['Editor.name']
                    }
                );
            });
            // console.log('loading...', this.myBooks);
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async addBookFn(newBook) {
        try {
            await this.findOrAddUser(); // Add user if not exists. In real apps you must confirm that the user exists in the db.
            const [author, author_result] = await Author.findOrCreate({ where: { name: newBook.author } });
            const [editor, editor_result] = await Editor.findOrCreate({ where: { name: newBook.editor } });
            const [book, book_result] = await Book.findOrCreate({ where: { title: newBook.title, year: newBook.year } });
            if (book_result === true) {
                await book.setAuthor(author);
                await book.setEditor(editor);
            }
            await this.user.addBook(book)
        } catch (error) {
            console.log(error);
            throw error;
        }

    }

    async deleteBook(id) {
        try {
            await this.findOrAddUser();
            await this.findBookById(id, false);
            // Now the object bookToQuery is available to the deleteBook method:
            const bookToRemove = this.bookToQuery;
            // console.log('bookToRemove', bookToRemove);
            // IMPORTANT: The helper method removeUser() works here BECAUSE the object bookToQuery is created with the flag rawFlag set to false!
            await bookToRemove.removeUser(this.user); // Unties the user in question from this particular book.
            // Return the count of tied having this book, using the helper method countUsers() - rawFlag set to false!
            const numberOfUsers = await bookToRemove.countUsers();
            // console.log('Number of users:', numberOfUsers, 'Book ID:', id);
            if (numberOfUsers === 0) { // No user is tied to this book! Delete book from Books.
                await Book.destroy({ where: { id } });
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    /* This method is used by Deleted Book page to fetch the data of the book just deleted by the user. Since
     * the book can have been deleted entirely, this method MUST be called BEFORE the deleteBook method. */
    async findBookById(id, rawFlag) {
        try {
            const bookToQuery = await Book.findOne({ where: { id }, include: [Author, Editor], raw: rawFlag });
            // console.log('Book To Query:', bookToQuery);
            this.bookToQuery = bookToQuery;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async checkBookUserIfExists(title, authorName) {
        try {
            const book = await Book.findOne({
                where: { title },
                include: {
                    model: Author,
                    where: { name: authorName }
                }
            });
            // console.log('Book Check:', book);
            if (book) {
                const bookUser = await BookUser.findOne({ where: { BookId: book.id, UserName: this.username } });
                this.bookUser = bookUser;
            } else {
                this.bookUser = null;

            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async findOrAddUser() {
        if (this.user === undefined) {
            try {
                const [user, user_result] = await User.findOrCreate({ where: { name: this.username } });
                this.user = user;
                // console.log('Selected User:', this.user);
            } catch (error) {
                console.log(error);
                throw error;
            }
        }
    }

}

export { BookList };



