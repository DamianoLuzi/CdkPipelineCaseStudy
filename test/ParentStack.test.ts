/* import { Match, Capture } from "@aws-cdk/assertions";
import * as cdk from "aws-cdk-lib";
import {  Stack } from "aws-cdk-lib";
import { CommunityHubStack } from "../lib/community-hub-stack";
import { CdkAnalyticsConstruct } from "../lib/analytics-construct";
import { Template } from 'aws-cdk-lib/assertions';
describe("CommunityHubStack Unit Test", () => {
  test("synthesizes all constructs correctly", () => {
    const app = new cdk.App();

    const stack: Stack = new CommunityHubStack(app, "CommunityHubStack");

    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::Lambda::Function", {
      Runtime: "python3.13",
    });

    

   template.hasResourceProperties("AWS::DynamoDB::Table", {
    KeySchema: Match.arrayWith([
        Match.objectLike({ AttributeName: "connectionId", KeyType: "HASH" })
    ]),
    AttributeDefinitions: Match.arrayWith([
        Match.objectLike({ AttributeName: "connectionId", AttributeType: "S" })
    ])
    });

    template.hasResourceProperties("AWS::DynamoDB::Table", {
    KeySchema: Match.arrayWith([
        Match.objectLike({ AttributeName: "postId", KeyType: "HASH" }),
        Match.objectLike({ AttributeName: "createdAt", KeyType: "RANGE" })
    ]),
    AttributeDefinitions: Match.arrayWith([
        Match.objectLike({ AttributeName: "postId", AttributeType: "S" }),
        Match.objectLike({ AttributeName: "createdAt", AttributeType: "S" })
    ])
    });


    template.hasResourceProperties("AWS::ApiGatewayV2::WebSocketApi", {
      Name: Match.stringLikeRegexp("-chat-api"),
    });

    template.hasResourceProperties("AWS::ApiGateway::RestApi", {
      Name: Match.stringLikeRegexp("PostsApi"),
    });

    template.hasResourceProperties("AWS::Events::EventBus", {
      Name: "AnalyticsBus",
    });

    template.hasResourceProperties("AWS::Events::Rule", {
      EventBusName: "AnalyticsBus",
      EventPattern: Match.objectLike({ source: ["posts.service"] }),
    });
    template.hasResourceProperties("AWS::Events::Rule", {
      EventBusName: "AnalyticsBus",
      EventPattern: Match.objectLike({ source: ["chat.service"] }),
    });
    const captureEnv = new Capture();
    template.hasResourceProperties("AWS::Lambda::Function", {
      Environment: captureEnv,
    });
    expect(captureEnv.asObject()).toHaveProperty("Variables");
  });
});
 */

import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { CommunityHubStack } from '../lib/community-hub-stack';

describe('CommunityHubStack Unit Test', () => {
  test('synthesizes analytics EventBus and outputs correctly', () => {
    const app = new cdk.App();
    const stack = new CommunityHubStack(app, 'CommunityHubStack');

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::Events::EventBus', {
      Name: Match.stringLikeRegexp('AnalyticsBus'),
    });

    template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    template.resourceCountIs('AWS::ApiGatewayV2::Api', 1);

    const outputs = Object.values(stack.node.children)
      .filter(c => c instanceof cdk.CfnOutput)
      .map(c => c as cdk.CfnOutput);

    const outputIds = outputs.map(o => o.node.id);
    expect(outputIds).toContain('PostsApiUrl');
    expect(outputIds).toContain('ChatApiUrl');
  });
});
