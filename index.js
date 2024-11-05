// Imports
const pg = require("pg");
const express = require("express");

// Creates instance of an express application
const app = express();

// Creates an instance of pg.Client
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/the_acme_notes_db"
);

// Middleware
app.use(express.json());
app.use(require("morgan")("dev"));

// Routes
// Handles the creation of a new 'note'
app.post("/api/notes", async (req, res, next) => {
  try {
    const SQL = `
    INSERT INTO notes(txt)
    VALUES($1)
    RETURNING *;
    `;
    const response = await client.query(SQL, [req.body.txt]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Retrieves all 'notes' from the database
app.get("/api/notes", async (req, res, next) => {
  try {
    const SQL = `
    SELECT * FROM notes ORDER BY created_at DESC;
    `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

// Updates an existing 'note' by its id
app.put("/api/notes/:id", async (req, res, next) => {
  try {
    const SQL = `
    UPDATE notes
    SET txt=$1, ranking=$2, updated_at= now()
    WHERE id=$3 RETURNING *;
    `;
    const response = await client.query(SQL, [
      req.body.txt,
      req.body.ranking,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Deletes a 'note' by its id
app.delete("/api/notes/:id", async (req, res, next) => {
  try {
    const SQL = `
    DELETE FROM notes
    WHERE id=$1;
    `;
    const response = await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

// Initializes the database connection and sets up the necessary tables and data
const init = async () => {
  await client.connect();
  console.log("connected to database");
  let SQL = `
  DROP TABLE IF EXISTS notes;
  CREATE TABLE notes(
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  ranking INTEGER DEFAULT 3 NOT NULL,
  txt VARCHAR(255) NOT NULL
  );
  `;
  await client.query(SQL);
  console.log("tables created");
  SQL = `
  INSERT INTO notes(txt, ranking) VALUES('learn express', 5);
  INSERT INTO notes(txt, ranking) VALUES('write SQL queries', 4);
  INSERT INTO notes(txt, ranking) VALUES('create routes', 2);
  `;
  await client.query(SQL);
  console.log("data seeded");
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`listening on port ${port}`);
  });
};

init();
