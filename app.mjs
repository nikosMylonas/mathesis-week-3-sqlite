import express from "express";
import 'dotenv/config';
import session from 'express-session';
import { engine } from 'express-handlebars';
import { router } from './modules/router.mjs';
import createMemoryStore from 'memorystore';

const MemoryStore = createMemoryStore(session);

const myBooksSession = session({
    secret: process.env.SESSION_SECRET,
    store: new MemoryStore({ checkPeriod: 86400 * 1000 }),
    resave: false,
    saveUninitialized: false,
    name: 'myBooks-sid',
    cookie: {
        maxAge: 20 * 60 * 1000
    }
})

// const date = new Date();
// const currentYear = date.getFullYear();
// console.log(currentYear);

const app = express();
app.engine('hbs', engine({ extname: 'hbs' }));
app.set('view engine', 'hbs');

app.use(myBooksSession);

app.use(express.static('public'));

app.use(router);

app.use((err, req, res, next) => {
    res.render('error', { message: err.message });
})

const PORT = process.env.PORT

app.listen(PORT, console.log(`App is running and listening on port ${PORT}`));
