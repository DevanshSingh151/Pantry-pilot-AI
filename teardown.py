import boto3
import json
import time

def teardown():
    try:
        with open("infra_output.json") as f:
            infra = json.load(f)
    except FileNotFoundError:
        print("infra_output.json not found. Cannot automatically tear down.")
        return

    region = infra['region']
    app_name = infra['app_name']
    
    session = boto3.Session(region_name=region)
    ec2 = session.client('ec2')
    iam = session.client('iam')
    s3 = session.client('s3')
    rds = session.client('rds')
    sns = session.client('sns')
    lam = session.client('lambda')
    events = session.client('events')
    
    print(f"Starting teardown for {app_name}...")
    
    # 1. EventBridge & Lambda
    print("Deleting EventBridge and Lambda...")
    try:
        events.remove_targets(Rule=f"{app_name}-DailyCheck", Ids=['1'])
        events.delete_rule(Name=f"{app_name}-DailyCheck")
    except Exception as e: print(e)
    
    try:
        lam.delete_function(FunctionName=infra['lambda_name'])
    except Exception as e: print(e)

    # 2. SNS
    print("Deleting SNS...")
    try:
        sns.delete_topic(TopicArn=infra['sns_arn'])
    except Exception as e: print(e)

    # 3. S3 Buckets
    print("Emptying and deleting S3 Buckets...")
    s3_resource = session.resource('s3')
    for bucket_name in [infra['uploads_bucket'], infra['frontend_bucket']]:
        try:
            bucket = s3_resource.Bucket(bucket_name)
            bucket.objects.all().delete()
            bucket.delete()
        except Exception as e: print(e)

    # 4. RDS
    print("Deleting RDS...")
    try:
        rds.delete_db_instance(
            DBInstanceIdentifier=infra['db_id'],
            SkipFinalSnapshot=True
        )
    except Exception as e: print(e)

    # 5. EC2
    print("Terminating EC2 instances and KeyPair...")
    try:
        ec2.delete_key_pair(KeyName=infra['key_file'].replace('.pem', ''))
    except Exception as e: print(e)
    
    try:
        # Find instance by tag
        res = ec2.describe_instances(Filters=[{'Name': 'tag:Name', 'Values': [f"{app_name}-backend"]}])
        instances = [i['InstanceId'] for r in res['Reservations'] for i in r['Instances'] if i['State']['Name'] not in ['terminated', 'shutting-down']]
        if instances:
            ec2.terminate_instances(InstanceIds=instances)
            print("Waiting for EC2 to terminate so we can delete Security Groups...")
            ec2.get_waiter('instance_terminated').wait(InstanceIds=instances)
    except Exception as e: print(e)

    # 6. Wait for RDS to delete before SG deletion
    print("Waiting for RDS to delete (this takes a few minutes)...")
    try:
        waiter = rds.get_waiter('db_instance_deleted')
        waiter.wait(DBInstanceIdentifier=infra['db_id'])
    except Exception as e: print(e)

    # 7. Security Groups
    print("Deleting Security Groups...")
    try:
        # RDS SG depends on EC2 SG
        res = ec2.describe_security_groups(Filters=[{'Name': 'group-name', 'Values': [f"RDS-Private-SG-{app_name.split('-')[1]}"]}])
        if res['SecurityGroups']:
            ec2.delete_security_group(GroupId=res['SecurityGroups'][0]['GroupId'])
            
        res = ec2.describe_security_groups(Filters=[{'Name': 'group-name', 'Values': [f"EC2-Backend-SG-{app_name.split('-')[1]}"]}])
        if res['SecurityGroups']:
            ec2.delete_security_group(GroupId=res['SecurityGroups'][0]['GroupId'])
    except Exception as e: print(e)

    # 8. IAM Roles
    print("Deleting IAM Roles...")
    try:
        iam.remove_role_from_instance_profile(InstanceProfileName=f"{app_name}-EC2Profile", RoleName=f"{app_name}-EC2Role")
        iam.delete_instance_profile(InstanceProfileName=f"{app_name}-EC2Profile")
        iam.delete_role_policy(RoleName=f"{app_name}-EC2Role", PolicyName="S3UploadAccess")
        iam.detach_role_policy(RoleName=f"{app_name}-EC2Role", PolicyArn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy")
        iam.delete_role(RoleName=f"{app_name}-EC2Role")
    except Exception as e: print(e)
    
    try:
        iam.delete_role_policy(RoleName=f"{app_name}-LambdaRole", PolicyName="SNSPublishAccess")
        iam.detach_role_policy(RoleName=f"{app_name}-LambdaRole", PolicyArn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole")
        iam.delete_role(RoleName=f"{app_name}-LambdaRole")
    except Exception as e: print(e)

    print("Teardown complete! All provisioned resources have been deleted to prevent charges.")

if __name__ == '__main__':
    teardown()
