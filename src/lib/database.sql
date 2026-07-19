-- Enable the uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Patients Table
-- ==========================================
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  phone VARCHAR,
  gender VARCHAR,
  dob DATE,
  allergies TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policy
CREATE POLICY "Tenant Isolation - Patients" ON patients
  AS PERMISSIVE FOR ALL
  TO authenticated
  USING (tenant_id = auth.jwt() ->> 'tenant_id')
  WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');

-- ==========================================
-- 2. Appointments Table
-- ==========================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_name VARCHAR NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status VARCHAR DEFAULT 'Scheduled',
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policy
CREATE POLICY "Tenant Isolation - Appointments" ON appointments
  AS PERMISSIVE FOR ALL
  TO authenticated
  USING (tenant_id = auth.jwt() ->> 'tenant_id')
  WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');

-- ==========================================
-- 3. Prescriptions Table
-- ==========================================
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR NOT NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  medications JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policy
CREATE POLICY "Tenant Isolation - Prescriptions" ON prescriptions
  AS PERMISSIVE FOR ALL
  TO authenticated
  USING (tenant_id = auth.jwt() ->> 'tenant_id')
  WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');

-- ==========================================
-- 4. Clinic Settings & Doctors Table
-- ==========================================
CREATE TABLE clinic_settings (
  tenant_id VARCHAR PRIMARY KEY,
  clinic_name VARCHAR NOT NULL,
  doctors JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policy
CREATE POLICY "Tenant Isolation - Clinic Settings" ON clinic_settings
  AS PERMISSIVE FOR ALL
  TO authenticated
  USING (tenant_id = auth.jwt() ->> 'tenant_id')
  WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');
