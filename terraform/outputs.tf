# Terraform Outputs - Display useful information after deployment

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Instance Information
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

output "instance_id" {
  description = "OCID of the compute instance"
  value       = oci_core_instance.jobtracker_instance.id
}

output "instance_name" {
  description = "Name of the compute instance"
  value       = oci_core_instance.jobtracker_instance.display_name
}

output "instance_state" {
  description = "Current state of the instance"
  value       = oci_core_instance.jobtracker_instance.state
}

output "instance_public_ip" {
  description = "Public IP address of the instance"
  value       = oci_core_instance.jobtracker_instance.public_ip
}

output "instance_private_ip" {
  description = "Private IP address of the instance"
  value       = oci_core_instance.jobtracker_instance.private_ip
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Network Information
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

output "vcn_id" {
  description = "OCID of the VCN"
  value       = oci_core_vcn.jobtracker_vcn.id
}

output "subnet_id" {
  description = "OCID of the subnet"
  value       = oci_core_subnet.jobtracker_subnet.id
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SSH Information
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

output "ssh_private_key_path" {
  description = "Path to SSH private key for instance access"
  value       = var.generate_new_ssh_key ? abspath("${path.module}/generated-keys/jobtracker_ssh_key.pem") : var.ssh_public_key_path
}

output "github_deploy_private_key_path" {
  description = "Path to GitHub deploy private key"
  value       = abspath("${path.module}/generated-keys/github_deploy_key")
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Connection Information
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

output "ssh_connection_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i ${var.generate_new_ssh_key ? "${path.module}/generated-keys/jobtracker_ssh_key.pem" : var.ssh_public_key_path} opc@${oci_core_instance.jobtracker_instance.public_ip}"
}

output "application_url" {
  description = "URL to access the application"
  value       = "http://${oci_core_instance.jobtracker_instance.public_ip}:3000"
}

output "health_check_url" {
  description = "URL for health check endpoint"
  value       = "http://${oci_core_instance.jobtracker_instance.public_ip}:3000/health"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Configuration Files
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

output "github_secrets_file" {
  description = "Path to GitHub secrets configuration file"
  value       = abspath("${path.module}/outputs/github-secrets.txt")
}

output "env_file" {
  description = "Path to generated environment file"
  value       = abspath("${path.module}/outputs/.env.generated")
}

output "connect_script" {
  description = "Path to connection script"
  value       = abspath("${path.module}/outputs/connect.sh")
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Secrets (Sensitive)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

output "database_password" {
  description = "Generated database password"
  value       = random_password.db_password.result
  sensitive   = true
}

output "jwt_secret" {
  description = "Generated JWT secret"
  value       = random_password.jwt_secret.result
  sensitive   = true
}

output "session_secret" {
  description = "Generated session secret"
  value       = random_password.session_secret.result
  sensitive   = true
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Summary Output
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

output "deployment_summary" {
  description = "Summary of deployment"
  value = <<-EOT

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ Job Tracker Infrastructure Created Successfully!
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Instance Information:
  ---------------------
  Name:       ${oci_core_instance.jobtracker_instance.display_name}
  Public IP:  ${oci_core_instance.jobtracker_instance.public_ip}
  Private IP: ${oci_core_instance.jobtracker_instance.private_ip}
  State:      ${oci_core_instance.jobtracker_instance.state}

  Access Information:
  -------------------
  SSH Command:
    ./outputs/connect.sh

  Or manually:
    ssh -i ${var.generate_new_ssh_key ? "generated-keys/jobtracker_ssh_key.pem" : var.ssh_public_key_path} opc@${oci_core_instance.jobtracker_instance.public_ip}

  Application URL (after deployment):
    http://${oci_core_instance.jobtracker_instance.public_ip}:3000

  Health Check:
    curl http://${oci_core_instance.jobtracker_instance.public_ip}:3000/health

  Generated Files:
  ----------------
  SSH Keys:        ./generated-keys/
  GitHub Secrets:  ./outputs/github-secrets.txt
  Environment:     ./outputs/.env.generated
  Connect Script:  ./outputs/connect.sh

  Next Steps:
  -----------
  ${var.use_cloud_init ? "1. Wait 10-15 minutes for cloud-init to complete setup" : "1. SSH to the instance and install Docker manually"}
  2. Check cloud-init status: sudo cloud-init status
  3. Clone repository: cd /opt/jobtracker && git clone ${var.github_repository} .
  4. Copy environment: scp outputs/.env.generated opc@${oci_core_instance.jobtracker_instance.public_ip}:/opt/jobtracker/.env
  5. Deploy application: docker-compose up -d
  6. Add GitHub secrets from: ./outputs/github-secrets.txt

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EOT
}
