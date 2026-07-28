# Deploy Gujarati Learning Module to Home Assistant
Write-Host "🎓 Deploying Gujarati Learning Module to Home Assistant..." -ForegroundColor Green
Write-Host ""

# Step 1: Create www folder in HA config
Write-Host "📁 Creating www/gujarati folder in HA config..." -ForegroundColor Cyan
docker exec homeassistant mkdir -p /config/www/gujarati
Write-Host "✅ Folder created" -ForegroundColor Green
Write-Host ""

# Step 2: Copy HTML file
Write-Host "📄 Copying gujarati-learning-module.html..." -ForegroundColor Cyan
docker cp "C:\Users\priya\Desktop\gujarati-learning-module.html" homeassistant:/config/www/gujarati/
Write-Host "✅ HTML copied" -ForegroundColor Green
Write-Host ""

# Step 3: Copy JSON curriculum
Write-Host "📚 Copying gujarati-curriculum-final-verified.json..." -ForegroundColor Cyan
docker cp "C:\Users\priya\Desktop\gujarati-curriculum-final-verified.json" homeassistant:/config/www/gujarati/
Write-Host "✅ Curriculum copied" -ForegroundColor Green
Write-Host ""

# Step 4: Success message
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Next steps:" -ForegroundColor Cyan
Write-Host "1. Go to Home Assistant: http://localhost:8123" -ForegroundColor White
Write-Host "2. Click 'Edit Dashboard' (pencil icon)" -ForegroundColor White
Write-Host "3. Click 'Create Manual Card'" -ForegroundColor White
Write-Host "4. Select 'Custom: Webpage Card'" -ForegroundColor White
Write-Host "5. Enter these settings:" -ForegroundColor White
Write-Host "   - URL: /local/gujarati/gujarati-learning-module.html" -ForegroundColor Yellow
Write-Host "   - Title: 🎓 Gujarati Learning" -ForegroundColor Yellow
Write-Host "   - Aspect Ratio: 16:9" -ForegroundColor Yellow
Write-Host "6. Save and enjoy!" -ForegroundColor White
Write-Host ""
Write-Host "Happy learning! 🎓" -ForegroundColor Green
