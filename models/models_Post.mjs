import { Sequelize, DataTypes } from "sequelize";
import { dbName, dbUser, dbPassword, dbHost, dbPort } from '../config/dbConfig.mjs';

const sequelize = new Sequelize({
    host: dbHost,
    dialect: 'postgres',
    port: dbPort,
    username: dbUser,
    database: dbName,
    password: dbPassword,
    logging: false,
    define: {
        timestamps: false
    }
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