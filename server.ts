import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app";

dotenv.config()

const port = process.env.PORT || 5000;
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

const DB =
  process.env?.DATABASE.replace("<password>", process.env?.DB_PASSWORD) ||
  "mongodb://localhost:27017";
mongoose.connect(DB).then(()=>{
  console.log("Database is Connected")
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const server = app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});

process.on('unhandledRejection', (err:any) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});