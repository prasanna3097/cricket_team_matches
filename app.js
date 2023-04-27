const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbPlayerToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertDbMatchToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT * 
    FROM player_details;`;
  const playerArray = await db.all(getPlayersQuery);
  response.send(
    playerArray.map((eachPlayer) => convertDbPlayerToResponseObject(eachPlayer))
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPLayerIdQuery = `
    SELECT * 
    FROM player_details
    WHERE player_id = ${playerId};`;
  const player = await db.get(getPLayerIdQuery);
  response.send(convertDbPlayerToResponseObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE player_details
    SET
        player_name = '${playerName}'
    WHERE player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT *
    FROM match_details
    WHERE match_id = ${matchId}`;
  const match = await db.get(getMatchQuery);
  response.send(convertDbMatchToResponseObject(match));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `
     SELECT *
     FROM player_match_score NATURAL JOIN match_details
     WHERE player_id = ${playerId};`;
  const playerMatchArray = await db.all(getPlayerMatchQuery);
  response.send(
    playerMatchArray.map((eachPlayer) =>
      convertDbMatchToResponseObject(eachPlayer)
    )
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
	    SELECT *
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id = ${matchId};`;
  const match = await db.all(getMatchPlayersQuery);
  response.send(
    match.map((eachPlayer) => convertDbPlayerToResponseObject(match))
  );
});
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const playerScore = await db.get(getPlayerScored);
  response.send(playerScore);
});

module.exports = app;
