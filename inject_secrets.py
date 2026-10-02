import json
import paramiko
import time
import sys

def inject():
    # Read outputs and secrets
    with open("infra_output.json") as f:
        infra = json.load(f)
    
    with open("secrets.json") as f:
        sec = json.load(f)
        
    ec2_ip = infra['ec2_ip']
    key_file = infra['key_file']
    
    # Wait for SSH to be ready
    print(f"Connecting to EC2 at {ec2_ip}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    max_retries = 15
    for i in range(max_retries):
        try:
            ssh.connect(ec2_ip, username='ubuntu', key_filename=key_file, timeout=10)
            print("SSH Connected!")
            break
        except Exception as e:
            print(f"Waiting for SSH... ({i+1}/{max_retries})")
            time.sleep(10)
    else:
        print("Failed to connect to EC2 via SSH.")
        sys.exit(1)
        
    # Generate .env file
    env_content = f"""
DATABASE_URL=mysql+pymysql://admin:{sec['db_password']}@{infra['db_id']}.XXXXXXXX.ap-south-1.rds.amazonaws.com:3306/pantry
S3_UPLOADS_BUCKET={infra['uploads_bucket']}
AWS_REGION={infra['region']}
GEMINI_API_KEY={sec['gemini_api_key']}
INTERNAL_API_SECRET={sec['internal_api_secret']}
"""
    # Wait, the RDS endpoint isn't fully known until RDS finishes creating.
    # We should grab the real RDS endpoint using boto3.
    import boto3
    rds = boto3.client('rds', region_name=infra['region'])
    
    print("Waiting for RDS to become available to get endpoint (this takes a few mins)...")
    waiter = rds.get_waiter('db_instance_available')
    waiter.wait(DBInstanceIdentifier=infra['db_id'])
    
    db_instances = rds.describe_db_instances(DBInstanceIdentifier=infra['db_id'])
    rds_endpoint = db_instances['DBInstances'][0]['Endpoint']['Address']
    
    env_content = f"""
DATABASE_URL=mysql+pymysql://admin:{sec['db_password']}@{rds_endpoint}:3306/pantry
S3_UPLOADS_BUCKET={infra['uploads_bucket']}
AWS_REGION={infra['region']}
GEMINI_API_KEY={sec['gemini_api_key']}
GROQ_API_KEY={sec.get('groq_api_key', '')}
INTERNAL_API_SECRET={sec['internal_api_secret']}
"""

    print("Injecting .env file...")
    sftp = ssh.open_sftp()
    with sftp.file('/home/ubuntu/.env', 'w') as f:
        f.write(env_content)
    sftp.close()
    
    # Secure the .env file
    ssh.exec_command("chmod 600 /home/ubuntu/.env")
    
    print("Secrets successfully injected and secured!")
    ssh.close()

if __name__ == '__main__':
    inject()
