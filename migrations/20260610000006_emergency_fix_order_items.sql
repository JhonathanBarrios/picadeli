-- Emergency fix: Create is_admin function and fix order_items policies

-- Create the is_admin function
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

-- Drop existing order_items policies
DROP POLICY IF EXISTS "Vendors can view own order items" ON order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
DROP POLICY IF EXISTS "Order items managed through orders" ON order_items;

-- Create new policies for order_items
-- Vendors can view items from their orders
CREATE POLICY "Vendors can view own order items" ON order_items
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_items.order_id AND orders.vendedor_id = auth.uid()
      )
    );

-- Admins can view all order items
CREATE POLICY "Admins can view all order items" ON order_items
    FOR SELECT USING (is_admin());

-- Vendors can insert items for their orders
CREATE POLICY "Vendors can insert order items" ON order_items
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_items.order_id AND orders.vendedor_id = auth.uid()
      )
    );

-- Admins can insert any order items
CREATE POLICY "Admins can insert order items" ON order_items
    FOR INSERT WITH CHECK (is_admin());
