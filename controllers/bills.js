const pool = require('../database/db')

/* GET ALL BILLS */
const getBills = (req, res) => {
  const building_id = req.body;
  pool.query(`
  SELECT
    bi.id,
    bi.number,
    bi.exp_date,
    bi.total,
    bi.status,
    bi.document,
    bi.department_id,
    de.number
      AS dep_number,
    de.defaulting,
    bi.admin_id,
    ad.first_n
      AS adm_first_n,
    ad.last_n
      AS adm_last_n,
    bi.building_id,
    bu.name
  FROM bills 
    AS bi
    INNER JOIN departments
      AS de
      ON bi.department_id = de.id
    INNER JOIN admins
      AS ad
      ON bi.admin_id = ad.id
    INNER JOIN buildings
      AS bu
      ON bi.building_id = bu.id
  WHERE bi.building_id = ${building_id} 
  ORDER BY bi.number ASC`, 
    (error, results) => {
      if (error) {
        throw error;
      };
      res.status(200).json(results.rows);
    }
  );
};

/* GET BILLS BY ID */
const getBillsById = (req, res) => {
  const id = req.body
  pool.query(`
    SELECT
      bd.id,
      bd.category_id,
      ca.cat_code,
      ca.cat_name,
      bd.concept_id,
      co.code,
      co.concept,
      bd.description,
      bd.amount,
      bd.quantity,
      bd.total,
    FROM bill_details
      AS bd
      INNER JOIN concepts
        AS co
        ON bd.concept_id = co.id
      INNER JOIN categories
        AS ca
        ON bd.category_id = ca.id
    WHERE bd.id IN(${id}) 
    ORDER BY ca.cat_name ASC`, 
    (error, results) => {
      if (error) {
        throw error;
      };
      res.status(200).json(results.rows);
    }
  );
};

/* CREATE RELATIONS */
const insertBillDetails = (res, id, details, department_id, building_id, admin_id) => {
  let values = [];
  details.forEach((detail) => {
    values.push(`(
      ${detail.category_id}, 
      ${detail.concept_id}, 
      '${detail.description}', 
      ${detail.amount}, 
      ${detail.quantity}, 
      ${detail.total}, 
      ${id}, 
      ${department_id}, 
      ${building_id},
      ${admin_id})`
    );
  });
  pool.query(`
    INSERT INTO bill_details (
      category_id, 
      concept_id, 
      description, 
      amount, 
      quantity, 
      total, 
      bill_id, 
      department_id, 
      building_id,
      admin_id) 
    VALUES ${values}
    RETURNING id`, 
    (error, results) => {
    if (error) {
      selfDelete(id, res);
      throw error;
    };
    res.status(201).send(`Bill "${id}" added successfully on department: ${department_id}, by admin: ${admin_id}`);
  });
};

/* DELETE RELATIONS */
const deleteBillDetails = (id) => {
  return pool.query(`DELETE FROM bill_details WHERE bill_id IN(${id})`);
};

/* CREATE BILL */
const createBill = (req, res) => {
  const { number, exp_date, ge_subtotal, in_subtotal, total, status, issued, document, department_id, building_id, admin_id, details } = req.body;
  pool.query(`
    INSERT INTO bills (number, exp_date, ge_subtotal, in_subtotal, total, status, issued, document, department_id, building_id, admin_id) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`, 
    [number, exp_date, ge_subtotal, in_subtotal, total, status, issued, document, department_id, building_id, admin_id], 
    (error, results) => {
      if (error) {
        throw error;
      };
      insertBillDetails(res, results.rows[0].id, details, department_id, building_id, admin_id);
    }
  );
};

/* UPDATE BILL */
const updateBill = (req, res) => {
  const { id, number, exp_date, ge_subtotal, in_subtotal, total, status, issued, document, department_id, building_id, admin_id, details } = req.body;
  pool.query(`
    UPDATE bills 
    SET 
      number = $1,
      exp_date = $2, 
      ge_subtotal = $3, 
      in_subtotal = $4, 
      total = $5, 
      status = $6, 
      issued = $7, 
      document = $8,
      department_id = $9,
      building_id = $10,
      admin_id = $11
    WHERE id = $12`,
    [number, exp_date, ge_subtotal, in_subtotal, total, status, issued, document, department_id, building_id, admin_id, id],
    async (error, results) => {
      if (error) {
        throw error;
      };
      await deleteBillDetails(id);
      await insertBillDetails(res, id, details, department_id, building_id, admin_id);
    }
  );
};

/* DELETE BILLS */
const selfDelete = (id, res) => {
  pool.query(`DELETE FROM bills WHERE id IN(${id})`, 
    (error, results) => {
      if (error) {
        throw error;
      };
      res.status(200).send(`Bills deleted with ID: ${id}`);
    }
  );
};
const deleteBills = async (req, res) => {
  const id = req.body;
  const response = await deleteBillDetails(id);
  console.log(response);
  await selfDelete(id, res);
};

/* EXPORTS */
module.exports = {
  getBills,
  getBillsById,
  createBill,
  updateBill,
  deleteBills,
};