# Testing Guide
## Family Hub Backend - Test Suite

**Status:** Production Ready ✅  
**Framework:** Jest + TypeScript  
**Coverage:** Unit & Integration Tests

---

## 📋 Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

---

## 🏗️ Test Structure

```
backend/
├── src/
│   ├── __tests__/
│   │   ├── setup.ts                    # Jest setup & config
│   │   ├── unit/
│   │   │   ├── validation.test.ts      # Validation middleware
│   │   │   ├── query-optimizer.test.ts # Query profiling
│   │   │   └── ...
│   │   ├── integration/
│   │   │   ├── endpoints.integration.test.ts
│   │   │   ├── database.integration.test.ts
│   │   │   ├── api.health.test.ts
│   │   │   └── ...
│   │   └── e2e/
│   │       └── (full workflow tests)
│   └── ...
├── jest.config.js                      # Jest configuration
└── package.json                        # Test scripts
```

---

## 🧪 Test Types

### Unit Tests

Test individual functions in isolation:

```typescript
// Example: validation.test.ts
describe('Validation Middleware', () => {
  it('should validate required string', async () => {
    const schema = {
      name: { field: 'name', type: 'string', required: true }
    };

    const result = await validateRequest({ name: 'John' }, schema);
    expect(result.valid).toBe(true);
    expect(result.data?.name).toBe('John');
  });
});
```

**Files:**
- `validation.test.ts` - Input validation tests
- `query-optimizer.test.ts` - Query profiling tests
- `rate-limiter.test.ts` - Rate limiting tests
- `compression.test.ts` - Response compression tests

### Integration Tests

Test API endpoints and database interactions:

```typescript
// Example: endpoints.integration.test.ts
describe('API Endpoints', () => {
  it('should return 200 for /health', async () => {
    const response = await fetch('http://localhost:3000/health');
    expect(response.status).toBe(200);
  });
});
```

**Files:**
- `endpoints.integration.test.ts` - HTTP endpoint tests
- `database.integration.test.ts` - Database operation tests
- `api.health.test.ts` - Health check endpoint tests

---

## 📊 Coverage Targets

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 50,      // 50% of branches
    functions: 50,     // 50% of functions
    lines: 50,         // 50% of lines
    statements: 50     // 50% of statements
  }
}
```

**Current Target:** 50% minimum coverage

To view coverage report:

```bash
npm run test:coverage

# Open coverage/lcov-report/index.html in browser
```

---

## 🚀 CI/CD Integration

Tests run automatically on every push:

```yaml
# .github/workflows/ci.yml
test:
  - npm run test:unit
  - npm run test:integration
  - npm run test:coverage
```

**Blocking:** Tests must pass before merging to main

---

## ✅ Testing Checklist

### Before Committing

- [ ] All unit tests pass (`npm run test:unit`)
- [ ] All integration tests pass (`npm run test:integration`)
- [ ] Coverage meets thresholds
- [ ] No console errors
- [ ] No timeout failures

### Endpoint Testing

- [ ] Health endpoints work
- [ ] Readiness probes respond
- [ ] Error handling returns proper status codes
- [ ] 404s return JSON

### Database Testing

- [ ] Connection pooling works
- [ ] Caching layers function
- [ ] Transactions commit/rollback
- [ ] Constraints enforced

### Performance Testing

- [ ] Queries execute within budget
- [ ] Indexes being used
- [ ] No N+1 query patterns
- [ ] Response compression working

---

## 🔍 Writing Tests

### Unit Test Template

```typescript
import { myFunction } from '../../path/to/function';

describe('Feature Name', () => {
  describe('Scenario', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = myFunction(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Integration Test Template

```typescript
describe('API Endpoint', () => {
  it('should return correct response', async () => {
    // Arrange
    const url = 'http://localhost:3000/endpoint';
    const options = { method: 'GET' };

    // Act
    const response = await fetch(url, options);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('field');
  });
});
```

---

## 🛠️ Common Test Patterns

### Testing Async Functions

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Testing Error Cases

```typescript
it('should throw on invalid input', () => {
  expect(() => {
    myFunction(null);
  }).toThrow();
});
```

### Testing with Mocks

```typescript
it('should call external service', async () => {
  const mockService = jest.fn().mockResolvedValue({ data: 'test' });
  const result = await functionUsingService(mockService);

  expect(mockService).toHaveBeenCalled();
  expect(result).toBeDefined();
});
```

### Testing with Setup/Teardown

```typescript
describe('Database Tests', () => {
  beforeEach(() => {
    // Setup: Create test data
  });

  afterEach(() => {
    // Teardown: Clean up
  });

  it('should work with test data', () => {
    expect(true).toBe(true);
  });
});
```

---

## 🐛 Debugging Tests

### Run Single Test

```bash
npm test -- validation.test.ts
```

### Run Specific Describe Block

```bash
npm test -- -t "Validation Middleware"
```

### Run with Debugging

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Verbose Output

```bash
npm test -- --verbose
```

---

## 📈 Performance Benchmarks

Expected test execution times:

```
Unit Tests:        < 5 seconds (20 tests)
Integration Tests: < 10 seconds (15 tests)
Coverage Report:   < 2 seconds
Total Suite:       < 20 seconds
```

---

## 🔐 Testing Security

### Test for Common Vulnerabilities

- [ ] SQL Injection (parameterized queries)
- [ ] XSS (input sanitization)
- [ ] CSRF (token validation)
- [ ] Authentication (bearer tokens)
- [ ] Authorization (role checks)

### Example Security Test

```typescript
it('should sanitize XSS attempts', async () => {
  const schema = {
    comment: { field: 'comment', type: 'string', required: true }
  };

  const result = await validateRequest(
    { comment: '<script>alert("xss")</script>' },
    schema
  );

  expect(result.data?.comment).not.toContain('<script>');
});
```

---

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [TypeScript Testing Guide](https://www.typescriptlang.org/docs/handbook/testing.html)

---

## ✨ Test Tips

1. **Descriptive Names**: Use clear test descriptions
2. **One Assertion Focus**: Test one thing per test
3. **DRY Setup**: Use beforeEach for common setup
4. **Meaningful Mocks**: Mock external dependencies
5. **Realistic Data**: Use production-like test data
6. **Fast Tests**: Keep tests under 100ms
7. **Isolated Tests**: No test should depend on another
8. **Clear Failures**: Make error messages helpful

---

**Status:** Testing Framework Ready ✅

Ready to run: `npm test`
