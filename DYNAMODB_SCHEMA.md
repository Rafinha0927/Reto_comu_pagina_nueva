# Estructura de Datos en DynamoDB

## Tabla: `sensor-data`

### Definición de la Tabla

| Propiedad | Valor |
|-----------|-------|
| Nombre | `sensor-data` |
| Partition Key (PK) | `sensorId` (String) |
| Sort Key (SK) | `timestamp` (Number) |
| Billing | On-demand (recomendado para desarrollo) |

---

## Esquema de Items

### Atributos Obligatorios

Cada registro (item) en la tabla debe tener esta estructura:

```json
{
  "sensorId": "sensor-01",
  "timestamp": 1701283200000,
  "receivedAt": "2025-11-29T10:30:00Z",
  "temperature": 22.5,
  "humidity": 65.3,
  "location": {
    "x": -4.0,
    "y": 2.5,
    "z": 4.0
  }
}
```

### Descripción de Campos

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| **sensorId** ⭐ | String | ID único del sensor (Partition Key) | "sensor-01" |
| **timestamp** ⭐ | Number | Marca de tiempo en milisegundos (Sort Key) | 1701283200000 |
| **receivedAt** | String | Fecha ISO 8601 cuando se recibió la lectura | "2025-11-29T10:30:00Z" |
| **temperature** | Number | Temperatura en grados Celsius | 22.5 |
| **humidity** | Number | Humedad relativa en porcentaje | 65.3 |
| **location** | Object | Coordenadas 3D para Potree | { x, y, z } |
| location.**x** | Number | Coordenada X en el espacio 3D | -4.0 |
| location.**y** | Number | Coordenada Y en el espacio 3D | 2.5 |
| location.**z** | Number | Coordenada Z en el espacio 3D | 4.0 |

⭐ = Campo de llave (clave para queries)

---

## Ejemplos de Items Válidos

### Sensor 1 - Esquina frontal izquierda
```json
{
  "sensorId": "sensor-01",
  "timestamp": 1701283200000,
  "receivedAt": "2025-11-29T10:30:00Z",
  "temperature": 22.5,
  "humidity": 65.3,
  "location": {
    "x": -4.0,
    "y": 2.5,
    "z": 4.0
  }
}
```

### Sensor 2 - Esquina frontal derecha
```json
{
  "sensorId": "sensor-02",
  "timestamp": 1701283201000,
  "receivedAt": "2025-11-29T10:31:00Z",
  "temperature": 23.1,
  "humidity": 62.8,
  "location": {
    "x": 4.0,
    "y": 2.5,
    "z": 4.0
  }
}
```

### Sensor 3 - Esquina trasera izquierda
```json
{
  "sensorId": "sensor-03",
  "timestamp": 1701283202000,
  "receivedAt": "2025-11-29T10:32:00Z",
  "temperature": 21.8,
  "humidity": 68.5,
  "location": {
    "x": -4.0,
    "y": 2.5,
    "z": -4.0
  }
}
```

### Sensor 4 - Esquina trasera derecha
```json
{
  "sensorId": "sensor-04",
  "timestamp": 1701283203000,
  "receivedAt": "2025-11-29T10:33:00Z",
  "temperature": 24.2,
  "humidity": 60.1,
  "location": {
    "x": 4.0,
    "y": 2.5,
    "z": -4.0
  }
}
```

---

## Consultas DynamoDB Utilizadas

### 1. Obtener última lectura de un sensor

```python
# Query para obtener la lectura más reciente de un sensor
# Sintaxis en DynamoDB Query Expression

KeyConditionExpression: "sensorId = :sid"
ExpressionAttributeValues: {
  ":sid": "sensor-01"
}
ScanIndexForward: false  # Descendente (más reciente primero)
Limit: 1
```

**Código TypeScript (implementado en `dynamodb.ts`):**
```typescript
export const getLatestReadings = async () => {
  const result = await ddbDocClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "sensorId = :sid",
      ExpressionAttributeValues: { ":sid": "sensor-01" },
      Limit: 1,
      ScanIndexForward: false,
    })
  );
  return result.Items?.[0];
};
```

### 2. Obtener histórico de un sensor (últimas N lecturas)

```python
KeyConditionExpression: "sensorId = :sid"
ExpressionAttributeValues: {
  ":sid": "sensor-01"
}
ScanIndexForward: false
Limit: 100  # Últimas 100 lecturas
```

**Código TypeScript:**
```typescript
export const getReadingsBySensor = async (
  sensorId: string,
  limit = 100
) => {
  const result = await ddbDocClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "sensorId = :sid",
      ExpressionAttributeValues: { ":sid": sensorId },
      Limit: limit,
      ScanIndexForward: false,
    })
  );
  return result.Items || [];
};
```

### 3. Obtener histórico filtrado por tiempo

```python
KeyConditionExpression: "sensorId = :sid AND #ts BETWEEN :start AND :end"
ExpressionAttributeNames: {
  "#ts": "timestamp"
}
ExpressionAttributeValues: {
  ":sid": "sensor-01",
  ":start": 1701283200000,  # Hace 7 días
  ":end": 1701369600000     # Hoy
}
```

**Código TypeScript:**
```typescript
export const getReadingsBySensor = async (
  sensorId: string,
  startTime: number,
  endTime: number
) => {
  const result = await ddbDocClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "sensorId = :sid AND #ts BETWEEN :start AND :end",
      ExpressionAttributeNames: { "#ts": "timestamp" },
      ExpressionAttributeValues: {
        ":sid": sensorId,
        ":start": startTime,
        ":end": endTime,
      },
    })
  );
  return result.Items || [];
};
```

---

## Índices Recomendados

### Índice Global Secundario (GSI) para análisis por fecha
```
GSI Name: timestamp-index
Partition Key: timestamp (Number)
Sort Key: sensorId (String)
Projection: ALL
```

Esto permitiría hacer queries como:
- "Dame todas las lecturas entre estas fechas, de cualquier sensor"

---

## Cálculo de Timestamps

### JavaScript/TypeScript
```typescript
// Timestamp actual en milisegundos
const now = Date.now();  // 1701283200000

// Hace 1 hora
const oneHourAgo = Date.now() - (60 * 60 * 1000);

// Hace 24 horas
const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

// Hace 7 días
const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

// Hace 30 días
const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
```

---

## Estimación de Capacidad

### Para desarrollo
- Lectura On-Demand: ideal
- Escritura On-Demand: ideal
- Costo: ~$1.25 por millón de escrituras

### Para producción (si tienes alto volumen)
- Provisioned Capacity: 10 RCU, 10 WCU
- Ajusta según métricas de CloudWatch

---

## Migrations / Inserción Inicial

### Script Python para insertar datos de prueba

```python
import boto3
from datetime import datetime, timedelta
import random

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('sensor-data')

sensors = ['sensor-01', 'sensor-02', 'sensor-03', 'sensor-04']
sensor_positions = {
    'sensor-01': {'x': -4.0, 'y': 2.5, 'z': 4.0},
    'sensor-02': {'x': 4.0, 'y': 2.5, 'z': 4.0},
    'sensor-03': {'x': -4.0, 'y': 2.5, 'z': -4.0},
    'sensor-04': {'x': 4.0, 'y': 2.5, 'z': -4.0},
}

# Insertar últimos 30 días de datos
now = datetime.utcnow()
for days_back in range(30):
    for sensor_id in sensors:
        # Varias lecturas por sensor por día
        for hour in range(0, 24, 2):
            timestamp = int((now - timedelta(days=days_back, hours=hour)).timestamp() * 1000)
            
            table.put_item(Item={
                'sensorId': sensor_id,
                'timestamp': timestamp,
                'receivedAt': (now - timedelta(days=days_back, hours=hour)).isoformat() + 'Z',
                'temperature': random.uniform(18, 28),
                'humidity': random.uniform(40, 80),
                'location': sensor_positions[sensor_id],
            })

print("Datos de prueba insertados exitosamente")
```

---

## Verificación en AWS Console

1. Ve a: AWS Console > DynamoDB > Tables
2. Selecciona `sensor-data`
3. Haz clic en "Items"
4. Deberías ver los registros con estructura descrita arriba

---

## Notas de Optimización

- **Timestamp**: Usar milisegundos (Date.now() en JS) para precisión
- **ScanIndexForward: false**: Obtiene datos más recientes primero
- **Limit**: Siempre especificar para evitar escaneos enormes
- **TTL (Time To Live)**: Considera agregar TTL para borrar datos antiguos automáticamente
