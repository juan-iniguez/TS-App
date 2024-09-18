import sqlite3 from 'sqlite3';

// Open DB Connection
export let db = new sqlite3.Database('db/apl.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to APL SQlite database.');
});
