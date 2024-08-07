function makeReq(path, method, callback) {
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    };
    xmlHttp.open(method, document.getElementById("url_tb").value + path, true);
    xmlHttp.send();
}

function create_team() {
    const team_name = document.getElementById("create_teamname_tb").value;
    const team_m1 = document.getElementById("create_teamm1_tb").value;
    const team_m2 = document.getElementById("create_teamm2_tb").value;
    const team_m3 = document.getElementById("create_teamm3_tb").value;
    const team_m4 = document.getElementById("create_teamm4_tb").value;

    makeReq(`/create/{"team_name": "${team_name}", "member1": "${team_m1}", ` + 
        `"member2": "${team_m2}", "member3": "${team_m3}", "member4": "${team_m4}"}`, "POST", responseText => {
        const out_tb = document.getElementById("create_out");
        out_tb.value = JSON.stringify(JSON.parse(responseText), null, 4);
    })
}

function vote_for_team(score) {
    makeReq(`/vote/{"vote": ${score}}`, "POST", responseText => {
        const out_tb = document.getElementById("vote_out");
        out_tb.value = JSON.stringify(JSON.parse(responseText), null, 4);
    })
}

function get_current_votes() {
    makeReq(`/current/`, "GET", responseText => {
        const out_tb = document.getElementById("current_out");
        out_tb.value = JSON.stringify(JSON.parse(responseText), null, 4);
    })
}

function get_top_teams() {
    makeReq(`/top/`, "GET", responseText => {
        const out_tb = document.getElementById("top_out");
        out_tb.value = JSON.stringify(JSON.parse(responseText), null, 4);
    })
}