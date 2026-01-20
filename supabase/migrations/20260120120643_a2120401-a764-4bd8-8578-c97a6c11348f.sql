-- Create enum for user roles (supplier vs vendor)
CREATE TYPE public.user_role AS ENUM ('supplier', 'vendor');

-- Create enum for order status
CREATE TYPE public.order_status AS ENUM ('pending', 'accepted', 'rejected', 'completed');

-- Create profiles table for user information
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    city TEXT,
    show_phone BOOLEAN DEFAULT false,
    show_email BOOLEAN DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Create supplier_profiles table for supplier-specific info
CREATE TABLE public.supplier_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    company_description TEXT,
    category TEXT,
    rating_average DECIMAL(2,1) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vendor_profiles table for vendor-specific info
CREATE TABLE public.vendor_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    store_name TEXT NOT NULL,
    store_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product categories table
CREATE TABLE public.categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name_fr TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id),
    name_fr TEXT NOT NULL,
    name_ar TEXT,
    description_fr TEXT,
    description_ar TEXT,
    price DECIMAL(10,2) NOT NULL,
    min_order_quantity INTEGER NOT NULL DEFAULT 1,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status order_status NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create favorites table
CREATE TABLE public.favorites (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (vendor_id, supplier_id)
);

-- Create supplier announcements table
CREATE TABLE public.announcements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title_fr TEXT NOT NULL,
    title_ar TEXT,
    content_fr TEXT NOT NULL,
    content_ar TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_supplier_profiles_updated_at BEFORE UPDATE ON public.supplier_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vendor_profiles_updated_at BEFORE UPDATE ON public.vendor_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for supplier_profiles
CREATE POLICY "Supplier profiles are viewable by everyone" ON public.supplier_profiles FOR SELECT USING (true);
CREATE POLICY "Suppliers can update their own profile" ON public.supplier_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Suppliers can insert their own profile" ON public.supplier_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for vendor_profiles  
CREATE POLICY "Vendor profiles are viewable by everyone" ON public.vendor_profiles FOR SELECT USING (true);
CREATE POLICY "Vendors can update their own profile" ON public.vendor_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Vendors can insert their own profile" ON public.vendor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for categories
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);

-- RLS Policies for products
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Suppliers can insert their own products" ON public.products FOR INSERT WITH CHECK (auth.uid() = supplier_id AND public.has_role(auth.uid(), 'supplier'));
CREATE POLICY "Suppliers can update their own products" ON public.products FOR UPDATE USING (auth.uid() = supplier_id);
CREATE POLICY "Suppliers can delete their own products" ON public.products FOR DELETE USING (auth.uid() = supplier_id);

-- RLS Policies for orders
CREATE POLICY "Vendors can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = vendor_id);
CREATE POLICY "Suppliers can view orders for them" ON public.orders FOR SELECT USING (auth.uid() = supplier_id);
CREATE POLICY "Vendors can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = vendor_id AND public.has_role(auth.uid(), 'vendor'));
CREATE POLICY "Suppliers can update order status" ON public.orders FOR UPDATE USING (auth.uid() = supplier_id);

-- RLS Policies for order_items
CREATE POLICY "Users can view order items for their orders" ON public.order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.vendor_id = auth.uid() OR orders.supplier_id = auth.uid()))
);
CREATE POLICY "Vendors can insert order items" ON public.order_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.vendor_id = auth.uid())
);

-- RLS Policies for reviews
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Vendors can insert reviews for completed orders" ON public.reviews FOR INSERT WITH CHECK (
    auth.uid() = vendor_id AND 
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_id AND orders.vendor_id = auth.uid() AND orders.status = 'completed')
);

-- RLS Policies for favorites
CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT USING (auth.uid() = vendor_id);
CREATE POLICY "Users can insert their own favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "Users can delete their own favorites" ON public.favorites FOR DELETE USING (auth.uid() = vendor_id);

-- RLS Policies for announcements
CREATE POLICY "Announcements are viewable by everyone" ON public.announcements FOR SELECT USING (is_active = true);
CREATE POLICY "Suppliers can manage their own announcements" ON public.announcements FOR ALL USING (auth.uid() = supplier_id);

-- Insert default categories
INSERT INTO public.categories (name_fr, name_ar, slug, icon) VALUES
('Fruits & Légumes', 'فواكه وخضروات', 'fruits-legumes', 'Apple'),
('Produits Laitiers', 'منتجات الألبان', 'produits-laitiers', 'Milk'),
('Viandes & Volailles', 'لحوم ودواجن', 'viandes-volailles', 'Beef'),
('Poissons & Fruits de Mer', 'أسماك ومأكولات بحرية', 'poissons-fruits-mer', 'Fish'),
('Boulangerie & Pâtisserie', 'مخبوزات وحلويات', 'boulangerie-patisserie', 'Croissant'),
('Épicerie Salée', 'بقالة مالحة', 'epicerie-salee', 'Package'),
('Épicerie Sucrée', 'بقالة حلوة', 'epicerie-sucree', 'Candy'),
('Boissons', 'مشروبات', 'boissons', 'Cup'),
('Surgelés', 'مجمدات', 'surgeles', 'Snowflake'),
('Hygiène & Entretien', 'نظافة وصيانة', 'hygiene-entretien', 'Sparkles');