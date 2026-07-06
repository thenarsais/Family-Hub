# Setup Gujarati Module in Home Assistant - Complete Debug & Deploy
# This script handles everything: copying files, checking permissions, testing access

Write-Host "🎓 Setting up Gujarati Learning Module in Home Assistant..." -ForegroundColor Green
Write-Host ""

# Step 1: Verify HA is running
Write-Host "1️⃣  Checking Home Assistant container..." -ForegroundColor Cyan
try {
    $haStatus = docker ps --filter "name=homeassistant" --format "{{.Status}}"
    if ($haStatus) {
        Write-Host "✅ Home Assistant is running" -ForegroundColor Green
    } else {
        Write-Host "❌ Home Assistant container not found" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error checking Docker: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Create www folder
Write-Host "2️⃣  Creating /config/www/gujarati folder..." -ForegroundColor Cyan
docker exec homeassistant sh -c "mkdir -p /config/www/gujarati"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Folder created successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  Folder may already exist (OK)" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Copy HTML file
Write-Host "3️⃣  Copying HTML file..." -ForegroundColor Cyan
docker cp "C:\Users\priya\Desktop\gujarati-learning-module.html" homeassistant:/config/www/gujarati/index.html
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ HTML copied" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to copy HTML" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Copy JSON file
Write-Host "4️⃣  Copying curriculum JSON..." -ForegroundColor Cyan
docker cp "C:\Users\priya\Desktop\gujarati-curriculum-final-verified.json" homeassistant:/config/www/gujarati/curriculum.json
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Curriculum copied" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to copy JSON" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 5: Verify files
Write-Host "5️⃣  Verifying files in container..." -ForegroundColor Cyan
$files = docker exec homeassistant sh -c "ls -lah /config/www/gujarati/"
Write-Host $files -ForegroundColor White
Write-Host ""

# Step 6: Check permissions
Write-Host "6️⃣  Checking file permissions..." -ForegroundColor Cyan
docker exec homeassistant sh -c "stat /config/www/gujarati/index.html | grep Access"
Write-Host ""

# Step 7: Test direct file access
Write-Host "7️⃣  Testing file access from HA..." -ForegroundColor Cyan
$testAccess = docker exec homeassistant sh -c "cat /config/www/gujarati/index.html | head -c 100"
if ($testAccess.Length -gt 0) {
    Write-Host "✅ Files accessible inside container" -ForegroundColor Green
} else {
    Write-Host "❌ Cannot read files" -ForegroundColor Red
}
Write-Host ""

# Step 8: Success message
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ FILES DEPLOYED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""

Write-Host "📍 NEXT STEPS IN HOME ASSISTANT:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to: http://localhost:8123" -ForegroundColor White
Write-Host "2. Settings → Dashboards" -ForegroundColor White
Write-Host "3. Create NEW Dashboard or edit existing" -ForegroundColor White
Write-Host "4. Click 'Create Manual Card'" -ForegroundColor White
Write-Host "5. Select: Custom: Webpage Card" -ForegroundColor White
Write-Host ""
Write-Host "6. Paste this YAML in the editor:" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────" -ForegroundColor Yellow
Write-Host "type: custom:webpage-card" -ForegroundColor White
Write-Host "url: /local/gujarati/index.html" -ForegroundColor White
Write-Host "title: 🎓 Gujarati Learning - Krish" -ForegroundColor White
Write-Host "aspect_ratio: 16:9" -ForegroundColor White
Write-Host "───────────────────────────────────────" -ForegroundColor Yellow
Write-Host ""
Write-Host "7. Save and Enjoy! 🎓" -ForegroundColor Green
