//This index.js is the Servers javascript file. The client never sees this code
//ATTENTION YOU need test data to make it work - see addition data.json file

//global express vars
var express = require('express');
var app = express();
app.use(express.static('public'));

//global database vars
// Database and container IDs
const databaseId = "ToDoList";
const containerId = "Items";

// Configure database access URI and primary key (enter your COSMOS DB values here xxxxx)
const endpoint = "https://xxxxx.documents.azure.com:443/";
const authKey = "xxxx";


var CosmosClientInterface;
var cosmosClient;
var dbResponse;
var dbContainer;
initDb();




//ROUTE - USER LIST  - this is the root page called with localhost:3000 
app.get('/', async function (req, res) {
	console.log("ROUTE# http://localhost:3000 (root)");
	var htmlString = getHtmlTemplateHeader();
	/*with this you can send a string or HTML code as server response */
	//res.send('Hello world');
	/*with this you can send a static page as server response */
	//res.sendFile('public/page-start.html', {root: __dirname});
	var sqlStatement = "SELECT * FROM User u WHERE u.table=\"user\"";
	var sqlResult = await queryDb(sqlStatement);
	if (sqlResult.length == 0) {
		
		htmlString+="No Data found for statement "+ sqlStatement;
	} else {
		var htmlString = getHtmlTemplateHeader();
		htmlString+= `
		<table class="table table-striped">
		  <thead>
			<tr>
			  <th scope="col">#</th>
			  <th scope="col">Name</th>
			  <th scope="col">Age</th>
			  <th scope="col">Show</th>
			  <th scope="col">AddRandom</th>
			</tr>
		  </thead>
		  <tbody>
		`;
		
		for (var i = 0; i < sqlResult.length; i++) {
			var tableRow = `<tr>
			<th scope="row">${sqlResult[i].userid}</th>
			<td>${sqlResult[i].name}</td>
			<td>${sqlResult[i].age}</td>
			<td><a href="/usersession?userid=${sqlResult[i].userid}&username=${sqlResult[i].name}" class="btn btn-info" role="button">Show</a></td>
			<td><a href="/addrandom?userid=${sqlResult[i].userid}" class="btn btn-info" role="button">AddRandomDataToLastSession</a></td>
			</tr>`;
			htmlString+=tableRow;
		}			 
	
		htmlString+= `			
		  </tbody>
		</table>
		`;	
	}
	
	htmlString+= getHtmlTemplateFooter();
	res.send(htmlString);
});


//ROUTE - SINGLE USER - this is the root page called with localhost:3000/page-usersession?userid=1 etc...
app.get('/usersession', async function (req, res) {
	console.log("ROUTE# http://localhost:3000/usersession");
	var htmlString = getHtmlTemplateHeader();
	// you get the user id from the url string like http://localhost:3000/usersession?userid=1 with req.params.userid
	
	var sqlStmtSession = `SELECT * FROM Session s WHERE s.userid=${req.query.userid} AND s.table=\"session\"`;
	var sqlResSession = await queryDb(sqlStmtSession);
	console.log(sqlStmtSession);
	
	if (sqlResSession.length == 0) {
		htmlString+="No Data found for statement "+ sqlStmtSession;

	} else {
		//print a JSON
		//htmlString+="<pre>" + JSON.stringify(sqlResult, null, 2) + "</pre>";
		
		htmlString+=`<h3>User:${req.query.username} Session Data</h3>`;
		
		for (var i = 0; i < sqlResSession.length; i++) {
			var sessionName = sqlResSession[i].name;
			var sessionId = sqlResSession[i].sessionid;
			
			htmlString+= `<p><strong>Session Name: ${sessionName} (SessionId: ${sessionId})</strong></p>`;
			var sqlStmtSessionData = `SELECT * FROM SessionData sd WHERE sd.sessionid=${sessionId} AND sd.table=\"sessiondata\"`;
			var sqlResSessionData = await queryDb(sqlStmtSessionData);
			console.log(sqlStmtSessionData);
			//console.log(sqlResSessionData);
				
			if (sqlResSessionData.length == 0) {
				htmlString+="No Data found for statement "+ sqlStmtSession;
			} else {
				for (var j = 0; j < sqlResSessionData.length; j++) {
					var line = `DataItem ${sqlResSessionData[j].sessiondataid} ${sqlResSessionData[j].parameter1} ${sqlResSessionData[j].parameter2} ${sqlResSessionData[j].parameter3}<br>`;
					console.log(line);
					htmlString+= line;
				}
			}
		}
		
		htmlString+=`<a href="/" class="btn btn-info" role="button">Back</a>`;
	}
	
	htmlString+= getHtmlTemplateFooter();
	res.send(htmlString);
	
});


app.get('/addrandom', async function (req, res) {
	console.log("ROUTE# http://localhost:3000/addrandom");
	
	var sqlStmtSession = `SELECT * FROM Session s WHERE s.userid=${req.query.userid} AND s.table=\"session\" ORDER BY s.sessionid DESC`;
	var sqlResSession = await queryDb(sqlStmtSession);
	console.log(sqlStmtSession);
	//console.log(sqlResSession);
	
	//get ID of highest session
	if (sqlResSession.length != 0) {
		console.log(sqlResSession[0].sessionid);
		var sessionIdMax = sqlResSession[0].sessionid;
		console.log(`highest sessionid: ${sessionIdMax}`);
		
		
		var sqlStmtSessionData = `SELECT * FROM SessionData sd WHERE sd.sessionid=${sessionIdMax} AND sd.table=\"sessiondata\" ORDER BY sd.sessiondataid DESC`;
		
		
		var sqlResSessionData = await queryDb(sqlStmtSessionData);
		console.log(sqlStmtSessionData);
		//console.log(sqlResSessionData);
		if (sqlResSessionData.length != 0) {
			
			var sessionDataIdMax = sqlResSessionData[0].sessiondataid;
			console.log(`highest sessiondataid: ${sessionDataIdMax}`);
			
			 sessionDataIdMax++;
			
			const newItemId = Math.floor(Math.random() * 1000).toString();
			let documentDefinition = {
			  "sessiondataid": sessionDataIdMax,
			  "sessionid": sessionIdMax,
			  "table":"sessiondata",
			  "parameter1": Math.floor(Math.random() * 1000).toString(),
			  "parameter2": Math.floor(Math.random() * 1000).toString(),
			  "parameter3": Math.floor(Math.random() * 1000).toString()
			  };

			// Add a new item to the container
			console.log("** Create item **");
			console.log(documentDefinition);
			const createResponse = await dbContainer.items.create(documentDefinition);
			console.log(createResponse.body);
			
			
			
			//add data to latest session
		
		}
			
			
		
		
	}
	
	
	//route back to start
	res.redirect("/");


});




//start the server
app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
  
});




/*
	This getHtmlTemplateHeader contains all the html code until the body
*/
function getHtmlTemplateHeader() {
	
	var htmlString = 
	`
	<!doctype html>
	<html lang="en">
	  <head>
	  <!-- all bootstrap template from  https://getbootstrap.com/docs/4.3/getting-started/introduction/-->
		<!-- Required meta tags -->
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

		<!-- Bootstrap CSS -->
		<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">

		<!-- Optional JavaScript -->
		<!-- jQuery first, then Popper.js, then Bootstrap JS -->
		<script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossorigin="anonymous"></script>
		<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>


		<script src="script.js"></script>
		<title>DBSM Homework</title>
	  </head>
	  
	  <body>
		<h1>DBSM Homework</h1>	
	`;
	
	return htmlString;
	
}

/*
	This getHtmlTemplateFooter returns all the html code closing the body onward
*/
function getHtmlTemplateFooter() {
	
	var htmlString = 
	`	
	  </body>
	</html>
	`;
	
	return htmlString;
	
}


async function initDb() {
	console.log("init db");
	
	CosmosClientInterface = require("@azure/cosmos").CosmosClient;
	// Instantiate the cosmos client, based on the endpoint and authorization key
	cosmosClient = new CosmosClientInterface({
		endpoint: endpoint,
		auth: {masterKey: authKey},
		consistencyLevel: "Session"
	});
	
	if (cosmosClient != null) {
		try {
			// Open a reference to the database			
			dbResponse = await cosmosClient.databases.createIfNotExists({id: databaseId});
			var { container } = await dbResponse.database.containers.createIfNotExists({id: containerId});
			dbContainer = container;

		} catch (error) {
			console.log(error);
			
			return null;
			//res.status(500).send("Error with database query: " + error.body);
		}
	}
   
	
}

async function queryDb(sqlQueryStr) {
		
	if (cosmosClient != null) {
		try {
			const queryResponse = await dbContainer.items.query(sqlQueryStr).toArray();
			
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