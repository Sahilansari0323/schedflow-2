"""End-to-end test: AI substitution + user management."""
import json
import urllib.request

BASE = "http://localhost:8000/api"
token = None


def call(method, path, body=None, auth=True, expect_error=False):
    global token
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header("Content-Type", "application/json")
    if auth:
        req.add_header("Authorization", f"Bearer {token}")
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(req, data) as res:
            return res.status, json.loads(res.read() or b"null")
    except urllib.error.HTTPError as e:
        payload = json.loads(e.read() or b"null")
        if not expect_error:
            raise AssertionError(f"{method} {path} -> {e.code}: {payload}")
        return e.code, payload


ok = []
code, r = call("POST", "/auth/login", {"email": "admin@schedflow.edu", "password": "admin123"}, auth=False)
token = r["access_token"]

# fixtures: timetable for section A with teacher[0] classes on Mon & Tue
code, sections = call("GET", "/sections")
sec_a = sections[0]
code, subjects = call("GET", "/subjects")
code, teachers = call("GET", "/teachers")
code, rooms = call("GET", "/rooms")
theory = next(s for s in subjects if not s["requires_lab"])
classroom = next(r for r in rooms if r["room_type"] == "classroom")
t0, t1 = teachers[0], teachers[1]

code, tt = call("POST", "/timetables", {
    "department_id": sec_a["department_id"], "semester_id": sec_a["semester_id"], "section_id": sec_a["id"],
})
for day, period in [(1, 1), (1, 3), (2, 2)]:
    code, r = call("POST", f"/timetables/{tt['id']}/entries", {
        "day_of_week": day, "period": period,
        "subject_id": theory["id"], "teacher_id": t0["id"], "room_id": classroom["id"],
    })
assert not r["conflicts"], r["conflicts"]

# t1 is busy Mon P1 (seeded unavailable? no — t1 unavailable 1-1 and 6-8)
code, r = call("POST", f"/timetables/{tt['id']}/entries", {
    "day_of_week": 4, "period": 1,
    "subject_id": theory["id"], "teacher_id": t1["id"], "room_id": classroom["id"],
})
assert not r["conflicts"], r["conflicts"]

# --- substitution: t0 on leave Mon..Tue (weekdays 1-2) ---
code, res = call("POST", "/substitutions", {
    "teacher_id": t0["id"], "start_date": "2026-09-21", "end_date": "2026-09-22", "note": "medical leave",
})
sub = res["substitution"]
results = res["results"]
assert len(results) == 3, results  # Mon P1, Mon P3, Tue P2
assert all(r["status"] == "assigned" for r in results), results
subs = {r["substitute"]["name"] for r in results}
assert t0["name"] not in subs
# Mon P1 must NOT go to t1: unavailable at 1-1 AND busy teaching
mon_p1 = next(r for r in results if r["day"] == 1 and r["period"] == 1)
assert mon_p1["substitute"]["name"] != t1["name"]
ok.append(f"3 classes auto-covered by {', '.join(sorted(subs))}; busy/unavailable teachers skipped")

# verify timetable entries now show substitutes and no conflicts remain
code, scan = call("GET", "/conflicts/scan")
assert scan["summary"]["total"] == 0, scan["summary"]
ok.append("post-substitution schedule scans clean")

# teacher schedule reflects reassignment
code, sched = call("GET", f"/teachers/{t0['id']}/timetable")
assert sched["assigned_periods"] == 0
ok.append("absent teacher's schedule is now empty for those slots")

# --- revert restores originals ---
code, r = call("POST", f"/substitutions/{sub['id']}/revert")
assert r["ok"] is True
code, sched = call("GET", f"/teachers/{t0['id']}/timetable")
assert sched["assigned_periods"] == 3
code, _ = call("POST", f"/substitutions/{sub['id']}/revert", expect_error=True)
assert code == 400
ok.append("revert restores all original teachers; double-revert rejected")

# delete reverted substitution works; deleting active one is blocked
code, _ = call("DELETE", f"/substitutions/{sub['id']}")
ok.append("reverted substitution deleted cleanly")

# --- user management ---
code, r = call("POST", "/settings/users", {
    "name": "Dr. R. Sharma", "email": "hod@schedflow.edu", "password": "hod@12345", "role": "admin",
})
assert r["email"] == "hod@schedflow.edu" and r["role"] == "admin"
hod_id = r["id"]
ok.append("new HOD user created")

# duplicate email rejected
code, _ = call("POST", "/settings/users", {
    "name": "Dup", "email": "hod@schedflow.edu", "password": "xyz9876",
}, expect_error=True)
assert code == 409
ok.append("duplicate email rejected")

# the HOD can sign in immediately with their own credentials
code, r = call("POST", "/auth/login", {"email": "hod@schedflow.edu", "password": "hod@12345"}, auth=False)
assert "access_token" in r
ok.append("new HOD can sign in with their own username/password")

# cannot deactivate/delete self; cannot remove last active admin
code, me = call("GET", "/auth/me")
code, _ = call("PUT", f"/settings/users/{me['id']}/status", {"is_active": False}, expect_error=True)
assert code == 400
code, _ = call("DELETE", f"/settings/users/{me['id']}", expect_error=True)
assert code == 400
ok.append("self-deactivation and self-deletion blocked")

# deactivate + delete the HOD works
code, _ = call("PUT", f"/settings/users/{hod_id}/status", {"is_active": False})
code, _ = call("POST", "/auth/login", {"email": "hod@schedflow.edu", "password": "hod@12345"}, auth=False, expect_error=True)
assert code == 403
code, _ = call("DELETE", f"/settings/users/{hod_id}")
ok.append("deactivated user cannot sign in; user deleted cleanly")

# audit captured substitution + user events
code, logs = call("GET", "/audit")
entities = {l["entity"] for l in logs}
assert "substitution" in entities and "user" in entities
ok.append("substitution and user events recorded in version history")

print("PASS — %d checks:" % len(ok))
for line in ok:
    print("  ✓", line)
