const ExpressError = require("../expressError");
const express = require("express");
const router = express.Router();
const db = require("../db");

// Return all companies
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`
    SELECT code,name,description FROM companies ORDER BY name`);
    return res.json({ companies: results.rows });
  } catch (e) {
    return next(e);
  }
});

// Return single company
router.get("/:code", async (req, res, next) => {
  try {
    let { code } = req.params;
    const results = await db.query(
      `SELECT code,name,description FROM companies WHERE code = $1`,
      [ code ]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`company: ${code} not found.`, 404);
    }
    return res.json({ company: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// Create a new company
router.post("/", async (req, res, next) => {
  try {
    const { code, name, description } = req.body;
    const results = await db.query(
      `INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *`,
      [ code, name, description ]
    );
    return res.status(201).json({ company: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// Update an existing company
router.patch("/:code", async (req, res, next) => {
  try {
    let { name, description } = req.body;
    let code = req.params.code;
    const results = await db.query(
      `UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code,name,description`,
      [ name, description, code ]
    );
    if (results.rows.length === 0) {
      throw new ExpressError("Company not found.", 404);
    }
    return res.json({ company: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// Delete a company
router.delete("/:code", async (req, res, next) => {
  try {
    let code = req.params.code;
    const results = await db.query(
      `DELETE FROM companies WHERE code=$1 RETURNING code`,
      [ code ]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`Company: ${code} not found.`, 404);
    } else {
      return res.send({ message: "Deleted." });
    }
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
