-- Create Products table
create table products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text not null,
  size text check (size in ('Small', 'Medium', 'Large')),
  default_weight numeric not null check (default_weight > 0),
  wastage_percent numeric not null default 0,
  labour_cost numeric not null default 0,
  current_stock numeric not null default 0 check (current_stock >= 0),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Enable RLS for products
alter table products enable row level security;
create policy "Authenticated users can view products"
on products for select
using (auth.role() = 'authenticated');

-- Update order_items table to link to products
alter table order_items 
add column product_id uuid references products(id),
add column weight numeric,
add column wastage_percent numeric,
add column labour_cost numeric;

-- Seed Data for Products
insert into products (name, category, size, default_weight, wastage_percent, labour_cost, current_stock) values
  ('Silver Mukut', 'Mukut', 'Medium', 50, 2, 500, 10),
  ('Silver Mukut', 'Mukut', 'Large', 100, 2, 800, 5),
  ('Fancy Ring', 'Ring', 'Small', 10, 1, 200, 20),
  ('Pendant', 'Pendant', 'Medium', 15, 1, 150, 15);

-- Stock Management Logic
-- Trigger to decrement stock when an order item linked to a product is CREATED
create or replace function decrement_stock()
returns trigger as $$
begin
  if new.product_id is not null then
    update products
    set current_stock = current_stock - new.quantity
    where id = new.product_id
    and current_stock >= new.quantity;
    
    if not found then
      raise exception 'Insufficient stock for product %', new.product_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trigger_decrement_stock
before insert on order_items
for each row
execute function decrement_stock();
