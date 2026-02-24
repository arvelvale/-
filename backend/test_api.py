"""API端到端测试脚本"""
import httpx
import json

BASE = "http://127.0.0.1:8000"

def p(label, r):
    print(f"\n=== {label} === [{r.status_code}]")
    print(json.dumps(r.json(), indent=2, ensure_ascii=False))
    return r

# 1. Health
p("Health", httpx.get(f"{BASE}/health"))

# 2. Register
r = p("Register", httpx.post(f"{BASE}/v1/auth/register", json={
    "username": "testuser", "email": "test@example.com", "password": "123456"
}))

# 3. Login
r = p("Login", httpx.post(f"{BASE}/v1/auth/login", json={
    "email": "test@example.com", "password": "123456"
}))
token = r.json()["data"]["token"]
user_id = r.json()["data"]["userId"]
refresh_tok = r.json()["data"]["refreshToken"]
headers = {"Authorization": f"Bearer {token}"}

# 4. Create diary
r = p("Create Diary", httpx.post(f"{BASE}/v1/diaries", json={
    "content": "Today I feel great!", "diaryDate": "2026-02-07",
    "title": "Happy Day", "emotionTags": ["happy"], "importanceScore": 8
}, headers=headers))
diary_id = r.json()["data"]["diaryId"]

# 5. Diary list
p("Diary List", httpx.get(f"{BASE}/v1/diaries", headers=headers))

# 6. Diary detail
p("Diary Detail", httpx.get(f"{BASE}/v1/diaries/{diary_id}", headers=headers))

# 7. Update diary
p("Update Diary", httpx.put(f"{BASE}/v1/diaries/{diary_id}", json={
    "title": "Updated Day"
}, headers=headers))

# 8. Get profile
p("Get Profile", httpx.get(f"{BASE}/v1/users/{user_id}/profile", headers=headers))

# 9. Update profile
p("Update Profile", httpx.put(f"{BASE}/v1/users/{user_id}/profile", json={
    "identityTag": "developer", "personalityType": "INTJ"
}, headers=headers))

# 10. Delete diary
p("Delete Diary", httpx.delete(f"{BASE}/v1/diaries/{diary_id}", headers=headers))

# 11. Refresh token
p("Refresh Token", httpx.post(f"{BASE}/v1/auth/refresh", json={
    "refreshToken": refresh_tok
}))

print("\n" + "=" * 50)
print("ALL API TESTS COMPLETED!")
print("=" * 50)
