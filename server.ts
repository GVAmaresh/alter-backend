import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config()

const app = express();
const port = process.env.PORT || 5000;

const DB =
  process.env?.DATABASE.replace("<password>", process.env?.DB_PASSWORD) ||
  "mongodb://localhost:27017";
mongoose.connect(DB).then(()=>{
  console.log("Database is Connected")
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
