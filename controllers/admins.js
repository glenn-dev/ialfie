const pool = require('../database/db');
const parseAdmins = require('../helpers/admins-helper');

/* GET ALL ADMINS */
const getAdmins = (req, res) => {

  pool.query(`
    SELECT 
	    admins.id,
	    admins.first_n,
	    admins.last_n,
      admins.email,
      admins.password,
	    admins.id_number,
	    admins.phone,
	    admins.status,
	    admins.created_at,
	    admins.updated_at,
	    admins_buildings.building_id,
      buildings.b_name,
	    buildings.address
    FROM admins
      INNER JOIN admins_buildings
        ON admins.id = admins_buildings.admin_id
      INNER JOIN buildings
        ON admins_buildings.building_id = buildings.id
    ORDER BY admins.first_n asc;`,
   (error, results) => {
    if (error) {
      throw error;
    };
    res.status(200).json(parseAdmins(results.rows));
  });
};

/* GET ADMIN BY ID */
const getAdminById = (req, res) => {
  const id = req.body;

  pool.query(`    
    SELECT 
	    admins.id,
	    admins.first_n,
	    admins.last_n,
      admins.email,
      admins.password,
	    admins.id_number,
	    admins.phone,
	    admins.status,
	    admins.created_at,
	    admins.updated_at,
	    admins_buildings.building_id,
      buildings.b_name, 
	    buildings.address
    FROM admins
      INNER JOIN admins_buildings
        ON admins.id = admins_buildings.admin_id
      INNER JOIN buildings
        ON admins_buildings.building_id = buildings.id
    WHERE admins.id IN(${id})
    ORDER BY admins.first_n asc;`, 
    (error, results) => {
    if (error) {
      throw error;
    };
    res.status(200).json(parseAdmins(results.rows));
  });
};

/* CREATE ADMIN */
const createAdmin = (req, res) => {
  const { name, last_name, email, password, phone, id_number, buildings, status } = req.body;
  // Insert Admin
  pool.query(
    'INSERT INTO admins (first_n, last_n, email, password, phone, id_number, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', 
    [name, last_name, email, password, phone, id_number, status],
    (error, results) => {
      if (error) {
        throw error;
      };
      insertAdminBuilding(results.rows[0].id);
    }
  );
  // Create relation Admin-Building
  const insertAdminBuilding = (id) => {
    let values = [];
    buildings.forEach((building, index) => {
      (buildings.length < index) ? values.push(`(${id}, ${building}),`) : values.push(`(${id}, ${building})`)
    });
    pool.query(
      `INSERT INTO admins_buildings (admin_id, building_id) VALUES ${values}`, 
      (error, results) => {
      if (error) {
        throw error;
      };
      res.status(201).send(`Admin "${name} ${last_name}" with ID: ${id} and buildings: ${buildings} added  successfully.`);
    });
  }
};

/* UPDATE ADMIN */
const updateAdmin = (req, res) => {
  const id = parseInt(req.params.id);
  const { name, last_name, email, password, phone, id_number, building_id, status } = req.body;

  pool.query(
    'UPDATE admins SET name = $1, last_name = $2, email = $3, password = $4, phone = $5, id_number = $6, status = $7 WHERE id = $8',
    [name, last_name, email, password, phone, id_number, status, id],
    (error, results) => {
      if (error) {
        throw error;
      };

      // Update relation Admin-Building
      pool.query(`DELETE FROM admins_buildings WHERE admin_id IN(${id})`, (error, results) => {
        if (error) {
          throw error;
        };
      });
      
      for(let i = 0; i < building_id.length; i++) {
        pool.query(
          `INSERT INTO admins_buildings (admin_id, building_id) VALUES (${id}, ${building_id[i]})`, 
          (error, results) => {
          if (error) {
            throw error;
          };
        });
      };

      res.status(200).send(`Admin modified with ID: ${id}, relations with buildings: ${building_id}`);
    }
  );
};

/* DELETE ADMIN */
const deleteAdmin = (req, res) => {
  const id = req.body;

  pool.query(`DELETE FROM admins WHERE id IN(${id})`, (error, results) => {
    if (error) {
      throw error;
    };

    // Delete relation Admin-Building
    pool.query(`DELETE FROM admins_buildings WHERE admin_id IN(${id})`, (error, results) => {
      if (error) {
        throw error;
      };
    });
    res.status(200).send(`Admins deleted with ID: ${id}. Relation admin-building removed.`);
  });
};

/* EXPORTS */
module.exports = {
  getAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
};