# Database Schema Documentation

## MongoDB Collections

### Response Collection

The `responses` collection stores all HTTP response data from the monitoring system.

#### Schema Structure

```typescript
{
  _id: ObjectId,           // MongoDB auto-generated ID
  url: string,             // Target URL (e.g., "https://httpbin.org/anything")
  method: string,          // HTTP method (e.g., "POST")
  requestPayload: object,  // Random JSON payload sent with request
  statusCode: number,      // HTTP response status code
  responseData: object,    // Full response data from httpbin.org
  responseTime: number,    // Response time in milliseconds
  timestamp: Date,        // When the request was made
  error?: string,          // Error message if request failed
  createdAt: Date,        // MongoDB auto-generated creation timestamp
  updatedAt: Date          // MongoDB auto-generated update timestamp
}
```

#### Example Document

```json
{
  "_id": "64f8b2c1a1b2c3d4e5f6g7h8",
  "url": "https://httpbin.org/anything",
  "method": "POST",
  "requestPayload": {
    "message": "Hello World",
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "statusCode": 200,
  "responseData": {
    "args": {},
    "data": "{\"message\":\"Hello World\",\"timestamp\":\"2024-01-15T10:30:00.000Z\"}",
    "files": {},
    "form": {},
    "headers": {
      "Accept": "*/*",
      "Content-Length": "65",
      "Content-Type": "application/json",
      "Host": "httpbin.org",
      "User-Agent": "Marketplace-Analytics-Backend/1.0"
    },
    "json": {
      "message": "Hello World",
      "timestamp": "2024-01-15T10:30:00.000Z"
    },
    "method": "POST",
    "origin": "192.168.1.100",
    "url": "https://httpbin.org/anything"
  },
  "responseTime": 245,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### Indexes

```javascript
// Compound index for efficient querying by timestamp
db.responses.createIndex({ "timestamp": -1 })

// Index for status code filtering
db.responses.createIndex({ "statusCode": 1 })

// Compound index for status and timestamp
db.responses.createIndex({ "statusCode": 1, "timestamp": -1 })

// Index for response time analysis
db.responses.createIndex({ "responseTime": 1 })
```

#### Query Patterns

**Get latest responses:**
```javascript
db.responses.find().sort({ timestamp: -1 }).limit(10)
```

**Get responses by status code:**
```javascript
db.responses.find({ statusCode: { $gte: 200, $lt: 400 } })
```

**Get average response time:**
```javascript
db.responses.aggregate([
  { $group: { _id: null, avgTime: { $avg: "$responseTime" } } }
])
```

**Get success rate statistics:**
```javascript
db.responses.aggregate([
  {
    $group: {
      _id: null,
      total: { $sum: 1 },
      successful: {
        $sum: { $cond: [{ $and: [{ $gte: ["$statusCode", 200] }, { $lt: ["$statusCode", 400] }] }, 1, 0] }
      },
      failed: {
        $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] }
      }
    }
  }
])
```

## Data Flow

1. **Scheduler Service** triggers every 5 minutes
2. **Response Service** generates random payload
3. **HTTP Request** sent to httpbin.org/anything
4. **Response Data** stored in MongoDB
5. **WebSocket Broadcast** notifies connected clients
6. **Frontend** receives real-time updates

## Data Retention

- **Default**: All data is retained indefinitely
- **Production Recommendation**: Implement data retention policies
- **Example**: Keep data for 30 days, archive older data

```javascript
// Example cleanup job (run daily)
db.responses.deleteMany({
  timestamp: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
})
```

## Performance Considerations

1. **Indexing**: Proper indexes for common query patterns
2. **Pagination**: Use limit/skip for large datasets
3. **Aggregation**: Use MongoDB aggregation for statistics
4. **Connection Pooling**: Configure appropriate connection limits
5. **Monitoring**: Monitor query performance and slow operations

## Backup Strategy

```bash
# Daily backup
mongodump --db marketplace-analytics --out /backup/$(date +%Y%m%d)

# Restore from backup
mongorestore --db marketplace-analytics /backup/20240115/marketplace-analytics
```
