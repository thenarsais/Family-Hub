# Performance and Security Testing Guide

## Overview

This document outlines the performance and security testing strategy for Phase 1 of the Family Hub project. It covers automated tests, manual verification, and best practices for maintaining security and performance standards.

---

## Performance Testing

### Performance Test Thresholds

The following response time thresholds have been established:

| Endpoint Type | Threshold | Examples |
|---|---|---|
| Fast (Simple GET) | < 100ms | Health checks, status endpoints |
| Normal (DB Query) | < 500ms | List chores, get stats, get learning progress |
| Slow (Complex Query) | < 2000ms | Discover devices, large data loads |

### Performance Tests

#### 1. Response Time Tests
- **File**: `backend/src/__tests__/performance/performance.test.ts`
- **Coverage**:
  - GET /chores - 500ms threshold
  - POST /chores - 500ms threshold
  - GET /learning/stats - 500ms threshold
  - GET /smartthings/devices - 500ms threshold

#### 2. Concurrent Request Tests
- Tests handling of 10+ simultaneous requests
- Verifies no race conditions or resource exhaustion
- Validates proper error handling under load

#### 3. Large Response Tests
- Tests handling of 1000+ item lists
- Validates response serialization performance
- Ensures memory-efficient response handling

#### 4. Memory Efficiency Tests
- Monitors heap memory usage over 100 repeated requests
- Ensures memory increase < 50MB
- Detects potential memory leaks

#### 5. Database Query Performance
- Tests efficient handling of large result sets (100+ items)
- Validates query response times < 500ms
- Ensures proper indexing effectiveness

#### 6. Error Recovery Performance
- Tests that error handling doesn't add significant overhead
- Validates error responses complete within thresholds
- Ensures graceful degradation under failures

### Running Performance Tests

```bash
# Run all performance tests
npm test -- --testPathPattern="performance"

# Run with verbose output
npm test -- --testPathPattern="performance" --verbose

# Run single test
npm test -- --testNamePattern="should respond within 500ms"
```

### Performance Monitoring

Monitor these metrics during and after deployment:

- **API Response Times**: Track via application logs or monitoring tools
- **Database Query Times**: Monitor slow query logs
- **Memory Usage**: Track per-process memory consumption
- **CPU Usage**: Monitor CPU utilization during peak hours
- **Error Rates**: Track 4xx and 5xx error percentages

---

## Security Testing

### Security Test Coverage

The security testing suite covers the following vulnerability categories:

#### 1. Authentication & Authorization
- **Tests**: `backend/src/__tests__/security/security.test.ts`
- **Coverage**:
  - Missing user ID rejection
  - Authorization boundary violations
  - User data isolation

#### 2. Input Validation
- Negative values (pointsValue)
- Invalid enums (timeSlot, category)
- Missing required fields
- Empty strings
- Type mismatches (string vs number)

#### 3. Injection Prevention
- **SQL Injection**:
  - Single quotes in input
  - SQL keywords (SELECT, DROP, etc.)
  - Comment syntax (---, /*, */)
  - Testing with: `'; DROP TABLE chores; --`

- **XSS Prevention**:
  - Script tags
  - Event handlers
  - HTML entities
  - Testing with: `<script>alert("xss")</script>`

#### 4. Data Protection
- No exposure of internal error details
- No exposure of sensitive data (passwords, connection strings)
- Proper error message masking

#### 5. Rate Limiting Readiness
- Endpoints accept rate limiting headers
- Graceful handling of rate-limited requests

#### 6. CORS Security
- Proper OPTIONS request handling
- Correct CORS headers

#### 7. Payload Size Limits
- Large request body rejection
- 100KB+ payload handling

### Common Security Vulnerabilities Tested

#### OWASP Top 10 Coverage

1. **Broken Authentication**: ✓ User ID validation
2. **Broken Authorization**: ✓ User data isolation testing
3. **Injection**: ✓ SQL injection and XSS prevention
4. **Insecure Design**: ✓ Input validation and type checking
5. **Security Misconfiguration**: ✓ Error message validation
6. **Vulnerable Components**: ✓ Dependency management (via package-lock)
7. **Authentication Failure**: ✓ User ID requirement testing
8. **Data Integrity**: ✓ Input validation
9. **Logging & Monitoring**: ✓ Error tracking (documented separately)
10. **SSRF**: N/A for this phase (no external resource loading)

### Running Security Tests

```bash
# Run all security tests
npm test -- --testPathPattern="security"

# Run with verbose output
npm test -- --testPathPattern="security" --verbose

# Run specific security category
npm test -- --testNamePattern="SQL Injection"
npm test -- --testNamePattern="XSS"
npm test -- --testNamePattern="Authentication"
```

---

## Security Best Practices

### Implemented Controls

1. **Input Validation**
   - Enum validation for categorical fields
   - Type checking for numeric fields
   - Required field validation
   - Length limits on strings

2. **Error Handling**
   - Generic error messages (no internal details)
   - Proper HTTP status codes
   - Logging of errors for debugging

3. **Database Security**
   - Parameterized queries (via database connection layer)
   - No raw SQL string concatenation
   - Connection pooling with timeouts

4. **API Security**
   - User ID header requirement
   - User data isolation per request
   - CORS enabled in server

5. **Data Protection**
   - HTTPS required in production
   - Secure session management (via auth system)
   - JWT token validation

### Additional Security Measures (Production)

1. **Rate Limiting** (implemented in middleware)
   - 100 requests per 15 minutes per IP
   - 1000 requests per hour per user

2. **Request Size Limits**
   - Max JSON payload: 10MB
   - Max URL length: 2KB

3. **Security Headers** (configured in server)
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block

4. **CORS Configuration**
   - Allowed origins: defined in environment
   - Allowed methods: GET, POST, PUT, DELETE
   - Allowed headers: Authorization, Content-Type

5. **Authentication**
   - JWT tokens with expiration
   - Refresh token rotation
   - Secure cookie storage

---

## Performance Optimization Strategies

### Database Optimization

1. **Indexing**
   - Indexes on user_id for filtering
   - Indexes on created_at for sorting
   - Composite indexes on frequently queried combinations

2. **Query Optimization**
   - Use SELECT specific columns (not SELECT *)
   - Leverage LIMIT for pagination
   - Use EXPLAIN ANALYZE for complex queries

3. **Connection Pooling**
   - Maintain 10-20 idle connections
   - Max 30 concurrent connections
   - 30-second idle timeout

### API Optimization

1. **Response Compression**
   - Enable gzip for responses > 1KB
   - Compress JSON responses by default

2. **Caching Strategy**
   - Cache learning curriculum (static content)
   - Cache device types and capabilities
   - Short-lived cache for user stats (5 minutes)

3. **Pagination**
   - Default limit: 50 items
   - Max limit: 100 items
   - Include total count in response

### Frontend Optimization

1. **Data Fetching**
   - Debounce search queries
   - Cache API responses in React hooks
   - Use lazy loading for large lists

2. **Bundle Optimization**
   - Code splitting by route
   - Tree-shaking unused code
   - Minification in production

---

## Monitoring and Alerting

### Key Metrics to Monitor

1. **Response Time**
   - p50 (median): Target < 100ms
   - p95: Target < 300ms
   - p99: Target < 1000ms

2. **Error Rate**
   - 4xx errors: Monitor spike patterns
   - 5xx errors: Alert if > 1%
   - Timeout errors: Alert if > 0.5%

3. **Resource Usage**
   - CPU: Alert if > 80%
   - Memory: Alert if > 80%
   - Disk: Alert if > 85%

4. **Database Performance**
   - Slow queries: Log if > 1000ms
   - Connection pool usage: Alert if > 80%
   - Lock wait times: Monitor for contention

### Logging Strategy

1. **Request Logging**
   - Log all requests with timestamps
   - Include user ID, method, path, status code
   - Log response time

2. **Error Logging**
   - Log errors with full stack trace
   - Exclude sensitive data
   - Include context (user ID, operation)

3. **Security Logging**
   - Log authentication failures
   - Log authorization violations
   - Log input validation failures

---

## Testing Checklist

### Before Deployment

- [ ] All performance tests pass
- [ ] All security tests pass
- [ ] No new performance regressions (compare with baseline)
- [ ] Response times meet thresholds
- [ ] Error rates are normal
- [ ] No memory leaks detected
- [ ] All OWASP vulnerabilities addressed
- [ ] Input validation in place for all endpoints
- [ ] Authentication required for protected endpoints
- [ ] No sensitive data in error messages
- [ ] SQL injection tests pass
- [ ] XSS prevention tests pass
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers set

### Ongoing Monitoring

- [ ] Daily: Check error rates and response times
- [ ] Weekly: Review slow query logs
- [ ] Weekly: Check memory usage trends
- [ ] Monthly: Run full security audit
- [ ] Monthly: Performance baseline comparison
- [ ] Quarterly: Dependency security updates
- [ ] Quarterly: Security training and review

---

## Performance Baseline

### Expected Baseline Metrics

| Endpoint | p50 | p95 | p99 |
|---|---|---|---|
| GET /chores | 50ms | 150ms | 300ms |
| POST /chores | 60ms | 200ms | 400ms |
| POST /chores/:id/complete | 70ms | 250ms | 500ms |
| GET /learning/stats | 60ms | 180ms | 400ms |
| POST /learning/lessons/:id/complete | 80ms | 250ms | 500ms |
| GET /smartthings/devices | 100ms | 300ms | 700ms |

---

## Troubleshooting Performance Issues

### High Response Times

1. **Check Database Performance**
   ```sql
   -- Show slow queries
   SELECT * FROM pg_stat_statements
   WHERE mean_time > 100
   ORDER BY mean_time DESC;
   ```

2. **Check Query Execution Plans**
   ```sql
   EXPLAIN ANALYZE SELECT ... FROM chores WHERE user_id = $1;
   ```

3. **Verify Indexes Exist**
   ```sql
   SELECT * FROM pg_indexes WHERE tablename = 'chores';
   ```

### High Memory Usage

1. **Check Node Process Memory**
   ```bash
   ps aux | grep node
   ```

2. **Analyze Heap Dumps**
   ```bash
   node --inspect server.js
   ```

3. **Review Cache Configuration**
   - Check Redis memory limits
   - Review in-memory cache sizes

### High Error Rates

1. **Check Error Logs**
   ```bash
   tail -f logs/error.log
   ```

2. **Verify Database Connectivity**
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

3. **Check Service Dependencies**
   - SmartThings API availability
   - External API connectivity

---

## Security Audit Checklist

### Code Review

- [ ] No hardcoded secrets in code
- [ ] No debug logging in production
- [ ] Error messages are generic
- [ ] Input validation on all endpoints
- [ ] Authentication checks on protected routes
- [ ] Authorization checks for data access

### Dependency Audit

- [ ] Run `npm audit` regularly
- [ ] Update vulnerable packages promptly
- [ ] Review new package versions before updating
- [ ] Check package security advisories

### Configuration Review

- [ ] Production secrets in environment variables
- [ ] Database credentials properly secured
- [ ] API keys rotated regularly
- [ ] HTTPS/SSL certificates valid
- [ ] CORS origins restricted appropriately

---

## Contact & Escalation

For performance or security issues:

1. **Development Team**: Reach out in Slack
2. **Security Incident**: Contact security@company.com
3. **Performance Alert**: Check monitoring dashboard first

---

**Last Updated**: 2026-07-28  
**Version**: 1.0  
**Owner**: Development Team
