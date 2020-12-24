/************************************************************
 * Get the stuff we need
 ************************************************************/

const express = require('express')
const app = express()
const port = 3000

const session = require('express-session')

const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

const handlebars = require('express-handlebars')

const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

const Pool = require('pg').Pool


/************************************************************
 * Set the stuff up
 ************************************************************/

// Setup handlebars stuff
app.set('view engine', 'handlebars')

app.engine('handlebars', handlebars({
	layoutsDir: __dirname + '/views/layouts',
	partialsDir: __dirname + '/views'
}))


// Setup the database connection
const db_conn_params = {
	user: 'some_user',
	host: 'localhost',
	database: 'test',
	port: 5432
}

const pool = new Pool(db_conn_params)


// Setup the rest of the stuff
app.use(express.static('public'))
app.use(cookieParser())
app.use(bodyParser())
app.use(session({ secret: 'some_secret_key', resave: false, saveUninitialized: false }))
app.use(passport.initialize())
app.use(passport.session())


// Define how Passport is going to authenticate users
passport.use(new LocalStrategy((username, password, done) => {
/*	
	User.findOne({ username: username }, (err, user) => {
		if (err) {
			return done(err)
		}

		if (!user) {
			return done(null, false, { message: 'Incorrect username.' })
		}

		if (!user.validPassword(password)) {
			return done(null, false, { message: 'Incorrect password.' })
		}
		
		return done(null, user)
	})
*/
	
	loginAttempt();

	async function loginAttempt() {
 
		const client = await pool.connect()
		try {
			await client.query('BEGIN')
			
			var currentAccountsData = await JSON.stringify(client.query('SELECT id, "username", "password" FROM "users" WHERE "username"=$1', [username], function(err, result) {
 
				if(err) {
					return done(err)
				}

				if(result.rows[0] == null) {
					//request.flash('danger', "Oops. Incorrect login details.");
					return done(null, false);
				}
				else {
					//bcrypt.compare(password, result.rows[0].password, function(err, check) {
					const check = password === result.rows[0].password
					const err = false			

						if (err) {
							console.log("Error while checking password");
							return done();
						}
						else if (check) {
							return done(null, {id: result.rows[0].id, username: result.rows[0].username}, {message: "Correct credentials"});
						}
						else {
							//request.flash('danger', "Oops. Incorrect login details.");
							return done(null, false/*, {message: "Incorrect credentials"}*/);
						}
					//});
				}
			}))
 		}
 		catch(e) {
 			throw (e);
 		}
 	};
 
}))


// Define how Passport sets up a session for the user
passport.serializeUser((user, done) => {
	console.log(user)
	done(null, user.username)
})


passport.deserializeUser((id, cb) => {
	console.log(id)
	pool.query('SELECT id, username FROM users WHERE username = $1', [id], (err, results) => {
		if (err) {
			winston.error('Error when selecting user on session deserialize', err)
			return cb(err)
		}

		cb(null, results.rows[0])
	})
})


//app.get('/', (request, response) => {
//	pool.query('SELECT * FROM boring_table', (err, results) => {
//		if (err) {
//			throw err
//		}
	
//		response.status(200).send(results.rows[0])
//	})
//})


// Let's start listening for shit and get this server running
app.listen(port, () => {
	console.log(`Server running at localhost ${port}`)
})


/************************************************************
 * Routes
 ************************************************************/

app.get('/', (request, response) => {
	if (isAuthenticated(request)) {
		response.render('mainLogin', {username: request.session.passport.user, layout: 'base.handlebars'})
	}
	else {
		response.render('mainNoLogin', {layout : 'base.handlebars'})
	}
})


app.get('/login', (request, response) => {
	response.redirect('/')
})

app.post('/login', passport.authenticate('local', {failureRedirect: '/loginFail', failureFlash: false}), (request, response) => {
	console.log(request.session)
	response.redirect('/loggedIn')
})


app.get('/loggedIn', (request, response) => {
	response.render('loggedIn', {layout: 'base.handlebars'})
})


app.get('/loginFail', (request, response) => {
	response.render('loginFail', {layout: 'base.handlebars'})
})


app.get('/logout', function(request, response){
  request.logout();
  response.render('logout', {layout: 'base.handlebars'})
})


/************************************************************
 * Helper functions
 ************************************************************/
function isAuthenticated(request)
{
	return request.session.passport && request.session.passport.user
}
