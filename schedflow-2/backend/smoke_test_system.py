"""Smoke test for the new audit-log and settings endpoints."""
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

# login
code, r = call("POST", "/auth/login", {"email": "admin@schedflow.edu", "password": "admin123"}, auth=False)
token = r["access_token"]

# audit should already contain smoke-test activity (created timetable, published, etc.)
code, logs = call("GET", "/audit")
assert len(logs) >= 5, f"expected audit entries, got {len(logs)}"
actions = {l["action"] for l in logs}
assert "created" in actions and "published" in actions
assert all(l["user"] == "admin@schedflow.edu" for l in logs)
ok.append(f"audit log records changes ({len(logs)} entries, actions={sorted(actions)})")

# filter by action
code, logs = call("GET", "/audit?action=published")
assert all(l["action"] == "published" for l in logs) and len(logs) >= 1
ok.append("audit filter by action works")

# profile: get + update
code, me = call("GET", "/settings/profile")
assert me["email"] == "admin@schedflow.edu"
code, r = call("PUT", "/settings/profile", {"name": "Head of Department"})
assert r["name"] == "Head of Department"
ok.append("profile name update works")

# password: wrong current rejected
code, _ = call("PUT", "/settings/password", {"current_password": "wrong", "new_password": "newpass123"}, expect_error=True)
assert code == 400
ok.append("wrong current password rejected")

# password: change, verify old fails + new works, change back
code, _ = call("PUT", "/settings/password", {"current_password": "admin123", "new_password": "newpass123"})
assert code == 200
code, _ = call("POST", "/auth/login", {"email": "admin@schedflow.edu", "password": "admin123"}, auth=False, expect_error=True)
assert code == 401
code, r = call("POST", "/auth/login", {"email": "admin@schedflow.edu", "password": "newpass123"}, auth=False)
token = r["access_token"]
call("PUT", "/settings/password", {"current_password": "newpass123", "new_password": "admin123"})
ok.append("password change + revert works end-to-end")

# short new password rejected
code, _ = call("PUT", "/settings/password", {"current_password": "admin123", "new_password": "abc"}, expect_error=True)
assert code == 422
ok.append("password validation (min length) enforced")

print("PASS — %d checks:" % len(ok))
for line in ok:
    print("  ✓", line)
