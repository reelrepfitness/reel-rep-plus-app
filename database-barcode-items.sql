-- Create barcode_items table for barcode scanner
-- This table stores food items with barcodes
-- Macros are stored in grams per 100g and automatically converted to servings
-- 
-- Serving definitions (CORRECT METHOD - CALORIE-BASED):
-- Protein Portion: A high-protein food that provides 200 calories TOTAL (including any fats or carbs it contains)
-- Carbohydrate Portion: A high-carb food that provides 120 calories TOTAL
-- Fat Portion: A high-fat food that provides 120 calories TOTAL
--
-- If a food contains similar levels of several macronutrients, it can count partly toward each category
-- For example: one protein portion and half a carb portion, depending on its nutrition profile

CREATE TABLE IF NOT EXISTS barcode_items (
  id BIGSERIAL PRIMARY KEY,
  barcode TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  brand_name TEXT,
  total_product_weight_g NUMERIC(10, 2),
  
  -- Macros per 100g (stored in grams)
  protein_per_100g NUMERIC(10, 2) NOT NULL DEFAULT 0,
  carbs_per_100g NUMERIC(10, 2) NOT NULL DEFAULT 0,
  fat_per_100g NUMERIC(10, 2) NOT NULL DEFAULT 0,
  fiber_per_100g NUMERIC(10, 2) DEFAULT 0,
  
  -- Calories per 100g (used for portion calculation)
  calories_per_100g NUMERIC(10, 2) NOT NULL,
  
  -- Calculated servings per 100g (automatically computed based on CALORIE-BASED method)
  -- These calculations determine which macro is dominant and calculate portions accordingly:
  -- Protein Portion = calories / 200 (if protein is dominant)
  -- Carb Portion = calories / 120 (if carbs are dominant)
  -- Fat Portion = calories / 120 (if fat is dominant)
  -- For mixed foods, portions are distributed based on macro ratios
  protein_servings_per_100g NUMERIC(10, 2) GENERATED ALWAYS AS (
    CASE 
      -- High protein food (protein provides >40% of calories)
      WHEN (protein_per_100g * 4.0) >= (calories_per_100g * 0.4) THEN 
        calories_per_100g / 200.0
      -- Mixed protein food (protein provides 20-40% of calories)
      WHEN (protein_per_100g * 4.0) >= (calories_per_100g * 0.2) THEN 
        (protein_per_100g * 4.0 / calories_per_100g) * (calories_per_100g / 200.0)
      ELSE 0
    END
  ) STORED,
  
  carb_servings_per_100g NUMERIC(10, 2) GENERATED ALWAYS AS (
    CASE 
      -- High carb food (carbs provide >50% of calories)
      WHEN (carbs_per_100g * 4.0) >= (calories_per_100g * 0.5) THEN 
        calories_per_100g / 120.0
      -- Mixed carb food (carbs provide 25-50% of calories)
      WHEN (carbs_per_100g * 4.0) >= (calories_per_100g * 0.25) THEN 
        (carbs_per_100g * 4.0 / calories_per_100g) * (calories_per_100g / 120.0)
      ELSE 0
    END
  ) STORED,
  
  fat_servings_per_100g NUMERIC(10, 2) GENERATED ALWAYS AS (
    CASE 
      -- High fat food (fat provides >50% of calories)
      WHEN (fat_per_100g * 9.0) >= (calories_per_100g * 0.5) THEN 
        calories_per_100g / 120.0
      -- Mixed fat food (fat provides 25-50% of calories)
      WHEN (fat_per_100g * 9.0) >= (calories_per_100g * 0.25) THEN 
        (fat_per_100g * 9.0 / calories_per_100g) * (calories_per_100g / 120.0)
      ELSE 0
    END
  ) STORED,
  
  -- Product details
  serving_size_g NUMERIC(10, 2),
  img_url TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on barcode for fast lookups
CREATE INDEX IF NOT EXISTS idx_barcode_items_barcode ON barcode_items(barcode);

-- Create index on name for search (using simple text search)
CREATE INDEX IF NOT EXISTS idx_barcode_items_name ON barcode_items USING gin(to_tsvector('simple', name));

-- Create index on brand name
CREATE INDEX IF NOT EXISTS idx_barcode_items_brand ON barcode_items(brand_name);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_barcode_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER barcode_items_updated_at
  BEFORE UPDATE ON barcode_items
  FOR EACH ROW
  EXECUTE FUNCTION update_barcode_items_updated_at();

-- Column descriptions
COMMENT ON COLUMN barcode_items.name IS 'Product name';
COMMENT ON COLUMN barcode_items.brand_name IS 'Brand name of the product';
COMMENT ON COLUMN barcode_items.total_product_weight_g IS 'Total weight of the product package in grams';
COMMENT ON COLUMN barcode_items.protein_per_100g IS 'Protein in grams per 100g of product';
COMMENT ON COLUMN barcode_items.carbs_per_100g IS 'Carbohydrates in grams per 100g of product';
COMMENT ON COLUMN barcode_items.fat_per_100g IS 'Fat in grams per 100g of product';
COMMENT ON COLUMN barcode_items.protein_servings_per_100g IS 'Auto-calculated protein portions (1 portion = 200 cal TOTAL for high-protein foods)';
COMMENT ON COLUMN barcode_items.carb_servings_per_100g IS 'Auto-calculated carb portions (1 portion = 120 cal TOTAL for high-carb foods)';
COMMENT ON COLUMN barcode_items.fat_servings_per_100g IS 'Auto-calculated fat portions (1 portion = 120 cal TOTAL for high-fat foods)';

-- Example data
-- Example 1: Chicken breast (100g has 31g protein, 0g carbs, 3.6g fat, 165 cal)
-- Protein calories: 31*4=124 (75% of total) → High protein food
-- This will calculate to: 0.825 protein portions (165/200)
INSERT INTO barcode_items (barcode, name, brand_name, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g, serving_size_g, total_product_weight_g)
VALUES 
('7290000000001', 'חזה עוף', 'תנובה', 31, 0, 3.6, 165, 150, 500);

-- Example 2: Whole wheat bread (100g has 13g protein, 41g carbs, 3.5g fat, 247 cal)
-- Carb calories: 41*4=164 (66% of total) → High carb food
-- This will calculate to: 2.06 carb portions (247/120)
INSERT INTO barcode_items (barcode, name, brand_name, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g, serving_size_g, fiber_per_100g, total_product_weight_g)
VALUES 
('7290000000002', 'לחם מלא', 'אנג''ל', 13, 41, 3.5, 247, 35, 7, 450);

-- Example 3: Greek yogurt (100g has 10g protein, 4g carbs, 0g fat, 59 cal)
-- Protein calories: 10*4=40 (68% of total) → High protein food
-- This will calculate to: 0.295 protein portions (59/200)
INSERT INTO barcode_items (barcode, name, brand_name, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g, serving_size_g, total_product_weight_g)
VALUES 
('7290000000003', 'יוגורט יווני 0%', 'תנובה', 10, 4, 0, 59, 150, 150);

-- Example 4: Almonds (100g has 21g protein, 22g carbs, 50g fat, 579 cal)
-- Fat calories: 50*9=450 (78% of total) → High fat food
-- This will calculate to: 4.83 fat portions (579/120)
INSERT INTO barcode_items (barcode, name, brand_name, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g, serving_size_g, fiber_per_100g, total_product_weight_g)
VALUES 
('7290000000004', 'שקדים', 'אגוז', 21, 22, 50, 579, 28, 12, 200);

-- Query to see how servings are calculated:
-- SELECT 
--   name,
--   brand_name,
--   total_product_weight_g || 'g' as package_weight,
--   calories_per_100g || ' cal' as total_calories,
--   protein_per_100g || 'g (' || ROUND((protein_per_100g * 4 / calories_per_100g * 100), 0) || '%)' as protein,
--   ROUND(protein_servings_per_100g, 2) as protein_portions,
--   carbs_per_100g || 'g (' || ROUND((carbs_per_100g * 4 / calories_per_100g * 100), 0) || '%)' as carbs,
--   ROUND(carb_servings_per_100g, 2) as carb_portions,
--   fat_per_100g || 'g (' || ROUND((fat_per_100g * 9 / calories_per_100g * 100), 0) || '%)' as fat,
--   ROUND(fat_servings_per_100g, 2) as fat_portions
-- FROM barcode_items;
