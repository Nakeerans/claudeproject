# Terraform Variables for Job Tracker OCI Infrastructure

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# OCI Authentication Variables
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

variable "tenancy_ocid" {
  description = "OCI Tenancy OCID"
  type        = string
}

variable "user_ocid" {
  description = "OCI User OCID"
  type        = string
}

variable "fingerprint" {
  description = "API Key Fingerprint"
  type        = string
}

variable "private_key_path" {
  description = "Path to OCI API private key"
  type        = string
  default     = "~/.oci/oci_api_key.pem"
}

variable "region" {
  description = "OCI Region"
  type        = string
  default     = "us-ashburn-1"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Compartment Configuration
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

variable "compartment_ocid" {
  description = "OCI Compartment OCID where resources will be created"
  type        = string
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Instance Configuration
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

variable "instance_name" {
  description = "Name for the compute instance"
  type        = string
  default     = "jobtracker-app"
}

variable "instance_shape" {
  description = "Shape for the compute instance"
  type        = string
  default     = "VM.Standard.E4.Flex"
}

variable "instance_ocpus" {
  description = "Number of OCPUs for the instance"
  type        = number
  default     = 2
}

variable "instance_memory_in_gbs" {
  description = "Amount of memory in GB"
  type        = number
  default     = 8
}

variable "boot_volume_size_in_gbs" {
  description = "Size of the boot volume in GB"
  type        = number
  default     = 50
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Operating System Configuration
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

variable "instance_image_ocid" {
  description = "OCID of the image to use (leave empty to use latest Oracle Linux)"
  type        = string
  default     = ""
}

variable "os_version" {
  description = "Operating system version"
  type        = string
  default     = "8"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Network Configuration
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

variable "vcn_cidr_block" {
  description = "CIDR block for the VCN"
  type        = string
  default     = "10.0.0.0/16"
}

variable "subnet_cidr_block" {
  description = "CIDR block for the subnet"
  type        = string
  default     = "10.0.1.0/24"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SSH Configuration
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

variable "ssh_public_key_path" {
  description = "Path to SSH public key for instance access"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "generate_new_ssh_key" {
  description = "Generate a new SSH key pair for this instance"
  type        = bool
  default     = true
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Application Configuration
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

variable "github_repository" {
  description = "GitHub repository URL for the application"
  type        = string
  default     = "https://github.com/Nakeerans/claudeproject.git"
}

variable "github_token" {
  description = "GitHub personal access token for private repos (optional)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "anthropic_api_key" {
  description = "Anthropic API key for AI features"
  type        = string
  default     = ""
  sensitive   = true
}

variable "auto_deploy_on_create" {
  description = "Automatically deploy the application after instance creation"
  type        = bool
  default     = false
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Cloud-Init Configuration
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

variable "use_cloud_init" {
  description = "Use cloud-init for instance setup"
  type        = bool
  default     = true
}

variable "cloud_init_script" {
  description = "Path to cloud-init script (relative to terraform directory)"
  type        = string
  default     = "../cloud-init/full-setup.yml"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Tags
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default = {
    "Project"     = "JobTracker"
    "Environment" = "Production"
    "ManagedBy"   = "Terraform"
  }
}
