#!/bin/bash

set -e

echo "======================================"
echo "BTA School System"
echo "Starting production container"
echo "======================================"

echo "Clearing optimization caches for migration..."
php artisan config:clear
php artisan route:clear

# -------------------------------------------------------
# PRODUCTION/CONTINUES DEPLOYMENT
# -------------------------------------------------------
echo "Running migration..."
php artisan migrate --force
# --------------------------------------------------------

# --------------------------------------------------------
# FRESH DEPLOY / RESET ALL
# --------------------------------------------------------
# echo "Running storage wipe and fresh..."
# php artisan storage:fresh

# echo "Running migration wipe and fresh..."
# php artisan migrate:fresh --seed --force
# --------------------------------------------------------

echo "Re-caching configurations..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Resetting storage permissions..."
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

echo "Starting Apache..."
exec apache2-foreground
