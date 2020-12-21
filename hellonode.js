const express = require('express')
const app = express()
const port = 3000

const conn_params = {
	user: 'some_user',
	host: 'localhost',
	database: 'test',
	port: 5432
}

const Pool = require('pg').Pool
const pool = new Pool(conn_params)
	
app.get('/', (request, response) => {
	pool.query('SELECT * FROM boring_table', (err, results) => {
		if (err) {
			throw err
		}
	
		response.status(200).send(results.rows[0])
	})
})

app.listen(port, () => {
	console.log(`Server running at localhost ${port}`)
})
