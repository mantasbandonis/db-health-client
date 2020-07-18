const cosmos = require("@azure/cosmos");
const express = require("express")

//This index.js is the Servers javascript file. The client never sees this code
//ATTENTION YOU need test data to make it work - see addition data.json file

var app = express();
//app.use(express.static('public'));

//global database vars
// Database and container IDs
const databaseId = "ToDoList";
const containerId = "Items";

// Configure database access URI and primary key (enter your COSMOS DB values here xxxxx)
const endpoint = "https://dbsm.documents.azure.com:443/";
const authKey = "pVMzFbxG3nsLkjWvxNmEpLwNEfRwE8fw9JFKwraacZagAZX4N9jyiQJAFvppfqrSiJdDzDmk1LLRUX3hlzUMPw==";


var dbResponse;
var dbContainer;
const cosmosClient = initDb();


app.use(express.static('public'));
app.use("/", express.static(__dirname + '/index.html'));

app.get('/rest/users/:userId/sessions', async function (req, res) {
	var sqlStmtSession = `SELECT * FROM Session s WHERE s.userid=@userId AND s.table=\"session\"`;
	var sqlResSession = await queryDb(sqlStmtSession, [{ name: "@userId", value: parseInt(req.params.userId, 10) }]);
	res.json(sqlResSession);
});

app.get('/rest/users', async function (req, res) {
	var sqlStatement = "SELECT * FROM User u WHERE u.table=\"user\"";
	var sqlResult = await queryDb(sqlStatement);
	res.json(sqlResult);
});

app.post('/rest/create-random-session', async function (req, res) {
	const sqlStatement = "SELECT * FROM User u WHERE u.table=\"user\"";
	const sqlResult = await queryDb(sqlStatement);
	const randomUserIndex = Math.floor(Math.random() * sqlResult.length);
	const randomUser = sqlResult[randomUserIndex];
	const latestSessionQuery = 'SELECT * FROM Session s WHERE s.table=\"session\" ORDER BY s.sessionid DESC OFFSET 0 LIMIT 1';
	const lastestSessionResult = await queryDb(latestSessionQuery);
	const latestSessionDataQuery = 'SELECT * FROM SessionData s WHERE s.table=\"sessiondata\" ORDER BY s.sessiondataid DESC OFFSET 0 LIMIT 1';
	const lastestSessionDataResult = await queryDb(latestSessionDataQuery);
	const sessionId = lastestSessionResult[0].sessionid + 1;
	let sessionDataId = lastestSessionDataResult[0].sessiondataid + 1;
	debugger;
	let newSession = {
		userid: randomUser.userid,
		sessionid: sessionId,
		table: "session",
		name: "Random session " + sessionId
	};
	const response = await dbContainer.items.create(newSession);
	for (let i = 0; i < 3; ++i) {
		let newSessionData = {
			"sessiondataid": sessionDataId++,
			"sessionid": sessionId,
			"table": "sessiondata",
			"parameter1": Math.floor(Math.random() * 1000).toString(),
			"parameter2": Math.floor(Math.random() * 1000).toString(),
			"parameter3": Math.floor(Math.random() * 1000).toString()
		};
		const response = await dbContainer.items.create(newSessionData);
	}

	res.json({
		user: {
			name: randomUser.name,
			id: randomUser.id
		},
		session: {
			id: sessionId,
			name: "Random session " + sessionId
		}
	});
});

app.get('/rest/usersessions/:id/details', async function (req, res) {
	var sqlStmtSessionData = 'SELECT * FROM SessionData sd WHERE sd.sessionid=@sessionId AND sd.table=\"sessiondata\"';
	var sqlResSessionData = await queryDb(sqlStmtSessionData, [{ name: "@sessionId", value: parseInt(req.params.id, 10) }]);
	res.json(sqlResSessionData);
})

app.get('/rest/usersessions/latest', async function (req, res) {
	var sqlStmtSessionData = 'SELECT * FROM Session s WHERE s.table=\"session\" ORDER BY s.sessionid DESC OFFSET 0 LIMIT 1';
	var sqlResSessionData = await queryDb(sqlStmtSessionData);
	res.json(sqlResSessionData[0]);
})

//start the server
app.listen(3000, function () {
	console.log('Example app listening on port 3000!');

});

async function initDb() {
	console.log("init db");
	// Instantiate the cosmos client, based on the endpoint and authorization key
	const cosmosClient = new cosmos.CosmosClient({
		endpoint: endpoint,
		auth: { masterKey: authKey },
		consistencyLevel: "Session"
	});

	if (cosmosClient != null) {
		try {
			// Open a reference to the database			
			dbResponse = await cosmosClient.databases.createIfNotExists({ id: databaseId });
			var { container } = await dbResponse.database.containers.createIfNotExists({ id: containerId });
			dbContainer = container;

		} catch (error) {
			console.log(error);

			return null;
			//res.status(500).send("Error with database query: " + error.body);
		}
	}
	return cosmosClient;
}


async function queryDb(sqlQueryStr, parameters) {

	if (cosmosClient != null) {
		try {
			const queryResponse = await dbContainer.items.query({ query: sqlQueryStr, parameters: parameters }).toArray();

			//res.send(strResponse);
			// ... (we will add more code here!)
			//res.send("DB interface Working!");
			return queryResponse.result;
		} catch (error) {
			console.log(error);

			return null;
			//res.status(500).send("Error with database query: " + error.body);
		}
	}
}