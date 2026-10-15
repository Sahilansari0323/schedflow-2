"""End-to-end tests for the advanced features: solver generator, teacher portal, projector, assistant, mail config."""
import json
import urllib.request

BASE = "http://localhost:8000/api"
token = None
teacher_token = None


def call(method, path, body=None, auth=True, token_override=None, expect_error=False):
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header("Content-Type", "application/json")
    tok = token_override if token_override is not None else token
    if auth and tok:
        req.add_header("Authorization", f"Bearer {tok}")
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(req, data) as res:
            return res.status, json.loads(res.read() or b"null")
    except urllib.error.HTTPError as e:
        payload = json.loads(e.read() or b"null") if e.read() else None
        if not expect_error:
            raise AssertionError(f"{method} {path} -> {e.code}: {payload}")
        return e.code, payload


ok = []
code, r = call("POST", "/auth/login", {"email": "admin@schedflow.edu", "password": "admin123"}, auth=False)
token = r["access_token"]

# ---------- 1) solver-grade generator ----------
code, sections = call("GET", "/sections")
sec_a = sections[0]
code, r = call("POST", "/timetables", {
    "department_id": sec_a["department_id"], "semester_id": sec_a["semester_id"], "section_id": sec_a["id"],
})
tt_id = r["id"]
code, gen = call("POST", f"/timetables/{tt_id}/generate")
assert gen["solver"] in ("solved", "best-partial", "no-teachers", "no-rooms"), gen
assert gen["placed"] == gen["total"] and gen["placed"] >= 3, gen
code, conflicts = call("GET", f"/timetables/{tt_id}/validate")
assert conflicts == [], conflicts
# spread constraint: no subject more than 2 times on any day
from collections import defaultdict
code, entries = call("GET", f"/timetables/{tt_id}/entries")
per_day = defaultdict(int)
subj_by_id = {s["id"]: s["code"] for s in call("GET", "/subjects")[1]}
for e in entries:
    per_day[(subj_by_id[e["subject_id"]], e["day_of_week"])] += 1
assert all(v <= 2 for v in per_day.values()), dict(per_day)
ok.append(f"solver placed {gen['placed']}/{gen['total']} classes ({gen['solver']}, {gen.get('nodes_explored', 0)} nodes), spread cap respected")

# ---------- 7) projector ----------
code, r = call("POST", "/rooms", {
    "name": "C201", "room_type": "classroom", "capacity": 80, "has_projector": True,
    "department_id": sec_a["department_id"],
})
assert r["has_projector"] is True
code, av = call("GET", "/availability?day=1&period=1&has_projector=true")
assert all(rm["has_projector"] for rm in av["rooms"]) and any(rm["name"] == "C201" for rm in av["rooms"])
code, av_all = call("GET", "/availability?day=1&period=1&has_projector=false")
assert all(not rm["has_projector"] for rm in av_all["rooms"])
ok.append(f"projector flag stored + filter works ({len(av['rooms'])} projector rooms, {len(av_all['rooms'])} without)")

# ---------- 10) assistant ----------
code, r = call("POST", "/assistant/ask", {"message": "which rooms are free on monday period 3?"})
assert "free" in r["reply"].lower() and "C201" in r["reply"]
ok.append(f"assistant room query: {r['reply'][:60]}...")
code, r = call("POST", "/assistant/ask", {"message": "any conflicts right now?"})
assert "conflict" in r["reply"].lower()
code, r = call("POST", "/assistant/ask", {"message": "who is free on monday p1?"})
assert "teacher(s) free" in r["reply"] or "free on Monday" in r["reply"]
code, r = call("POST", "/assistant/ask", {"message": "what does section A have on monday?"})
assert "Section A on Monday" in r["reply"] and "CS" in r["reply"]
code, r = call("POST", "/assistant/ask", {"message": "rooms with projector free on monday period 3?"})
assert "C201" in r["reply"] and "projector" in r["reply"]
code, r = call("POST", "/assistant/ask", {"message": "how many classes does meera have this week?"})
assert "Meera" in r["reply"] and "class" in r["reply"]
ok.append(f"assistant teacher query: {r['reply'][:70]}...")

# ---------- 3) teacher portal ----------
code, r = call("POST", "/auth/login", {"email": "meera@schedflow.edu", "password": "teacher123"}, auth=False)
assert "access_token" in r
teacher_token = r["access_token"]
assert r["user"]["role"] == "teacher"
code, me = call("GET", "/teacher/me", token_override=teacher_token)
assert me["teacher"]["name"] == "Dr. Meera Iyer"
code, sched = call("GET", "/teacher/me/schedule", token_override=teacher_token)
assert "assigned_periods" in sched and "entries" in sched
ok.append("teacher login (meera@schedflow.edu) reaches personal portal data")

# teacher must be BLOCKED from admin APIs
code, _ = call("GET", "/teachers", token_override=teacher_token, expect_error=True)
assert code == 403
code, _ = call("GET", "/analytics", token_override=teacher_token, expect_error=True)
assert code == 403
# ...and can read own notifications
code, notes = call("GET", "/notifications", token_override=teacher_token)
assert "unread" in notes
ok.append("teacher blocked from admin APIs (403) but can read notifications")

# staff cannot enter teacher portal
code, _ = call("GET", "/teacher/me", expect_error=True)
assert code == 403

# ---------- settings: create another linked teacher user ----------
code, teachers = call("GET", "/teachers")
arjun = next(t for t in teachers if "Arjun" in t["name"])
code, r = call("POST", "/settings/users", {
    "name": "Prof. Arjun Rao", "email": "arjun.portal@schedflow.edu",
    "password": "arjun123", "role": "teacher", "teacher_id": arjun["id"],
})
assert r["role"] == "teacher" and r["teacher_id"] == arjun["id"]
code, _ = call("POST", "/settings/users", {
    "name": "Dup", "email": "arjun2@schedflow.edu", "password": "abc1234",
    "role": "teacher", "teacher_id": arjun["id"],
}, expect_error=True)
assert code == 409  # one portal account per teacher
ok.append("teacher-linked portal user created via settings; duplicate link rejected")

# ---------- activation cycle: deactivate -> blocked login -> activate -> works ----------
code, users = call("GET", "/settings/users")
assert all("is_active" in u for u in users), "is_active must be exposed to the UI"
portal = next(u for u in users if u["email"] == "arjun.portal@schedflow.edu")
code, r = call("POST", "/auth/login", {"email": "arjun.portal@schedflow.edu", "password": "arjun123"}, auth=False)
assert "access_token" in r  # works while active
code, _ = call("PUT", f"/settings/users/{portal['id']}/status", {"is_active": False})
code, _ = call("POST", "/auth/login", {"email": "arjun.portal@schedflow.edu", "password": "arjun123"}, auth=False, expect_error=True)
assert code == 403
code, _ = call("PUT", f"/settings/users/{portal['id']}/status", {"is_active": True})
code, r = call("POST", "/auth/login", {"email": "arjun.portal@schedflow.edu", "password": "arjun123"}, auth=False)
assert "access_token" in r
ok.append("deactivate blocks sign-in, Activate restores it — teacher logs in again")

# ---------- mail config ----------
code, mail = call("GET", "/settings/mail")
assert mail["enabled"] is False and "not configured" in mail["host"]
ok.append("mail status reports SMTP off (emails logged, not sent) until configured")

print("PASS — %d checks:" % len(ok))
for line in ok:
    print("  ✓", line)
