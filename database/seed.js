const pool = require('./db')

/* *** WARNING *** !! *** DANGER *** !! *** WARNING *** !! *** DANGER ***

 * !! FUNCTIONS BELOW WILL ALTER DATABASE INTEGRITY PERMANENTLY !! * 

 * !! DO NEVER EXECUTE THEM IN PRODUCTION ENVIRONMENTS !! * 

 *** WARNING *** !! *** DANGER *** !! *** WARNING *** !! *** DANGER *** */

/* DELETE DATA */
let resetDb = (tables) => {
  pool.query(
    `DELETE FROM ${tables}`,
    (error, results) => {
      if (error) {
        throw error
      }
      console.log(`All data in tables: ${tables} were removed!!`);
    }
  )
}

/* SEED DATA (UNFINISHED METHOD) */
function seedDb(amount) {

  for(let i = 0; i < amount; i++){
    pool.query(
      `INSERT INTO buildings (
        name,
        address,
        image) 
        VALUES (
          'Building ${i}', 
          'Address for building ${i}', 
          'Image path for building ${i}')`,
      (error, results) => {
        if (error) {
          throw error
        }
        console.log(`Building "${i}" added successfully`)
      }
    )
  }
  
}

/* SET TABLES TO RESET/SEED */
let tables = [
  'admins',
  'admins_buildings',
  'bill_details',
  'bills',
  'buildings',
  'communications',
  'concepts',
  'departments',
  'general_expenses',
  'payments',
  'users',
  'users_buildings',
  'users_departments'
]

console.log("!! * WARNING * !! DISABLE 'seed.js' FILE IN PRODUCTION ENVIRONMENTS !!");

/*  *** DANGER *** !! *** DANGER *** !! *** DANGER *** !! *** DANGER ***  */

// resetDb(tables)  /* * !! RUN AT YOUR OWN RISK !! * */ 

// seedDb(tables)   /* * !! RUN AT YOUR OWN RISK !! * */

/* *** DANGER *** !! *** DANGER *** !! *** DANGER *** !! *** DANGER ***  */