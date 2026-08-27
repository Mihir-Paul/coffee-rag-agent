-- CoffeeMind AI Supabase Database Schema
-- Run this script in your Supabase SQL Editor to set up tables & Row Level Security (RLS)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id VARCHAR(50) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Customer Preferences Table
CREATE TABLE IF NOT EXISTS public.customer_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID UNIQUE REFERENCES public.customers(id) ON DELETE CASCADE,
    temperature VARCHAR(20) DEFAULT 'Cold',
    sweetness VARCHAR(20) DEFAULT 'Medium',
    milk_preference VARCHAR(50) DEFAULT 'Oat Milk',
    caffeine_preference VARCHAR(20) DEFAULT 'Medium',
    budget NUMERIC(10,2) DEFAULT 250.00,
    dietary_restrictions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Current Coffee Session',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    recommendations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performant querying
CREATE INDEX IF NOT EXISTS idx_customers_auth_user ON public.customers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON public.customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer ON public.conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);

-- Enable Row Level Security (RLS) on all customer tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Customers
DROP POLICY IF EXISTS "Users can view their own customer profile" ON public.customers;
CREATE POLICY "Users can view their own customer profile" 
    ON public.customers FOR SELECT 
    USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can insert their own customer profile" ON public.customers;
CREATE POLICY "Users can insert their own customer profile" 
    ON public.customers FOR INSERT 
    WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can update their own customer profile" ON public.customers;
CREATE POLICY "Users can update their own customer profile" 
    ON public.customers FOR UPDATE 
    USING (auth.uid() = auth_user_id);

-- RLS Policies for Customer Preferences
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.customer_preferences;
CREATE POLICY "Users can view their own preferences" 
    ON public.customer_preferences FOR SELECT 
    USING (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.customer_preferences;
CREATE POLICY "Users can insert their own preferences" 
    ON public.customer_preferences FOR INSERT 
    WITH CHECK (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their own preferences" ON public.customer_preferences;
CREATE POLICY "Users can update their own preferences" 
    ON public.customer_preferences FOR UPDATE 
    USING (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()));

-- RLS Policies for Conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
CREATE POLICY "Users can view their own conversations" 
    ON public.conversations FOR SELECT 
    USING (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create their own conversations" ON public.conversations;
CREATE POLICY "Users can create their own conversations" 
    ON public.conversations FOR INSERT 
    WITH CHECK (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
CREATE POLICY "Users can update their own conversations" 
    ON public.conversations FOR UPDATE 
    USING (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.conversations;
CREATE POLICY "Users can delete their own conversations" 
    ON public.conversations FOR DELETE 
    USING (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()));

-- RLS Policies for Messages
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages;
CREATE POLICY "Users can view messages from their conversations" 
    ON public.messages FOR SELECT 
    USING (conversation_id IN (
        SELECT c.id FROM public.conversations c 
        JOIN public.customers cust ON c.customer_id = cust.id 
        WHERE cust.auth_user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can insert messages into their conversations" ON public.messages;
CREATE POLICY "Users can insert messages into their conversations" 
    ON public.messages FOR INSERT 
    WITH CHECK (conversation_id IN (
        SELECT c.id FROM public.conversations c 
        JOIN public.customers cust ON c.customer_id = cust.id 
        WHERE cust.auth_user_id = auth.uid()
    ));
