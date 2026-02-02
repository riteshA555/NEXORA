-- Create orders table
create table orders (
  id uuid default gen_random_uuid() primary key,
  order_number serial not null,
  order_date date not null default current_date,
  customer_name text not null,
  material_type text not null check (material_type in ('CLIENT', 'OWN')),
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create order_items table
create table order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  description text not null,
  quantity numeric not null check (quantity > 0),
  unit text not null,
  rate numeric not null check (rate >= 0),
  amount numeric generated always as (quantity * rate) stored
);

-- Enable RLS
alter table orders enable row level security;
alter table order_items enable row level security;

-- Policies (Simple for now: authenticated users can see/create all)
-- In a real multi-tenant app, we'd filter by organization or user_id properly.
-- For this phase, we'll allow auth users to do everything on their own rows if we strictly filter,
-- but the requirement is "Login system (Admin user is enough for now)".
-- Let's stick to "Users can see their own orders" to be safe and clean.

create policy "Users can view their own orders"
on orders for select
using (auth.uid() = user_id);

create policy "Users can insert their own orders"
on orders for insert
with check (auth.uid() = user_id);

create policy "Users can update their own orders"
on orders for update
using (auth.uid() = user_id);

create policy "Users can view items of their orders"
on order_items for select
using (
  exists (
    select 1 from orders
    where orders.id = order_items.order_id
    and orders.user_id = auth.uid()
  )
);

create policy "Users can insert items to their orders"
on order_items for insert
with check (
  exists (
    select 1 from orders
    where orders.id = order_items.order_id
    and orders.user_id = auth.uid()
  )
);
