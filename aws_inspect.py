import boto3
import json

def inspect():
    session = boto3.Session(region_name='ap-south-1')
    
    sts = session.client('sts')
    identity = sts.get_caller_identity()
    print("Caller Identity:", identity['Arn'])

    ec2 = session.client('ec2')
    vpcs = ec2.describe_vpcs()
    print("\nVPCs:", [vpc['VpcId'] for vpc in vpcs['Vpcs']])

    rds = session.client('rds')
    dbs = rds.describe_db_instances()
    print("\nRDS Instances:", [db['DBInstanceIdentifier'] for db in dbs['DBInstances']])

    s3 = session.client('s3')
    buckets = s3.list_buckets()
    print("\nS3 Buckets:", [b['Name'] for b in buckets['Buckets']])

    lam = session.client('lambda')
    funcs = lam.list_functions()
    print("\nLambda Functions:", [f['FunctionName'] for f in funcs['Functions']])

if __name__ == '__main__':
    try:
        inspect()
    except Exception as e:
        print("Error:", str(e))
