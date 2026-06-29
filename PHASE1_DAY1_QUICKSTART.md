# Phase 1 - Day 1: Quick Start Guide

**Goal:** Get development environment set up and Supabase configured  
**Est. Time:** 3-4 hours  
**Outcome:** Ready to start building backend

---

## Step 1: Verify Prerequisites (15 min)

Check if you have these installed:

```bash
# Check Flutter
flutter --version
# Expected: Flutter 3.x.x or higher

# Check Node.js
node --version
npm --version
# Expected: Node 18+ and npm 9+

# Check Git
git --version
# Expected: Git 2.40+

# Check PostgreSQL (local for development)
postgres --version
# Expected: PostgreSQL 14+
```

**If any are missing:** Install from:
- Flutter: https://flutter.dev/docs/get-started/install
- Node.js: https://nodejs.org/ (LTS version)
- PostgreSQL: https://www.postgresql.org/download/

---

## Step 2: Create Supabase Project (20 min)

1. **Go to Supabase:** https://supabase.com
2. **Sign up/Login** with GitHub (recommended)
3. **Create new project:**
   - Name: `family-hub`
   - Region: US East (or closest to you)
   - Database password: Generate strong password, save it
   - Click "Create new project"
   - Wait 2-3 min for database to initialize

4. **Get Connection Details:**
   - Go to Project Settings → Database
   - Copy:
     - **Host:** `db.xxx.supabase.co`
     - **Port:** `5432`
     - **Database:** `postgres`
     - **Username:** `postgres`
     - **Password:** (the one you set)
   - Also get from API settings:
     - **SUPABASE_URL:** `https://xxx.supabase.co`
     - **SUPABASE_ANON_KEY:** (under "anon public")

---

## Step 3: Setup Local Environment (30 min)

1. **Create `.env.local` file in project root:**

```bash
# .env.local (DO NOT COMMIT THIS FILE)

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Database (Local for development)
DATABASE_URL=postgresql://postgres:yourpassword@db.xxx.supabase.co:5432/postgres
DATABASE_URL_LOCAL=postgresql://postgres:yourpassword@localhost:5432/family_hub

# API Server
API_PORT=3000
NODE_ENV=development

# JWT Secret (generate: openssl rand -base64 32)
JWT_SECRET=your_generated_secret_here
```

2. **Add to .gitignore:**

```bash
echo ".env.local" >> .gitignore
git add .gitignore
git commit -m "chore: Add .env.local to gitignore"
```

3. **Create backend folder:**

```bash
mkdir backend
cd backend
npm init -y
```

---

## Step 4: Initialize Backend Project (30 min)

1. **Install dependencies:**

```bash
npm install express cors dotenv
npm install -D typescript ts-node @types/express @types/node nodemon

# For Supabase/PostgreSQL
npm install @supabase/supabase-js pg

# For validation & type safety
npm install zod pino pino-pretty
```

2. **Create `tsconfig.json`:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

3. **Create folder structure:**

```bash
mkdir -p src/{routes,middleware,services,types}
touch src/server.ts src/index.ts
```

4. **Create `src/server.ts`:**

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

export default app;
```

5. **Update `package.json` scripts:**

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

6. **Test it works:**

```bash
npm run dev
# Should output: ✅ Server running on http://localhost:3000

# In another terminal:
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"2026-06-29T..."}
```

---

## Step 5: Test Supabase Connection (30 min)

1. **Create `src/services/database.ts`:**

```typescript
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}
```

2. **Update `src/server.ts` to test connection:**

```typescript
import { testConnection } from './services/database';

// After app initialization
app.listen(PORT, async () => {
  const connected = await testConnection();
  if (connected) {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  } else {
    console.error('Failed to connect to database');
    process.exit(1);
  }
});
```

3. **Run and verify:**

```bash
npm run dev
# Should output: ✅ Supabase connected successfully
```

---

## Step 6: Initialize Flutter Project (30 min)

1. **Create Flutter project:**

```bash
cd .. # Back to root
flutter create family_hub
cd family_hub
```

2. **Update `pubspec.yaml` with dependencies:**

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  riverpod: ^2.4.0
  flutter_riverpod: ^2.4.0
  
  # Routing
  go_router: ^10.0.0
  
  # HTTP Client
  dio: ^5.3.0
  
  # Local Storage
  isar: ^3.1.0+1
  
  # Firebase (optional for Phase 1, defer if needed)
  # firebase_core: ^2.24.0
  
  # Material 3
  flutter_material_3: ^0.0.0
  
  # Serialization
  freezed_annotation: ^2.4.1
  json_annotation: ^4.8.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  build_runner: ^2.4.0
  freezed: ^2.4.1
  json_serializable: ^6.7.0
```

3. **Install dependencies:**

```bash
flutter pub get
flutter pub run build_runner build
```

4. **Test it runs:**

```bash
flutter run
# Should launch app on connected device/emulator
# You'll see default Flutter demo app
```

---

## Step 7: Create Project Structure (20 min)

**Create folder structure:**

```bash
mkdir -p lib/{features,shared,app}
mkdir -p lib/shared/{providers,widgets,models,constants,utils}
mkdir -p lib/features/{auth,games,trivia,activities}
```

**Create `lib/main.dart`:**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  runApp(
    const ProviderScope(
      child: MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Family Hub',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Family Hub - Phase 1 MVP'),
      ),
      body: const Center(
        child: Text('Welcome to Family Hub!\n\nPhase 1 starting...'),
      ),
    );
  }
}
```

**Test it compiles:**

```bash
flutter run
# Should show: "Welcome to Family Hub!"
```

---

## Verification Checklist ✅

By end of Day 1, you should have:

- [ ] Flutter, Node.js, PostgreSQL installed
- [ ] Supabase project created and configured
- [ ] `.env.local` file with credentials
- [ ] Backend running on `http://localhost:3000`
- [ ] Backend can connect to Supabase
- [ ] Flutter project created
- [ ] Flutter app runs on emulator/device
- [ ] Git repository clean and ready
- [ ] All documents committed to GitHub

---

## Common Issues & Fixes

**Issue: `flutter: command not found`**
- Solution: Add Flutter to PATH or reinstall Flutter

**Issue: `npm: command not found`**
- Solution: Install Node.js from nodejs.org

**Issue: Supabase connection fails**
- Solution: Double-check credentials in `.env.local`, verify database initialized in Supabase dashboard

**Issue: Flutter build fails**
- Solution: Run `flutter clean && flutter pub get`

**Issue: Can't connect to `localhost:3000`**
- Solution: Make sure backend is running with `npm run dev`

---

## Next Steps (Day 2)

Once Day 1 is complete:

1. Create PostgreSQL schema (from UNIFIED_STATE_SCHEMA.md)
2. Seed trivia questions and badges
3. Implement auth API endpoints
4. Test endpoints with Postman
5. Create Riverpod providers

---

## Troubleshooting Resources

- **Flutter Issues:** https://flutter.dev/docs/development/troubleshooting
- **Supabase Help:** https://supabase.com/docs
- **Node.js Issues:** https://nodejs.org/en/docs/
- **PostgreSQL:** https://www.postgresql.org/docs/

---

**Checkpoint: Ready to begin Day 1?**

Confirm when:
1. ✅ You've installed all prerequisites
2. ✅ You've created Supabase project
3. ✅ You've setup `.env.local`
4. ✅ Backend starts with `npm run dev`
5. ✅ Flutter app runs

Then reply and we'll proceed to Task 1A2 (Database Schema Setup).

