import os
import json
import urllib.request
import ssl
import boto3

def lambda_handler(event, context):
    backend_url = os.environ.get("BACKEND_URL")
    secret = os.environ.get("INTERNAL_API_SECRET")
    sns_topic_arn = os.environ.get("SNS_TOPIC_ARN")
    
    if not backend_url or not secret:
        print("Missing environment variables.")
        return {"statusCode": 500, "body": "Missing config"}
    
    # Request expiring items from EC2 backend
    req = urllib.request.Request(
        f"{backend_url}/api/internal/trigger-expiry-check",
        headers={"Authorization": f"Bearer {secret}"},
        method="POST"
    )
    
    # Bypass SSL verification since EC2 might use a self-signed cert for raw IP
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            data = json.loads(response.read().decode('utf-8'))
            print("Received data:", data)
    except Exception as e:
        print(f"Error calling backend: {e}")
        return {"statusCode": 500, "body": str(e)}

    # Send to SNS if items found
    expiring_items = data.get("expiring_items", [])
    if expiring_items:
        sns = boto3.client("sns")
        
        message = "The following pantry items are expiring soon:\n\n"
        for item in expiring_items:
            message += f"- {item['name']} (Expires: {item['expiry_date']})\n"
        message += "\nPlease log in to PantryPilot to manage your inventory."

        try:
            sns.publish(
                TopicArn=sns_topic_arn,
                Subject="PantryPilot: Items Expiring Soon!",
                Message=message
            )
            print("SNS notification sent successfully.")
        except Exception as e:
            print(f"Error sending SNS: {e}")
            return {"statusCode": 500, "body": str(e)}
    else:
        print("No expiring items found.")

    return {"statusCode": 200, "body": "Check complete"}
