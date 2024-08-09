import sqlite3
import json
import hashlib
import os
import atexit

from flask import Flask, jsonify, request, make_response
from flask_sqlalchemy import SQLAlchemy

PASS_HASH = "fb74185cbe8adab9724de6f3c3bd6f3a56be8fed7784cee31ad26ce13b1a23dd"
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ["GDSC_ST_DB_FILE"]
db = SQLAlchemy(app)

cur_team = -1
voting_page_enabled = False
create_page_enabled = False


class Team(db.Model):
    def __init__(self, teamname, member1name, member2name, member3name, member4name):
        if member3name is None and member4name is not None:
            member3name = member4name
            member4name = None

        self.teamname = teamname
        self.member1name = member1name
        self.member2name = member2name
        self.member3name = member3name
        self.member4name = member4name
        self.score = 0
        self.votecount = 0
        self.voting_done = False

    __tablename__ = "teams"
    teamid = db.Column(db.Integer, primary_key=True)
    teamname = db.Column(db.String(256), unique=True)
    member1name = db.Column(db.String(256), nullable=False)
    member2name = db.Column(db.String(256), nullable=False)
    member3name = db.Column(db.String(256), nullable=True)
    member4name = db.Column(db.String(256), nullable=True)
    score = db.Column(db.Integer, nullable=False)
    votecount = db.Column(db.Integer, nullable=False)
    voting_done = db.Column(db.Boolean, nullable=False)

    # get jsonify-able representation
    def toDict(self):
        return {
            k: v for (k, v) in self.__dict__.items() if "_sa_instance_state" not in k
        }


def get_all_team_data():
    return list(db.session.query(Team))


def get_top_teams():
    res: list = get_all_team_data()
    res.sort(
        key=lambda x: ((x.score / x.votecount) if x.votecount != 0 else 0), reverse=True
    )
    return res


def get_team(team_id):
    return db.session.get(Team, team_id)


def add_team(team):
    q = db.session.query(Team).filter_by(teamname=team.teamname)
    exists = db.session.query(q.exists())
    if list(exists)[0][0]:
        return "Team with that name already exists!"
    db.session.add(team)
    db.session.commit()


def remove_team(team_id):
    team = db.session.get(Team, team_id)
    if team is None:
        return "Team does not exist!"
    db.session.delete(team)
    db.session.commit()

def set_voting_done():
    team = db.session.get(Team, cur_team)
    if team is None:
        return
    team.voting_done = True
    db.session.flush()
    db.session.commit()
    

def add_votes(score):
    team = db.session.get(Team, cur_team)
    if team is None:
        return "Team does not exist!"
    team.score += score
    team.votecount += 1
    db.session.flush()
    db.session.commit()


# create a team
@app.route("/create/", methods=["POST"])
def create_team():    
    json_input = request.get_json()

    # validate keys
    for key in ["team_name", *[f"member{x}" for x in range(1, 5)]]:
        if key not in json_input:
            return jsonify({"status": "error", "message": "!DEV missing data"}), 400

    if json_input["member1"] is None or json_input["member2"] is None:
        return jsonify({"status": "error", "message": "!DEV missing data"}), 400

    if not create_page_enabled:
        return jsonify({"status": "error", "message": "Team creation is not enabled!"})
        
    # create data tuple
    error = add_team(
        Team(
            json_input["team_name"],
            json_input["member1"],
            json_input["member2"],
            json_input["member3"],
            json_input["member4"],
        )
    )

    if error is None:
        resp = make_response(jsonify({"status": "ok"}))
        resp.set_cookie("teamcreated", "yes", max_age=3600)
        return resp
    else:
        return jsonify({"status": "error", "message": error})


# vote for a team
@app.route("/vote/", methods=["POST"])
def vote_team():    
    json_input = request.get_json()

    # validate keys
    for key in ["vote"]:
        if key not in json_input:
            return jsonify({"status": "error", "message": "!DEV missing data"}), 400

    vote_input = json_input["vote"]

    # validate data and current team
    if vote_input != 0 and vote_input != 1:
        return jsonify({"status": "error", "message": "!DEV invalid vote"}), 400

    if cur_team == -1 or not voting_page_enabled:
        return jsonify({"status": "error", "message": "Voting is not open!"})

    # add votes
    error = add_votes(vote_input)

    if error is None:
        resp = make_response(jsonify({"status": "ok"}))
        resp.set_cookie("voted", "yes", max_age=60)
        return resp
    else:
        return jsonify({"status": "error", "message": error})


# get votes for current team
@app.route("/current/", methods=["GET"])
def current_votes():
    if cur_team == -1:
        return jsonify({"status": "error", "message": "Voting is not open!"})

    cur_team_data: Team = get_team(cur_team)

    return jsonify(
        {
            "status": "ok",
            "team_name": cur_team_data.teamname,
            "votes_yes": cur_team_data.score,
            "votes_no": cur_team_data.votecount - cur_team_data.score,
        }
    )


# get top teams
@app.route("/top/", methods=["GET"])
def top_votes():
    res = get_top_teams()
    return jsonify({"status": "ok", "teams": [x.toDict() for x in res]})


# admin only route: change current team
@app.route("/change/", methods=["POST"])
def change_team():
    global cur_team

    json_input = request.get_json()

    # validate keys
    for key in ["team_id", "pass"]:
        if key not in json_input:
            return jsonify({"status": "error", "message": "!DEV missing data"}), 400

    team_id_input = json_input["team_id"]
    pass_input = json_input["pass"]

    # validate pass and then execute
    if hashlib.sha3_256(pass_input.encode("utf-8")).hexdigest() == PASS_HASH:
        if cur_team == team_id_input:
            return jsonify({"status": "error", "message": "That is already the current team!"})
        
        cur_team_data = get_team(cur_team)
        if cur_team_data is not None:
            if cur_team_data.votecount > 0:
                set_voting_done()
        
        new_team_data = get_team(team_id_input)
        if (new_team_data is None) and (team_id_input != -1):
            cur_team = -1
            return jsonify({"status": "error", "message": "Team does not exist!"})

        if new_team_data.voting_done:
            cur_team = -1
            return jsonify({"status": "error", "message": "Voting for this team has concluded!"})

        cur_team = team_id_input
        return jsonify({"status": "ok"})
    else:
        return jsonify({"status": "error", "message": "Wrong admin password!"})


# admin only route: delete a team
@app.route("/delete/", methods=["POST"])
def delete_team():
    global cur_team

    json_input = request.get_json()

    # validate keys
    for key in ["team_id", "pass"]:
        if key not in json_input:
            return jsonify({"status": "error", "message": "!DEV missing data"}), 400

    team_id_input = json_input["team_id"]
    pass_input = json_input["pass"]

    # validate pass and then execute
    if hashlib.sha3_256(pass_input.encode("utf-8")).hexdigest() == PASS_HASH:
        if team_id_input == cur_team:
            cur_team = -1
        error = remove_team(team_id_input)
    else:
        return jsonify({"status": "error", "message": "Wrong admin password!"})

    if error is None:
        return jsonify({"status": "ok"})
    else:
        return jsonify({"status": "error", "message": error})


# admin only route: get all data from all teams as json
@app.route("/getall/", methods=["POST"])
def get_all():
    json_input = request.get_json()

    # validate keys
    for key in ["pass"]:
        if key not in json_input:
            return jsonify({"status": "error", "message": "!DEV missing data"}), 400
    pass_input = json_input["pass"]

    # validate pass and then execute
    if hashlib.sha3_256(pass_input.encode("utf-8")).hexdigest() == PASS_HASH:
        return jsonify({"teams": [x.toDict() for x in get_all_team_data()]})
    else:
        return jsonify({"status": "error", "message": "Wrong admin password!"})

# admin only route: reset eevrything
@app.route("/togglepages/", methods=["POST"])
def toggle_pages():
    global voting_page_enabled, create_page_enabled
    
    json_input = request.get_json()

    # validate keys
    for key in ["enable_voting", "enable_create"]:
        if key not in json_input:
            return jsonify({"status": "error", "message": "!DEV missing data"}), 400
    pass_input = json_input["pass"]

    # validate pass and then execute
    if hashlib.sha3_256(pass_input.encode("utf-8")).hexdigest() == PASS_HASH:
        voting_page_enabled = bool(json_input["enable_voting"])
        create_page_enabled = bool(json_input["enable_create"])
        return jsonify({"status": "ok"})
    else:
        return jsonify({"status": "error", "message": "Wrong admin password!"})

# admin only route: reset eevrything
@app.route("/resetall/", methods=["POST"])
def reset_all():
    json_input = request.get_json()

    # validate keys
    for key in ["pass"]:
        if key not in json_input:
            return jsonify({"status": "error", "message": "!DEV missing data"}), 400
    pass_input = json_input["pass"]

    # validate pass and then execute
    if hashlib.sha3_256(pass_input.encode("utf-8")).hexdigest() == PASS_HASH:
        db.drop_all()
        db.create_all()
        db.session.commit()
        return jsonify({"status": "ok"})
    else:
        return jsonify({"status": "error", "message": "Wrong admin password!"})


# admin panel page
@app.route("/admin_panel_7b2b191f", methods=["GET", "POST"])
def admin_panel():
    return app.send_static_file("adminpanel.html")


# voting page
@app.route("/votingpage", methods=["GET", "POST"])
def voting_page():
    if not voting_page_enabled:
        return "Voting is not enabled!"
    return app.send_static_file("votingpage.html")


# creation page
@app.route("/createteam", methods=["GET", "POST"])
def create_team_page():
    if not create_page_enabled:
        return "Team creation is not enabled!"
    return app.send_static_file("createteam.html")


# live score page
@app.route("/livescore", methods=["GET", "POST"])
def live_score_page():
    return app.send_static_file("livescore.html")


# final leaderboard page
@app.route("/leaderboard", methods=["GET", "POST"])
def leaderboard_page():
    return app.send_static_file("leaderboard.html")
