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

function setMessage(error, message) {
    if (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: message,
            confirmButtonText: 'OK'
        });
    } else {
        Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: message,
            confirmButtonText: 'OK'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = '/';
            }
        });
    }
}

function create_team() {
    const value = `; ${document.cookie}`;
    const parts = value.split("; teamcreated=");
    let team_created = null;
    if (parts.length === 2) team_created = parts.pop().split(';').shift();

    if (team_created !== null) {
        setMessage(true, "You have already created a team!");
        return;
    }

    const team_name = document.getElementById("create_teamname_tb").value;
    const team_m1 = document.getElementById("create_teamm1_tb").value;
    const team_m2 = document.getElementById("create_teamm2_tb").value;
    const team_m3 = document.getElementById("create_teamm3_tb").value;
    const team_m4 = document.getElementById("create_teamm4_tb").value;

    if (team_name === "") {
        setMessage(true, "Team name must be specified!");
        return;
    }
    if (team_m1 === "") {
        setMessage(true, "Member 1 name must be specified!");
        return;
    }
    if (team_m2 === "") {
        setMessage(true, "Member 2 name must be specified!");
        return;
    }

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

function vote_for_team(score) {
    const value = `; ${document.cookie}`;
    const parts = value.split("; voted=");
    let team_voted = null;
    if (parts.length === 2) team_voted = parts.pop().split(';').shift();

    if (team_voted !== null) {
        setMessage(true, "You cannot vote again yet!");
        return;
    }

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

function get_top_teams() {
    makeReq(`/top/`, "", "GET", responseText => {
        const out_tb = document.getElementById("top_out");
        out_tb.value = JSON.stringify(JSON.parse(responseText), null, 4);
    })
}