const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');

const app = express();

// let cacheRosterData = null;

// TODO: Uncomment out line 13
// Refer to Picture Example Folder for help for below instructions. (hit the gear for settings, click projecgt settings, then click service accounts)
// In your firebase project settings it will give you an option to "create service account".
// This generates a service account json file. Download it, and put the file in this project. 
// Enter the path to your service account json file below where it says "REPLACE_WITH_SERVICE_ACCOUNT"
// If you need more help with this step go here: https://firebase.google.com/docs/admin/setup

const serviceAccount = require("./madden-companion-project-firebase-adminsdk-u16ts-0a223df9a2.json");

// TODO: Uncomment out line 17-21
// Enter your database url from firebase where it says <DATABASE_NAME> below.
// Refer to picture for reference. It's the 2nd property.
admin.initializeApp({
   credential: admin.credential.cert(serviceAccount),
   databaseURL: "https://madden-companion-project-default-rtdb.firebaseio.com"
 });

app.set('port', (process.env.PORT || 3001));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.get('*', (req, res) => {
    res.send('Madden Companion Exporter');
});

// app.get('/roster/get', (request, response) => {
//     res.send(cacheRosterData);
// })

app.post('/:username/:platform/:leagueId/leagueteams', (req, res) => {
    const db = admin.database();
    const ref = db.ref();
    const {
        params: { username, leagueId },
        body: { leagueTeamInfoList: teams },
    } = req;

    teams.forEach(team => {
        const teamRef = ref.child(
            `data/${username}/${leagueId}/teams/${team.teamId}`
        );
        teamRef.update(team);
    });

    res.sendStatus(200);
    });

app.post('/:username/:platform/:leagueId/standings', (req, res) => {
    const db = admin.database();
    const ref = db.ref();
    const {
        params: { username, leagueId },
        body: { teamStandingInfoList: teams },
    } = req;

    teams.forEach(team => {
        const teamRef = ref.child(
            `data/${username}/${leagueId}/teams/${team.teamId}`
        );
        teamRef.update(team);
    });

    res.sendStatus(200);
    });

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

app.post(
    '/:username/:platform/:leagueId/week/:weekType/:weekNumber/:dataType',
    (req, res) => {
        const db = admin.database();
        const ref = db.ref();
        const {
            params: { username, leagueId, weekType, weekNumber, dataType },
        } = req;
        const basePath = `data/${username}/${leagueId}/`;
        // "defense", "kicking", "passing", "punting", "receiving", "rushing"
        const statsPath = `${basePath}stats`;

        switch (dataType) {
            case 'schedules': {
                const weekRef = ref.child(
                    `${basePath}schedules/${weekType}/${weekNumber}`
                );
                const {
                    body: { gameScheduleInfoList: schedules },
                } = req;
                weekRef.update(schedules);
                break;
            }
            case 'teamstats': {
                const {
                    body: { teamStatInfoList: teamStats },
                } = req;
                teamStats.forEach(stat => {
                    const weekRef = ref.child(
                        `${statsPath}/${weekType}/${weekNumber}/${stat.teamId}/team-stats`
                    );
                    weekRef.update(stat);
                });
                break;
            }
            case 'defense': {
                const {
                    body: { playerDefensiveStatInfoList: defensiveStats },
                } = req;
                defensiveStats.forEach(stat => {
                    const weekRef = ref.child(
                        `${statsPath}/${weekType}/${weekNumber}/${stat.teamId}/player-stats/${stat.rosterId}`
                    );
                    weekRef.update(stat);
                });
                break;
            }
            default: {
                const { body } = req;
                const property = `player${capitalizeFirstLetter(
                    dataType
                )}StatInfoList`;
                const stats = body[property];
                stats.forEach(stat => {
                    const weekRef = ref.child(
                        `${statsPath}/${weekType}/${weekNumber}/${stat.teamId}/player-stats/${stat.rosterId}`
                    );
                    weekRef.update(stat);
                });
                break;
            }
        }

            res.sendStatus(200);
        });

// ROSTERS
app.post('/:username/:platform/:leagueId/freeagents/roster', (req, res) => {
    const db = admin.database();
    console.info('database object: ', db);
    const ref = db.ref();
    const {
        params: { username, leagueId, teamId }
    } = req;
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
        console.info('data event:', body);
        cacheRosterData = body;
    });
    req.on('end', () => {
        const { rosterInfoList } = JSON.parse(body);
        console.info('end', rosterInfoList);
        const dataRef = ref.child(
            `data/${username}/${leagueId}/freeagents`
        );
        const players = {};
        rosterInfoList.forEach(player => {
            players[player.rosterId] = player;
        });
        dataRef.set(players, error => {
            if (error) {
                console.log('Data could not be saved.' + error);
            } else {
                console.log('Data saved successfully.');
            }
        });
        res.sendStatus(200);
    });    
});

app.post('/:username/:platform/:leagueId/team/:teamId/roster', (req, res) => {
    const db = admin.database();
    const ref = db.ref();
    const {
        params: { username, leagueId, teamId },
        body: { rosterInfoList },
    } = req;
    const dataRef = ref.child(
        `data/${username}/${leagueId}/teams/${teamId}/roster`
    );
    const players = {};
    rosterInfoList.forEach(player => {
        players[player.rosterId] = player;
    });
    dataRef.set(players, error => {
        if (error) {
            console.log('Data could not be saved.' + error);
        } else {
            console.log('Data saved successfully.');
        }
    });
    res.sendStatus(200);
    });

app.listen(app.get('port'), () =>
    console.log('Madden Data is running on port', app.get('port'))
);
