"""End-to-end API smoke test for SchedFlow (run against localhost:8000)."""
import json
import urllib.request

BASE = "http://localhost:8000/api"
token = None


def call(method, path, body=None, auth=False, expect_error=False):
    global token
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header("Content-Type", "application/json")
    if auth and token:
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


passed = []

# 1. auth
code, r = call("POST", "/auth/login", {"email": "admin@schedflow.edu", "password": "admin123"})
token = r["access_token"]
passed.append("login returns JWT")
code, r = call("GET", "/auth/me", auth=True)
assert r["email"] == "admin@schedflow.edu"
passed.append("auth/me works")

# wrong password rejected
code, _ = call("POST", "/auth/login", {"email": "admin@schedflow.edu", "password": "wrong"}, expect_error=True)
assert code == 401
passed.append("wrong password -> 401")

# unauthenticated access blocked
code, _ = call("GET", "/teachers", expect_error=True)
assert code == 401
passed.append("master data requires auth")

# 2. reference data
code, teachers = call("GET", "/teachers", auth=True)
code, subjects = call("GET", "/subjects", auth=True)
code, rooms = call("GET", "/rooms", auth=True)
code, sections = call("GET", "/sections", auth=True)
lab = next(s for s in subjects if s["requires_lab"])
theory = next(s for s in subjects if not s["requires_lab"])
classroom = next(r for r in rooms if r["room_type"] == "classroom")
labroom = next(r for r in rooms if r["room_type"] == "lab")
passed.append(f"seed data present ({len(teachers)} teachers, {len(subjects)} subjects, {len(rooms)} rooms)")

# 3. create timetable for section A
sec_a = sections[0]
code, tt = call("POST", "/timetables", {
    "department_id": sec_a["department_id"],
    "semester_id": sec_a["semester_id"],
    "section_id": sec_a["id"],
    "notes": "smoke test",
}, auth=True)
tt_id = tt["id"]
passed.append(f"timetable created (id={tt_id})")

# 4. assign a valid entry
code, r = call("POST", f"/timetables/{tt_id}/entries", {
    "day_of_week": 1, "period": 1,
    "subject_id": theory["id"], "teacher_id": teachers[0]["id"], "room_id": classroom["id"],
}, auth=True)
assert not r["conflicts"], r["conflicts"]
entry_id = r["entry"]["id"]
passed.append("valid entry saved with no conflicts")

# 5. duplicate slot in same timetable rejected
code, _ = call("POST", f"/timetables/{tt_id}/entries", {
    "day_of_week": 1, "period": 1,
    "subject_id": theory["id"], "teacher_id": teachers[1]["id"], "room_id": classroom["id"],
}, auth=True, expect_error=True)
assert code == 409
passed.append("duplicate slot in same timetable -> 409")

# 6. create second timetable (section B) and detect teacher clash
code, tt2 = call("POST", "/timetables", {
    "department_id": sec_a["department_id"],
    "semester_id": sec_a["semester_id"],
    "section_id": sections[1]["id"],
}, auth=True)
code, r = call("POST", f"/timetables/{tt2['id']}/entries", {
    "day_of_week": 1, "period": 1,
    "subject_id": theory["id"], "teacher_id": teachers[0]["id"], "room_id": classroom["id"],
}, auth=True)
types = {c["type"] for c in r["conflicts"]}
assert "teacher" in types and "room" in types, r["conflicts"]
passed.append("cross-timetable teacher + room clash detected")

# 7. lab mismatch + teacher availability + workload
code, r = call("PUT", f"/timetables/{tt2['id']}/entries/{r['entry']['id']}", {
    "day_of_week": 6, "period": 8,
    "subject_id": lab["id"], "teacher_id": teachers[1]["id"], "room_id": classroom["id"],
}, auth=True)
types = {c["type"] for c in r["conflicts"]}
assert "lab" in types, r["conflicts"]
assert "availability" in types, r["conflicts"]
passed.append("lab mismatch + teacher unavailability detected")

# 8. publish blocked while conflicts exist
code, r = call("POST", f"/timetables/{tt2['id']}/publish", auth=True, expect_error=True)
assert code == 409
passed.append("publish blocked while conflicts exist")

# 9. fix conflicts, publish, verify public view
code, entries = call("GET", f"/timetables/{tt2['id']}/entries", auth=True)
for e in entries:
    call("DELETE", f"/timetables/{tt2['id']}/entries/{e['id']}", auth=True)
call("POST", f"/timetables/{tt2['id']}/entries", {
    "day_of_week": 2, "period": 1,
    "subject_id": theory["id"], "teacher_id": teachers[0]["id"], "room_id": classroom["id"],
}, auth=True)
code, r = call("POST", f"/timetables/{tt2['id']}/publish", auth=True)
assert r["status"] == "published" and r["version"] == 2
passed.append("publish succeeds after fixes (v2)")

code, pub = call("GET", "/public/timetable?department=CSE&semester=3&section=B")
assert pub["entries"] and pub["entries"][0]["teacher_name"]
passed.append("public endpoint returns published timetable with details")

# 10. workload endpoint
code, wl = call("GET", "/teachers-workload", auth=True)
passed.append(f"teachers-workload endpoint ({wl[0]['assigned_periods']} periods for {wl[0]['name']})")

print("\nPASS — %d checks:" % len(passed))
for p in passed:
    print("  ✓", p)
