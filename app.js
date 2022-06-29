//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const cors = require('cors');
const app = express();
const pool = require("./db");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(cors());

// ROUTES

// Create a todo
// app.post("/todos", async(req, res) => {
//   try {
//     const { description } = req.body;
//     const newTodo = await pool.query(
//       "INSERT INTO todo (description) VALUES($1) RETURNING *",
//       [description]
//     );
//
//     res.json(newTodo.rows[0]);
//   } catch (e) {
//     console.error(e.message);
//   }
// });


/////////////////////// POST /////////////////////////////
// Get all posts
app.get("/posts", async(req, res) => {
  try {
    const allTodos = await pool.query(
      `
SELECT p.*, rc.reaction_emails, rc.reaction_count, cc.comment_count
FROM post AS p
LEFT JOIN (
	SELECT post_id, string_agg(email, ', ') AS reaction_emails, count(*) AS reaction_count
	FROM reaction AS r
	GROUP BY post_id
	) AS rc
ON p.id = rc.post_id
LEFT JOIN (
	SELECT post_id, count(*) AS comment_count
	FROM comment AS c
	GROUP BY post_id
	) AS cc
ON p.id = cc.post_id
ORDER BY p.id DESC
;
`
    );


    res.json(allTodos.rows);
  } catch (e) {
    console.error(e.message);
  }
});

// Get a post
app.get("/posts/:id", async(req, res) => {
  try {
    const {id} = req.params;
    const todo = await pool.query(
      `
SELECT p.*, rc.reaction_emails, rc.reaction_count, cc.comment_count
FROM post AS p
LEFT JOIN (
  SELECT post_id, string_agg(email, ', ') AS reaction_emails, count(*) AS reaction_count
  FROM reaction AS r
  GROUP BY post_id
  ) AS rc
ON p.id = rc.post_id
LEFT JOIN (
  SELECT post_id, count(*) AS comment_count
  FROM comment AS c
  GROUP BY post_id
  ) AS cc
ON p.id = cc.post_id
WHERE p.id = $1
;
`,
      [id]
    );

    res.json(todo.rows[0]);
  } catch (e) {
    console.error(e.message);
    res.status(400).send({
      message: e.message
    });
  }
});

// update a post
app.put("/posts/:id", async(req, res) => {
  try {
    const {id} = req.params;
    const { description } = req.body;
    const updateTodo = await pool.query(
      "UPDATE posts SET description = $1 WHERE id = $2 RETURNING *",
      [description, id]
    );

    res.json(updateTodo.rows[0]);
  } catch (e) {
    console.error(e.message);
    res.status(400).send({
      message: e.message
    });
  }
});

// delete a post
app.delete("/posts/:id", async(req, res) => {
  try {
    const {id} = req.params;
    const todo = await pool.query(
      "DELETE FROM posts WHERE id = $1 RETURNING *",
      [id]
    );

    res.json(todo.rows[0]);
  } catch (e) {
    console.error(e.message);
    res.status(400).send({
      message: e.message
    });
  }
});

// create new post
app.post('/posts', async(req, res) => {
  try {
    const email = req.body.email;
    const description = req.body.description;
    const created_at = req.body.created_at;

    const todo = await pool.query(
      "INSERT INTO post (email, description, created_at) VALUES($1, $2, $3) RETURNING *",
      [email, description, created_at]
    );

    res.json(todo.rows[0]);
  } catch (e) {
    console.error(e.message);
    res.status(400).send({
      message: e.message
    });
  }
});

///////////////////////// AUTH /////////////////////////
app.post('/login', async(req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const todo = await pool.query(
      "SELECT * FROM player WHERE email = $1 AND password = $2",
      [email, password]
    );

    res.json(todo.rows[0]);
  } catch (e) {
    console.error(e.message);
    res.status(400).send({
      message: e.message
    });
  }
});

app.post('/register', async(req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const todo = await pool.query(
      "INSERT INTO player (email, password) VALUES($1, $2) RETURNING *",
      [email, password]
    );

    res.json(todo.rows[0]);
  } catch (e) {
    console.error(e.message);
    res.status(400).send({
      message: e.message
    });
  }
});

////////////// ACCOUNT /////////////////
// Get a todo
app.get("/account/:email", async(req, res) => {
  try {
    const {email} = req.params;
    const todo = await pool.query(
      "SELECT * FROM player WHERE email = $1",
      [email]
    );

    res.json(todo.rows[0]);
  } catch (e) {
    console.error(e.message);
    res.status(400).send({
      message: e.message
    });
  }
});

// update account
app.put("/account/:email", async(req, res) => {
  try {
    const {email} = req.params;
    const newEmail = req.body.email;
    const password = req.body.password;
    const phone = req.body.phone_number;
    const name = req.body.name;

    const updateTodo = await pool.query(
      "UPDATE player SET email = $1, password = $2, phone_number = $3, name = $4 WHERE email = $5 RETURNING *",
      [newEmail, password, phone, name, email]
    );

    res.json(updateTodo.rows[0]);
  } catch (e) {
    console.error(e.message);
    res.status(400).send({
      message: e.message
    });
  }
});

//////////////////// REACTION ///////////////////////

app.post("/reaction", async(req, res) => {
  try {
    const email = req.body.email;
    const id = req.body.id;

    console.log(req.body);
    console.log(`email: ${email} - id: ${id}`);

    const todo = await pool.query(
      "INSERT INTO reaction (post_id, email) VALUES($1, $2) RETURNING *",
      [id, email]
    );

    res.json(todo.rows[0]);
  } catch (e) {
    console.error(e.message);
    res.status(400).send({
      message: e.message
    });
  }
});

app.delete("/reaction", async(req, res) => {
  try {
    const email = req.body.email;
    const id = req.body.id;

    console.log(req.body);
    console.log(`email: ${email} - id: ${id}`);

    const todo = await pool.query(
      "DELETE FROM reaction WHERE post_id = $1 AND email = $2 RETURNING *",
      [id, email]
    );

    res.json(todo.rows[0]);
  } catch (e) {
    console.error(e.message);
    res.status(400).send({
      message: e.message
    });
  }
});

///////////////////// COMMENT ///////////////////////////
// Get comment for a post
app.get("/comments/:id", async(req, res) => {
  try {
    const {id} = req.params;
    const todo = await pool.query(
      `SELECT * FROM comment WHERE post_id = $1`,
      [id]
    );

    res.json(todo.rows);
  } catch (e) {
    console.error(e.message);
    res.status(400).send({
      message: e.message
    });
  }
});

// Add comment for a post
app.post("/comments/:id", async(req, res) => {
  try {
    const {id} = req.params;
    const content = req.body.content;
    const email = req.body.email;
    const addComment = await pool.query(
      "INSERT INTO comment (post_id, email, content) VALUES ($1, $2, $3) RETURNING *",
      [id, email, content]
    );

    res.json(addComment.rows[0]);
  } catch (e) {
    console.error(e.message);
    res.status(400).send({
      message: e.message
    });
  }
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
