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

function change_team() {
    const pass = document.getElementById("pass_tb").value;
    const team_id = Number(document.getElementById("change_teamid_tb").value);

    makeReq("/change/", `{"team_id": ${team_id}, "pass": "${pass}"}`, "POST", responseText => {
        const out_tb = document.getElementById("change_out");
        out_tb.value = JSON.stringify(JSON.parse(responseText), null, 4);
    })
}

function delete_team() {
    const pass = document.getElementById("pass_tb").value;
    const team_id = Number(document.getElementById("delete_teamid_tb").value);

    makeReq("/delete/", `{"team_id": ${team_id}, "pass": "${pass}"}`, "POST", responseText => {
        const out_tb = document.getElementById("delete_out");
        out_tb.value = JSON.stringify(JSON.parse(responseText), null, 4);
    })
}

function toggle_pages() {
    const pass = document.getElementById("pass_tb").value;
    const enable_voting = document.getElementById("enable_voting").checked;
    const enable_create = document.getElementById("enable_create").checked;

    makeReq("/togglepages/", `{"enable_voting": ${enable_voting}, "enable_create": ${enable_create}, "pass": "${pass}"}`, "POST", responseText => {
        const out_tb = document.getElementById("toggle_pages_out");
        out_tb.value = JSON.stringify(JSON.parse(responseText), null, 4);
    })
}

function get_all() {
    const pass = document.getElementById("pass_tb").value;

    makeReq("/getall/", `{"pass": "${pass}"}`, "POST", responseText => {
        const out_tb = document.getElementById("get_all_out");
        out_tb.value = JSON.stringify(JSON.parse(responseText), null, 4);
    })
}

function reset_all() {
    if (confirm("Are you SURE you want to reset all data?") && confirm("Are you REALLY sure?")) {
        const pass = document.getElementById("pass_tb").value;

        makeReq("/resetall/", `{"pass": "${pass}"}`, "POST", responseText => {
            const out_tb = document.getElementById("resetall_out");
            out_tb.value = JSON.stringify(JSON.parse(responseText), null, 4);
        })
    }
}