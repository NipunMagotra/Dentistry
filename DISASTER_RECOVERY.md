# Disaster Recovery & Backup Protocol

## 1. Automated Daily Backups

Clinic OS relies on Supabase for database hosting. To ensure data safety:
- **Requirement:** The production environment must be hosted on at least the **Supabase Pro tier**.
- **Mechanism:** Supabase automatically performs daily physical backups (via pgBackRest) of the PostgreSQL database.
- **Retention:** Backups are retained for 7 days automatically without requiring custom cron jobs.

## 2. Point-in-Time Recovery (PITR)

Due to the sensitive and high-paced nature of Clinic OS, standard daily backups are insufficient for granular recovery. 
- **Requirement:** **Point-in-Time Recovery (PITR)** must be enabled via the Supabase dashboard add-ons.
- **Use Case:** If a clinic receptionist accidentally deletes a patient's CRM history at 2:15 PM, PITR allows the engineering team to rewind the database specifically to 2:14 PM, preventing the loss of an entire day's work.

## 3. The Verification Drill (Disaster Recovery Protocol)

A backup is only as good as its last successful restore. We conduct a mandatory **Monthly Verification Drill** to ensure data integrity.

### Step-by-Step Drill:

1. **Provision Staging Environment**
   - Spin up a separate, isolated staging project in the Supabase Dashboard.
   
2. **Trigger Restore**
   - Navigate to the Database Backups section of the **Production** Supabase project.
   - Select the latest daily backup (or a specific PITR timestamp).
   - Choose the option to restore to the newly created staging project.
   
3. **Run Automated Integrity Tests**
   - Once the restore completes, update your local `.env` (or a dedicated `.env.staging`) with the staging database credentials.
   - Execute the disaster recovery verification script to ensure that patient records, appointments, and multi-tenant RLS policies are completely intact.
   - **Command:** `npx tsx scripts/verify-dr.ts`

4. **Sign Off & Teardown**
   - If tests pass successfully, log the successful drill in the engineering DR log.
   - Pause or delete the staging project to avoid unnecessary costs.
