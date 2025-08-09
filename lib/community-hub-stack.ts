import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CdkChatConstruct } from './chat-construct';
import { CdkPostsConstruct} from './posts-construct';

export class CommunityHubStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const postsApp = new CdkPostsConstruct(this, 'PostsConstruct');

    // Create the chat application resources as a single construct
    const chatApp = new CdkChatConstruct(this, 'ChatConstruct');

    // =====================================================================
    //  Outputs for the frontend
    // =====================================================================
    // These outputs will give you the API endpoints you need for your React app.
    // The `cdk deploy` command will print these values to your terminal.
    new cdk.CfnOutput(this, 'PostsApiUrl', {
      value: postsApp.postsApi.url,
      description: 'The URL for the Posts REST API',
    });

    new cdk.CfnOutput(this, 'ChatApiUrl', {
      value: chatApp.stage.url,
      description: 'The URL for the Chat WebSocket API',
    });
    /* const postsStack = new CdkPostsStack(this, 'PostsStack');
    const chatStack = new CdkChatStack(this, 'ChatStack'); */
  }
}
