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
          'npm test',
          'npx cdk synth',
        ],
      }),
      crossAccountKeys: true, // Set to true if you need cross-account deployments
    });
  
  pipeline.addStage(
    new PipelineStage(
      this, 'DEV', {env: { account: '799201157016', region: 'eu-west-3' }})
  )

  pipeline.addStage(
  new PipelineStage(
    this, 'STG', {env: { account: '351323459405', region: 'eu-central-1' }})
  )
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




