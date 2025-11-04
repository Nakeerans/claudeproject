# JobFlow Cloud Deployment Guide

This database setup is **fully cloud-ready** and can be deployed to any major cloud provider. Here's how to migrate to various platforms.

---

## Why This Setup is Cloud-Compatible

✅ **PostgreSQL** - Industry-standard database supported everywhere
✅ **Prisma ORM** - Built for cloud with connection pooling, SSL support
✅ **Environment Variables** - 12-factor app compliant
✅ **Migrations** - Declarative schema, version-controlled
✅ **Connection String** - Universal `DATABASE_URL` format
✅ **SSL Support** - Automatic SSL with `?sslmode=require`
✅ **Connection Pooling** - Built-in with Prisma
✅ **Read Replicas** - Prisma supports multiple database URLs

---

## Cloud Provider Options

### Option 1: Supabase (Recommended - Easiest)

**Pros**: Free tier, PostgreSQL + Auth + Storage, instant setup, great DX
**Pricing**: Free up to 500MB, then $25/month

#### Setup:

1. **Create Supabase Project**
   ```bash
   # Visit: https://supabase.com/dashboard
   # Click "New Project"
   # Choose region, database password
   ```

2. **Get Connection String**
   ```
   Go to Settings > Database > Connection String
   Copy the "URI" (not the "Connection pooling")
   ```

3. **Update Environment Variables**
   ```bash
   # packages/database/.env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   ```

4. **Run Migrations**
   ```bash
   cd packages/database
   npm run migrate:deploy
   ```

5. **Test Connection**
   ```bash
   npm run studio
   # Opens Prisma Studio connected to Supabase
   ```

**Supabase-Specific Benefits**:
- Automatic backups
- Real-time subscriptions (if needed later)
- Built-in authentication (can replace NextAuth)
- File storage for resumes/documents
- REST API auto-generated from schema

---

### Option 2: Neon (Serverless PostgreSQL)

**Pros**: Serverless, autoscaling, generous free tier, branching (like Git for databases)
**Pricing**: Free up to 3GB, then pay-as-you-go

#### Setup:

1. **Create Neon Project**
   ```bash
   # Visit: https://neon.tech
   # Sign up and create project
   ```

2. **Get Connection String**
   ```
   Dashboard shows connection string automatically
   Format: postgresql://[user]:[password]@[host]/[database]?sslmode=require
   ```

3. **Update Environment**
   ```bash
   DATABASE_URL="postgresql://neondb_owner:...@ep-...aws.neon.tech/neondb?sslmode=require"
   ```

4. **Run Migrations**
   ```bash
   cd packages/database
   npm run migrate:deploy
   ```

**Neon-Specific Benefits**:
- Database branching (dev/staging/prod)
- Scale to zero (saves money)
- Instant provisioning
- Point-in-time recovery

---

### Option 3: Railway

**Pros**: Simple deployment, Git-based, PostgreSQL included, auto-deploys
**Pricing**: $5/month credit free, then usage-based

#### Setup:

1. **Create Railway Project**
   ```bash
   # Visit: https://railway.app
   # Click "New Project" > "Provision PostgreSQL"
   ```

2. **Get Database URL**
   ```
   Click on PostgreSQL service
   Go to "Connect" tab
   Copy DATABASE_URL
   ```

3. **Update Environment**
   ```bash
   # Railway provides DATABASE_URL automatically if deployed there
   # For external access:
   DATABASE_URL="postgresql://postgres:...@containers-us-west-xx.railway.app:5432/railway"
   ```

4. **Deploy Entire App** (Optional)
   ```bash
   # Railway can deploy your entire monorepo
   railway link
   railway up
   ```

**Railway-Specific Benefits**:
- Deploy backend + database together
- Automatic HTTPS
- Preview environments per PR
- Simple pricing

---

### Option 4: Vercel Postgres (with Vercel Deployment)

**Pros**: Perfect if deploying Next.js to Vercel, integrated experience
**Pricing**: Free up to 256MB, then $20/month

#### Setup:

1. **Add Vercel Postgres**
   ```bash
   # In Vercel dashboard:
   # Project > Storage > Create Database > Postgres
   ```

2. **Environment Variables**
   ```
   Vercel automatically sets:
   - POSTGRES_URL
   - POSTGRES_PRISMA_URL (use this for Prisma)
   - POSTGRES_URL_NON_POOLING (use for migrations)
   ```

3. **Update prisma/schema.prisma**
   ```prisma
   datasource db {
     provider = "postgresql"
     url = env("POSTGRES_PRISMA_URL") // uses connection pooling
     directUrl = env("POSTGRES_URL_NON_POOLING") // used for migrations
   }
   ```

4. **Deploy**
   ```bash
   vercel --prod
   # Migrations run automatically via build script
   ```

**Vercel-Specific Benefits**:
- Zero-config integration with Next.js
- Edge functions support
- Global CDN for static assets
- Automatic preview deployments

---

### Option 5: AWS RDS (Enterprise-Grade)

**Pros**: Full control, VPC security, multi-AZ, read replicas
**Pricing**: ~$15/month for smallest instance

#### Setup:

1. **Create RDS Instance**
   ```bash
   # AWS Console > RDS > Create Database
   # Choose: PostgreSQL
   # Template: Free tier (or your choice)
   # Instance: db.t3.micro
   # Storage: 20GB
   # Enable: Automated backups, monitoring
   ```

2. **Configure Security Group**
   ```
   # Allow inbound PostgreSQL (port 5432) from:
   # - Your IP (for development)
   # - Your application's security group
   ```

3. **Get Endpoint**
   ```
   RDS Console > Databases > [Your DB] > Connectivity & security
   Endpoint: mydb.xxxxx.us-east-1.rds.amazonaws.com
   ```

4. **Update Environment**
   ```bash
   DATABASE_URL="postgresql://postgres:[PASSWORD]@mydb.xxxxx.us-east-1.rds.amazonaws.com:5432/jobflow?sslmode=require"
   ```

**AWS-Specific Benefits**:
- Enterprise-grade reliability
- Multi-AZ failover
- Read replicas for scaling
- CloudWatch monitoring
- Automated backups
- Point-in-time recovery

---

### Option 6: Google Cloud SQL

**Pros**: Managed PostgreSQL, automatic backups, high availability
**Pricing**: Similar to AWS RDS

#### Setup:

1. **Create Cloud SQL Instance**
   ```bash
   gcloud sql instances create jobflow-db \
     --database-version=POSTGRES_15 \
     --tier=db-f1-micro \
     --region=us-central1
   ```

2. **Create Database**
   ```bash
   gcloud sql databases create jobflow --instance=jobflow-db
   ```

3. **Create User**
   ```bash
   gcloud sql users create jobflow-user \
     --instance=jobflow-db \
     --password=[YOUR-PASSWORD]
   ```

4. **Get Connection String**
   ```bash
   DATABASE_URL="postgresql://jobflow-user:[PASSWORD]@[PUBLIC-IP]:5432/jobflow?sslmode=require"
   ```

---

## Migration Checklist

### Before Migration:

- [ ] Backup local database
  ```bash
  pg_dump jobflow > backup.sql
  ```

- [ ] Test migrations locally
  ```bash
  cd packages/database
  npm run migrate:deploy
  ```

- [ ] Document all environment variables needed

### During Migration:

- [ ] Create cloud database
- [ ] Update DATABASE_URL in environment
- [ ] Run migrations on cloud database
  ```bash
  npm run migrate:deploy
  ```
- [ ] Verify schema with Prisma Studio
  ```bash
  npm run studio
  ```
- [ ] Seed initial data if needed
  ```bash
  npm run db:seed
  ```

### After Migration:

- [ ] Test application connectivity
- [ ] Set up automated backups
- [ ] Configure monitoring/alerts
- [ ] Document connection strings (securely)
- [ ] Set up staging environment
- [ ] Configure connection pooling if needed

---

## Connection String Formats

### Standard PostgreSQL
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

### With SSL (Required for most cloud providers)
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
```

### With Connection Pooling (Vercel, Supabase)
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?pgbouncer=true
```

### With Multiple Options
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require&connect_timeout=10&pool_timeout=10
```

---

## Schema Migration in Production

### Safe Migration Process:

1. **Review Migration**
   ```bash
   cd packages/database
   npx prisma migrate diff \
     --from-schema-datamodel prisma/schema.prisma \
     --to-schema-database $DATABASE_URL
   ```

2. **Create Migration**
   ```bash
   npx prisma migrate dev --name add_new_feature
   ```

3. **Test in Staging**
   ```bash
   DATABASE_URL=$STAGING_DATABASE_URL npm run migrate:deploy
   ```

4. **Deploy to Production**
   ```bash
   DATABASE_URL=$PRODUCTION_DATABASE_URL npm run migrate:deploy
   ```

### Rollback Strategy:

Prisma migrations are in `packages/database/prisma/migrations/`

To rollback:
```bash
# Option 1: Reset database (dev only!)
npm run migrate:reset

# Option 2: Manual rollback (production)
# 1. Run the down.sql from the migration folder manually
# 2. Delete the migration from _prisma_migrations table
```

---

## Performance Optimization for Cloud

### 1. Connection Pooling

**With PgBouncer** (Recommended for serverless):
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // Pooled connection
  directUrl = env("DIRECT_DATABASE_URL") // Direct for migrations
}
```

**Environment**:
```bash
DATABASE_URL="postgresql://user:pass@host:6543/db?pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://user:pass@host:5432/db"
```

### 2. Query Optimization

Add indexes for common queries:
```prisma
model Application {
  @@index([userId, status])
  @@index([createdAt])
}

model Recording {
  @@index([userId, domain])
}
```

### 3. Connection Limits

```javascript
// packages/database/index.ts
new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: ['error', 'warn'],
  errorFormat: 'minimal',
})
```

---

## Cost Optimization

### Free Tier Options:

| Provider | Free Tier | Limit |
|----------|-----------|-------|
| Supabase | ✅ Yes | 500MB, 2GB transfer |
| Neon | ✅ Yes | 3GB storage |
| Railway | ✅ $5 credit | ~1 month |
| Vercel Postgres | ✅ Yes | 256MB |
| AWS RDS | ✅ Yes (12 months) | db.t3.micro |

### Cost-Saving Tips:

1. **Start with Supabase or Neon free tier**
2. **Use connection pooling** (reduces database load)
3. **Add indexes** (faster queries = less CPU)
4. **Implement caching** (Redis/Upstash for frequently-accessed data)
5. **Use read replicas** only when needed
6. **Monitor query performance** (slow queries cost money)

---

## Recommended Setup for JobFlow

### Development:
```
Local PostgreSQL or Docker
```

### Staging:
```
Supabase (free tier)
or
Neon (database branching)
```

### Production:
```
Option A: Supabase Pro ($25/month)
Option B: Neon Scale ($19/month)
Option C: Railway ($20-30/month for app + db)
Option D: AWS RDS ($15/month minimum)
```

---

## Deployment Workflow

```mermaid
graph TD
    A[Local Development] -->|git push| B[GitHub]
    B -->|Trigger| C[CI/CD]
    C -->|Deploy| D[Staging]
    C -->|Run Tests| E[Tests Pass]
    E -->|Manual Approval| F[Production]
    D -.->|Supabase Staging| G[Staging DB]
    F -.->|Supabase Prod| H[Production DB]
```

### Automated Deployment:

**GitHub Actions** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: cd packages/database && npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      - run: npm run build
      - uses: vercel/actions/deploy@v1
```

---

## Monitoring & Observability

### Database Monitoring:

**Supabase**: Built-in dashboard
**Neon**: Metrics in dashboard
**AWS RDS**: CloudWatch
**Railway**: Metrics tab

### Application Monitoring:

**Recommended Tools**:
- Sentry (errors)
- LogRocket (session replay)
- Datadog (full observability)
- Better Stack (logs)

---

## Security Best Practices

### 1. Environment Variables
✅ Never commit DATABASE_URL
✅ Use different databases for dev/staging/prod
✅ Rotate passwords regularly

### 2. Network Security
✅ Enable SSL (`?sslmode=require`)
✅ Whitelist IP addresses
✅ Use VPC for sensitive data (AWS/GCP)

### 3. Access Control
✅ Use read-only users for reporting
✅ Limit connection pooler access
✅ Enable audit logging

### 4. Data Protection
✅ Enable automatic backups
✅ Test restore procedures
✅ Encrypt sensitive fields

---

## Summary

Your JobFlow database setup is **production-ready** for cloud deployment:

✅ **Works with any cloud provider** (Supabase, Neon, Vercel, AWS, GCP)
✅ **Prisma migrations** handle schema changes safely
✅ **Environment variables** make switching providers easy
✅ **Connection pooling** ready for serverless
✅ **SSL support** for secure connections
✅ **Scalable schema** with proper indexes and relations

**Recommended Path**:
1. Start with **Supabase** free tier (easiest, most features)
2. If you need branching, use **Neon**
3. For full control, use **AWS RDS** or **Google Cloud SQL**
4. If deploying to Vercel, use **Vercel Postgres**

**Next Steps**:
1. Choose a cloud provider
2. Create database
3. Update DATABASE_URL
4. Run `npm run migrate:deploy`
5. Test with `npm run studio`
6. Deploy your application

You're ready for production! 🚀
