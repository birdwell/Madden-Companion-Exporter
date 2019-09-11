const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

const app = express();

// TODO: Enter the path to your service account json file
// Need help with this step go here: https://firebase.google.com/docs/admin/setup
// const serviceAccount = require("./REPLACE_WITH_SERVICE_ACCOUNT.json");

// TODO: Enter your database url from firebase
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://<DATABASE_NAME>.firebaseio.com/"
// });

app.set('port', (process.env.PORT || 3001));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.get('*', (req, res) => {
    res.send('Madden Companion Exporter');
});

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
    }
);

// ROSTERS
app.post('/:username/:platform/:leagueId/freeagents/roster', (req, res) => {
    res.sendStatus(200);
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
