FROM php:8.3-apache

# --------------------------------------------------
# 1. Install system dependencies + PostgreSQL
# --------------------------------------------------
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    ca-certificates \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    && docker-php-ext-install \
        pdo \
        pdo_pgsql \
        mbstring \
        zip \
        exif \
        pcntl \
        bcmath \
        gd \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# --------------------------------------------------
# 2. Install Node.js 22 LTS + npm + npx
# --------------------------------------------------
COPY --from=node:22 /usr/local/bin/node /usr/local/bin/node
COPY --from=node:22 /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/npm

RUN ln -sf /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -sf /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx \
    && node --version \
    && npm --version \
    && npx --version

# --------------------------------------------------
# 3. Enable Apache rewrite
# --------------------------------------------------
RUN a2enmod rewrite

# --------------------------------------------------
# 4. Install Composer
# --------------------------------------------------
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# --------------------------------------------------
# 5. Set working directory
# --------------------------------------------------
WORKDIR /var/www/html

# --------------------------------------------------
# 6. Copy Laravel application
# --------------------------------------------------
COPY . .

# --------------------------------------------------
# 7. Ensure Vite HMR is not used in production
# --------------------------------------------------
RUN rm -f public/hot

# --------------------------------------------------
# 8. Install PHP dependencies
# --------------------------------------------------
RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction \
    --prefer-dist

# --------------------------------------------------
# 9. Install JavaScript dependencies
# --------------------------------------------------
RUN npm ci

# --------------------------------------------------
# 10. Build Vite production assets
# --------------------------------------------------
RUN npm run build

# --------------------------------------------------
# 11. Configure Apache to use Laravel /public
# --------------------------------------------------
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

RUN sed -ri \
    -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
    /etc/apache2/sites-available/000-default.conf \
    /etc/apache2/apache2.conf

# --------------------------------------------------
# 12. Optimize Laravel for production
# --------------------------------------------------
RUN php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache

# --------------------------------------------------
# 13. Laravel writable directories
# --------------------------------------------------
RUN chown -R www-data:www-data \
    storage \
    bootstrap/cache

# --------------------------------------------------
# 14. Expose HTTP
# --------------------------------------------------
EXPOSE 80

# --------------------------------------------------
# 15. Start application
# --------------------------------------------------
COPY docker/start.sh /usr/local/bin/start.sh

RUN chmod +x /usr/local/bin/start.sh

CMD ["/usr/local/bin/start.sh"]