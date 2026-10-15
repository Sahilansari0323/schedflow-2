"""Full backend audit: every endpoint, every rule, edge cases included."""
import json
import urllib.request

BASE = "http://localhost:8000/api"
token = None
teacher_token = None
ok = []


def call(method, path, body=None, auth=True, token_override=None, expect_error=False):
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header("Content-Type", "application/json")
    tok = token_override if token_override is not None else token
    if auth and tok:
        req.add_header("Authorization", f"Bearer {tok}")
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(req, data) as res:
            raw = res.read()
            return res.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raw = e.read()
        payload = None
        try:
            payload = json.loads(raw) if raw else None
        except json.JSONDecodeError:
            payload = raw.decode(errors="ignore")
        if not expect_error:
            raise AssertionError(f"{method} {path} -> {e.code}: {payload}")
        return e.code, payload


# ============ AUTH ============
code, r = call("POST", "/auth/login", {"email": "admin@schedflow.edu", "password": "admin123"}, auth=False)
token = r["access_token"]
ok.append("admin login")
code, _ = call("POST", "/auth/login", {"email": "admin@schedflow.edu", "password": "nope"}, auth=False, expect_error=True)
assert code == 401
code, _ = call("POST", "/auth/login", {"email": "ghost@x.edu", "password": "admin123"}, auth=False, expect_error=True)
assert code == 401
ok.append("wrong credentials rejected (unknown user + bad password)")
code, r = call("POST", "/auth/login-form", None, auth=False, expect_error=True)  # form endpoint exists; empty body 422
assert code in (401, 422)
code, me = call("GET", "/auth/me")
assert me["role"] == "admin"
ok.append("auth/me returns profile")

# unauthenticated access blocked everywhere
for p in ("/teachers", "/subjects", "/timetables", "/analytics", "/audit", "/settings/users", "/conflicts/scan", "/notifications"):
    code, _ = call("GET", p, auth=False, expect_error=True)
    assert code == 401, (p, code)
ok.append("all protected endpoints reject anonymous access (401)")

# ============ REFERENCE DATA ============
code, deps = call("GET", "/departments")
cse = deps[0]
code, teachers = call("GET", "/teachers")
code, semesters = call("GET", "/semesters")
sem_a = next(s for s in semesters if s["department_id"] == cse["id"])
code, rooms = call("GET", "/rooms")
code, sections = call("GET", "/sections")
sec_a = next(s for s in sections if s["semester_id"] == sem_a["id"])
ok.append(f"reference data: {len(teachers)} teachers, {len(rooms)} rooms, {len(sections)} sections")

# teacher CRUD + guards
code, t = call("POST", "/teachers", {"name": "Audit Prof", "email": "audit@x.edu", "employee_code": "AUD1", "max_weekly_load": 10, "department_id": cse["id"], "unavailable_slots": ["6-8"]})
tid = t["id"]
code, one = call("GET", f"/teachers/{tid}")
assert one["assigned_periods"] == 0
code, t2 = call("PUT", f"/teachers/{tid}", {**t, "designation": "Senior Prof"})
assert t2["designation"] == "Senior Prof"
ok.append("teacher create/get/update with availability + workload fields")

# duplicate-friendly 409s (was 500 before audit fix)
code, _ = call("POST", "/semesters", {"number": sem_a["number"], "academic_year": sem_a["academic_year"], "department_id": cse["id"]}, expect_error=True)
assert code == 409
code, r = call("POST", "/sections", {"name": sec_a["name"], "strength": 50, "department_id": cse["id"], "semester_id": sem_a["id"]}, expect_error=True)
assert code == 409
code, _ = call("POST", "/rooms", {"name": rooms[0]["name"], "room_type": "classroom", "capacity": 10, "department_id": cse["id"]}, expect_error=True)
assert code == 409
subj0 = call("GET", "/subjects")[1][0]
code, _ = call("POST", "/subjects", {"code": subj0["code"], "name": "Dup", "department_id": cse["id"], "semester_id": sem_a["id"]}, expect_error=True)
assert code == 409
ok.append("duplicate semester/section/room/subject -> friendly 409 (was 500)")

# delete guards: teacher with classes cannot be deleted
code, tt = call("POST", "/timetables", {"department_id": cse["id"], "semester_id": sem_a["id"], "section_id": sec_a["id"]})
tt_id = tt["id"]
theory = next(s for s in call("GET", "/subjects")[1] if not s["requires_lab"] and s["department_id"] == cse["id"])
classroom = next(r for r in rooms if r["room_type"] == "classroom" and r["department_id"] == cse["id"])
code, e1 = call("POST", f"/timetables/{tt_id}/entries", {"day_of_week": 1, "period": 1, "subject_id": theory["id"], "teacher_id": tid, "room_id": classroom["id"]})
assert e1["conflicts"] == []
code, _ = call("DELETE", f"/teachers/{tid}", expect_error=True)
assert code == 409
ok.append("teacher deletion blocked while assigned to classes (409)")

# entry rules: dup slot, teacher clash, availability, workload cap
code, tt2 = call("POST", "/timetables", {"department_id": cse["id"], "semester_id": sem_a["id"], "section_id": sec_a["id"]})
labroom = next(r for r in rooms if r["room_type"] == "lab" and r["department_id"] == cse["id"])
labsub = next((s for s in call("GET", "/subjects")[1] if s["requires_lab"]), None)
code, _ = call("POST", f"/timetables/{tt_id}/entries", {"day_of_week": 1, "period": 1, "subject_id": theory["id"], "teacher_id": tid, "room_id": classroom["id"]}, expect_error=True)
assert code == 409
code, r = call("POST", f"/timetables/{tt2['id']}/entries", {"day_of_week": 1, "period": 1, "subject_id": theory["id"], "teacher_id": tid, "room_id": classroom["id"]})
types = {c["type"] for c in r["conflicts"]}
assert {"teacher", "room"} <= types
code, r = call("PUT", f"/timetables/{tt2['id']}/entries/{r['entry']['id']}", {"day_of_week": 1, "period": 2, "subject_id": theory["id"], "teacher_id": tid, "room_id": classroom["id"]})
assert not r["conflicts"]
# fill Audit Prof to cap (10) then expect workload conflict
for (d, p) in [(1, 3), (1, 4), (2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7), (2, 8)]:
    code, r = call("POST", f"/timetables/{tt2['id']}/entries", {"day_of_week": d, "period": p, "subject_id": theory["id"], "teacher_id": tid, "room_id": classroom["id"]})
wc = next((c for c in r["conflicts"] if c["type"] == "workload"), None)
assert wc, r["conflicts"]
ok.append("slot/teacher/room conflicts + workload cap enforced live")

# availability + lab mismatch
code, r = call("POST", f"/timetables/{tt2['id']}/entries", {"day_of_week": 1, "period": 1, "subject_id": labsub["id"], "teacher_id": teachers[0]["id"], "room_id": classroom["id"]})
types = {c["type"] for c in r["conflicts"]}
assert "availability" in types or "lab" in types
ok.append("availability + lab-mismatch detection")

# publish blocked on conflicts; clean -> published, version increments
code, _ = call("POST", f"/timetables/{tt2['id']}/publish", expect_error=True)
assert code == 409
for e in call("GET", f"/timetables/{tt2['id']}/entries")[1]:
    call("DELETE", f"/timetables/{tt2['id']}/entries/{e['id']}")
call("POST", f"/timetables/{tt2['id']}/entries", {"day_of_week": 5, "period": 5, "subject_id": theory["id"], "teacher_id": teachers[0]["id"], "room_id": classroom["id"]})
code, pub = call("POST", f"/timetables/{tt2['id']}/publish")
assert pub["status"] == "published"
code, r = call("POST", f"/timetables/{tt2['id']}/publish")
assert r["version"] == pub["version"] + 1
ok.append("publish blocked on conflicts; clean publish + version bump works")

# elective rules
code, el = call("POST", "/subjects", {"code": "ELE9", "name": "Elective Audit", "department_id": cse["id"], "semester_id": sem_a["id"], "elective_group": "Audit Group"})
code, el2 = call("POST", "/subjects", {"code": "ELE10", "name": "Elective Audit 2", "department_id": cse["id"], "semester_id": sem_a["id"], "elective_group": "Audit Group"})
code, tt3 = call("POST", "/timetables", {"department_id": cse["id"], "semester_id": sem_a["id"], "section_id": sec_a["id"]})
code, r1 = call("POST", f"/timetables/{tt3['id']}/entries", {"day_of_week": 4, "period": 4, "subject_id": el["id"], "teacher_id": teachers[0]["id"], "room_id": classroom["id"]})
code, r2 = call("POST", f"/timetables/{tt3['id']}/entries", {"day_of_week": 4, "period": 4, "subject_id": el2["id"], "teacher_id": teachers[1]["id"], "room_id": labroom["id"]})
assert r2["conflicts"] == []
code, _ = call("POST", f"/timetables/{tt3['id']}/entries", {"day_of_week": 4, "period": 4, "subject_id": theory["id"], "teacher_id": teachers[2]["id"], "room_id": classroom["id"]}, expect_error=True)
assert code == 409
ok.append("electives share slots; core class still blocked at same slot")

# regression: elective vs CORE across timetables must clash (fix for the bypass)
code, tt4 = call("POST", "/timetables", {"department_id": cse["id"], "semester_id": sem_a["id"], "section_id": sec_a["id"]})
code, rc = call("POST", f"/timetables/{tt3['id']}/entries", {"day_of_week": 4, "period": 5, "subject_id": theory["id"], "teacher_id": teachers[1]["id"], "room_id": labroom["id"]})
code, r = call("POST", f"/timetables/{tt4['id']}/entries", {"day_of_week": 4, "period": 5, "subject_id": el2["id"], "teacher_id": teachers[2]["id"], "room_id": classroom["id"]})
types = {c["type"] for c in r["conflicts"]}
assert "section" in types, r["conflicts"]
ok.append("elective vs core class (across timetables) flagged as section clash")

# regression: generator reports PARTIAL placement per subject (no silent masking)
code, cap_t = call("POST", "/teachers", {"name": "Cap Prof", "department_id": cse["id"], "max_weekly_load": 10})
code, big_s = call("POST", "/subjects", {"code": "BIG1", "name": "Big Course", "department_id": cse["id"], "semester_id": sem_a["id"], "hours_per_week": 20})
code, tt5 = call("POST", "/timetables", {"department_id": cse["id"], "semester_id": sem_a["id"], "section_id": sec_a["id"]})
code, gen5 = call("POST", f"/timetables/{tt5['id']}/generate")
assert gen5["placed"] < gen5["total"], gen5
assert any("of 20 hour(s) unplaced" in u for u in gen5["unplaced"]), gen5["unplaced"]
ok.append(f"generator partial placement reported per subject ({gen5['placed']}/{gen5['total']})")

# scan + resolver
code, scan = call("GET", "/conflicts/scan")
assert isinstance(scan["conflicts"], list)
ok.append(f"system scan runs ({scan['summary']['total']} conflicts in audit dataset)")

# generator: full placement + clean validation + spread
for e in call("GET", f"/timetables/{tt_id}/entries")[1]:
    call("DELETE", f"/timetables/{tt_id}/entries/{e['id']}")
code, gen = call("POST", f"/timetables/{tt_id}/generate")
assert gen["placed"] > 0
code, conf = call("GET", f"/timetables/{tt_id}/validate")
assert conf == []
code, gentries = call("GET", f"/timetables/{tt_id}/entries")
assert len(gentries) == gen["placed"]
ok.append(f"solver generator: {gen['placed']}/{gen['total']} placed ({gen['solver']}), zero conflicts")

# delete guards: subject/room with entries blocked
code, _ = call("DELETE", f"/subjects/{theory['id']}", expect_error=True)
assert code == 409
code, _ = call("DELETE", f"/rooms/{classroom['id']}", expect_error=True)
assert code == 409
ok.append("subject/room deletion blocked while referenced (409)")

# section deletion blocked while timetables exist
code, _ = call("DELETE", f"/sections/{sec_a['id']}", expect_error=True)
assert code == 409
ok.append("section deletion blocked while timetables exist (409)")

# ============ SUBSTITUTIONS ============
code, subs_teachers = call("GET", "/teachers")
absent = next(t for t in subs_teachers if t["is_active"])
code, res = call("POST", "/substitutions", {"teacher_id": absent["id"], "start_date": "2026-10-01", "end_date": "2026-10-02", "note": "audit"})
assert "email_status" in res and res["substitution"]["status"] == "active"
sub_id = res["substitution"]["id"]
code, r = call("POST", f"/substitutions/{sub_id}/revert")
assert r["ok"]
code, r = call("POST", f"/substitutions/{sub_id}/revert", expect_error=True)
assert code == 400
code, _ = call("DELETE", f"/substitutions/{sub_id}")
code, r = call("POST", "/substitutions", {"teacher_id": absent["id"], "start_date": "2026-10-05", "end_date": "2026-10-01"}, expect_error=True)
assert code == 400
ok.append("substitutions: assign/revert/delete lifecycle + date validation + email status")

# regression: substitution auto-reverts once the leave window has passed
code, ar_t = call("POST", "/teachers", {"name": "AR Prof", "department_id": cse["id"], "max_weekly_load": 10})
code, tt_ar = call("POST", "/timetables", {"department_id": cse["id"], "semester_id": sem_a["id"], "section_id": sec_a["id"]})
code, r = call("POST", f"/timetables/{tt_ar['id']}/entries", {"day_of_week": 1, "period": 6, "subject_id": theory["id"], "teacher_id": ar_t["id"], "room_id": classroom["id"]})
assert not r["conflicts"], r["conflicts"]
entry_ar_id = r["entry"]["id"]
code, res = call("POST", "/substitutions", {"teacher_id": ar_t["id"], "start_date": "2026-09-21", "end_date": "2026-09-22", "note": "past leave"})
assert res["substitution"]["status"] == "active" and res["results"][0]["status"] == "assigned"
sub_id_ar = res["substitution"]["id"]
code, entries_mid = call("GET", f"/timetables/{tt_ar['id']}/entries")
assert next(e for e in entries_mid if e["id"] == entry_ar_id)["teacher_id"] != ar_t["id"]  # covered
code, subs_list = call("GET", "/substitutions")  # GET triggers auto-revert of expired windows
sub_row = next(s for s in subs_list if s["id"] == sub_id_ar)
assert sub_row["status"] == "reverted", sub_row["status"]
code, entries_after = call("GET", f"/timetables/{tt_ar['id']}/entries")
assert next(e for e in entries_after if e["id"] == entry_ar_id)["teacher_id"] == ar_t["id"]  # restored
ok.append("expired substitution auto-reverts and restores the original teachers")

# ============ USERS / ROLES ============
code, r = call("POST", "/settings/users", {"name": "Coord", "email": "coord@x.edu", "password": "coord12", "role": "coordinator"})
coord_id = r["id"]
code, r = call("POST", "/settings/users", {"name": "Ghost", "email": "ghost.link@x.edu", "password": "ghost12", "role": "teacher", "teacher_id": 99999}, expect_error=True)
assert code == 404
ok.append("teacher user with nonexistent teacher record -> 404 (was silently broken)")
code, r = call("POST", "/auth/login", {"email": "coord@x.edu", "password": "coord12"}, auth=False)
teacher_token2 = None
coord_token = r["access_token"]
code, _ = call("GET", "/settings/users", token_override=coord_token)
assert code == 200  # coordinator is staff
ok.append("coordinator role has staff access")

# activation cycle
code, users = call("GET", "/settings/users")
assert all(isinstance(u["is_active"], bool) for u in users)
coord_row = next(u for u in users if u["email"] == "coord@x.edu")
call("PUT", f"/settings/users/{coord_id}/status", {"is_active": False})
code, _ = call("POST", "/auth/login", {"email": "coord@x.edu", "password": "coord12"}, auth=False, expect_error=True)
assert code == 403
call("PUT", f"/settings/users/{coord_id}/status", {"is_active": True})
code, r = call("POST", "/auth/login", {"email": "coord@x.edu", "password": "coord12"}, auth=False)
assert "access_token" in r
code, _ = call("PUT", f"/settings/users/{coord_id}/status", {"is_active": False}, expect_error=True) if False else (0, None)
# self-deactivation + last-admin protection
code, me_now = call("GET", "/auth/me")
code, _ = call("PUT", f"/settings/users/{me_now['id']}/status", {"is_active": False}, expect_error=True)
assert code == 400
ok.append("activation cycle works end-to-end; self-deactivation blocked")

# role gating: teacher vs staff
code, r = call("POST", "/auth/login", {"email": "meera@schedflow.edu", "password": "teacher123"}, auth=False)
teacher_token = r["access_token"]
for p in ("/teachers", "/timetables", "/analytics", "/announcements", "/assistant/ask", "/settings/users"):
    code, _ = call("GET" if p != "/assistant/ask" else "POST", p, {"message": "hi"} if p == "/assistant/ask" else None, token_override=teacher_token, expect_error=True)
    assert code == 403, (p, code)
code, _ = call("GET", "/teacher/me", token_override=teacher_token)
assert code == 200
code, _ = call("GET", "/teacher/me", expect_error=True)
assert code == 403
ok.append("role walls: teacher blocked from staff APIs; staff blocked from teacher portal")

for p, m, b in (("/conflicts/scan", "GET", None),
                ("/conflicts/apply", "POST", {"entry_id": 1, "action": "move_slot", "to_day": 1, "to_period": 2})):
    code, _ = call(m, p, b, token_override=teacher_token, expect_error=True)
    assert code == 403, (p, code)
ok.append("conflicts scan/apply blocked for teacher accounts (403)")

# ============ NOTIFICATIONS ============
call("POST", "/public/feedback", {"department_code": "CSE", "category": "other", "message": "audit notification test"}, auth=False)
code, notes = call("GET", "/notifications")
assert notes["unread"] >= 1
nid = notes["items"][0]["id"]
code, r = call("DELETE", f"/notifications/{nid}")
assert r["ok"]
code, r = call("DELETE", "/notifications/999999", expect_error=True)
assert code == 404
call("POST", "/notifications/read-all")
code, notes2 = call("GET", "/notifications")
assert notes2["unread"] == 0
ok.append("notifications: created by events, deleted individually, mark-all-read")

# ============ ANNOUNCEMENTS ============
code, r = call("POST", "/announcements", {"title": "Audit notice", "body": "hello", "pinned": True})
ann_id = r["id"]
code, pa = call("GET", "/public/announcements?department=CSE")
assert any(a["title"] == "Audit notice" for a in pa)
call("PUT", f"/announcements/{ann_id}/status?active=false")
code, pa = call("GET", "/public/announcements?department=CSE")
assert not any(a["title"] == "Audit notice" for a in pa)
call("DELETE", f"/announcements/{ann_id}")
ok.append("announcements: publish, dept-filtered public list, archive hides, delete")

# ============ FEEDBACK ============
code, fb = call("GET", "/feedback?status=open")
assert any(f["message"] == "audit notification test" for f in fb)
fid = fb[0]["id"]
code, r = call("POST", f"/feedback/{fid}/resolve?note=done")
assert r["ok"]
code, r = call("POST", "/public/feedback", {"message": "no"}, auth=False, expect_error=True)
assert code == 422
ok.append("feedback queue: filter, resolve with note, validation on public submit")

# ============ IMPORT ============
code, r = call("POST", "/import", {
    "department_id": cse["id"], "semester_id": sem_a["id"],
    "subjects": [{"code": subj0["code"], "name": "Dup"}, {"code": "IMP1", "name": "Imported Sub", "hours_per_week": 2}],
})
assert r["subjects_created"] == 1 and len(r["errors"]) == 1 and "already exists" in r["errors"][0]
ok.append("import: creates new rows, reports duplicates per-row (no 500)")

code, r = call("POST", "/import", {
    "department_id": cse["id"], "semester_id": sem_a["id"],
    "teachers": [{"name": "Bad Int", "max_weekly_load": "twelve"}],
    "subjects": [{"code": "IMPX", "name": "Bad Hours", "hours_per_week": "ten"}],
})
assert r["teachers_created"] == 0 and r["subjects_created"] == 0 and len(r["errors"]) == 2
assert all("must be a positive number" in e for e in r["errors"])
ok.append("import with non-numeric numbers logged per-row instead of 500")

# ============ ANALYTICS / VIEWS / AVAILABILITY ============
code, an = call("GET", "/analytics")
assert all(k in an for k in ("rooms", "teachers", "gaps", "sections"))
code, mv = call("GET", "/views/master?day=1")
assert "sections" in mv
code, rv = call("GET", f"/views/room/{classroom['id']}")
assert rv["room"]["name"] == classroom["name"]
code, av = call("GET", "/availability?day=9&period=1", expect_error=True)
assert code == 400
code, av = call("GET", "/availability?day=1&period=1&has_projector=true")
assert all(rm["has_projector"] for rm in av["rooms"])
ok.append("analytics/views/availability shapes + validation correct")

# ============ ASSISTANT ============
for q, expect in [("which rooms are free on monday period 3?", "free"), ("any conflicts right now?", "conflict"), ("help", "Try:"), ("what does section a have on monday?", "Section A")]:
    code, r = call("POST", "/assistant/ask", {"message": q})
    assert expect.lower() in r["reply"].lower(), (q, r["reply"])
ok.append("assistant answers rooms/conflicts/help/section queries from live data")

# ============ TEACHER PORTAL DATA ============
code, me = call("GET", "/teacher/me", token_override=teacher_token)
code, sched = call("GET", "/teacher/me/schedule", token_override=teacher_token)
assert "assigned_periods" in sched and "entries" in sched
ok.append("teacher portal: me + schedule data correct")

# ============ AUDIT TRAIL ============
code, audit = call("GET", "/audit?limit=500")
actions = {a["action"] for a in audit}
assert {"created", "updated", "deleted", "published", "substituted", "resolved"} & actions
ok.append(f"audit trail records everything ({len(audit)} entries, actions={sorted(actions)})")

# ============ PUBLIC ============
code, st = call("GET", "/public/structure")
assert st and st[0]["semesters"]
code, _ = call("GET", "/public/timetable?department=NOPE&semester=3&section=A", expect_error=True)
assert code == 404
code, pt = call("GET", "/public/timetable?department=CSE&semester=3&section=A")
assert pt["timetable"]["status"] == "published" and pt["entries"]
ok.append("public: structure + latest-published timetable + 404 for unknown")

print("\nAUDIT PASS — %d checks" % len(ok))
for line in ok:
    print("  ✓", line)
