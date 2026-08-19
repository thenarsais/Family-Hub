import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
  try {
    console.log('🌱 Seeding test data...\n');

    const userId = 'parent-001';

    // 1. Create or get family
    console.log('📋 Creating family for user:', userId);
    const { data: families, error: familyError } = await supabase
      .from('families')
      .select('*')
      .eq('created_by', userId)
      .limit(1);

    let familyId: string;
    if (families && families.length > 0) {
      familyId = families[0].id;
      console.log('✅ Family already exists:', familyId);
    } else {
      const { data: newFamily, error: createError } = await supabase
        .from('families')
        .insert({
          name: 'Test Family',
          created_by: userId,
        })
        .select()
        .single();

      if (createError) throw createError;
      familyId = newFamily.id;
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
        event_date: new Date(currentYear, currentMonth, 19),
        start_time: "07:30",
        end_time: "08:30",
        location: "Dental Clinic",
        event_description: "Regular checkup for kids",
        event_type: "family"
      },
      {
        event_title: "Soccer Practice",
        event_date: new Date(currentYear, currentMonth, 20),
        start_time: "16:00",
        end_time: "17:30",
        location: "Sports Field",
        event_description: "Weekly soccer practice",
        event_type: "family"
      },
      {
        event_title: "Family Dinner",
        event_date: new Date(currentYear, currentMonth, 21),
        start_time: "18:00",
        end_time: "20:00",
        location: "Home",
        event_description: "Family dinner night",
        event_type: "family"
      },
      {
        event_title: "Project Deadline",
        event_date: new Date(currentYear, currentMonth, 22),
        start_time: "09:00",
        end_time: "17:00",
        location: "Office",
        event_description: "Important project deadline",
        event_type: "family"
      },
      {
        event_title: "Weekend Trip",
        event_date: new Date(currentYear, currentMonth, 23),
        start_time: "08:00",
        end_time: "18:00",
        location: "Mountain Resort",
        event_description: "Family weekend getaway",
        event_type: "family"
      }
    ];

    for (const event of testEvents) {
      const { error } = await supabase
        .from('events')
        .insert({
          ...event,
          family_id: familyId,
          created_by: userId,
          created_at: new Date().toISOString(),
        });

      if (error && !error.message.includes('duplicate')) {
        throw error;
      }
      console.log(`  ✅ ${event.event_title}`);
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
