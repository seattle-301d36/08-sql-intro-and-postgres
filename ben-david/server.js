'use strict';

const fs = require('fs');
const pg = require('pg');
const express = require('express');

const PORT = process.env.PORT || 3000;
const app = express();

// Windows and Linux users: You should have retained the user/password from the pre-work for this course.
// Your OS may require that your conString is composed of additional information including user and password.
let conString;
if (process.platform === 'win32') {
  //windows pc
  conString = 'postgres://hoffit:xyz4pass@HOST:5432/kilovolt';
} else if (process.platform === 'darwin') {
  //mac
  conString = 'postgres://localhost:5432';
} else {
  console.log('Unsupported system for database connectivity');
}

const client = new pg.Client(conString);

// REVIEW: Use the client object to connect to our DB.
client.connect();

// REVIEW: Install the middleware plugins so that our app can parse the request body
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static('./public'));

// REVIEW: Routes for requesting HTML resources
app.get('/new-article', (request, response) => {
  // TODone COMMENT:What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which
  // method of article.js, if any, is interacting with this particular piece of `server.js`? What part of CRUD, if any, is being enacted/managed by this particular piece of code?
  // #2,5. Doesn't tie directly to article.js. It's triggered by the user entering this url in their browser:
  // http://localhost:3000/new-article. There is no CRUD operation here. It's just returning an empty form.
  response.sendFile('new.html', {root: './public'});
});

// REVIEW: Routes for making API calls to use CRUD Operations on our database
app.get('/articles', (request, response) => {
  // TODone COMMENT:What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which
  // method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // #2,5. It's called from Article.fetchAll using HTTPs get method.
  let SQL = `
    SELECT * FROM articles;
  `;
  client
    .query(SQL)
    .then(function (result) {
      response.send(result.rows);
    })
    .catch(function (err) {
      console.error(err);
    });
});

app.post('/articles', (request, response) => {
  // TODone COMMENT:What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which
  // method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // #2, 3, 4, 5. This aligns with the C in CRUD; creates a new record in the database. It's invoked from the
  // insertRecord function in article.js.
  let SQL = `
    INSERT INTO articles(title, author, author_url, category, published_on, body)
    VALUES ($1, $2, $3, $4, $5, $6);
  `;

  let values = [
    request.body.title,
    request.body.author,
    request.body.author_url,
    request.body.category,
    request.body.published_on,
    request.body.body
  ];

  client
    .query(SQL, values)
    .then(function () {
      response.send('insert complete');
    })
    .catch(function (err) {
      console.error(err);
    });
});

app.put('/articles/:id', (request, response) => {
  // TODone COMMENT:What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which
  // method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // #2, 3, 4, 5. This aligns with the U in CRUD; updates an existing record in the database. It's invoked from the
  // Article.updateRecord method.

  let SQL = `
    UPDATE articles 
    SET title=$1, author=$2, author_url$3, category=$4, published_on=$5, body=$6
    WHERE aritcle_id=$7;
  `;

  let values = [
    request.body.title,
    request.body.author,
    request.body.author_url,
    request.body.category,
    request.body.published_on,
    request.body.body,
    request.body.params_id
  ];

  client.query(SQL, values)
    .then(() => {
      response.send('update complete');
    })
    .catch(err => {
      console.error(err);
    });
});

app.delete('/articles/:id', (request, response) => {
  // TODone COMMENT:What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which
  // method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // #2, 3, 4, 5. This aligns with the D in CRUD; deletes an existing record in the database. It's invoked from the
  // Article.deleteRecord method.

  let SQL = `DELETE FROM articles WHERE article_id=$1;`;
  let values = [request.params.id];

  client
    .query(SQL, values)
    .then(() => {
      response.send('Delete complete');
    })
    .catch(err => {
      console.error(err);
    });
});

app.delete('/articles', (request, response) => {
  // TODone COMMENT:What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which
  // method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // #2, 3, 4, 5. This aligns with the D in CRUD; deletes all existing records in the database. It's invoked from the
  // Article.truncateTable method.

  let SQL = `
    DELETE FROM articles;
  `;
  client
    .query(SQL)
    .then(() => {
      response.send('Delete complete');
    })
    .catch(err => {
      console.error(err);
    });
});

// TODone COMMENT:What is this function invocation doing?
// It's invoking the loadDB function, which in turn is ensuring that there is a article table in kilovolt database.
// It executes on the server with the terminal command 'node server' and initializes the database if needed.
loadDB();

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}!`);
});

//////// ** DATABASE LOADER ** ////////
////////////////////////////////////////
function loadArticles() {
  // TODone COMMENT:What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // #3, 4. There is no relationship to article.js, as this is just server side database table initialization. It's
  // the C in CRUD as it inserting records into the table.

  let SQL = 'SELECT COUNT(*) FROM articles';
  client.query(SQL).then(result => {
    // REVIEW: result.rows is an array of objects that PostgreSQL returns as a response to a query.
    // If there is nothing on the table, then result.rows[0] will be undefined, which will make count undefined. parseInt(undefined) returns NaN. !NaN evaluates to true.
    // Therefore, if there is nothing on the table, line 158 will evaluate to true and enter into the code block.
    if (!parseInt(result.rows[0].count)) {
      fs.readFile('./public/data/hackerIpsum.json', 'utf8', (err, fd) => {
        JSON.parse(fd).forEach(ele => {
          let SQL = `
              INSERT INTO articles(title, author, author_url, category, published_on, body)
              VALUES ($1, $2, $3, $4, $5, $6);
            `;
          let values = [
            ele.title,
            ele.author,
            ele.author_url,
            ele.category,
            ele.published_on,
            ele.body
          ];
          client.query(SQL, values);
        });
      });
    }
  });
}

function loadDB() {
  // TODone COMMENT:What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which
  // method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // #3, 4. It has nothing to do with Article.js which is view code. It's running server side. From a CRUD
  // perspective, its not related because CRUD refers to interacting with existing tables, and not the creation of
  // tables themselves.
  client
    .query(
      `
    CREATE TABLE IF NOT EXISTS articles (
      article_id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      author_url VARCHAR (255),
      category VARCHAR(20),
      published_on DATE,
      body TEXT NOT NULL);`
    )
    .then(() => {
      loadArticles();
    })
    .catch(err => {
      console.error(err);
    });
}
