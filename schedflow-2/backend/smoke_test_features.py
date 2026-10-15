"""End-to-end tests for the nine new features."""
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

code, sections = call("GET", "/sections")
sec_a, sec_b = sections[0], sections[1]
code, teachers = call("GET", "/teachers")
code, rooms = call("GET", "/rooms")
classroom = next(r for r in rooms if r["room_type"] == "classroom")
labroom = next(r for r in rooms if r["room_type"] == "lab")

# ---------- 1) generator ----------
code, r = call("POST", "/timetables", {
    "department_id": sec_a["department_id"], "semester_id": sec_a["semester_id"], "section_id": sec_a["id"],
})
tt_id = r["id"]
code, gen = call("POST", f"/timetables/{tt_id}/generate")
assert gen["placed"] == gen["total"] and gen["placed"] >= 3, gen
code, entries = call("GET", f"/timetables/{tt_id}/entries")
assert len(entries) == gen["placed"]
# every placed entry must be conflict-free
code, conflicts = call("GET", f"/timetables/{tt_id}/validate")
assert conflicts == [], conflicts
# teacher loads respect caps
code, wl = call("GET", "/teachers-workload")
assert all(w["assigned_periods"] <= w["max_weekly_load"] for w in wl)
ok.append(f"generator drafted {gen['placed']} conflict-free classes; caps respected")

# ---------- 7) electives ----------
code, semesters = call("GET", "/semesters")
sem_a = next(s for s in semesters if s["id"] == sec_a["semester_id"])
code, r = call("POST", "/subjects", {
    "code": "EL001", "name": "Open Elective: AI", "department_id": sec_a["department_id"],
    "semester_id": sec_a["semester_id"], "hours_per_week": 2, "elective_group": "Open Elective A",
})
assert r["elective_group"] == "Open Elective A"
el1 = r
code, r = call("POST", "/subjects", {
    "code": "EL002", "name": "Open Elective: IoT", "department_id": sec_a["department_id"],
    "semester_id": sec_a["semester_id"], "hours_per_week": 2, "elective_group": "Open Elective A",
})
el2 = r
# find a free slot in the generated timetable that avoids teacher unavailability
occupied = {(e["day_of_week"], e["period"]) for e in entries}
blocked = {tuple(map(int, s.split("-"))) for t in teachers for s in (t["unavailable_slots"] or [])}
free = next(
    (d, p) for d in range(1, 7) for p in range(1, 9)
    if (d, p) not in occupied and (d, p) not in blocked
)
code, e1 = call("POST", f"/timetables/{tt_id}/entries", {
    "day_of_week": free[0], "period": free[1],
    "subject_id": el1["id"], "teacher_id": teachers[0]["id"], "room_id": classroom["id"],
})
assert e1["entry"]["id"]
code, e2 = call("POST", f"/timetables/{tt_id}/entries", {
    "day_of_week": free[0], "period": free[1],
    "subject_id": el2["id"], "teacher_id": teachers[1]["id"], "room_id": labroom["id"],
})
assert not e2["conflicts"], e2["conflicts"]
# a CORE subject at the same slot must still be rejected
code, _ = call("POST", f"/timetables/{tt_id}/entries", {
    "day_of_week": free[0], "period": free[1],
    "subject_id": next(s["id"] for s in call("GET", "/subjects")[1] if not s["requires_lab"] and s["code"].startswith("CS")),
    "teacher_id": teachers[2]["id"], "room_id": classroom["id"],
}, expect_error=True)
assert code == 409
code, scan = call("GET", "/conflicts/scan")
assert all(c["type"] != "section" for c in scan["conflicts"]), scan["conflicts"]
ok.append("electives share a slot cleanly; core classes still blocked; scan sees no section clash")

# ---------- 5) views ----------
code, master = call("GET", f"/views/master?day={free[0]}&department_id={sec_a['department_id']}")
sec_row = next(s for s in master["sections"] if s["id"] == sec_a["id"])
assert sec_row["periods"][str(free[1])]["code"] in ("EL001", "EL002")
ok.append("master grid shows the shared elective slot")
code, rv = call("GET", f"/views/room/{labroom['id']}")
assert any(e["subject_code"] == "EL002" for e in rv["entries"])
ok.append("room week view lists the elective in its room")

# ---------- 2) announcements ----------
code, r = call("POST", "/announcements", {"title": "Saturday week-off", "body": "No classes this Saturday.", "pinned": True})
ann_id = r["id"]
code, pub_ann = call("GET", "/public/announcements?department=CSE")
assert any(a["title"] == "Saturday week-off" for a in pub_ann)
ok.append("announcement published and visible on the public endpoint")

# ---------- 10) feedback ----------
code, r = call("POST", "/public/feedback", {
    "department_code": "CSE", "semester_number": 3, "section_name": "A",
    "reporter_name": "Rahul", "category": "wrong_room",
    "message": "Wednesday lab shows C102 but we are in CS-Lab-1.",
}, auth=False)
assert r["ok"]
code, fb = call("GET", "/feedback?status=open")
assert any(f["message"].startswith("Wednesday lab") for f in fb)
fid = fb[0]["id"]
code, r = call("POST", f"/feedback/{fid}/resolve?note=fixed")
assert r["ok"]
ok.append("student report lands in queue and resolves with a note")

# ---------- 3) notifications ----------
code, notes = call("GET", "/notifications")
titles = [n["title"] for n in notes["items"]]
assert notes["unread"] >= 2
assert any("student report" in t.lower() or "Announcement" in t for t in titles)
code, r = call("POST", "/notifications/read-all")
code, notes2 = call("GET", "/notifications")
assert notes2["unread"] == 0
ok.append(f"notification center received {len(titles)} events; mark-all-read works")

# ---------- 4) analytics ----------
code, an = call("GET", "/analytics")
assert an["rooms"] and an["teachers"] and "gaps" in an and "sections" in an
assert an["sections"][0]["filled"] > 0
ok.append(f"analytics computed: {len(an['rooms'])} rooms, {len(an['teachers'])} teachers, gaps tracked")

# ---------- 8) importer ----------
code, r = call("POST", "/import", {
    "department_id": sec_a["department_id"], "semester_id": sec_a["semester_id"],
    "teachers": [
        {"name": "Dr. B. Verma", "email": "b.verma@college.edu", "employee_code": "CSE010", "max_weekly_load": 18},
        {"name": "Prof. C. Nair", "email": "c.nair@college.edu"},
    ],
    "subjects": [
        {"code": "CS401", "name": "Compiler Design", "hours_per_week": 4, "requires_lab": "no"},
        {"code": "CS402", "name": "ML Lab", "hours_per_week": 2, "requires_lab": "yes"},
    ],
})
assert r["teachers_created"] == 2 and r["subjects_created"] == 2 and r["errors"] == []
code, subj = call("GET", "/subjects", None)
code, subj = call("GET", f"/subjects?semester_id={sec_a['semester_id']}")
assert any(s["code"] == "CS401" for s in subj)
ok.append("CSV import created 2 teachers + 2 subjects")

print("PASS — %d checks:" % len(ok))
for line in ok:
    print("  ✓", line)
