import { Sequelize, DataTypes } from "sequelize";
import { filename } from '../config/dbConfig.mjs';

// const db_name = '../db/books.sqlite';

// console.log(filename);

const db_name = filename;

const sequelize = new Sequelize({
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    define: {
        timestamps: false
    },
    storage: db_name
});

const Book = sequelize.define('Book', {
    title: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER
    }
});

const Author = sequelize.define('Author', {
    name: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true
    }
});

const Editor = sequelize.define('Editor', {
    name: {
        type: DataTypes.TEXT,
        allowNull: true,
        unique: true
    }
})

const User = sequelize.define('User', {
    name: {
        type: DataTypes.TEXT,
        primaryKey: true
    },
    password: {
        type: DataTypes.TEXT
    }
});

const BookUser = sequelize.define('BookUser', {
    comment: {
        type: DataTypes.TEXT,
        defaultValue: null
    }
});

export { sequelize, Book, Author, Editor, User, BookUser };