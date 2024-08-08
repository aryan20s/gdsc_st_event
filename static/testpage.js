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

function create_team() {
    const team_name = document.getElementById("create_teamname_tb").value;
    const team_m1 = document.getElementById("create_teamm1_tb").value;
    const team_m2 = document.getElementById("create_teamm2_tb").value;
    const team_m3 = document.getElementById("create_teamm3_tb").value;
    const team_m4 = document.getElementById("create_teamm4_tb").value;

    makeReq("/create/", `{"team_name": "${team_name}", "member1": "${team_m1}", ` + 
        `"member2": "${team_m2}", "member3": "${team_m3}", "member4": "${team_m4}"}`, "POST", responseText => {
        let jsonData = JSON.parse(responseText);
        if (jsonData.status !== "ok") {
            setMessage(true, jsonData.message);
        } else {
            setMessage(false, "Team created succesfully!");
        }
    })
}

function setMessage(error, message) {
    let errorMessageDiv = document.getElementById('error_message');
    let successMessageDiv = document.getElementById('success_message');
    if (error) {
        successMessageDiv.style.display = 'none';
        errorMessageDiv.style.display = 'block';
        errorMessageDiv.innerText = 'Error: ' + message;
    } else {
        errorMessageDiv.style.display = 'none';
        successMessageDiv.style.display = 'block';
        successMessageDiv.innerText = message;
    }
}

function vote_for_team(score) {
    const value = `; ${document.cookie}`;
    const parts = value.split("; voted=");
    let team_voted = null;
    if (parts.length === 2) team_voted = parts.pop().split(';').shift();

    if (team_voted !== null) {
        setMessage(true, "You cannot vote for another minute!");
    } else {
        setMessage(false, "Voting...");
        makeReq("/vote/", `{"vote": ${score}}`, "POST", responseText => {
            let jsonData = JSON.parse(responseText);
            if (jsonData.status !== "ok") {
                setMessage(true, jsonData.message);
            } else {
                setMessage(false, "Vote succesfully registered!");
            }
        });
    }
}

function get_current_team() {
    let retVal = null;

    makeReq(`/current/`, "", "GET", responseText => {
        jsonData = JSON.parse(responseText);
        retVal = jsonData.getElementById("team_name")
    })
}

function get_top_teams() {
    makeReq(`/top/`, "", "GET", responseText => {
        const out_tb = document.getElementById("top_out");
        out_tb.value = JSON.stringify(JSON.parse(responseText), null, 4);
    })
}