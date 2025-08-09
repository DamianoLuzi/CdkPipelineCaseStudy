import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';

//export class CdkChatStack extends cdk.Stack {
export class CdkChatConstruct extends Construct {

  public readonly chatApi: apigwv2.WebSocketApi;
  public readonly stage: apigwv2.WebSocketStage
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id);

    const table = new dynamodb.Table(this, 'ConnectionsTable', {
      partitionKey: { name: 'connectionId', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const makeLambda = (id: string, timeoutSec: number) => {
      return new lambda.Function(this, id, {
        runtime: lambda.Runtime.PYTHON_3_13,
        handler: `handler.lambda_handler`,
        code: lambda.Code.fromAsset(`lambda/${id}`),
        environment: { TABLE_NAME: table.tableName},
        timeout: cdk.Duration.seconds(timeoutSec),
        architecture: lambda.Architecture.ARM_64,
        functionName: `${cdk.Stack.of(this).stackName}-${id}`,
      });
    };

    const connectFn = makeLambda('connect', 10);
    const sendMessageFn = makeLambda('sendmessage', 10);
    const disconnectFn = makeLambda('disconnect', 10);
  
    table.grantWriteData(connectFn);
    table.grantWriteData(disconnectFn);
    table.grantReadWriteData(sendMessageFn);

    sendMessageFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['execute-api:ManageConnections'],
      resources: ['*'],
    }));

    //const wsApi = new apigwv2.WebSocketApi(this, 'ChatApi', {
    this.chatApi  = new apigwv2.WebSocketApi(this, 'ChatApi', {
      apiName: `${cdk.Stack.of(this).stackName}-chat-api`,
      routeSelectionExpression: '$request.body.action',
      connectRouteOptions: {
        integration: new integrations.WebSocketLambdaIntegration('ConnectIntegration', connectFn),
      },
      disconnectRouteOptions: {
        integration: new integrations.WebSocketLambdaIntegration('DisconnectIntegration', disconnectFn),
      },
    });

    //wsApi.addRoute('sendmessage', {
    this.chatApi.addRoute('sendmessage', {
      integration: new integrations.WebSocketLambdaIntegration('SendIntegration', sendMessageFn),
    });

    //const stage = new apigwv2.WebSocketStage(this, 'ChatApiStage', {
    this.stage = new apigwv2.WebSocketStage(this, 'ChatApiStage', {
      webSocketApi: this.chatApi,
      stageName: 'production',
      autoDeploy: true,
    });

    [connectFn, disconnectFn, sendMessageFn].forEach(fn => {
      fn.addPermission(`${fn.node.id}InvokePermission`, {
        principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
        action: 'lambda:InvokeFunction',
        //sourceArn: `arn:aws:execute-api:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:${wsApi.apiId}/${stage.stageName}/*/*`,
        sourceArn: `arn:aws:execute-api:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:${this.chatApi.apiId}/${this.stage.stageName}/*/*`,
      });
    });


    // CALLBACK_URL for send-message Lambda
    //const apiDomain = `https://${wsApi.apiId}.execute-api.${cdk.Stack.of(this).region}.amazonaws.com/${stage.stageName}`;
    const apiDomain = `https://${this.chatApi.apiId}.execute-api.${cdk.Stack.of(this).region}.amazonaws.com/${this.stage.stageName}`;
    sendMessageFn.addEnvironment('CALLBACK_URL', apiDomain);
  }
}




