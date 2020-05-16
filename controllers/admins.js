const pool = require('../database/db')

// GET ALL ADMINS:
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
      buildings.name 
        AS building_name,
	    buildings.address
    FROM admins
      INNER JOIN admins_buildings
        ON admins.id = admins_buildings.admin_id
      INNER JOIN buildings
        ON admins_buildings.building_id = buildings.id
    ORDER BY admins.first_n asc;`,
   (error, results) => {
    if (error) {
      throw error
    }

    // RESULTS JSON PARSE METHOD:
    let getAdminsData = results.rows;
    let admins = []
    
    let pushAdmin = (admin) => {
      console.log('admin pushed');
      admins.push(
        {
          id: admin.id,
          name: admin.first_n,
          last_name: admin.last_n,
          email: admin.email,
          password: admin.password,
          id_number: admin.id_number,
          phone: admin.phone,
          status: admin.status,
          created_at: admin.created_at,
          updated_at: admin.updated_at,
          buildings: [
            {
              building_id: admin.building_id,
              building_name: admin.building_name,
              building_address: admin.address
            },
          ]
        },
      )
    }

    let pushBuilding = (index, admin) => {
      admins[index].buildings.push(
        {
          building_id: admin.building_id,
          building_name: admin.building_name,
          building_address: admin.address
        },
      )
      console.log('building pushed');
    }

    let findAdmin = (admins, admin) => admins.find(elem => elem.id === admin.id);

    let haveElem = (admin) => {
      if(findAdmin(admins, admin) != undefined) {
        let index = admins.indexOf(findAdmin(admins, admin))
        pushBuilding(index, admin)
      } else {
        pushAdmin(admin)
      }
    }

    let parseAdmins = (admin) => (admins.length === 0) ? pushAdmin(admin) : haveElem(admin);

    getAdminsData.map( (admin) => 
      parseAdmins(admin)
    );

    // END
    res.status(200).json(results.rows)
  })
}

// GET ADMIN BY ID:
const getAdminById = (req, res) => {
  const { id } = req.body

  pool.query(
    `SELECT * FROM admins WHERE id IN(${id}) ORDER BY name ASC`, (error, results) => {
    if (error) {
      throw error
    }
    res.status(200).json(results.rows)
  })
}

// CREATE ADMIN:
const createAdmin = (req, res) => {
  const { name, last_name, email, password, phone, id_number, building_id, status } = req.body

  pool.query(
    'INSERT INTO admins (name, last_name, email, password, phone, id_number, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', 
    [name, last_name, email, password, phone, id_number, status],
    (error, results) => {
      if (error) {
        throw error
      }
      let admin_id = results.rows[0].id
      
      // CREATE RELATION ADMIN-BUILDING
      for(let i = 0; i < building_id.length; i++) {
        pool.query(
          `INSERT INTO admins_buildings (admin_id, building_id) VALUES (${admin_id}, ${building_id[i]})`, 
          (error, results) => {
          if (error) {
            throw error
          }
        })
      }
      res.status(201).send(`Admin "${name} ${last_name}" with ID: ${results.insertId} and relation with building ID: ${building_id} added successfully`)
    }
  )
}

// UPDATE ADMIN:
const updateAdmin = (req, res) => {
  const id = parseInt(req.params.id)
  const { name, last_name, email, password, phone, id_number, building_id, status } = req.body

  pool.query(
    'UPDATE admins SET name = $1, last_name = $2, email = $3, password = $4, phone = $5, id_number = $6, status = $7 WHERE id = $8',
    [name, last_name, email, password, phone, id_number, status, id],
    (error, results) => {
      if (error) {
        throw error
      }

      // UPDATE RELATION ADMIN-BUILDING:
      pool.query(`DELETE FROM admins_buildings WHERE admin_id IN(${id})`, (error, results) => {
        if (error) {
          throw error
        }
      })
      
      for(let i = 0; i < building_id.length; i++) {
        pool.query(
          `INSERT INTO admins_buildings (admin_id, building_id) VALUES (${id}, ${building_id[i]})`, 
          (error, results) => {
          if (error) {
            throw error
          }
        })
      }

      res.status(200).send(`Admin modified with ID: ${id}, relations with buildings: ${building_id}`)
    }
  )
}

// DELETE ADMIN:
const deleteAdmin = (req, res) => {
  const { id } = req.body

  pool.query(`DELETE FROM admins WHERE id IN(${id})`, (error, results) => {
    if (error) {
      throw error
    }

    // DELETE RELATION ADMIN-BUILDING
    pool.query(`DELETE FROM admins_buildings WHERE admin_id IN(${id})`, (error, results) => {
      if (error) {
        throw error
      }
    })
    res.status(200).send(`Admins deleted with ID: ${id}. Relation admin-building removed.`)
  })
}

// EXPORTS:
module.exports = {
  getAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
}