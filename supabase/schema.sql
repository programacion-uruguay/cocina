-- Esquema SQL para Supabase (PostgreSQL + Storage)
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase para activar el almacenamiento en la nube.

create extension if not exists "uuid-ossp";

-- Tabla principal de recetas
create table if not exists public.recipes (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null default '',
  calories integer not null default 0,
  servings integer not null default 1,
  prep_time_minutes integer not null default 15,
  meal_times text[] not null default '{}',
  cooking_methods jsonb not null default '[]'::jsonb,
  ingredients jsonb not null default '[]'::jsonb,
  steps text[] not null default '{}',
  resources jsonb not null default '[]'::jsonb,
  source_url text,
  cover_image text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tabla de lista de compras
create table if not exists public.shopping_items (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  quantity numeric not null default 1,
  unit text not null default 'unidad',
  checked boolean not null default false,
  recipe_id uuid references public.recipes(id) on delete set null,
  recipe_title text,
  created_at timestamptz not null default now()
);

-- Tablas futuras para el comparador de precios de supermercados
create table if not exists public.supermarkets (
  id text primary key,
  name text not null,
  api_endpoint text,
  is_active boolean not null default true
);

create table if not exists public.product_prices (
  id uuid primary key default uuid_generate_v4(),
  supermarket_id text references public.supermarkets(id) on delete cascade,
  ingredient_key text not null,
  product_name text not null,
  price numeric not null,
  currency text not null default 'ARS',
  unit text not null default 'unidad',
  product_url text,
  updated_at timestamptz not null default now()
);

-- Bucket de Storage para videos, PDFs e imágenes de recetas
insert into storage.buckets (id, name, public)
values ('recipe-media', 'recipe-media', true)
on conflict (id) do nothing;
