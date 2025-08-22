import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { PipelineStage } from './pipeline-stage';

export class CdkPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this,"Pipeline", {
      pipelineName: 'CaseStudyCodePipeline',
      synth: new ShellStep('Synth', {
        /* input: CodePipelineSource.gitHub(
          'DamianoLuzi/CDKChatApp','main'
        ), */
        input: CodePipelineSource.connection(
          'DamianoLuzi/CdkPipelineCaseStudy','main',{
            connectionArn: 'arn:aws:codeconnections:us-east-1:718579638605:connection/500ced3a-c591-4bad-9545-b6d2b66de1c3',
            triggerOnPush: true
          }
        ),
        commands: [
          'npm ci',
          'npm run build',
          //'npm test',
          'npx cdk synth',
        ],
      }),
      crossAccountKeys: true, // Set to true if you need cross-account deployments
    });

    const devStage =  new PipelineStage(this, 'DEV', {env: { account: '799201157016', region: 'eu-west-3' }});

    pipeline.addStage(devStage, {
      pre: [
        new ShellStep('UnitTests', {
          commands: [
            'npm ci',
            'npm test',
          ],
        }),
      ],
    });

    const stgStage = new PipelineStage(this, 'STG', {env: { account: '351323459405', region: 'eu-central-1' }})
    pipeline.addStage(stgStage, {
      post: [
        new ShellStep('RunIntegrationTests', {
          commands: [
            'npm ci',
            'npm run integ',
            'POSTS_API_URL=$(aws cloudformation describe-stacks --stack-name CommunityHubStack-STG --query \'Stacks[0].Outputs[?OutputKey==`PostsApiUrl`].OutputValue\' --output text)',
            'CHAT_WS_URL=$(aws cloudformation describe-stacks --stack-name CommunityHubStack-STG --query \'Stacks[0].Outputs[?OutputKey==`ChatApiUrl`].OutputValue\' --output text)',

            'echo "Posts API URL: $POSTS_API_URL"',
            'echo "Chat WS URL: $CHAT_WS_URL"',

            'curl -s -o /dev/null -w "%{http_code}" $POSTS_API_URL/posts | grep 200',
            'npx wscat -c $CHAT_WS_URL -x \'{"action":"sendmessage","message":"hello"}\'',
          ],
        }),
      ],
   });
  /*
  const prdWave = pipeline.addWave('PRD')
  prdWave.addStage(
    new PipelineStage(
      this, 'PRD-NV', {env: { account: '718579638605', region: 'us-east-1' }})
  );
    prdWave.addStage(
    new PipelineStage(
      this, 'DR-NV', {env: { account: '718579638605', region: 'us-east-1' }})
  ); */
}
}




