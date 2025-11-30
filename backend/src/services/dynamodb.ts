import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

const ddbDocClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE!;

export const saveReading = async (data: any) => {
  const params = new PutCommand({
    TableName: TABLE_NAME,
    Item: data,
  });
  await ddbDocClient.send(params);
};

export const getLatestReadings = async () => {
  const sensors = ["sensor-01", "sensor-02", "sensor-03", "sensor-04"];
  const latest: Record<string, any> = {};

  for (const sensorId of sensors) {
    const result = await ddbDocClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "sensorId = :sid",
        ExpressionAttributeValues: { ":sid": sensorId },
        Limit: 1,
        ScanIndexForward: false,
      })
    );
    if (result.Items && result.Items[0]) {
      latest[sensorId] = result.Items[0];
    }
  }
  return latest;
};

export const getReadingsBySensor = async (
  sensorId: string,
  startTime?: number,
  endTime?: number,
  limit = 1000
) => {
  const params: any = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "sensorId = :sid",
    ExpressionAttributeValues: { ":sid": sensorId },
    ScanIndexForward: false,
    Limit: limit,
  };

  if (startTime && endTime) {
    params.KeyConditionExpression += " AND #ts BETWEEN :start AND :end";
    params.ExpressionAttributeNames = { "#ts": "timestamp" };
    params.ExpressionAttributeValues[":start"] = startTime;
    params.ExpressionAttributeValues[":end"] = endTime;
  }

  const result = await ddbDocClient.send(new QueryCommand(params));
  return result.Items || [];
};