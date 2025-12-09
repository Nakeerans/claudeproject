# Main Terraform Configuration for Job Tracker OCI Infrastructure
# This creates: VCN, Subnet, Security Lists, Compute Instance, and SSH Keys

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Data Sources
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Get the latest Oracle Linux image
data "oci_core_images" "oracle_linux" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Oracle Linux"
  operating_system_version = var.os_version
  shape                    = var.instance_shape
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

# Get availability domains
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_ocid
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SSH Key Generation (Optional)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "tls_private_key" "instance_ssh_key" {
  count     = var.generate_new_ssh_key ? 1 : 0
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "local_file" "private_key" {
  count           = var.generate_new_ssh_key ? 1 : 0
  content         = tls_private_key.instance_ssh_key[0].private_key_pem
  filename        = "${path.module}/generated-keys/jobtracker_ssh_key.pem"
  file_permission = "0600"
}

resource "local_file" "public_key" {
  count           = var.generate_new_ssh_key ? 1 : 0
  content         = tls_private_key.instance_ssh_key[0].public_key_openssh
  filename        = "${path.module}/generated-keys/jobtracker_ssh_key.pub"
  file_permission = "0644"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GitHub Deploy Key Generation
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "tls_private_key" "github_deploy_key" {
  algorithm = "ED25519"
}

resource "local_file" "github_deploy_private_key" {
  content         = tls_private_key.github_deploy_key.private_key_openssh
  filename        = "${path.module}/generated-keys/github_deploy_key"
  file_permission = "0600"
}

resource "local_file" "github_deploy_public_key" {
  content         = tls_private_key.github_deploy_key.public_key_openssh
  filename        = "${path.module}/generated-keys/github_deploy_key.pub"
  file_permission = "0644"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Virtual Cloud Network (VCN)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "oci_core_vcn" "jobtracker_vcn" {
  compartment_id = var.compartment_ocid
  display_name   = "${var.instance_name}-vcn"
  cidr_blocks    = [var.vcn_cidr_block]
  dns_label      = "jobtracker"

  freeform_tags = var.tags
}

# Internet Gateway
resource "oci_core_internet_gateway" "jobtracker_igw" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.jobtracker_vcn.id
  display_name   = "${var.instance_name}-igw"
  enabled        = true

  freeform_tags = var.tags
}

# Route Table
resource "oci_core_route_table" "jobtracker_rt" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.jobtracker_vcn.id
  display_name   = "${var.instance_name}-rt"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.jobtracker_igw.id
  }

  freeform_tags = var.tags
}

# Security List
resource "oci_core_security_list" "jobtracker_seclist" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.jobtracker_vcn.id
  display_name   = "${var.instance_name}-seclist"

  # Egress Rules - Allow all outbound traffic
  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
    stateless   = false
  }

  # Ingress Rules

  # SSH (22)
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    stateless   = false
    description = "SSH access"

    tcp_options {
      min = 22
      max = 22
    }
  }

  # HTTP (80)
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    stateless   = false
    description = "HTTP access"

    tcp_options {
      min = 80
      max = 80
    }
  }

  # HTTPS (443)
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    stateless   = false
    description = "HTTPS access"

    tcp_options {
      min = 443
      max = 443
    }
  }

  # Application (3000)
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    stateless   = false
    description = "Application access"

    tcp_options {
      min = 3000
      max = 3000
    }
  }

  # ICMP (Ping)
  ingress_security_rules {
    protocol    = "1" # ICMP
    source      = "0.0.0.0/0"
    stateless   = false
    description = "ICMP ping"
  }

  freeform_tags = var.tags
}

# Subnet
resource "oci_core_subnet" "jobtracker_subnet" {
  compartment_id    = var.compartment_ocid
  vcn_id            = oci_core_vcn.jobtracker_vcn.id
  cidr_block        = var.subnet_cidr_block
  display_name      = "${var.instance_name}-subnet"
  dns_label         = "app"
  route_table_id    = oci_core_route_table.jobtracker_rt.id
  security_list_ids = [oci_core_security_list.jobtracker_seclist.id]

  freeform_tags = var.tags
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Cloud-Init Configuration
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

locals {
  # Read cloud-init script if enabled
  cloud_init_content = var.use_cloud_init ? file(var.cloud_init_script) : ""

  # Determine SSH public key to use
  ssh_public_key = var.generate_new_ssh_key ? tls_private_key.instance_ssh_key[0].public_key_openssh : file(var.ssh_public_key_path)

  # Determine image OCID
  image_id = var.instance_image_ocid != "" ? var.instance_image_ocid : data.oci_core_images.oracle_linux.images[0].id
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Compute Instance
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "oci_core_instance" "jobtracker_instance" {
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = var.compartment_ocid
  display_name        = var.instance_name
  shape               = var.instance_shape

  # Shape configuration for Flex shapes
  shape_config {
    ocpus         = var.instance_ocpus
    memory_in_gbs = var.instance_memory_in_gbs
  }

  # Source details
  source_details {
    source_type             = "image"
    source_id               = local.image_id
    boot_volume_size_in_gbs = var.boot_volume_size_in_gbs
  }

  # Network configuration
  create_vnic_details {
    subnet_id        = oci_core_subnet.jobtracker_subnet.id
    assign_public_ip = true
    display_name     = "${var.instance_name}-vnic"
  }

  # Metadata
  metadata = {
    ssh_authorized_keys = local.ssh_public_key
    user_data          = var.use_cloud_init ? base64encode(local.cloud_init_content) : null
  }

  freeform_tags = var.tags

  # Prevent accidental deletion
  lifecycle {
    ignore_changes = [
      source_details[0].source_id, # Ignore image updates
    ]
  }
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Generate GitHub Secrets Configuration File
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "local_file" "github_secrets_config" {
  content = templatefile("${path.module}/templates/github-secrets.tpl", {
    oci_host               = oci_core_instance.jobtracker_instance.public_ip
    oci_user               = "opc"
    production_url         = oci_core_instance.jobtracker_instance.public_ip
    oci_ssh_private_key    = tls_private_key.github_deploy_key.private_key_openssh
  })
  filename        = "${path.module}/outputs/github-secrets.txt"
  file_permission = "0600"

  depends_on = [oci_core_instance.jobtracker_instance]
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Generate Environment File for Application
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "random_password" "jwt_secret" {
  length  = 32
  special = true
}

resource "random_password" "session_secret" {
  length  = 32
  special = true
}

resource "random_password" "db_password" {
  length  = 20
  special = false
}

resource "local_file" "env_config" {
  content = templatefile("${path.module}/templates/env.tpl", {
    db_password        = random_password.db_password.result
    jwt_secret         = random_password.jwt_secret.result
    session_secret     = random_password.session_secret.result
    client_url         = "http://${oci_core_instance.jobtracker_instance.public_ip}"
    anthropic_api_key  = var.anthropic_api_key
  })
  filename        = "${path.module}/outputs/.env.generated"
  file_permission = "0600"

  depends_on = [oci_core_instance.jobtracker_instance]
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Generate Connection Script
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "local_file" "connect_script" {
  content = templatefile("${path.module}/templates/connect.tpl", {
    instance_ip    = oci_core_instance.jobtracker_instance.public_ip
    ssh_key_path   = var.generate_new_ssh_key ? "${path.module}/generated-keys/jobtracker_ssh_key.pem" : var.ssh_public_key_path
    ssh_user       = "opc"
  })
  filename        = "${path.module}/outputs/connect.sh"
  file_permission = "0755"

  depends_on = [oci_core_instance.jobtracker_instance]
}
