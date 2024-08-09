function makeReq(path, data, method, callback) {
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    };
    xmlHttp.open(method, path, true);
    xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlHttp.send(data);
}

function displayLeaderboard(leaderboard) {
    const leaderboardContainer = document.getElementById('leaderboard');

    leaderboardContainer.innerHTML = '';

    // table header
    // const leaderboardItem = document.createElement('div');
    // leaderboardItem.classList.add('leaderboard-item');
    // leaderboardItem.innerHTML = `
    //     <span class="rank">Rank</span>
    //     <span class="team">Team Name</span>
    //     <span class="score">Score</span>
    // `;
    // leaderboardContainer.appendChild(leaderboardItem);

    // table rows
    leaderboard.forEach((team, index) => {
        const rank = index + 1;
        const teamName = team.teamname;
        let score;
        if (team.votecount === 0) {
            score = 0.00;
        } else {
            score = team.score / team.votecount;
        }

        const leaderboardItem = document.createElement('div');
        leaderboardItem.classList.add('leaderboard-item');
        leaderboardItem.innerHTML = `
            <span class="rank">${rank}</span>
            <span class="team">${teamName}</span>
            <span class="score">${(score * 100).toFixed(1)}</span>
        `;

        leaderboardContainer.appendChild(leaderboardItem);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    makeReq('/top/', "", "GET", responseText => {
        teams = JSON.parse(responseText).teams
        displayLeaderboard(teams)
    })
});
