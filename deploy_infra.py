import boto3
import json
import uuid
import time
import zipfile
import os
import secrets

def deploy():
    region = 'ap-south-1'
    session = boto3.Session(region_name=region)
    ec2 = session.client('ec2')
    iam = session.client('iam')
    s3 = session.client('s3')
    rds = session.client('rds')
    sns = session.client('sns')
    lam = session.client('lambda')
    events = session.client('events')
    cloudfront = session.client('cloudfront')
    
    uid = str(uuid.uuid4())[:8]
    app_name = f"pantrypilot-{uid}"
    db_password = secrets.token_urlsafe(16)
    internal_api_secret = secrets.token_urlsafe(32)
    
    print(f"Starting deployment for {app_name}...")
    
    # 1. Get Default VPC
    vpcs = ec2.describe_vpcs()
    vpc_id = vpcs['Vpcs'][0]['VpcId']
    
    # 2. Security Groups
    print("Creating Security Groups...")
    user_ip = "171.79.57.229/32"
    
    backend_sg_res = ec2.create_security_group(GroupName=f"EC2-Backend-SG-{uid}", Description="EC2 Backend", VpcId=vpc_id)
    backend_sg_id = backend_sg_res['GroupId']
    
    ec2.authorize_security_group_ingress(
        GroupId=backend_sg_id,
        IpPermissions=[
            {'IpProtocol': 'tcp', 'FromPort': 80, 'ToPort': 80, 'IpRanges': [{'CidrIp': '0.0.0.0/0'}]},
            {'IpProtocol': 'tcp', 'FromPort': 443, 'ToPort': 443, 'IpRanges': [{'CidrIp': '0.0.0.0/0'}]},
            {'IpProtocol': 'tcp', 'FromPort': 22, 'ToPort': 22, 'IpRanges': [{'CidrIp': user_ip}]}
        ]
    )
    
    rds_sg_res = ec2.create_security_group(GroupName=f"RDS-Private-SG-{uid}", Description="RDS Private", VpcId=vpc_id)
    rds_sg_id = rds_sg_res['GroupId']
    
    ec2.authorize_security_group_ingress(
        GroupId=rds_sg_id,
        IpPermissions=[
            {'IpProtocol': 'tcp', 'FromPort': 3306, 'ToPort': 3306, 'UserIdGroupPairs': [{'GroupId': backend_sg_id}]}
        ]
    )
    
    # 3. S3 Buckets
    print("Creating S3 Buckets...")
    uploads_bucket = f"{app_name}-uploads"
    frontend_bucket = f"{app_name}-frontend"
    
    s3.create_bucket(Bucket=uploads_bucket, CreateBucketConfiguration={'LocationConstraint': region})
    s3.create_bucket(Bucket=frontend_bucket, CreateBucketConfiguration={'LocationConstraint': region})
    
    for b in [uploads_bucket, frontend_bucket]:
        s3.put_public_access_block(
            Bucket=b,
            PublicAccessBlockConfiguration={
                'BlockPublicAcls': True, 'IgnorePublicAcls': True, 'BlockPublicPolicy': True, 'RestrictPublicBuckets': True
            }
        )
    
    # 4. IAM Roles
    print("Creating IAM Roles...")
    ec2_trust = json.dumps({"Version": "2012-10-17", "Statement": [{"Action": "sts:AssumeRole", "Principal": {"Service": "ec2.amazonaws.com"}, "Effect": "Allow"}]})
    iam.create_role(RoleName=f"{app_name}-EC2Role", AssumeRolePolicyDocument=ec2_trust)
    
    s3_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [{"Effect": "Allow", "Action": ["s3:PutObject", "s3:GetObject"], "Resource": f"arn:aws:s3:::{uploads_bucket}/*"}]
    })
    iam.put_role_policy(RoleName=f"{app_name}-EC2Role", PolicyName="S3UploadAccess", PolicyDocument=s3_policy)
    iam.attach_role_policy(RoleName=f"{app_name}-EC2Role", PolicyArn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy")
    
    iam.create_instance_profile(InstanceProfileName=f"{app_name}-EC2Profile")
    iam.add_role_to_instance_profile(InstanceProfileName=f"{app_name}-EC2Profile", RoleName=f"{app_name}-EC2Role")
    
    lambda_trust = json.dumps({"Version": "2012-10-17", "Statement": [{"Action": "sts:AssumeRole", "Principal": {"Service": "lambda.amazonaws.com"}, "Effect": "Allow"}]})
    iam.create_role(RoleName=f"{app_name}-LambdaRole", AssumeRolePolicyDocument=lambda_trust)
    iam.attach_role_policy(RoleName=f"{app_name}-LambdaRole", PolicyArn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole")

    # SNS Topic
    print("Creating SNS Topic...")
    sns_res = sns.create_topic(Name=f"{app_name}-ExpiryAlerts")
    sns_arn = sns_res['TopicArn']
    sns.subscribe(TopicArn=sns_arn, Protocol='email', Endpoint='devanshsin2020@gmail.com')

    sns_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [{"Effect": "Allow", "Action": "sns:Publish", "Resource": sns_arn}]
    })
    iam.put_role_policy(RoleName=f"{app_name}-LambdaRole", PolicyName="SNSPublishAccess", PolicyDocument=sns_policy)

    time.sleep(10) # wait for IAM roles to propagate

    # 5. RDS
    print("Creating RDS (this will take time in background)...")
    db_id = f"{app_name}-db"
    rds.create_db_instance(
        DBInstanceIdentifier=db_id,
        AllocatedStorage=20,
        DBInstanceClass='db.t3.micro',
        Engine='mysql',
        MasterUsername='admin',
        MasterUserPassword=db_password,
        VpcSecurityGroupIds=[rds_sg_id],
        PubliclyAccessible=False,
        MultiAZ=False,
        StorageType='gp2'
    )
    
    # 6. EC2 KeyPair & Instance
    print("Creating KeyPair & EC2...")
    key_name = f"{app_name}-key"
    key_res = ec2.create_key_pair(KeyName=key_name)
    with open(f"{key_name}.pem", "w") as f:
        f.write(key_res['KeyMaterial'])
    os.chmod(f"{key_name}.pem", 0o400)

    # Ubuntu 24.04 ap-south-1 AMI
    ami_id = 'ami-0f58b397bc5c1f2e8'
    
    user_data = '''#!/bin/bash
apt-get update
apt-get install -y docker.io docker-compose nginx
systemctl start docker
systemctl enable docker
'''
    
    run_res = ec2.run_instances(
        ImageId=ami_id,
        InstanceType='t3.micro',
        KeyName=key_name,
        MinCount=1,
        MaxCount=1,
        SecurityGroupIds=[backend_sg_id],
        IamInstanceProfile={'Name': f"{app_name}-EC2Profile"},
        UserData=user_data,
        TagSpecifications=[{'ResourceType': 'instance', 'Tags': [{'Key': 'Name', 'Value': f"{app_name}-backend"}]}]
    )
    instance_id = run_res['Instances'][0]['InstanceId']
    
    # 7. Package and Create Lambda
    print("Creating Lambda...")
    with zipfile.ZipFile('lambda_function.zip', 'w') as z:
        z.write('lambda_function.py')
        
    lambda_role_arn = iam.get_role(RoleName=f"{app_name}-LambdaRole")['Role']['Arn']
    
    # Wait a bit more for IAM
    time.sleep(10)
    
    with open('lambda_function.zip', 'rb') as f:
        lam_code = f.read()
        
    try:
        lam_res = lam.create_function(
            FunctionName=f"{app_name}-ExpiryCheck",
            Runtime='python3.10',
            Role=lambda_role_arn,
            Handler='lambda_function.lambda_handler',
            Code={'ZipFile': lam_code},
            Environment={'Variables': {
                'BACKEND_URL': 'https://PENDING',
                'INTERNAL_API_SECRET': internal_api_secret,
                'SNS_TOPIC_ARN': sns_arn
            }},
            Timeout=30
        )
        lam_arn = lam_res['FunctionArn']
        
        # EventBridge
        rule_res = events.put_rule(Name=f"{app_name}-DailyCheck", ScheduleExpression='cron(0 8 * * ? *)', State='ENABLED')
        events.put_targets(Rule=f"{app_name}-DailyCheck", Targets=[{'Id': '1', 'Arn': lam_arn}])
        lam.add_permission(FunctionName=f"{app_name}-ExpiryCheck", StatementId='EventBridgeInvoke', Action='lambda:InvokeFunction', Principal='events.amazonaws.com', SourceArn=rule_res['RuleArn'])
    except Exception as e:
        print("Lambda creation error:", e)

    # 8. CloudFront OAC
    print("Setting up CloudFront...")
    try:
        oac_res = cloudfront.create_origin_access_control(
            OriginAccessControlConfig={
                'Name': f"{app_name}-OAC",
                'Description': 'OAC for frontend',
                'SigningProtocol': 'sigv4',
                'SigningBehavior': 'always',
                'OriginAccessControlOriginType': 's3'
            }
        )
        oac_id = oac_res['OriginAccessControl']['Id']
        
        origin_domain = f"{frontend_bucket}.s3.{region}.amazonaws.com"
        cf_res = cloudfront.create_distribution(
            DistributionConfig={
                'CallerReference': str(uuid.uuid4()),
                'Origins': {
                    'Quantity': 1,
                    'Items': [{
                        'Id': 'S3Origin',
                        'DomainName': origin_domain,
                        'S3OriginConfig': {'OriginAccessIdentity': ''},
                        'OriginAccessControlId': oac_id
                    }]
                },
                'DefaultCacheBehavior': {
                    'TargetOriginId': 'S3Origin',
                    'ViewerProtocolPolicy': 'redirect-to-https',
                    'MinTTL': 0,
                    'ForwardedValues': {'QueryString': False, 'Cookies': {'Forward': 'none'}}
                },
                'Comment': f"{app_name} distribution",
                'Enabled': True,
                'DefaultRootObject': 'index.html'
            }
        )
        cf_domain = cf_res['Distribution']['DomainName']
        
        s3_policy_cf = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{"Effect": "Allow", "Principal": {"Service": "cloudfront.amazonaws.com"}, "Action": "s3:GetObject", "Resource": f"arn:aws:s3:::{frontend_bucket}/*", "Condition": {"StringEquals": {"AWS:SourceArn": cf_res['Distribution']['ARN']}}}]
        })
        s3.put_bucket_policy(Bucket=frontend_bucket, Policy=s3_policy_cf)
    except Exception as e:
        print("CloudFront error:", e)
        cf_domain = "error"

    print("Deployment initiated. Waiting for EC2 IP...")
    ec2.get_waiter('instance_running').wait(InstanceIds=[instance_id])
    inst = ec2.describe_instances(InstanceIds=[instance_id])
    ec2_ip = inst['Reservations'][0]['Instances'][0]['PublicIpAddress']
    
    out = {
        "app_name": app_name,
        "region": region,
        "ec2_ip": ec2_ip,
        "db_id": db_id,
        "key_file": f"{key_name}.pem",
        "uploads_bucket": uploads_bucket,
        "frontend_bucket": frontend_bucket,
        "cf_domain": cf_domain,
        "sns_arn": sns_arn,
        "lambda_name": f"{app_name}-ExpiryCheck"
    }
    with open("infra_output.json", "w") as f:
        json.dump(out, f, indent=2)
        
    sec = {
        "db_password": db_password,
        "internal_api_secret": internal_api_secret,
        "gemini_api_key": ""
    }
    with open("secrets.json", "w") as f:
        json.dump(sec, f, indent=2)
        
    print("Done! Check infra_output.json")

if __name__ == '__main__':
    deploy()
