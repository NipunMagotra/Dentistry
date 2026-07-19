-- ==========================================
-- 1. Staff Accounts & Roles
-- ==========================================

-- Staff accounts (links directly to Supabase Auth's native users table)
CREATE TABLE staff_accounts (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR UNIQUE NOT NULL,
  first_name VARCHAR,
  last_name VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Defined roles in the system
CREATE TABLE roles (
  id VARCHAR PRIMARY KEY, -- e.g., 'admin', 'doctor', 'receptionist'
  description TEXT
);

-- Seed basic roles
INSERT INTO roles (id, description) VALUES 
  ('admin', 'Full access to all clinic data, billing, and settings'),
  ('doctor', 'Can manage appointments and issue e-prescriptions'),
  ('receptionist', 'Can view, schedule, and reschedule appointments. Cannot issue prescriptions');

-- ==========================================
-- 2. Tenant Memberships
-- ==========================================
-- Links a staff account to a specific tenant with a specific role
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff_accounts(id) ON DELETE CASCADE,
  tenant_id VARCHAR NOT NULL,
  role_id VARCHAR REFERENCES roles(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure a user can only have one role per clinic
  UNIQUE(staff_id, tenant_id) 
);

-- ==========================================
-- 3. RBAC Helper Function
-- ==========================================
-- A secure definer function to rapidly lookup the user's role for the current tenant.
-- This uses auth.uid() which correlates to the 'sub' claim in the JWT.
CREATE OR REPLACE FUNCTION get_user_role(p_tenant_id VARCHAR) 
RETURNS VARCHAR AS $$
  SELECT role_id FROM memberships 
  WHERE staff_id = auth.uid() 
  AND tenant_id = p_tenant_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ==========================================
-- 4. RLS Policy Integration Example
-- ==========================================

-- Example: Expanding the Appointments policy to enforce RBAC
-- Tenant isolation is enforced via the JWT, and Role is enforced via the membership lookup.

DROP POLICY IF EXISTS "Tenant Isolation - Appointments" ON appointments;

-- READ: Everyone in the clinic can view appointments
CREATE POLICY "RBAC Select Appointments" ON appointments
  FOR SELECT TO authenticated
  USING (
    tenant_id = auth.jwt() ->> 'tenant_id' AND 
    get_user_role(tenant_id) IN ('admin', 'doctor', 'receptionist')
  );

-- INSERT/UPDATE: Everyone can schedule appointments
CREATE POLICY "RBAC Insert/Update Appointments" ON appointments
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = auth.jwt() ->> 'tenant_id' AND 
    get_user_role(tenant_id) IN ('admin', 'doctor', 'receptionist')
  );
CREATE POLICY "RBAC Update Appointments" ON appointments
  FOR UPDATE TO authenticated
  USING (
    tenant_id = auth.jwt() ->> 'tenant_id' AND 
    get_user_role(tenant_id) IN ('admin', 'doctor', 'receptionist')
  );

-- DELETE: Only admins and doctors can permanently delete/cancel appointments
CREATE POLICY "RBAC Delete Appointments" ON appointments
  FOR DELETE TO authenticated
  USING (
    tenant_id = auth.jwt() ->> 'tenant_id' AND 
    get_user_role(tenant_id) IN ('admin', 'doctor')
  );

-- ==========================================
-- Example: E-Prescriptions RLS
-- ==========================================

-- Only Doctors and Admins can create or modify prescriptions
CREATE POLICY "RBAC Write Prescriptions" ON prescriptions
  FOR ALL TO authenticated
  USING (
    tenant_id = auth.jwt() ->> 'tenant_id' AND 
    get_user_role(tenant_id) IN ('admin', 'doctor')
  )
  WITH CHECK (
    tenant_id = auth.jwt() ->> 'tenant_id' AND 
    get_user_role(tenant_id) IN ('admin', 'doctor')
  );
