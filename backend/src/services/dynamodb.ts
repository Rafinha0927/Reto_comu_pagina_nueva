import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

/**
 * INTEGRACIÓN CON DYNAMODB
 * ========================
 * Este archivo maneja todas las operaciones con la tabla de DynamoDB que almacena
 * los datos de los sensores IoT.
 * 
 * ESTRUCTURA DE LA TABLA EN DYNAMODB:
 * ===================================
 * Tabla: sensor-data
 * Partition Key (PK): sensorId (String) - Identificador único del sensor
 * Sort Key (SK): timestamp (Number) - Marca de tiempo en milisegundos
 * 
 * Atributos esperados en cada item:
 * - sensorId: String (ej: "sensor-01", "sensor-02")
 * - timestamp: Number (ej: 1701283200000)
 * - receivedAt: String (ISO 8601, ej: "2025-11-29T10:30:00Z")
 * - temperature: Number (ej: 22.5)
 * - humidity: Number (ej: 65.3)
 * - location: Object (coordenadas para visualización en Potree)
 *   - x: Number (coordenada X)
 *   - y: Number (coordenada Y)
 *   - z: Number (coordenada Z)
 * 
 * VARIABLES DE ENTORNO REQUERIDAS:
 * - AWS_REGION: Región de AWS (ej: "us-east-1")
 * - AWS_ACCESS_KEY_ID: Clave de acceso de AWS
 * - AWS_SECRET_ACCESS_KEY: Clave secreta de AWS
 * - DYNAMODB_TABLE: Nombre de la tabla (ej: "sensor-data")
 */

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

const ddbDocClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE!;

/**
 * GUARDAR LECTURA DE SENSOR
 * Almacena una nueva lectura de sensor en DynamoDB
 * 
 * @param data - Objeto con la estructura:
 *   {
 *     sensorId: string,        // ID del sensor (partition key)
 *     timestamp: number,       // Marca de tiempo (sort key)
 *     receivedAt: string,      // Fecha ISO cuando se recibió
 *     temperature: number,     // Temperatura en Celsius
 *     humidity: number,        // Humedad en porcentaje
 *     location: {              // Coordenadas para Potree
 *       x: number,
 *       y: number,
 *       z: number
 *     }
 *   }
 */
export const saveReading = async (data: any) => {
  const params = new PutCommand({
    TableName: TABLE_NAME,
    Item: data,
  });
  await ddbDocClient.send(params);
};

/**
 * OBTENER ÚLTIMAS LECTURAS DE TODOS LOS SENSORES
 * Recupera la lectura más reciente de cada sensor
 * 
 * @returns Record<sensorId, latestReading>
 * Ejemplo:
 * {
 *   "sensor-01": { sensorId: "sensor-01", temperature: 22.5, ... },
 *   "sensor-02": { sensorId: "sensor-02", temperature: 23.1, ... }
 * }
 * 
 * NOTA: Configura aquí los IDs de tus sensores según estén en DynamoDB
 */
export const getLatestReadings = async () => {
  // ⚠️ IMPORTANTE: Cambiar estos IDs por los de tus sensores reales en DynamoDB
  const sensors = ["sensor-01", "sensor-02", "sensor-03", "sensor-04"];
  const latest: Record<string, any> = {};

  for (const sensorId of sensors) {
    const result = await ddbDocClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "sensorId = :sid",
        ExpressionAttributeValues: { ":sid": sensorId },
        Limit: 1,
        ScanIndexForward: false, // true = orden ascendente, false = descendente (más reciente)
      })
    );
    if (result.Items && result.Items[0]) {
      latest[sensorId] = result.Items[0];
    }
  }
  return latest;
};

/**
 * OBTENER LECTURAS DE UN SENSOR (CON FILTRO DE TIEMPO OPCIONAL)
 * 
 * @param sensorId - ID del sensor (ej: "sensor-01")
 * @param startTime - Marca de tiempo inicial en ms (opcional)
 * @param endTime - Marca de tiempo final en ms (opcional)
 * @param limit - Máximo de registros a devolver (default: 1000)
 * 
 * @returns Array de lecturas ordenadas por timestamp más reciente primero
 * 
 * EJEMPLO DE USO:
 * // Obtener últimas 100 lecturas
 * getReadingsBySensor("sensor-01", undefined, undefined, 100)
 * 
 * // Obtener lecturas de los últimos 7 días
 * const now = Date.now();
 * const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
 * getReadingsBySensor("sensor-01", sevenDaysAgo, now)
 */
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
    ScanIndexForward: false, // Ordenar descendente (más reciente primero)
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