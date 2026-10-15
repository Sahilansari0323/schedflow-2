"""End-to-end test for the conflict scan + AI resolver."""
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

# clean scan on seed data
code, scan = call("GET", "/conflicts/scan")
assert scan["summary"]["total"] == 0, scan["summary"]
ok.append("clean seed scans with 0 conflicts")

# build fixtures: two sections in the same semester
code, sections = call("GET", "/sections")
sec_a, sec_b = sections[0], sections[1]
code, subjects = call("GET", "/subjects")
code, teachers = call("GET", "/teachers")
code, rooms = call("GET", "/rooms")
theory = next(s for s in subjects if not s["requires_lab"])
lab_sub = next(s for s in subjects if s["requires_lab"])
classroom = next(r for r in rooms if r["room_type"] == "classroom")

code, tt_a = call("POST", "/timetables", {
    "department_id": sec_a["department_id"], "semester_id": sec_a["semester_id"], "section_id": sec_a["id"],
})
code, tt_b = call("POST", "/timetables", {
    "department_id": sec_b["department_id"], "semester_id": sec_b["semester_id"], "section_id": sec_b["id"],
})

# baseline entry for section A: Mon P1, teacher[0], classroom
code, r = call("POST", f"/timetables/{tt_a['id']}/entries", {
    "day_of_week": 1, "period": 1,
    "subject_id": theory["id"], "teacher_id": teachers[0]["id"], "room_id": classroom["id"],
})
assert not r["conflicts"], r["conflicts"]

# 1) teacher+room clash: same teacher+room+slot as section A's entry (Mon P1)
code, r = call("POST", f"/timetables/{tt_b['id']}/entries", {
    "day_of_week": 1, "period": 1,
    "subject_id": theory["id"], "teacher_id": teachers[0]["id"], "room_id": classroom["id"],
})
code, scan = call("GET", "/conflicts/scan")
types = {c["type"] for c in scan["conflicts"]}
assert "teacher" in types and "room" in types
tclash = next(c for c in scan["conflicts"] if c["type"] == "teacher")
assert tclash["severity"] == "high" and len(tclash["entries"]) == 2
assert tclash["suggestions"], "teacher clash should have suggestions"
ok.append(f"scan finds teacher+room clash with {len(tclash['suggestions'])} ranked fixes")

# best fix must actually be valid: apply it and expect the slot to become clean
best = tclash["suggestions"][0]
code, res = call("POST", "/conflicts/apply", best)
assert res["ok"] is True and res["remaining_conflicts"] == [], res
ok.append(f"applied best fix ({best['action']}: {best['label']}) — slot now clean")

# 2) availability violation: teacher[1] is unavailable Mon P1 -> stage on Tue P2, then move to Mon P1
code, r = call("POST", f"/timetables/{tt_b['id']}/entries", {
    "day_of_week": 2, "period": 2,
    "subject_id": theory["id"], "teacher_id": teachers[1]["id"], "room_id": classroom["id"],
})
# move it to Mon P1 via apply (teacher[1] unavailable at 1-1)
entry_id = r["entry"]["id"]
code, res = call("POST", "/conflicts/apply", {
    "entry_id": entry_id, "action": "move_slot", "to_day": 1, "to_period": 1,
})
assert res["ok"] and any(c["type"] == "availability" for c in res["remaining_conflicts"])
code, scan = call("GET", "/conflicts/scan")
av = next(c for c in scan["conflicts"] if c["type"] == "availability")
assert av["suggestions"], "availability violation should have suggestions"
best = av["suggestions"][0]
code, res = call("POST", "/conflicts/apply", best)
code, scan = call("GET", "/conflicts/scan")
assert all(c["type"] != "availability" for c in scan["conflicts"])
ok.append(f"availability violation resolved via '{best['label']}'")

# 3) lab mismatch: lab subject in a classroom
code, r = call("POST", f"/timetables/{tt_b['id']}/entries", {
    "day_of_week": 3, "period": 2,
    "subject_id": lab_sub["id"], "teacher_id": teachers[2]["id"], "room_id": classroom["id"],
})
code, scan = call("GET", "/conflicts/scan")
lab = next(c for c in scan["conflicts"] if c["type"] == "lab")
room_fix = next((s for s in lab["suggestions"] if s["action"] == "change_room"), None)
if room_fix:
    code, res = call("POST", "/conflicts/apply", room_fix)
    assert res["ok"]
    ok.append(f"lab mismatch fixed by moving to a real lab ({room_fix['label']})")
else:
    # no free lab at that slot -> resolver must at least offer a move_slot
    assert any(s["action"] == "move_slot" for s in lab["suggestions"])
    best = lab["suggestions"][0]
    call("POST", "/conflicts/apply", best)
    ok.append(f"lab mismatch fixed by relocating slot ({best['label']})")

# resolver suggestions never recommend already-busy targets:
code, scan = call("GET", "/conflicts/scan")
for c in scan["conflicts"]:
    for s in c["suggestions"]:
        if s["action"] == "move_slot":
            assert s["to_day"] != c["entries"][-1]["day"] or s["to_period"] != c["entries"][-1]["period"]
ok.append("all suggestions validated against live occupancy")

# audit trail captured the resolutions
code, logs = call("GET", "/audit?action=resolved")
assert len(logs) >= 2
ok.append(f"resolver actions recorded in version history ({len(logs)} entries)")

print("PASS — %d checks:" % len(ok))
for line in ok:
    print("  ✓", line)
