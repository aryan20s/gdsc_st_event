function makeReq(path, method, callback) {
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    };
    xmlHttp.open(method, document.getElementById("url_tb").value + path, true);
    xmlHttp.send();
}

function change_team() {
    const pass = document.getElementById("pass_tb").value;
    const team_id = Number(document.getElementById("change_teamid_tb").value);

    makeReq(`/change/{"team_id": ${team_id}, "pass": "${pass}"}`, "POST", responseText => {
        const out_tb = document.getElementById("change_out");
        out_tb.value = JSON.stringify(JSON.parse(responseText), null, 4);
    })
}

function delete_team() {
    const pass = document.getElementById("pass_tb").value;
    const team_id = Number(document.getElementById("delete_teamid_tb").value);

    makeReq(`/delete/{"team_id": ${team_id}, "pass": "${pass}"}`, "POST", responseText => {
        const out_tb = document.getElementById("delete_out");
        out_tb.value = JSON.stringify(JSON.parse(responseText), null, 4);
    })
}

function get_all() {
    const pass = document.getElementById("pass_tb").value;

    makeReq(`/getall/{"pass": "${pass}"}`, "GET", responseText => {
        const out_tb = document.getElementById("get_all_out");
        out_tb.value = JSON.stringify(JSON.parse(responseText), null, 4);
    })
}