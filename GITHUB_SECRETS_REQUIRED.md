# GitHub Secrets Required

Add these secrets to your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

---

## For Terraform (Infrastructure Creation)

```
Name: TF_VAR_tenancy_ocid
Value: ocid1.tenancy.oc1..aaaaaaaaxxxxxx...
```

```
Name: TF_VAR_user_ocid
Value: ocid1.user.oc1..aaaaaaaaxxxxxx...
```

```
Name: TF_VAR_fingerprint
Value: xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx
```

```
Name: TF_VAR_compartment_ocid
Value: ocid1.compartment.oc1..aaaaaaaaxxxxxx...
```

```
Name: TF_VAR_region
Value: us-ashburn-1
```

```
Name: OCI_API_PRIVATE_KEY
Value: -----BEGIN RSA PRIVATE KEY-----
(paste entire private key including BEGIN/END lines)
-----END RSA PRIVATE KEY-----
```

```
Name: TF_VAR_anthropic_api_key
Value: sk-ant-api03-xxxxxx...
(optional - for AI features)
```

---

## For Application Deployment

**These are added AFTER Terraform creates the instance:**

```
Name: OCI_HOST
Value: <instance-ip-from-terraform-output>
```

```
Name: OCI_USER
Value: opc
```

```
Name: OCI_SSH_PRIVATE_KEY
Value: -----BEGIN OPENSSH PRIVATE KEY-----
(from Terraform output)
-----END OPENSSH PRIVATE KEY-----
```

```
Name: PRODUCTION_URL
Value: <instance-ip-or-domain>
```

---

## Where to Get OCI Values

### 1. Tenancy OCID
```
OCI Console → Profile (top right) → Tenancy: <name>
Copy OCID
```

### 2. User OCID
```
OCI Console → Profile → User Settings
Copy OCID under "User Information"
```

### 3. API Key & Fingerprint
```bash
# Generate API key locally
mkdir -p ~/.oci
openssl genrsa -out ~/.oci/oci_api_key.pem 2048
openssl rsa -pubout -in ~/.oci/oci_api_key.pem -out ~/.oci/oci_api_key_public.pem

# Display public key
cat ~/.oci/oci_api_key_public.pem
```

Add to OCI:
```
OCI Console → User Settings → API Keys → Add API Key
→ Paste Public Key → Add
→ Copy the Fingerprint shown
```

GitHub Secrets:
```
OCI_API_PRIVATE_KEY = contents of ~/.oci/oci_api_key.pem
TF_VAR_fingerprint = the fingerprint from OCI Console
```

### 4. Compartment OCID
```
OCI Console → Identity & Security → Compartments
Click your compartment → Copy OCID

OR use root compartment (same as Tenancy OCID)
```

### 5. Region
```
Pick closest region:
- us-ashburn-1 (US East)
- us-phoenix-1 (US West)
- eu-frankfurt-1 (Europe)
```

---

## Deployment Flow

**Step 1: Add Terraform secrets (above 7 secrets)**

**Step 2: Run Terraform workflow**
```
GitHub → Actions → "Create OCI Infrastructure" → Run workflow
```

**Step 3: Get instance IP from workflow output**

**Step 4: Add deployment secrets (4 secrets with instance IP)**

**Step 5: Push code to trigger auto-deployment**
```bash
git push origin main
```

Done! ✅
