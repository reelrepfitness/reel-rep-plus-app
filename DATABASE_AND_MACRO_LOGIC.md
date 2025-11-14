# Database Architecture & Macro Calculation Logic

## 📋 Complete Guide for React Native Developers

This document provides a complete explanation of the nutrition tracking app's database structure, macro calculation system, and business logic. Built with Supabase PostgreSQL, React Native, and Expo.

---

## 🗄️ Database Schema Overview

### Core Tables

#### 1. **profiles** - User profiles and daily targets
Stores user information and their nutrition goals.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'coach', 'admin')),
  
  -- Daily nutrition targets
  kcal_goal NUMERIC,
  protein_units NUMERIC(4,1),    -- e.g., 3.5 מנות חלבון
  carb_units NUMERIC(4,1),       -- e.g., 4.5 מנות פחמימה
  fat_units NUMERIC(4,1),        -- e.g., 1.5 מנות שומן
  veg_units NUMERIC(4,1),        -- e.g., 4 מנות ירקות
  fruit_units NUMERIC(4,1),      -- e.g., 1 מנת פירות
  
  -- Target template or custom override
  target_template_id UUID REFERENCES target_templates(id) ON DELETE SET NULL,
  targets_override BOOLEAN DEFAULT false,  -- true = custom targets, false = use template
  
  -- Body metrics
  body_weight NUMERIC(5,2),
  height NUMERIC,
  water_daily_goal NUMERIC DEFAULT 12,
  
  -- Activity goals
  weekly_cardio_minutes NUMERIC DEFAULT 0,
  weekly_strength_workouts NUMERIC DEFAULT 0,
  
  -- Other fields
  whatsapp_link TEXT,
  gender TEXT,
  goal TEXT,
  phone TEXT,
  age TEXT,
  activity TEXT,
  profile_picture TEXT,
  food_limitations TEXT,
  users_notes TEXT,
  meal_plan BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Points:**
- `id` matches `auth.users(id)` from Supabase Auth
- Users can either use a preset `target_template` OR set custom targets with `targets_override`
- All `_units` fields represent "servings" (מנות) in Hebrew
- Decimal precision: up to 1 decimal place (e.g., 3.5 units)

**Indexes:**
```sql
-- No custom indexes needed - primary key on id is sufficient
```

**RLS Policies:**
```sql
-- Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

---

#### 2. **target_templates** - Pre-defined calorie plans
Preset nutrition targets based on different calorie levels (e.g., 1200, 1500, 2000 kcal).

```sql
CREATE TABLE target_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kcal_plan NUMERIC NOT NULL UNIQUE,
  protein_units NUMERIC(4,1) NOT NULL,
  carb_units NUMERIC(4,1) NOT NULL,
  fat_units NUMERIC(4,1) NOT NULL,
  veg_units NUMERIC(4,1) NOT NULL,
  fruit_units NUMERIC(4,1) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Sample Data:**
```sql
INSERT INTO target_templates (kcal_plan, protein_units, carb_units, fat_units, veg_units, fruit_units) VALUES
  (2600, 6, 7, 1.5, 4, 2),
  (2200, 5.5, 6, 1.5, 4, 1),
  (1900, 5, 5, 1, 4, 1),
  (1700, 4, 5, 1, 4, 1),
  (1540, 3.5, 4.5, 1, 4, 1),
  (1300, 3, 3.5, 1, 4, 1),
  (1200, 3, 3, 0.5, 4, 1);
```

**RLS Policies:**
```sql
CREATE POLICY "Anyone can view target templates" ON target_templates
  FOR SELECT USING (true);  -- Public read-only
```

---

#### 3. **food_bank** - Food items database (ONE SERVING)
**CRITICAL:** Each food item in `food_bank` represents **ONE SERVING** of that food.

```sql
CREATE TABLE food_bank (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  img_url TEXT,
  category TEXT NOT NULL,  -- "חלבון", "פחמימה", "שומן", "ירק", "פרי", "ממרחים"
  sub_category TEXT,       -- e.g., "עוף", "בשר בקר", "דגים"
  
  -- ONE SERVING nutritional values
  caloreis_per_unit NUMERIC NOT NULL DEFAULT 0,  -- Calories in ONE serving
  protien_units NUMERIC NOT NULL DEFAULT 0,      -- Protein units in ONE serving
  carb_units NUMERIC NOT NULL DEFAULT 0,         -- Carb units in ONE serving
  fats_units NUMERIC NOT NULL DEFAULT 0,         -- Fat units in ONE serving
  veg_units NUMERIC NOT NULL DEFAULT 0,          -- Veg units in ONE serving
  fruit_units NUMERIC NOT NULL DEFAULT 0,        -- Fruit units in ONE serving
  
  -- Measurement conversions
  grams_per_single_item NUMERIC DEFAULT 0,       -- e.g., 1 apple = 150g
  items_per_unit NUMERIC DEFAULT 0,              -- How many items = 1 serving
  grams_per_cup NUMERIC DEFAULT 0,               -- Grams in 1 cup
  grams_per_tbsp NUMERIC DEFAULT 0,              -- Grams in 1 tablespoon
  
  -- Additional fields
  veg_unit TEXT,                                 -- Unit name for vegetables
  fruit_unit TEXT,                               -- Unit name for fruits
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Important Notes:**
- Column names have typos (`caloreis`, `protien`, `fats_units`) but **MUST** be kept for backward compatibility
- Each row = ONE serving of that macro
- When user adds 2 servings, you multiply all `_units` values by 2

**Indexes:**
```sql
CREATE INDEX idx_food_bank_category ON food_bank(category);
CREATE INDEX idx_food_bank_sub_category ON food_bank(sub_category);
CREATE INDEX idx_food_bank_name ON food_bank(name);
CREATE INDEX idx_food_bank_name_search ON food_bank USING gin(to_tsvector('simple', name));
```

**RLS Policies:**
```sql
CREATE POLICY "Anyone can view food bank" ON food_bank
  FOR SELECT USING (true);  -- Public read-only
```

**Example Records:**

| id | name | category | caloreis_per_unit | protien_units | carb_units | fats_units | veg_units | fruit_units |
|----|------|----------|-------------------|---------------|------------|------------|-----------|-------------|
| 101 | חזה עוף | חלבון | 200 | 1 | 0 | 0 | 0 | 0 |
| 202 | אורז לבן | פחמימה | 120 | 0 | 1 | 0 | 0 | 0 |
| 303 | אבוקדו | שומן | 120 | 0 | 0 | 1 | 0 | 0 |
| 404 | עגבניה | ירק | 35 | 0 | 0 | 0 | 1 | 0 |
| 505 | תפוח | פרי | 85 | 0 | 0 | 0 | 0 | 1 |

---

#### 4. **daily_logs** - Daily tracking summary
One row per user per day. **Automatically updated** via triggers when `daily_items` change.

```sql
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  
  -- Automatically calculated totals (via triggers)
  total_kcal NUMERIC NOT NULL DEFAULT 0,
  total_protein_units NUMERIC(5,1) NOT NULL DEFAULT 0,
  total_carb_units NUMERIC(5,1) NOT NULL DEFAULT 0,
  total_fat_units NUMERIC(5,1) NOT NULL DEFAULT 0,
  total_veg_units NUMERIC(5,1) NOT NULL DEFAULT 0,
  total_fruit_units NUMERIC(5,1) NOT NULL DEFAULT 0,
  
  -- Manual tracking
  water_glasses NUMERIC NOT NULL DEFAULT 0,
  cardio_minutes NUMERIC NOT NULL DEFAULT 0,
  strength_minutes NUMERIC NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)  -- One log per user per day
);
```

**Key Points:**
- Created automatically when user logs their first food for the day
- `total_*` fields are **auto-calculated** by database triggers
- Users only manually update `water_glasses`, `cardio_minutes`, `strength_minutes`

**Indexes:**
```sql
CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, date DESC);
```

**RLS Policies:**
```sql
CREATE POLICY "Users can view own logs" ON daily_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON daily_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs" ON daily_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs" ON daily_logs
  FOR DELETE USING (auth.uid() = user_id);
```

---

#### 5. **daily_items** - Individual food entries
Each food item logged by the user (breakfast, lunch, etc.)

```sql
CREATE TABLE daily_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_log_id UUID REFERENCES daily_logs(id) ON DELETE CASCADE NOT NULL,
  food_id INTEGER REFERENCES food_bank(id) NOT NULL,
  
  meal_category TEXT NOT NULL,  -- "ארוחת בוקר", "ארוחת ביניים", "ארוחת צהריים", "ארוחת ערב"
  
  measure_type TEXT NOT NULL,   -- "unit", "grams", "cup", "tbsp", "tsp"
  quantity NUMERIC NOT NULL,    -- How many servings/grams/cups
  grams NUMERIC DEFAULT 0,      -- Total grams
  
  -- Calculated nutritional values (quantity * food_bank values)
  kcal NUMERIC NOT NULL DEFAULT 0,
  protein_units NUMERIC NOT NULL DEFAULT 0,
  carb_units NUMERIC NOT NULL DEFAULT 0,
  fat_units NUMERIC NOT NULL DEFAULT 0,
  veg_units NUMERIC NOT NULL DEFAULT 0,
  fruit_units NUMERIC NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_daily_items_log ON daily_items(daily_log_id);
CREATE INDEX idx_daily_items_food ON daily_items(food_id);
```

**RLS Policies:**
```sql
-- Users can only access items in their own daily logs
CREATE POLICY "Users can view own daily items" ON daily_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = daily_items.daily_log_id
      AND daily_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own daily items" ON daily_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = daily_items.daily_log_id
      AND daily_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own daily items" ON daily_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = daily_items.daily_log_id
      AND daily_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own daily items" ON daily_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = daily_items.daily_log_id
      AND daily_logs.user_id = auth.uid()
    )
  );
```

---

#### 6. **restaurants** - Restaurant menu items

```sql
CREATE TABLE restaurants (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,      -- Restaurant category (e.g., "מקדונלד'ס", "ארומה")
  quantity NUMERIC(4,1) DEFAULT 1,
  caloreis NUMERIC NOT NULL DEFAULT 0,
  protien_units NUMERIC(3,1) NOT NULL DEFAULT 0,
  carb_units NUMERIC(3,1) NOT NULL DEFAULT 0,
  fats_units NUMERIC(3,1) NOT NULL DEFAULT 0,
  grid_restaurants TEXT,
  is_favorite BOOLEAN DEFAULT false,
  favorites TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_restaurants_category ON restaurants(category);
CREATE INDEX idx_restaurants_name ON restaurants(name);
CREATE INDEX idx_restaurants_favorite ON restaurants(is_favorite) WHERE is_favorite = true;
```

**RLS Policies:**
```sql
CREATE POLICY "Anyone can view restaurants" ON restaurants
  FOR SELECT USING (true);  -- Public read-only
```

---

#### 7. **favorites** - User's favorite foods

```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  food_id INTEGER REFERENCES food_bank(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, food_id)  -- Prevent duplicate favorites
);
```

**Indexes:**
```sql
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
```

**RLS Policies:**
```sql
CREATE POLICY "Users can view own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);
```

---

#### 8. **recipes** - User custom recipes

```sql
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  ingredients JSONB NOT NULL,        -- Array of {food_id, quantity, measure_type}
  total_calories NUMERIC NOT NULL,
  total_units JSONB NOT NULL,        -- {protein, carb, fat, vegetable, fruit}
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
```

**RLS Policies:**
```sql
CREATE POLICY "Users can manage own recipes" ON recipes
  FOR ALL USING (auth.uid() = user_id);
```

---

#### 9. **body_measurements** - Body tracking

```sql
CREATE TABLE body_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  measurement_date DATE NOT NULL,
  body_weight NUMERIC(5,2),
  body_fat_mass NUMERIC(5,2),
  lean_mass NUMERIC(5,2),
  body_fat_percentage NUMERIC(4,1),
  shoulder_circumference NUMERIC(5,2),
  waist_circumference NUMERIC(5,2),
  arm_circumference NUMERIC(5,2),
  thigh_circumference NUMERIC(5,2),
  neck_circumference NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### 10. **alcohol** - Alcohol tracking table

```sql
CREATE TABLE alcohol (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  img_url TEXT,
  category TEXT NOT NULL,        -- "בירה", "יין", "משקאות חריפים", "קוקטיילים"
  serving_size_ml NUMERIC,
  caloreis_per_unit NUMERIC NOT NULL DEFAULT 0,
  protien_units NUMERIC NOT NULL DEFAULT 0,
  carb_units NUMERIC NOT NULL DEFAULT 0,
  fats_units NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### 11. **guides** - Nutrition guides

```sql
CREATE TABLE guides (
  guide_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  short_description TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  text_color TEXT,
  emoji TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### 12. **push_tokens** - Push notification tokens

```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  push_token TEXT NOT NULL,
  device_type TEXT,  -- 'ios', 'android', 'web'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, push_token)
);
```

---

## 🧮 Macro Calculation Logic

### Understanding "Units" (מנות)

The app uses a **SERVING-BASED system** instead of grams. Each macro category has a standard calorie value per serving:

```typescript
export const CATEGORY_KCAL_PER_UNIT: Record<FoodCategory, number> = {
  protein: 200,      // 1 מנת חלבון = 200 קלוריות
  carb: 120,         // 1 מנת פחמימה = 120 קלוריות
  fat: 120,          // 1 מנת שומן = 120 קלוריות
  vegetable: 35,     // 1 מנת ירק = 35 קלוריות
  fruit: 85,         // 1 מנת פרי = 85 קלוריות
  spread: 120,       // 1 מנת ממרח = 120 קלוריות
  restaurant: 120,   // Base value
  alcohol: 120,      // Base value
};
```

### How Food Bank Works

**Each food item = ONE SERVING** of its macro category.

Examples:
- **Chicken breast (חזה עוף)**: 1 serving of protein
  - `protien_units = 1`
  - `caloreis_per_unit = 200`
  
- **Rice (אורז)**: 1 serving of carbs
  - `carb_units = 1`
  - `caloreis_per_unit = 120`

- **Avocado (אבוקדו)**: 1 serving of fat
  - `fats_units = 1`
  - `caloreis_per_unit = 120`

- **Tomato (עגבניה)**: 1 serving of vegetables
  - `veg_units = 1`
  - `caloreis_per_unit = 35`

**Mixed Foods:**
Some foods contain multiple macros:

Example: **Cheese (גבינה)** might have:
```
protien_units = 0.5
fats_units = 0.5
caloreis_per_unit = 160  // (0.5 * 200) + (0.5 * 120) = 160
```

### Calculation When User Adds Food

When a user adds food to their log:

```typescript
// User adds 2 servings of chicken breast
const foodItem = {
  name: "חזה עוף",
  protien_units: 1,
  carb_units: 0,
  fats_units: 0,
  veg_units: 0,
  fruit_units: 0,
  caloreis_per_unit: 200
};

const quantity = 2;  // User wants 2 servings

// Calculate totals
const totalProteinUnits = foodItem.protien_units * quantity;  // 1 * 2 = 2
const totalCarbUnits = foodItem.carb_units * quantity;        // 0 * 2 = 0
const totalFatUnits = foodItem.fats_units * quantity;         // 0 * 2 = 0
const totalVegUnits = foodItem.veg_units * quantity;          // 0 * 2 = 0
const totalFruitUnits = foodItem.fruit_units * quantity;      // 0 * 2 = 0
const totalCalories = foodItem.caloreis_per_unit * quantity;  // 200 * 2 = 400

// Insert into daily_items
await supabase.from("daily_items").insert([{
  daily_log_id: dailyLog.id,
  food_id: foodItem.id,
  meal_category: "ארוחת בוקר",
  measure_type: "unit",
  quantity: quantity,
  kcal: totalCalories,           // 400
  protein_units: totalProteinUnits,  // 2
  carb_units: totalCarbUnits,        // 0
  fat_units: totalFatUnits,          // 0
  veg_units: totalVegUnits,          // 0
  fruit_units: totalFruitUnits,      // 0
}]);

// Database trigger automatically updates daily_logs totals
```

### Automatic Total Calculation (Database Triggers)

The database automatically sums all `daily_items` for each `daily_log`:

```sql
CREATE OR REPLACE FUNCTION update_daily_log_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE daily_logs
  SET 
    total_kcal = (
      SELECT COALESCE(SUM(kcal), 0)
      FROM daily_items
      WHERE daily_log_id = COALESCE(NEW.daily_log_id, OLD.daily_log_id)
    ),
    total_protein_units = (
      SELECT COALESCE(SUM(protein_units), 0)
      FROM daily_items
      WHERE daily_log_id = COALESCE(NEW.daily_log_id, OLD.daily_log_id)
    ),
    total_carb_units = (
      SELECT COALESCE(SUM(carb_units), 0)
      FROM daily_items
      WHERE daily_log_id = COALESCE(NEW.daily_log_id, OLD.daily_log_id)
    ),
    total_fat_units = (
      SELECT COALESCE(SUM(fat_units), 0)
      FROM daily_items
      WHERE daily_log_id = COALESCE(NEW.daily_log_id, OLD.daily_log_id)
    ),
    total_veg_units = (
      SELECT COALESCE(SUM(veg_units), 0)
      FROM daily_items
      WHERE daily_log_id = COALESCE(NEW.daily_log_id, OLD.daily_log_id)
    ),
    total_fruit_units = (
      SELECT COALESCE(SUM(fruit_units), 0)
      FROM daily_items
      WHERE daily_log_id = COALESCE(NEW.daily_log_id, OLD.daily_log_id)
    )
  WHERE id = COALESCE(NEW.daily_log_id, OLD.daily_log_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers fire on INSERT, UPDATE, DELETE
CREATE TRIGGER update_daily_totals_on_insert
  AFTER INSERT ON daily_items
  FOR EACH ROW EXECUTE FUNCTION update_daily_log_totals();

CREATE TRIGGER update_daily_totals_on_update
  AFTER UPDATE ON daily_items
  FOR EACH ROW EXECUTE FUNCTION update_daily_log_totals();

CREATE TRIGGER update_daily_totals_on_delete
  AFTER DELETE ON daily_items
  FOR EACH ROW EXECUTE FUNCTION update_daily_log_totals();
```

**This means:**
- Developer NEVER manually calculates totals
- Database automatically recalculates on every change
- Guarantees data consistency

---

## 📊 Complete User Flow Example

### Scenario: User logs breakfast

1. **User selects food**: "Chicken breast" (חזה עוף)
2. **User sets quantity**: 2 servings
3. **User selects meal**: "Breakfast" (ארוחת בוקר)

### Step-by-step calculation:

```typescript
// 1. Get food from food_bank
const foodItem = await supabase
  .from("food_bank")
  .select("*")
  .eq("id", 101)
  .single();

// foodItem = {
//   id: 101,
//   name: "חזה עוף",
//   category: "חלבון",
//   caloreis_per_unit: 200,
//   protien_units: 1,
//   carb_units: 0,
//   fats_units: 0,
//   veg_units: 0,
//   fruit_units: 0
// }

// 2. Get or create today's daily_log
const today = "2025-01-14";
let { data: dailyLog } = await supabase
  .from("daily_logs")
  .select("id")
  .eq("user_id", userId)
  .eq("date", today)
  .single();

if (!dailyLog) {
  const { data: newLog } = await supabase
    .from("daily_logs")
    .insert([{ user_id: userId, date: today }])
    .select("id")
    .single();
  dailyLog = newLog;
}

// 3. Calculate values
const quantity = 2;
const totalCalories = foodItem.caloreis_per_unit * quantity;  // 200 * 2 = 400
const totalProtein = foodItem.protien_units * quantity;       // 1 * 2 = 2
const totalCarb = foodItem.carb_units * quantity;             // 0 * 2 = 0
const totalFat = foodItem.fats_units * quantity;              // 0 * 2 = 0
const totalVeg = foodItem.veg_units * quantity;               // 0 * 2 = 0
const totalFruit = foodItem.fruit_units * quantity;           // 0 * 2 = 0

// 4. Insert into daily_items
await supabase.from("daily_items").insert([{
  daily_log_id: dailyLog.id,
  food_id: foodItem.id,
  meal_category: "ארוחת בוקר",
  measure_type: "unit",
  quantity: quantity,
  grams: 0,
  kcal: totalCalories,           // 400
  protein_units: totalProtein,   // 2
  carb_units: totalCarb,         // 0
  fat_units: totalFat,           // 0
  veg_units: totalVeg,           // 0
  fruit_units: totalFruit,       // 0
}]);

// 5. Database trigger automatically updates daily_logs
// daily_logs.total_kcal += 400
// daily_logs.total_protein_units += 2
// (other totals remain unchanged)
```

---

## 🎯 Goals vs. Intake Calculation

```typescript
// Get user's goals
const profile = await supabase
  .from("profiles")
  .select("*, target_templates(*)")
  .eq("user_id", userId)
  .single();

// Determine if using custom targets or template
let goals;
if (profile.targets_override) {
  // Use custom targets
  goals = {
    calories: profile.kcal_goal,
    protein: profile.protein_units,
    carb: profile.carb_units,
    fat: profile.fat_units,
    veg: profile.veg_units,
    fruit: profile.fruit_units,
  };
} else {
  // Use template targets
  goals = {
    calories: profile.target_templates.kcal_plan,
    protein: profile.target_templates.protein_units,
    carb: profile.target_templates.carb_units,
    fat: profile.target_templates.fat_units,
    veg: profile.target_templates.veg_units,
    fruit: profile.target_templates.fruit_units,
  };
}

// Get today's intake from daily_logs
const dailyLog = await supabase
  .from("daily_logs")
  .select("*")
  .eq("user_id", userId)
  .eq("date", today)
  .single();

// Calculate progress
const intake = {
  calories: dailyLog.total_kcal || 0,
  protein: dailyLog.total_protein_units || 0,
  carb: dailyLog.total_carb_units || 0,
  fat: dailyLog.total_fat_units || 0,
  veg: dailyLog.total_veg_units || 0,
  fruit: dailyLog.total_fruit_units || 0,
};

// Calculate percentages
const progress = {
  calories: (intake.calories / goals.calories) * 100,
  protein: (intake.protein / goals.protein) * 100,
  carb: (intake.carb / goals.carb) * 100,
  fat: (intake.fat / goals.fat) * 100,
  veg: (intake.veg / goals.veg) * 100,
  fruit: (intake.fruit / goals.fruit) * 100,
};

// Example output:
// goals = { calories: 1240, protein: 3, carb: 3, fat: 1, veg: 4, fruit: 1 }
// intake = { calories: 400, protein: 2, carb: 0, fat: 0, veg: 0, fruit: 0 }
// progress = { calories: 32%, protein: 67%, carb: 0%, fat: 0%, veg: 0%, fruit: 0% }
```

---

## 🔄 Data Flow Summary

```
User Action (Add Food)
        ↓
1. Select food from food_bank (ONE serving)
        ↓
2. Choose quantity (e.g., 2 servings)
        ↓
3. Calculate: quantity × food_bank values
        ↓
4. Insert into daily_items with calculated values
        ↓
5. Database TRIGGER fires automatically
        ↓
6. Trigger SUMs all daily_items for this daily_log
        ↓
7. Trigger UPDATES daily_logs totals
        ↓
8. React Query invalidates cache
        ↓
9. UI shows updated totals and progress
```

---

## 🔐 Security (RLS Policies)

### Key Security Principles:

1. **Users can only access their own data**
   - Profiles, daily_logs, daily_items, favorites, recipes

2. **Public read-only tables**
   - food_bank, target_templates, restaurants, guides

3. **No infinite recursion**
   - Policies use `auth.uid()` directly (no subqueries to profiles table)

4. **Cascade deletes**
   - When user deletes account → all their data deleted
   - When daily_log deleted → all its daily_items deleted

---

## 📱 React Native Integration

### State Management

```typescript
// contexts/auth.tsx
export const [AuthProvider, useAuth] = createContextHook<AuthContextValue>(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  // ...
});

// lib/useHomeData.ts
export function useHomeData(selectedDate?: string) {
  const { user } = useAuth();
  const today = selectedDate || formatDate(new Date());

  // Fetch profile with React Query
  const profileQuery = useQuery({
    queryKey: ["profile", user?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.user_id)
        .single();
      return data;
    },
  });

  // Fetch daily log with auto-creation
  const dailyLogQuery = useQuery({
    queryKey: ["dailyLog", user?.user_id, today],
    queryFn: async () => {
      let { data } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.user_id)
        .eq("date", today)
        .single();

      if (!data) {
        // Auto-create if not exists
        const { data: newLog } = await supabase
          .from("daily_logs")
          .insert([{ user_id: user.user_id, date: today }])
          .select("*")
          .single();
        data = newLog;
      }

      return data;
    },
  });

  // Calculate goals (template vs override)
  const goals = profileQuery.data?.targets_override
    ? {
        calories: profileQuery.data.kcal_goal,
        protein: profileQuery.data.protein_units,
        // ...
      }
    : {
        calories: targetTemplateQuery.data?.kcal_plan,
        protein: targetTemplateQuery.data?.protein_units,
        // ...
      };

  return { profile, dailyLog, goals };
}
```

---

## 🎨 Bottom Sheets Used in App

### 1. **Add Food Sheet** (food-bank.tsx)
- **Trigger**: Tap on food item in food bank
- **Contents**:
  - Food name & image
  - Quantity input (number stepper)
  - Measurement selector (for some foods)
  - Macro preview (shows calculated values)
  - Confirm button

### 2. **Restaurant Selection Sheet** (food-bank.tsx)
- **Trigger**: Tap on restaurant category
- **Contents**:
  - List of restaurant items
  - Each item shows: name, calories, macro units
  - Tap item → adds to sheet footer
  - Quantity selector
  - Confirm button

### 3. **Edit Meal Sheet** (app/(tabs)/add.tsx)
- **Trigger**: Tap "Edit" icon on meal card
- **Contents**:
  - List of all items in that meal
  - Each item: name, quantity input, delete button
  - Save changes button
  - Real-time macro updates as you edit

### 4. **Macro Popover** (components/MacroPopover.tsx)
- **Trigger**: Tap on macro progress bar
- **Contents**:
  - Detailed breakdown of that macro
  - Goal vs. intake
  - Percentage complete
  - Visual progress ring

### 5. **Admin Menu Sheet** (components/AdminMenuSheet.tsx)
- **Trigger**: Admin users only - swipe from bottom
- **Contents**:
  - Quick links to admin pages
  - Analytics
  - Client management
  - Food bank editor
  - Settings

### 6. **Meal Plan Sheet** (app/meal-plan.tsx)
- **Trigger**: Tap "View Meal Plan" button
- **Contents**:
  - Pre-built meal plan for the day
  - Organized by meal (breakfast, lunch, dinner)
  - Quick add buttons

---

## 🚀 Key Takeaways for Developers

1. **Food Bank = ONE SERVING**
   - Always multiply by quantity when adding to daily_items

2. **Database Does the Math**
   - Triggers automatically sum daily_items → daily_logs
   - Never manually update daily_logs totals

3. **Units = Servings**
   - Not grams or calories
   - 1 מנת חלבון = 1 protein serving = 200 kcal

4. **RLS Security**
   - Users can only see/edit their own data
   - Public tables: food_bank, restaurants, templates

5. **React Query for State**
   - Automatic cache invalidation
   - Optimistic updates
   - Real-time UI updates

6. **One daily_log per user per day**
   - Auto-created on first food log
   - UNIQUE constraint enforces this

---

## 📚 Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **React Query Docs**: https://tanstack.com/query/latest
- **Expo Router**: https://docs.expo.dev/router/introduction/

---

**Last Updated**: January 2025
**Version**: 1.0
**Author**: Rork AI Assistant
