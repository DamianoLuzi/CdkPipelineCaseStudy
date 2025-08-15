import json
import os
import boto3
from datetime import datetime

import logging


logger = logging.getLogger()
logger.setLevel(logging.INFO)
s3 = boto3.client('s3')
BUCKET = os.environ['BUCKET']

def lambda_handler(event, context):
    # EventBridge sends the event object; CloudWatch Logs will show the shape
    # We'll write each event as a JSON file prefixed by date/hour
    ts = datetime.now().strftime('%Y/%m/%d/%H')
    key = f"events/{ts}/{context.aws_request_id}.json"
    # s3.put_object(Bucket=BUCKET, Key=key, Body=json.dumps(event))
    logger.info(f"Writing event to s3://{BUCKET}/{key}")
    return {'statusCode': 200}
