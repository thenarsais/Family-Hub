import fetch from 'node:fetch';

console.log('Exporting automations from Home Assistant...\n');

try {
  // Get auth token from HA (if needed)
  const response = await fetch('http://localhost:8123/api/automation/', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    console.log(`API Response: ${response.status} ${response.statusText}`);
    console.log('Trying alternative methods...\n');
    
    // Try to read .storage file directly
    const { execSync } = await import('child_process');
    try {
      const storageContent = execSync('docker exec homeassistant cat /config/.storage/automations.json 2>/dev/null').toString();
      console.log('Found automations.json in .storage\n');
      console.log('═'.repeat(80));
      console.log(JSON.stringify(JSON.parse(storageContent), null, 2));
      console.log('═'.repeat(80));
    } catch (e) {
      console.log('Could not read .storage/automations.json');
      console.log('Trying to list .storage directory...');
      try {
        const listing = execSync('docker exec homeassistant ls -la /config/.storage/ 2>/dev/null | grep -i autom').toString();
        console.log('\n' + listing);
      } catch (e2) {
        console.log('No automation files found in .storage');
      }
    }
  } else {
    const data = await response.json();
    console.log('Automations from API:\n');
    console.log('═'.repeat(80));
    console.log(JSON.stringify(data, null, 2));
    console.log('═'.repeat(80));
  }

} catch (error) {
  console.error('Error:', error.message);
  console.log('\nTrying direct file read approach...');
  
  try {
    const { execSync } = await import('child_process');
    
    // List all files in .storage
    console.log('\nFiles in /config/.storage/:');
    try {
      const files = execSync('docker exec homeassistant ls /config/.storage/').toString();
      const automationFiles = files.split('\n').filter(f => f.includes('autom') || f.includes('script'));
      if (automationFiles.length > 0) {
        console.log(automationFiles.join('\n'));
      } else {
        console.log('(No automation-related files found)');
      }
    } catch (e) {
      console.log('Could not list .storage directory');
    }
  } catch (e) {
    console.error('Could not execute docker command');
  }
}
