-- NexusCRM Database Relational Schema
-- Standard PostgreSQL / ANSI SQL Compatible

-- Enable extensions if needed (e.g., for UUIDs, though we use standard sequential BIGSERIAL here)

---------------------------------------------------------
-- 1. USERS (Internal Staff)
---------------------------------------------------------
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'sales_rep',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

---------------------------------------------------------
-- 2. ACCOUNTS (Companies / Corporate entities)
---------------------------------------------------------
CREATE TABLE accounts (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    industry VARCHAR(100),
    website VARCHAR(200),
    billing_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

---------------------------------------------------------
-- 3. CONTACTS (Qualified Individuals)
---------------------------------------------------------
CREATE TABLE contacts (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(50),
    job_title VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'Contact' CHECK (status IN ('Lead', 'Contact', 'Customer', 'Inactive')),
    value DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

---------------------------------------------------------
-- 4. OPPORTUNITIES (Sales Deals)
---------------------------------------------------------
CREATE TABLE opportunities (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    primary_contact_id BIGINT REFERENCES contacts(id) ON DELETE SET NULL,
    assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    stage VARCHAR(50) NOT NULL DEFAULT 'qualification' 
        CHECK (stage IN ('qualification', 'proposal', 'negotiation', 'won', 'lost')),
    probability INT NOT NULL CHECK (probability BETWEEN 0 AND 100),
    close_date DATE NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

---------------------------------------------------------
-- 5. LEADS (Unqualified Pipeline Entries)
---------------------------------------------------------
CREATE TABLE leads (
    id BIGSERIAL PRIMARY KEY,
    assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(50),
    company_name VARCHAR(150),
    status VARCHAR(50) NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Qualified', 'Unqualified')),
    source VARCHAR(100),
    
    -- Conversion Metadata (References populated after lead qualification/conversion)
    converted_contact_id BIGINT REFERENCES contacts(id) ON DELETE SET NULL,
    converted_account_id BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
    converted_opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

---------------------------------------------------------
-- 6. INTERACTIONS (Unified Activity Logs)
---------------------------------------------------------
CREATE TABLE interactions (
    id BIGSERIAL PRIMARY KEY,
    logged_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    contact_id BIGINT REFERENCES contacts(id) ON DELETE CASCADE,
    lead_id BIGINT REFERENCES leads(id) ON DELETE CASCADE,
    opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note')),
    details TEXT NOT NULL,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure the activity is associated with at least one subject context
    CONSTRAINT chk_interaction_has_target CHECK (
        contact_id IS NOT NULL OR 
        lead_id IS NOT NULL OR 
        opportunity_id IS NOT NULL
    )
);

---------------------------------------------------------
-- 7. TASKS (Action Checklists)
---------------------------------------------------------
CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
    contact_id BIGINT REFERENCES contacts(id) ON DELETE CASCADE,
    opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

---------------------------------------------------------
-- PERFORMANCE OPTIMIZATION INDICES (Foreign Keys & Queries)
---------------------------------------------------------
CREATE INDEX idx_contacts_account_id ON contacts(account_id);
CREATE INDEX idx_contacts_email ON contacts(email);

CREATE INDEX idx_opportunities_account_id ON opportunities(account_id);
CREATE INDEX idx_opportunities_contact_id ON opportunities(primary_contact_id);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_assigned ON opportunities(assigned_to);

CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_status ON leads(status);

CREATE INDEX idx_interactions_contact ON interactions(contact_id);
CREATE INDEX idx_interactions_lead ON interactions(lead_id);
CREATE INDEX idx_interactions_opp ON interactions(opportunity_id);
CREATE INDEX idx_interactions_logged ON interactions(logged_at);

CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_due ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
