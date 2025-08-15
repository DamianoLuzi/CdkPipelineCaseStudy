import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps, Duration, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ssm from 'aws-cdk-lib/aws-ssm';


export class CdkPostsConstruct extends Construct {
  public readonly postsApi: apigateway.RestApi;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id);

    const table = new dynamodb.Table(this, 'PostsTable', {
      partitionKey: { name: 'postId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY, 
    });

    const comprehendRole = new iam.Role(this, 'PostsLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    comprehendRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
            'comprehend:DetectTargetedSentiment',
            'comprehend:BatchDetectTargetedSentiment',
            'comprehend:DetectToxicContent',
        ],
        resources: ['*'],
      })
    );

    const postAnalysisFn = new lambda.Function(this, 'AnalyzePostContentFunction', {
      functionName: 'postModerationFunction',
      runtime: lambda.Runtime.PYTHON_3_13,
      architecture: lambda.Architecture.ARM_64,
      code: lambda.Code.fromAsset('lambda/analyze'), 
      handler: 'handler.lambda_handler',
      memorySize: 128,
      timeout: Duration.seconds(3),
      role: comprehendRole,
      environment: {
        TABLE_NAME: table.tableName,
        REGION: cdk.Stack.of(this).region
      }
    });
    const fetchPostsFn = new lambda.Function(this, 'FetchPostsFunction', {
      functionName: 'postFetchFunction',
      runtime: lambda.Runtime.PYTHON_3_13,
      architecture: lambda.Architecture.ARM_64,
      code: lambda.Code.fromAsset('lambda/fetch'), 
      handler: 'handler.lambda_handler',
      memorySize: 128,
      timeout: Duration.seconds(3),
      role: comprehendRole,
      environment: {
        TABLE_NAME: table.tableName,
        REGION: cdk.Stack.of(this).region
      }
    });

    this.postsApi = new apigateway.RestApi(this, 'PostsApi', {
      restApiName: 'PostsAPI',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
        allowMethods: ['POST', 'OPTIONS'],
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
    });

    table.grantWriteData(postAnalysisFn);
    table.grantReadData(fetchPostsFn);

    const apiResource = this.postsApi.root.addResource('posts');
    apiResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(postAnalysisFn, {
        proxy: true,
      })
    );
    apiResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(fetchPostsFn, {
        proxy: true,
      })
    );

    postAnalysisFn.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'));
    fetchPostsFn.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'));

    new CfnOutput(this, 'CustomerReviewEndpoint', {
      value: `${this.postsApi.url}review`,
    });

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'CdkSentimentAnalysisAppQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}




