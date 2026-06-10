-- Seed data for Picadeli
-- This creates an initial admin user and sample products

-- Note: You need to create the auth user first via Supabase Auth
-- Then update the profile role to 'admin' manually

-- Sample products
INSERT INTO products (name, description, price, stock, min_stock) VALUES
('Gomitas Ositas', 'Deliciosas gomitas de osito', 5000.00, 100, 10),
('Gomitas Gusanitos', 'Gomitas ácidas en forma de gusano', 4500.00, 80, 10),
('Gomitas Frutillas', 'Gomitas con sabor a fresa', 5500.00, 60, 10),
('Gomitas Colores', 'Surtido de gomitas multicolor', 6000.00, 50, 10),
('Gomitas Piñas', 'Gomitas con forma de piña', 4800.00, 70, 10),
('Gomitas Sandías', 'Gomitas con sabor a sandía', 5200.00, 65, 10),
('Gomitas Limones', 'Gomitas ácidas de limón', 4700.00, 90, 10),
('Gomitas Naranjas', 'Gomitas con sabor a naranja', 4900.00, 75, 10),
('Gomitas Uvas', 'Gomitas con sabor a uva', 5300.00, 55, 10),
('Gomitas Mangos', 'Gomitas con sabor a mango', 5800.00, 45, 10);

-- After running this migration:
-- 1. Create a user via Supabase Auth (email/password)
-- 2. Run: UPDATE profiles SET role = 'admin' WHERE email = 'your-admin-email';
