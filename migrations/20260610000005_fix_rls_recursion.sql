-- Fix RLS recursion by dropping and recreating profiles policies
-- The issue: policies that query the same table cause infinite recursion

-- Drop existing profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

-- Create a security definer function to check admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Recreate profiles policies with the function
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert profiles" ON profiles
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update profiles" ON profiles
    FOR UPDATE USING (is_admin());

-- Also fix other policies that use the same pattern
-- Drop and recreate policies that query profiles
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;

CREATE POLICY "Admins can insert products" ON products
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update products" ON products
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete products" ON products
    FOR DELETE USING (is_admin());

DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

CREATE POLICY "Admins can view all orders" ON orders
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update orders" ON orders
    FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
DROP POLICY IF EXISTS "Order items managed through orders" ON order_items;

CREATE POLICY "Admins can view all order items" ON order_items
    FOR SELECT USING (is_admin());

CREATE POLICY "Order items managed through orders" ON order_items
    FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can view inventory transactions" ON inventory_transactions;
DROP POLICY IF EXISTS "Admins can insert inventory transactions" ON inventory_transactions;
DROP POLICY IF EXISTS "Admins can update inventory transactions" ON inventory_transactions;

CREATE POLICY "Admins can view inventory transactions" ON inventory_transactions
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert inventory transactions" ON inventory_transactions
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update inventory transactions" ON inventory_transactions
    FOR UPDATE USING (is_admin());
