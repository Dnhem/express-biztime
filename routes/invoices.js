const ExpressError = require("../expressError");
const express = require("express");
const router = express.Router();
const db = require("../db");
const { request } = require("http");

// Return all invoices
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(
      `SELECT id, comp_code FROM invoices ORDER BY id`
    );
    console.log(results);
    return res.json({ invoices: results.rows });
  } catch (e) {
    return next(e);
  }
});

// Return single invoice
router.get("/:id", async (req, res, next) => {
  try {
    let id = req.params.id;
    const results = await db.query(
      `SELECT i.id, 
              i.comp_code,
              i.amt, 
              i.paid, 
              i.add_date, 
              i.paid_date,
              c.name,
              c.description
      FROM invoices as i
        INNER JOIN companies AS c ON (i.comp_code = c.code) 
      WHERE id=$1`,
      [ id ]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`Invoice id:${id} does not exist.`, 404);
    }
    const data = results.rows[0];
    const invoice = {
      id: data.id,
      company: {
        code: data.comp_code,
        name: data.name,
        description: data.description,
      },
      amount: data.amt,
      paid: data.paid,
      added_on: data.add_date,
      paid_on: data.paid_date,
    };
    return res.json({ invoice: invoice });
  } catch (e) {
    return next(e);
  }
});

// Create new invoice
router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    const results = await db.query(
      `INSERT INTO invoices (comp_code, amt)
       VALUES ($1, $2)
       RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [ comp_code, amt ]
    );
    return res.json({ invoice: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// Update existing invoice
router.put("/:id", async (req, res, next) => {
  try {
    const { amt, paid } = req.body;
    let id = req.params.id;
    const results = await db.query(
      `UPDATE invoices SET amt=$1, paid=$2
       WHERE id=$3
       RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [ amt, paid, id ]
    );
    if (results.rows.length === 0) {
      throw new ExpressError("Invoice not found.", 404);
    }
    return res.json({ invoice: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// Delete invoice
router.delete("/:id", async (req, res, next) => {
  try {
    let id = req.params.id;
    const results = await db.query(
      `DELETE FROM invoices WHERE id=$1 RETURNING id`,
      [ id ]
    );
    console.log(results.rows);
    if (results.rows.length === 0) {
      throw new ExpressError(`Invoice of id: ${id} not found.`, 404);
    }
    return res.json({ msg: "Deleted." });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
