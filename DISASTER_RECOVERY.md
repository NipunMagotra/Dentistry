# Disaster Recovery & Backup Protocol

## 1. Automated Daily Backups

Clinic OS relies on **Firebase Cloud Firestore** for document database hosting:
- **Mechanism:** Cloud Firestore provides continuous automatic multi-region backups and disaster recovery managed by Google Cloud Platform (GCP).
- **Scheduled Backups:** Automated daily backups can be scheduled using Google Cloud CLI / Cloud Console export rules to Google Cloud Storage (GCS) buckets.
- **Retention:** Custom retention policies (e.g., 30-day or 90-day GCS bucket lifecycle rules) are enforced for HIPAA/compliance auditability.

---

## 2. Point-in-Time Recovery (PITR)

Due to the sensitive and high-paced nature of Clinic OS, granular point-in-time recovery is enabled:
- **Feature:** **Firestore Point-In-Time Recovery (PITR)** allows restoring data to any microsecond in the past 7 days.
- **Use Case:** If a clinic receptionist accidentally deletes a patient's CRM history at 2:15 PM, PITR allows the engineering team to rewind the target Firestore collection specifically to 2:14 PM, preventing data loss.

---

## 3. Zero-Trust Rules & Encryption Pillars

- **Zero-Trust Access:** Configured in `firestore.rules` (`allow read, write: if false;`). Direct client-side SDK requests are blocked; all access must flow through authenticated Server Actions using the Firebase Admin SDK.
- **AES-256-GCM Encryption:** Field-level encryption for sensitive medical notes (`sensitive_notes`) using fresh 96-bit IVs and 128-bit authentication tags.

---

## 4. The Verification Drill (Disaster Recovery Protocol)

A backup is only as good as its last successful restore. We conduct a mandatory **Monthly Verification Drill** to ensure data integrity.

### Step-by-Step Drill:

1. **Initialize Verification Environment**
   - Ensure `.env.local` contains valid Firebase credentials (e.g. `FIREBASE_PROJECT_ID=dentistry-a00f1`).

2. **Run Automated Integrity & Encryption Tests**
   - Execute the disaster recovery verification script to test Firestore tenant sub-collection isolation and AES-256-GCM field encryption:
   - **Command:** `npx tsx scripts/verify-dr.ts`

3. **Expected Output:**
   ```text
   🔄 Starting DR & Firestore Verification Drill...
   ⏳ Testing Firebase Firestore tenant sub-collection isolation...
   ✅ Firestore tenant refs initialized successfully.
   ✅ AES-256-GCM field encryption/decryption verified successfully.
   ✅ DR & Firestore setup verification passed!
   ```

4. **Sign Off & Log Verification**
   - Log the successful verification drill in the engineering DR compliance audit log.
