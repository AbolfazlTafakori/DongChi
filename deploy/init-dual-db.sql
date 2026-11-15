-- ==============================================================================
-- DongChi Dual-Database Auto-Initialization Script
-- Runs on PostgreSQL container first boot to ensure isolated databases exist
-- ==============================================================================

-- 1. Create Admins Database if not exists
SELECT 'CREATE DATABASE dongchi_admins_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'dongchi_admins_db')\gexec

-- 2. Grant full permissions to application user
GRANT ALL PRIVILEGES ON DATABASE dongchi_admins_db TO dongchi_app;
