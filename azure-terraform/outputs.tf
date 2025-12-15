# Azure Terraform Outputs

output "resource_group_name" {
  description = "Resource group name"
  value       = azurerm_resource_group.main.name
}

output "vm_public_ip" {
  description = "Public IP address of VM"
  value       = azurerm_public_ip.main.ip_address
}

output "vm_name" {
  description = "Virtual machine name"
  value       = azurerm_linux_virtual_machine.main.name
}

output "admin_username" {
  description = "Admin username"
  value       = var.admin_username
}

output "ssh_connection" {
  description = "SSH connection command"
  value       = "ssh ${var.admin_username}@${azurerm_public_ip.main.ip_address}"
}

output "application_url" {
  description = "Application URL"
  value       = "http://${azurerm_public_ip.main.ip_address}:3000"
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

output "db_password" {
  description = "Generated database password"
  value       = random_password.db_password.result
  sensitive   = true
}

output "ssh_private_key" {
  description = "Generated SSH private key"
  value       = var.generate_ssh_key ? tls_private_key.ssh[0].private_key_pem : "Using provided key"
  sensitive   = true
}
