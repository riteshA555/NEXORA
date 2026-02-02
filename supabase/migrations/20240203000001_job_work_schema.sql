-- Create Job Work Items table
create table job_work_items (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  unit text not null check (unit in ('KG', 'Piece', 'Jodi')),
  default_rate numeric not null check (default_rate >= 0),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Enable RLS
alter table job_work_items enable row level security;

-- Policies
create policy "Authenticated users can view job work items"
on job_work_items for select
using (auth.role() = 'authenticated');

-- Seed Data
insert into job_work_items (name, unit, default_rate) values
  -- KG Based
  ('Half Belt', 'KG', 600),
  ('Fancy Half Belt', 'KG', 1000),
  ('Casting Choti', 'KG', 1000),
  ('Micro Choti', 'KG', 1000),
  ('Choti Meena Kanpuri', 'KG', 1000),
  ('Emboss Katai', 'KG', 1000),
  
  -- Piece/Jodi Based
  ('Hath Phool', 'Jodi', 100),
  ('Jali Locket', 'Piece', 30),
  ('Hanuman Locket', 'Piece', 12),
  ('Durga Locket', 'Piece', 12),
  ('Pendant Super Nice', 'Piece', 2),
  ('Pendant', 'Piece', 3),
  
  -- Extras
  ('Chalai', 'Piece', 23);
