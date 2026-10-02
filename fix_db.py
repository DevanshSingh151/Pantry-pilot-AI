import paramiko
import json

with open("infra_output.json") as f:
    infra = json.load(f)

ec2_ip = infra['ec2_ip']
key_file = infra['key_file']

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(ec2_ip, username='ubuntu', key_filename=key_file)
sftp = ssh.open_sftp()
with sftp.file('/home/ubuntu/create_db.py', 'w') as f:
    f.write("""import os, pymysql
from dotenv import load_dotenv
load_dotenv('/home/ubuntu/.env')
db_url = os.environ.get('DATABASE_URL')
parts = db_url.split('/')
host_part = parts[2]
host = host_part.split('@')[1].split(':')[0]
pwd = host_part.split(':')[1].split('@')[0]
conn = pymysql.connect(host=host, user='admin', password=pwd)
conn.cursor().execute('CREATE DATABASE IF NOT EXISTS pantry')
conn.commit()
conn.close()
""")
sftp.close()
_, stdout, stderr = ssh.exec_command('cd /home/ubuntu && backend/venv/bin/python create_db.py && sudo systemctl restart pantrypilot')
print(stdout.read().decode())
print(stderr.read().decode())
