const pages = {
    home: {
        mainId: 'home',
        title: ' | Home',
        homeActive: true
    },
    bookList: {
        mainId: 'booklist',
        title: ' | Booklist',
        bookListActive: true
    },
    addForm: {
        mainId: 'add-book',
        title: ' | Add Book',
        addFormActive: true
    },
    login: {
        mainId: 'login',
        title: ' | Login',
        loginActive: true
    },
    addedBook: {
        mainId: 'added-book',
        title: ' | Book Was Added Successfully'
    },
    deletedBook: {
        mainId: 'deleted-book',
        title: ' | Book Was Deleted Successfully'
    },
    // error: {
    //     mainId: 'errorPage',
    //     title: ' | Error Page'
    // },
}

const currentDate = new Date();
const currentYear = currentDate.getFullYear();

export { pages, currentYear };