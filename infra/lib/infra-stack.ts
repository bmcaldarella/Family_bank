import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as authorizers from "aws-cdk-lib/aws-apigatewayv2-authorizers";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // -----------------------
    // DynamoDB
    // -----------------------
    const table = new dynamodb.Table(this, "FamilyBankTable", {
      tableName: "FamilyBank",
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,

      // Si NO quieres perder data nunca, cambia a RETAIN.
      // Si estás en puro dev y te da igual, deja DESTROY.
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    table.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "GSI1PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI1SK", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // -----------------------
    // Cognito
    // -----------------------
    const userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "family-bank-users",
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // dev only
    });

    const userPoolClient = userPool.addClient("UserPoolClient", {
      userPoolClientName: "family-bank-web",
      authFlows: { userPassword: true, userSrp: true },
    });

    // -----------------------
    // Lambda
    // -----------------------
    const apiLambda = new lambda.Function(this, "ApiLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("lambda"),
      environment: { TABLE_NAME: table.tableName },
    });

    table.grantReadWriteData(apiLambda);

    // -----------------------
    // HTTP API (API Gateway v2)
    // IMPORTANT: Cambié el construct ID a "HttpApiV2" para forzar un API NUEVO
    // y evitar conflictos 409 por rutas existentes.
    // -----------------------
    const httpApi = new apigwv2.HttpApi(this, "HttpApiV2", {
      apiName: "family-bank-api-v2",
      corsPreflight: {
        allowOrigins: ["http://localhost:3000", "http://127.0.0.1:3000"],
        allowHeaders: ["authorization", "content-type"],
        allowMethods: [apigwv2.CorsHttpMethod.ANY],
      },
    });

    const jwtAuthorizer = new authorizers.HttpJwtAuthorizer(
      "CognitoJwtAuthorizer",
      `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
      {
        jwtAudience: [userPoolClient.userPoolClientId],
      }
    );

    const integration = new integrations.HttpLambdaIntegration(
      "LambdaIntegration",
      apiLambda
    );

    // -----------------------
    // Routes (1 vez cada path)
    // -----------------------
    httpApi.addRoutes({
      path: "/households",
      methods: [apigwv2.HttpMethod.GET, apigwv2.HttpMethod.POST],
      integration,
      authorizer: jwtAuthorizer,
    });

    httpApi.addRoutes({
      path: "/transactions",
      methods: [
        apigwv2.HttpMethod.GET,
        apigwv2.HttpMethod.POST,
        apigwv2.HttpMethod.PATCH,
        apigwv2.HttpMethod.DELETE,
      ],
      integration,
      authorizer: jwtAuthorizer,
    });

    httpApi.addRoutes({
      path: "/invites",
      methods: [apigwv2.HttpMethod.POST],
      integration,
      authorizer: jwtAuthorizer,
    });

    httpApi.addRoutes({
      path: "/invites/accept",
      methods: [apigwv2.HttpMethod.POST],
      integration,
      authorizer: jwtAuthorizer,
    });

    httpApi.addRoutes({
      path: "/profile",
      methods: [apigwv2.HttpMethod.GET, apigwv2.HttpMethod.PUT],
      integration,
      authorizer: jwtAuthorizer,
    });

    httpApi.addRoutes({
      path: "/profiles",
      methods: [apigwv2.HttpMethod.GET],
      integration,
      authorizer: jwtAuthorizer,
    });

    httpApi.addRoutes({
      path: "/goals",
      methods: [apigwv2.HttpMethod.GET, apigwv2.HttpMethod.PUT],
      integration,
      authorizer: jwtAuthorizer,
    });

    // -----------------------
    // Outputs
    // -----------------------
    new cdk.CfnOutput(this, "ApiUrl", { value: httpApi.apiEndpoint });
    new cdk.CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, "Region", { value: this.region });
  }
}
