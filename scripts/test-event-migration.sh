#!/bin/bash
# Script to safely test the Event system migration on a staging database

set -e  # Exit immediately on error
set -u  # Error on unset variables

# Bold text
bold=$(tput bold)
normal=$(tput sgr0)

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - change these as needed
STAGING_DB="wns_community_staging"
BACKUP_FILE="wns_staging_backup_$(date +%Y%m%d_%H%M%S).sql"
MIGRATION_FILE="./prisma/migrations/event_pricing_amenities_coorganizers.sql"

# Functions
function log_info() {
    echo -e "${BLUE}INFO:${NC} $1"
}

function log_success() {
    echo -e "${GREEN}SUCCESS:${NC} $1"
}

function log_warning() {
    echo -e "${YELLOW}WARNING:${NC} $1"
}

function log_error() {
    echo -e "${RED}ERROR:${NC} $1"
}

function check_postgres() {
    log_info "Checking PostgreSQL connection..."
    if ! pg_isready -U postgres > /dev/null 2>&1; then
        log_error "PostgreSQL is not running or not accepting connections"
        exit 1
    fi
    log_success "PostgreSQL is ready"
}

function check_database() {
    log_info "Checking if database '$STAGING_DB' exists..."
    if ! psql -U postgres -lqt | cut -d \| -f 1 | grep -qw "$STAGING_DB"; then
        log_error "Database '$STAGING_DB' does not exist"
        log_info "Creating staging database..."
        createdb -U postgres "$STAGING_DB"
        log_success "Created staging database '$STAGING_DB'"
    else
        log_success "Database '$STAGING_DB' exists"
    fi
}

function backup_database() {
    log_info "Backing up database '$STAGING_DB' to '$BACKUP_FILE'..."
    pg_dump -U postgres -d "$STAGING_DB" -f "$BACKUP_FILE"
    log_success "Backup completed: $BACKUP_FILE"
}

function run_migration() {
    log_info "Running migration on '$STAGING_DB'..."
    psql -U postgres -d "$STAGING_DB" -f "$MIGRATION_FILE" 2>&1 | tee migration_log.txt
    
    if grep -i "error" migration_log.txt > /dev/null; then
        log_error "Migration encountered errors, check migration_log.txt for details"
        log_info "Rolling back to backup..."
        psql -U postgres -c "DROP DATABASE IF EXISTS ${STAGING_DB}"
        createdb -U postgres "$STAGING_DB"
        psql -U postgres -d "$STAGING_DB" -f "$BACKUP_FILE"
        log_success "Rolled back to backup"
        exit 1
    else
        log_success "Migration completed successfully"
    fi
}

function validate_migration() {
    log_info "Validating migration..."
    
    # Check if the new columns exist
    COL_COUNT=$(psql -U postgres -d "$STAGING_DB" -t -c "\d \"Event\"" | grep -E "isPaid|price|maxAttendees|highlightedAmenities" | wc -l)
    
    if [ "$COL_COUNT" -lt 4 ]; then
        log_error "Some columns are missing from the Event table"
        exit 1
    fi
    
    # Check if EventOrganizer table exists
    TABLE_EXISTS=$(psql -U postgres -d "$STAGING_DB" -t -c "SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'EventOrganizer')")
    
    if [[ "$TABLE_EXISTS" != *"t"* ]]; then
        log_error "EventOrganizer table does not exist"
        exit 1
    fi
    
    # Check indexes
    IDX_COUNT=$(psql -U postgres -d "$STAGING_DB" -t -c "\di Event_*" | grep -E "isPaid|isSoldOut" | wc -l)
    
    if [ "$IDX_COUNT" -lt 2 ]; then
        log_error "Some indexes are missing"
        exit 1
    fi
    
    log_success "Migration validation passed"
}

# Main script
echo "${bold}===== Event System Migration Test Script =====${normal}"
log_info "Starting migration test process..."

check_postgres
check_database
backup_database
run_migration
validate_migration

log_success "Migration test completed successfully!"
echo ""
echo "${bold}Next steps:${normal}"
echo "1. Review migration_log.txt for any warnings"
echo "2. Run Prisma generate to update the client"
echo "3. Deploy migration to production after thorough testing"

exit 0 