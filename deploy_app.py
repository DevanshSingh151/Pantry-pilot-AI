import json
import paramiko
import os
import tarfile

def deploy_app():
    # Package files
    print("Packaging application...")
    with tarfile.open("app.tar.gz", "w:gz") as tar:
        tar.add("backend/app", arcname="backend/app")
        tar.add("backend/requirements.txt", arcname="backend/requirements.txt")
        tar.add("frontend/dist", arcname="frontend/dist")
        
    # Read infra info
    with open("infra_output.json") as f:
        infra = json.load(f)
    
    ec2_ip = infra['ec2_ip']
    key_file = infra['key_file']
    
    # Connect
    print(f"Connecting to {ec2_ip}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(ec2_ip, username='ubuntu', key_filename=key_file)
    
    # Upload
    print("Uploading application...")
    sftp = ssh.open_sftp()
    sftp.put("app.tar.gz", "/home/ubuntu/app.tar.gz")
    
    # Configure and start
    print("Configuring server...")
    commands = [
        "tar -xzf app.tar.gz",
        "sudo rm -rf /var/www/html/*",
        "sudo cp -r frontend/dist/* /var/www/html/",
        "sudo apt-get update && sudo apt-get install -y python3-venv",
        "cd backend && python3 -m venv venv && ./venv/bin/pip install -r requirements.txt",
        "sudo bash -c 'cat > /etc/systemd/system/pantrypilot.service <<EOF\n[Unit]\nDescription=PantryPilot Backend\nAfter=network.target\n\n[Service]\nUser=ubuntu\nWorkingDirectory=/home/ubuntu/backend\nEnvironmentFile=/home/ubuntu/.env\nExecStart=/home/ubuntu/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000\nRestart=always\n\n[Install]\nWantedBy=multi-user.target\nEOF'",
        "sudo systemctl daemon-reload",
        "sudo systemctl restart pantrypilot",
        "sudo systemctl enable pantrypilot",
        "sudo bash -c 'cat > /etc/nginx/sites-available/default <<EOF\nserver {\n    listen 80 default_server;\n    root /var/www/html;\n    index index.html;\n    location / {\n        try_files \\$uri /index.html;\n    }\n    location /api/ {\n        proxy_pass http://127.0.0.1:8000;\n        proxy_set_header Host \\$host;\n        proxy_set_header X-Real-IP \\$remote_addr;\n    }\n}\nEOF'",
        "sudo systemctl restart nginx"
    ]
    
    for cmd in commands:
        stdin, stdout, stderr = ssh.exec_command(cmd)
        exit_status = stdout.channel.recv_exit_status()
        if exit_status != 0:
            print(f"Command failed: {cmd}\nError: {stderr.read().decode()}")
            
    print("Application deployed successfully!")
    ssh.close()

if __name__ == '__main__':
    deploy_app()
