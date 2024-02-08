import express from 'express';
import { BookList } from './bookList_lite_seq.mjs';
// import { BookList } from './bookList_db.mjs';

import { body, validationResult } from 'express-validator';
import { pages, currentYear } from '../config/attributes.mjs';

const router = express.Router();

router.use(express.urlencoded({ extended: false }));
/* MIddleware to pass the currentYear property globally. The Current Year is used in footer's copyright. */
router.use((req, res, next) => {
    res.locals.currentYear = currentYear;
    next();
});

router.get('/', (req, res) => {
    res.locals.pageTitle = pages.home.title;
    res.locals.mainId = pages.home.mainId;
    res.locals.homeActive = pages.home.homeActive;
    if (req.session.username) {
        res.locals.username = req.session.username; // Home page when user is authenticated.
    }
    res.render('home');
});

/* 1a. Render the login form */
router.get('/login', (req, res) => {
    res.locals.pageTitle = pages.login.title;
    res.locals.mainId = pages.login.mainId;
    res.locals.loginActive = pages.login.loginActive;
    res.render('login');
});

router.get('/books',
    checkIfAuthenticated,
    showBookList);

router.post('/books',
    body('username') // 1c. Validate username input
        .notEmpty()
        .withMessage('Το πεδίο είναι υποχρεωτικό')
        .isAlphanumeric()
        .withMessage('Επιτρέπονται μόνο αριθμοί και λατινικοί χαρακτήρες')
        .escape()
        .trim(),
    // the following middleware is also a handler function for the user validation
    (req, res, next) => { // 2b. Use the next keyword because now, the middlewere has to continue to the next one.
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            req.session.username = req.body.username; // 1d. Save the username value as a session value
            next();
        } else {
            res.render('login', {
                message: errors.mapped(),
                username: req.body.username
            });
        }
    },
    showBookList)

router.get('/addbookform',
    checkIfAuthenticated,
    (req, res) => {
        res.locals.username = req.session.username;
        res.locals.pageTitle = pages.addForm.title;
        res.locals.mainId = pages.addForm.mainId;
        res.locals.addFormActive = pages.addForm.addFormActive;
        res.render('bookform');
    });

router.post('/doaddbook', // v3.3.2 Edited to include Sequelize functionality
    checkIfAuthenticated,
    body('title')
        .notEmpty()
        .withMessage('Το πεδίο είναι υποχρεωτικό')
        .isLength({ min: 3 })
        .withMessage('Απαιτούνται τουλάχιστον 3 χαρακτήρες')
        .isAlpha('el-GR', { ignore: '\s.,\'1234567890' })
        .withMessage('Επιτρέπονται μόνο ελληνικοί χαρακτήρες'),
    body('author')
        .notEmpty()
        .withMessage('Το πεδίο είναι υποχρεωτικό')
        .isLength({ min: 3 })
        .withMessage('Απαιτούνται τουλάχιστον 3 χαρακτήρες')
        .isAlpha('el-GR', { ignore: '/s.,\'' })
        .withMessage('Επιτρέπονται μόνο ελληνικοί χαρακτήρες'),
    body('editor')
        .notEmpty()
        .withMessage('Το πεδίο είναι υποχρεωτικό')
        .isLength({ min: 2 })
        .withMessage('Απαιτούνται τουλάχιστον 3 χαρακτήρες')
        .isAlpha('el-GR', { ignore: '\s1234567890' }),
    body('year')
        .notEmpty()
        .withMessage('Το πεδίο είναι υποχρεωτικό')
        .isInt()
        .withMessage('Εισάγετε το Ετος σε μορφή YYYY (Από 1990 και μετά)')
        .isLength({ min: 4, max: 4 })
        .withMessage('Εισάγετε το Ετος σε μορφή YYYY (Από 1990 και μετά)')
        .custom(value => {
            if (value < 1990 || value > new Date().getFullYear()) {
                throw new Error('Μη αποδεκτό έτος')
            } else {
                return true;
            }
        }),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            const newBook = {
                author: req.body.author,
                title: req.body.title,
                editor: req.body.editor,
                year: req.body.year
            }
            try {
                const bookList = new BookList(req.session.username); // v3.1.6 Personalized bookList object
                res.locals.username = req.session.username;
                res.locals.title = req.body.title;
                res.locals.author = req.body.author;
                res.locals.editor = req.body.editor;
                res.locals.year = req.body.year;
                res.locals.pageTitle = pages.addedBook.title;
                res.locals.mainId = pages.addedBook.mainId;
                /* v3.3.2 Check if the book provided by the user, already exists. */
                await bookList.checkBookUserIfExists(res.locals.title, res.locals.author);
                let bookUserCheck = true; // v3.3.2 Book already exists
                const bookUserInstance = bookList.bookUser;
                // console.log('BookUser Instance:', bookUserInstance);
                if (bookUserInstance === null) { // v3.3.2 If th book/user don't exist change the value of the check variable to false.
                    bookUserCheck = false;
                }
                res.locals.bookUserCheck = bookUserCheck;
                await bookList.addBookFn(newBook);
                res.render('addedbook');

            } catch (error) {
                next(error);
            }

        } else {
            res.render('bookform', {
                message: errors.mapped(),
                author: req.body.author,
                title: req.body.title,
                editor: req.body.editor,
                year: req.body.year
            });
        }
    });

router.get('/logout',
    checkIfAuthenticated,
    (req, res) => { // 3a. Logout middlewere, destroy session
        req.session.destroy();
        res.redirect('/');
    });

/* Middleware to delete a book. When we turn this to a REST API, we need to replace this middlewere 
to a router.delete() method. */
router.get('/delete/:id', // v3.3.2 Edited to include Sequelize functionality.
    checkIfAuthenticated,
    async (req, res, next) => {
        const id = req.params.id;
        // console.log(`Book to delete: ${id}`);
        try {
            const bookList = new BookList(req.session.username);
            await bookList.findBookById(id, true);
            /* v3.3.2 Save the book to delete to a variable. That way the book-to-be-deleted
            details will be available to be displayed in a message to the user as a confirmation. */
            const bookToDelete = bookList.bookToQuery;
            // console.log('Data send to Delete Page:', bookToDelete);
            await bookList.deleteBook(id);
            /* Pass all book-to-be-deleted details to handlebars */
            res.locals.username = req.session.username;
            res.locals.title = bookToDelete.title;
            res.locals.author = bookToDelete['Author.name'];
            res.locals.editor = bookToDelete['Editor.name'];
            res.locals.year = bookToDelete.year;
            res.locals.pageTitle = pages.deletedBook.title;
            res.locals.mainId = pages.deletedBook.mainId;
            res.render('deletedbook');
            // res.redirect('/books');
        } catch (error) {
            next(error);
        }
    })

router.use((req, res) => {
    res.redirect('/'); // 1b. Redirect any other endpoint to root (3.1.5)
});

// Functions declarations
/* IMPORTANT NOTE!
Ohe key difference between a function definition and its arrow shorthand is that the arrow shorthand cannot
be accessed before initialization (Hoisting concept). -> The showBookList function MUST be defined her using
the function keyword.
*/
async function showBookList(req, res, next) { // 2a. Create a function showBookList to use it in several middleweres
    res.locals.username = req.session.username; // This variable (username) is available to the template
    res.locals.pageTitle = pages.bookList.title;
    res.locals.mainId = pages.bookList.mainId;
    res.locals.bookListActive = pages.bookList.bookListActive;
    try {
        const bookList = new BookList(req.session.username); // v3.1.6 Personalized bookList
        await bookList.loadBooks();
        res.render('booklist', { books: bookList.myBooks });
    } catch (error) {
        next(error);
    }
}
function checkIfAuthenticated(req, res, next) {
    // console.log(req.session.username);
    if (req.session.username) {
        next();
    } else {
        res.redirect('/login');
    }
}


export { router };

