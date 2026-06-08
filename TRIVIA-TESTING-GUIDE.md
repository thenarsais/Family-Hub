# Trivia Expansion Testing Guide

**Status:** Manual testing (recommended for full feature verification)  
**What's New:** 130+ questions, 12 categories, fun facts, learning resources  
**Time to Test:** 10-15 minutes

---

## 🎯 Quick Testing Checklist

### Part 1: Navigate to Trivia
- [ ] Open Home Assistant Dashboard
- [ ] Go to **Family Hub** dashboard
- [ ] Open **Krish's Activity Board** button
- [ ] Click the **🧠 Trivia** tab

### Part 2: Basic Functionality
- [ ] **Question loads** - See a clear trivia question
- [ ] **Category tag visible** - Shows one of 12 categories (Science, History, Technology, etc.)
- [ ] **Difficulty level shown** - Easy, Medium, or Hard
- [ ] **Answer counter** - Shows "X answered"

### Part 3: Interactive Features
- [ ] **Answer input works** - Can type in the text field
- [ ] **Hint button (💡)** - Click to show/hide hint
- [ ] **Check Answer button** - Works when pressed
- [ ] **Streakcounter** - Shows 🔥 X day streak or "Start your streak"

### Part 4: Test Correct Answer
- [ ] Click the **Hint button (💡)** to see the hint
- [ ] Type the correct answer (case-insensitive)
- [ ] Click **Check Answer**
- [ ] See: ✓ Correct message + 🔥 Streak + **Fun Fact** box
- [ ] See: **Fun Fact** displays educational information
- [ ] See: **📚 Learn More About This Topic** button (clickable)
- [ ] See: **+5 points** awarded message
- [ ] Click the learn button to verify it opens in new tab

### Part 5: Test Wrong Answer  
- [ ] Type an incorrect answer
- [ ] Click **Check Answer**
- [ ] See error feedback (❌ or border change)
- [ ] Wait for answer reveal
- [ ] See: Correct answer displayed
- [ ] See: **📚 Learn This Topic** button for learning resource
- [ ] Click to verify learning link works

### Part 6: Category Diversity (Refresh & Check)
- [ ] Close Activity Board
- [ ] Open again (reload page)
- [ ] Go back to Trivia tab
- [ ] See a NEW question (same question each day is OK)
- [ ] Note the category - verify it's one of the 12:
  - [ ] Science
  - [ ] History
  - [ ] Geography
  - [ ] Mathematics
  - [ ] Literature
  - [ ] Technology
  - [ ] Animals
  - [ ] Sports
  - [ ] Space
  - [ ] Nature
  - [ ] General Knowledge

### Part 7: Streak Counter (Optional - requires 2+ days)
- [ ] Answer correctly today
- [ ] Return tomorrow
- [ ] See streak count increment (1 → 2 days)
- [ ] Streak should be persistent

### Part 8: Points Integration
- [ ] Answer trivia correctly (+5 points)
- [ ] Check **Points tab** in Activity Board
- [ ] Verify points increased by 5

---

## 📝 Detailed Testing Steps

### Step 1: Load the Activity Board

**Location:** Home Assistant → Family Hub → Activity Board button

**What to see:**
- Multi-tab interface with 🧠 Trivia tab visible
- Current question displayed immediately
- Answer input field ready for typing

**Success:** Activity Board loads within 2 seconds, no errors

---

### Step 2: Test Hint System

**Action:**
1. Click the 💡 button
2. Observe hint appears below the input
3. Click 💡 again
4. Hint disappears

**Success:** Hint toggles on/off smoothly

**Example Hints:**
- "Starts with J" (for Jupiter)
- "It's in Egypt" (for Cairo)
- "A famous playwright" (for Shakespeare)

---

### Step 3: Test Correct Answer

**Setup:** Let's test with an easy Science question

**Action:**
1. Look at the question
2. Click 💡 for hint
3. Type the correct answer (ignore case)
4. Press Enter OR click "Check Answer"

**Expected Result:**
```
✓ You answered correctly! +5 points
Streak: X days 🔥

💡 Fun Fact
[Educational fact about the answer]

📚 Learn More About This Topic [LINK]
```

**Sample Output:**
```
Question: "What is the largest planet in our solar system?"
Answer: "Jupiter"
Hint: "Starts with J"

✓ You answered correctly! +5 points
Streak: 1 days 🔥

💡 Fun Fact
Jupiter is so large that over 1,300 Earths could fit inside it! 
It also has a massive storm called the Great Red Spot that has 
been raging for over 350 years.

📚 Learn More About This Topic
```

**Verification:**
- [ ] ✓ Checkmark icon appears
- [ ] [ ] "+5 points" message shown
- [ ] [ ] 🔥 Streak counter updated
- [ ] [ ] Fun Fact displays (should be 1-2 sentences)
- [ ] [ ] Learn More button is blue and clickable
- [ ] [ ] Learn button opens link in new tab (if clicked)

---

### Step 4: Test Wrong Answer

**Setup:** Deliberately answer incorrectly

**Action:**
1. Type a completely wrong answer: "WRONG_ANSWER_123"
2. Click "Check Answer"

**Expected Result:**
```
Input field shows red border/background

After ~800ms:
❌ Not quite right. Try again!
Don't give up! Would you like to try again or see what the answer is?

The answer was: [CORRECT_ANSWER]
📚 Learn This Topic [LINK]
```

**Verification:**
- [ ] Input field shows error styling (red border)
- [ ] Error message displays with encouragement
- [ ] Correct answer revealed
- [ ] Learning resource link provided
- [ ] Link opens in new tab (if clicked)

---

### Step 5: Verify Categories (Sample Questions)

Test at least 3 different categories by answering correctly and reloading:

**Science Questions:**
- "What is the largest planet in our solar system?" → Jupiter
- "How many bones does an adult human have?" → 206
- "What gas do plants absorb from the air?" → Carbon dioxide

**History Questions:**
- "Who was the first President of the United States?" → George Washington
- "In what year did the Titanic sink?" → 1912
- "Who wrote the Declaration of Independence?" → Thomas Jefferson

**Geography Questions:**
- "What is the capital of France?" → Paris
- "Which is the largest country in the world?" → Russia
- "What is the longest river in the world?" → Nile River

**Technology Questions:**
- "What does AI stand for?" → Artificial Intelligence
- "Who invented the World Wide Web?" → Tim Berners-Lee
- "What year was the first iPhone released?" → 2007

---

### Step 6: Check for Learning Resources

**When you see a correct answer:**
1. Look for the **"📚 Learn More About This Topic"** button
2. Click it
3. Verify it opens a real Khan Academy / Britannica / NASA page in a new tab
4. Example: Jupiter question should open https://spaceplace.nasa.gov/all-about-jupiter/en/

**When you see a wrong answer:**
1. Look for the **"📚 Learn This Topic"** button
2. Click it
3. Verify it opens a learning resource (might be different from correct resource)

---

### Step 7: Points Integration Test

**Action:**
1. Start with current points (e.g., 10 points)
2. Answer trivia correctly (+5)
3. Points should be 15
4. Navigate to **Points tab**
5. Verify points match

**Expected:**
- Points increment by 5 per correct answer
- Points persistent after refresh
- Points show in both Trivia feedback AND Points tab

---

## 🎓 What You Should See

### Question Variety (12 Categories)

| Category | Sample Question | Answer |
|----------|-----------------|--------|
| Science | "What is the smallest unit of life?" | Cell |
| History | "In what year did World War II end?" | 1945 |
| Geography | "What is the capital of India?" | New Delhi |
| Mathematics | "What is 50% of 200?" | 100 |
| Literature | "Who wrote 'Romeo and Juliet'?" | William Shakespeare |
| Technology | "What does CPU stand for?" | Central Processing Unit |
| Animals | "What is the fastest land animal?" | Cheetah |
| Sports | "How many players are on a soccer team?" | 11 |
| Space | "What is the largest planet in our solar system?" | Jupiter |
| Nature | "What do bees do that helps flowers?" | Pollinate |
| General Knowledge | "How many colors are in a rainbow?" | 7 |

### Fun Facts (Examples)

```
"Jupiter is so large that over 1,300 Earths could fit inside it!"

"One large tree can produce enough oxygen for 2 people in a year!"

"The Titanic sank after hitting an iceberg. Over 1,500 people died."

"DNA carries the genetic code for all living things."
```

---

## ✅ Success Criteria

**Trivia expansion is working correctly if:**

✅ At least 3 different categories appear when testing  
✅ Questions are clear and readable  
✅ Correct answers display fun facts  
✅ Wrong answers show learning resources  
✅ Points increase by 5 per correct answer  
✅ Streak counter increments  
✅ Learning links open in new tabs  
✅ Fun facts are educational and interesting  
✅ No duplicate questions in same session  
✅ Case-insensitive answer checking works  

---

## 📊 What Changed

### Before (Original)
- 25 questions
- 5 categories
- Basic question/answer
- Simple feedback
- No educational resources

### After (Expanded)
- **130+ questions** ✨
- **12 categories** ✨
- Question + Category + Difficulty ✨
- Fun facts on correct answers ✨
- Learning resource links ✨
- Educational value for wrong answers ✨

---

## 🎯 Testing Notes

- **Same question daily:** This is intentional - deterministic hash by date
- **Case-insensitive:** "jupiter", "JUPITER", "Jupiter" all work
- **Fun facts vary:** Each question has unique facts
- **Links are real:** All learning resources point to actual Khan Academy, Britannica, NASA, etc.
- **Mobile friendly:** Test on phone too if possible

---

## 📱 Browser Testing

**Test on:**
- [ ] Desktop (Chrome/Firefox)
- [ ] Tablet (if available)
- [ ] Mobile (if available)

**Check:**
- [ ] Input fields are appropriately sized
- [ ] Buttons are tappable (min 44x44px)
- [ ] Text is readable
- [ ] No layout issues

---

## 🔍 If Something Doesn't Work

**Problem:** Question won't load  
**Solution:** Refresh page, check browser console for errors

**Problem:** Hint doesn't toggle  
**Solution:** Check JavaScript is enabled, try different browser

**Problem:** Points don't increase  
**Solution:** Verify you answered correctly (case-insensitive), check points counter in Points tab

**Problem:** Learning links don't work  
**Solution:** Right-click link, select "Open in new tab", should open external learning resource

---

## 🎉 What to Celebrate

When testing, note:

✨ **130 questions** - Won't see repeats often  
✨ **12 categories** - Great variety!  
✨ **Fun facts** - Learning is engaging  
✨ **Resource links** - Kids can dive deeper  
✨ **Points system** - Rewards correct answers  
✨ **Streak tracking** - Encourages daily participation  

---

**Happy Testing! 🧠✨**

Report any issues you find - we can refine as needed!
