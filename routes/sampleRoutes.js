const express = require("express");
const router = express.Router();

const { getDB } = require("../config/db");


// GET all Accounts
router.get("/", async (req, res) => {

  const db = getDB();

  const accounts = await db
    .collection("accounts")
    .find()
    .toArray();

  res.json(accounts);

});


// CREATE accounts
router.post("/", async (req, res) => {

  const db = getDB();

  const result = await db
    .collection("accounts")
    .insertOne(req.body);

  res.json(result);

});


// DELETE accounts
router.delete("/:id", async (req, res) => {

  const db = getDB();

  const { ObjectId } = require("mongodb");

  const result = await db
    .collection("accounts")
    .deleteOne({
      _id: new ObjectId(req.params.id)
    });

  res.json(result);

});


module.exports = router;