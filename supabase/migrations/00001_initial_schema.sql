-- Initial Schema for Maji

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores
CREATE TABLE public.stores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store Settings
CREATE TABLE public.store_settings (
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE PRIMARY KEY,
    primary_color TEXT DEFAULT '#000000',
    secondary_color TEXT DEFAULT '#FFFFFF',
    logo_url TEXT,
    banner_url TEXT,
    about_text TEXT,
    layout TEXT DEFAULT 'classic',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social Links
CREATE TABLE public.social_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL,
    is_digital BOOLEAN DEFAULT false,
    stock INTEGER DEFAULT 0,
    digital_file_url TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, slug)
);

-- Product Images
CREATE TABLE public.product_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_email TEXT,
    total_amount DECIMAL(12, 2) NOT NULL,
    payment_reference TEXT UNIQUE NOT NULL,
    payment_status TEXT DEFAULT 'pending', -- pending, paid, failed
    fulfillment_status TEXT DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price_at_purchase DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payout Accounts (for Paystack Subaccounts)
CREATE TABLE public.payout_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL UNIQUE,
    bank_code TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    subaccount_code TEXT NOT NULL, -- Paystack subaccount ID
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payout Change Requests
CREATE TABLE public.payout_change_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    new_bank_code TEXT NOT NULL,
    new_account_number TEXT NOT NULL,
    new_account_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Store Verifications (KYC)
CREATE TABLE public.verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL UNIQUE,
    document_url TEXT,
    business_name TEXT,
    cac_number TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Admin Users
CREATE TABLE public.admin_users (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stores_modtime
    BEFORE UPDATE ON public.stores
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_store_settings_modtime
    BEFORE UPDATE ON public.store_settings
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_products_modtime
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

