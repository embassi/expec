#!/usr/bin/env python3
"""
Run SQL against Supabase via Management API.
Usage:
  python3 scripts/supabase-query.py "SELECT * FROM users LIMIT 5"
  python3 scripts/supabase-query.py --file path/to/migration.sql
"""
import sys, json, subprocess, os

def load_env():
    env = {}
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip()
    return env

def run_sql(sql, token, ref):
    result = subprocess.run([
        'curl', '-s', '-X', 'POST',
        '-H', f'Authorization: Bearer {token}',
        '-H', 'Content-Type: application/json',
        '-d', json.dumps({'query': sql}),
        f'https://api.supabase.com/v1/projects/{ref}/database/query'
    ], capture_output=True, text=True)
    return json.loads(result.stdout)

def main():
    env = load_env()
    token = env.get('SUPABASE_ACCESS_TOKEN')
    ref = env.get('SUPABASE_PROJECT_REF')
    if not token or not ref:
        print('ERROR: SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF must be set in .env')
        sys.exit(1)

    if '--file' in sys.argv:
        idx = sys.argv.index('--file')
        with open(sys.argv[idx + 1]) as f:
            sql = f.read()
    elif len(sys.argv) > 1:
        sql = ' '.join(sys.argv[1:])
    else:
        sql = sys.stdin.read()

    result = run_sql(sql, token, ref)
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()
