-- ==========================================
-- 1. Immutable Audit Logs Table
-- ==========================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR NOT NULL,
    actor_id UUID, -- References the staff member making the change (auth.uid)
    table_name VARCHAR NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_payload JSONB,
    new_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. Audit Log Protection (RLS)
-- ==========================================
-- Audit logs must be strictly immutable.
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view audit logs for their clinic
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    tenant_id = auth.jwt() ->> 'tenant_id' AND 
    get_user_role(tenant_id) = 'admin'
  );

-- No policy is provided for UPDATE or DELETE, ensuring the logs are completely immutable.

-- ==========================================
-- 3. The Core Audit Trigger Function
-- ==========================================
CREATE OR REPLACE FUNCTION process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID;
    v_tenant_id VARCHAR;
    v_record_id UUID;
    v_old JSONB := NULL;
    v_new JSONB := NULL;
BEGIN
    -- Extract the actor directly from the secure JWT session context
    v_actor_id := auth.uid();
    
    -- Extract the tenant context natively from the JWT or the record itself
    v_tenant_id := auth.jwt() ->> 'tenant_id';
    
    -- Dynamically capture the payload and record IDs based on the action
    IF (TG_OP = 'DELETE') THEN
        v_record_id := OLD.id;
        v_old := row_to_json(OLD)::JSONB;
        IF v_tenant_id IS NULL THEN v_tenant_id := OLD.tenant_id; END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_record_id := NEW.id;
        v_old := row_to_json(OLD)::JSONB;
        v_new := row_to_json(NEW)::JSONB;
        IF v_tenant_id IS NULL THEN v_tenant_id := NEW.tenant_id; END IF;
    ELSIF (TG_OP = 'INSERT') THEN
        v_record_id := NEW.id;
        v_new := row_to_json(NEW)::JSONB;
        IF v_tenant_id IS NULL THEN v_tenant_id := NEW.tenant_id; END IF;
    END IF;
    
    -- Insert the immutable record
    INSERT INTO audit_logs (
        tenant_id, actor_id, table_name, record_id, action, old_payload, new_payload
    ) VALUES (
        v_tenant_id, v_actor_id, TG_TABLE_NAME::VARCHAR, v_record_id, TG_OP, v_old, v_new
    );
    
    -- Return NULL because this is an AFTER trigger and the result is ignored
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. Attaching the Triggers
-- ==========================================

-- Attach to Patients
CREATE TRIGGER audit_patients_trigger
AFTER INSERT OR UPDATE OR DELETE ON patients
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- Attach to Appointments
CREATE TRIGGER audit_appointments_trigger
AFTER INSERT OR UPDATE OR DELETE ON appointments
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- Attach to Prescriptions
CREATE TRIGGER audit_prescriptions_trigger
AFTER INSERT OR UPDATE OR DELETE ON prescriptions
FOR EACH ROW EXECUTE FUNCTION process_audit_log();
