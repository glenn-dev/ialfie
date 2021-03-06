const pool = require('../database/db');

/* GET ALL BUILDINGS */
const getBuildings = (req, res) => {
  pool.query('SELECT * FROM buildings ORDER BY name ASC', (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  });
};

/* GET BUILDING BY ID */
const getBuildingById = (req, res) => {
  const id = req.body;
  pool.query(
    `
    SELECT 
      bu.id,
      bu.name,
      bu.image,
      bu.status,
      bu.street,
      bu.block_number,
      mu.municipality,
      re.region,
      co.country,
      bs.cutoff_date,
      bs.bill_exp_date
    FROM 
      buildings 
      AS bu
    INNER JOIN
      municipalities
      AS mu
      ON bu.municipality_id = mu.id
    INNER JOIN
      regions
      AS re
      ON bu.region_id = re.id
    INNER JOIN
      countries
      AS co
      ON bu.country_id = co.id
    INNER JOIN
      building_setups
      AS bs
      ON bs.building_id = bu.id
    WHERE 
      bu.id = ${id}`,
    (error, results) => {
      if (error) {
        throw error;
      }
      res.status(200).json(results.rows);
    }
  );
};

/* CREATE BUILDING */
const createBuilding = (req, res) => {
  const {
    image,
    name,
    status,
    street,
    block_number,
    municipality_id,
    region_id,
    country_id,
    setups,
  } = req.body;
  pool.query(
    `
    INSERT INTO 
      buildings 
      (
        image, 
        name, 
        status, 
        street, 
        block_number, 
        municipality_id, 
        region_id, 
        country_id
      ) 
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8) 
    RETURNING id`,
    [
      image,
      name,
      status,
      street,
      block_number,
      municipality_id,
      region_id,
      country_id,
    ],
    (error, results) => {
      if (error) {
        throw error;
      }
      const id = results.rows[0].id;
      insertRelations(id, setups.cutoff_date, setups.bill_exp_date)
        .then(res.status(201).send(`Building ${id} created.`))
        .catch((err) => {
          throw err;
        });
    }
  );
};

/* CREATE BUILDING RELATIONS */
const insertRelations = (building_id, cutoff_date, bill_exp_date) => {
  return pool.query(
    `
    INSERT INTO 
      building_setups 
      (cutoff_date, bill_exp_date, building_id) 
    VALUES 
      ($1, $2, $3)`,
    [cutoff_date, bill_exp_date, building_id]
  );
};

/* UPDATE BUILDING */
const updateBuilding = (req, res) => {
  const {
    id,
    name,
    image,
    status,
    street,
    block_number,
    municipality_id,
    region_id,
    country_id,
    setups,
  } = req.body;
  pool.query(
    `
    UPDATE 
      buildings 
    SET 
      name = $1,
      image = $2,
      status = $3,
      street = $4,
      block_number = $5,
      municipality_id = $6,
      region_id = $7,
      country_id = $8
    WHERE 
      id = $9`,
    [
      name,
      image,
      status,
      street,
      block_number,
      municipality_id,
      region_id,
      country_id,
      id,
    ],
    (error, results) => {
      if (error) {
        throw error;
      }
      deleteRelations(id)
        .then(
          insertRelations(id, setups.cutoff_date, setups.bill_exp_date)
            .then(res.status(200).send(`Building ${id} modified.`))
            .catch((err) => {
              throw err;
            })
        )
        .catch((err) => {
          throw err;
        });
    }
  );
};

/* DELETE BUILDINGS */
const deleteBuildings = (req, res) => {
  const id = req.body;
  deleteRelations(id)
    .then(
      pool.query(
        `DELETE FROM buildings WHERE id IN(${id})`,
        (error, results) => {
          if (error) {
            throw error;
          }
          res.status(200).send(`Building ${id} deleted.`);
        }
      )
    )
    .catch((err) => {
      throw err;
    });
};

/* DELETE BUILDING RELATIONS */
const deleteRelations = (building_id) => {
  return pool.query(
    `DELETE FROM building_setups WHERE building_id = ${building_id}`
  );
};

/* EXPORTS */
module.exports = {
  getBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuildings,
};
