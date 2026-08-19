import axios from 'axios';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const api = axios.create({
  baseURL: `${supabaseUrl}/rest/v1`,
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  },
});

async function seedData() {
  try {
    console.log('🌱 Seeding test data via REST API...\n');

    const userId = 'parent-001';

    // 1. Get or create family
    console.log('📋 Creating family for user:', userId);

    let familyId: string;
    try {
      const { data: families } = await api.get('/families?limit=1');

      if (families && families.length > 0) {
        familyId = families[0].id;
        console.log('✅ Family already exists:', familyId);
      } else {
        throw new Error('No family found');
      }
    } catch (err) {
      // Create new family
      const { data: newFamily } = await api.post('/families', {
        name: 'Test Family',
      }, {
        headers: {
          'Prefer': 'return=representation',
        },
      });

      familyId = newFamily[0].id;
      console.log('✅ Created family:', familyId);
    }

    // 2. Create test events
    console.log('\n📅 Creating test events...');
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const testEvents = [
      {
        event_title: "Kids Dentist",
        event_date: new Date(currentYear, currentMonth, 19).toISOString().split('T')[0],
        start_time: "07:30",
        end_time: "08:30",
        location: "Dental Clinic",
        event_description: "Regular checkup for kids",
        event_type: "family",
        family_id: familyId,
      },
      {
        event_title: "Soccer Practice",
        event_date: new Date(currentYear, currentMonth, 20).toISOString().split('T')[0],
        start_time: "16:00",
        end_time: "17:30",
        location: "Sports Field",
        event_description: "Weekly soccer practice",
        event_type: "family",
        family_id: familyId,
      },
      {
        event_title: "Family Dinner",
        event_date: new Date(currentYear, currentMonth, 21).toISOString().split('T')[0],
        start_time: "18:00",
        end_time: "20:00",
        location: "Home",
        event_description: "Family dinner night",
        event_type: "family",
        family_id: familyId,
      },
      {
        event_title: "Project Deadline",
        event_date: new Date(currentYear, currentMonth, 22).toISOString().split('T')[0],
        start_time: "09:00",
        end_time: "17:00",
        location: "Office",
        event_description: "Important project deadline",
        event_type: "family",
        family_id: familyId,
      },
      {
        event_title: "Weekend Trip",
        event_date: new Date(currentYear, currentMonth, 23).toISOString().split('T')[0],
        start_time: "08:00",
        end_time: "18:00",
        location: "Mountain Resort",
        event_description: "Family weekend getaway",
        event_type: "family",
        family_id: familyId,
        created_by: userId,
      }
    ];

    for (const event of testEvents) {
      try {
        await api.post('/events', event, {
          headers: {
            'Prefer': 'return=minimal',
          },
        });
        console.log(`  ✅ ${event.event_title}`);
      } catch (error: any) {
        if (error.response?.status === 409) {
          console.log(`  ℹ️  ${event.event_title} (already exists)`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✨ Seed data created successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`  • Family ID: ${familyId}`);
    console.log(`  • User ID: ${userId}`);
    console.log(`  • Events created: ${testEvents.length}`);
    console.log(`\n🚀 Ready to test the calendar!\n`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
