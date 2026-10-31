FROM php:8.3-apache

# --------------------------------------------------
# 1. Install system dependencies + PostgreSQL + Chrome
# --------------------------------------------------
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    ca-certificates \
    fonts-liberation \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc-s1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
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
# 1b. Install Node.js 22 LTS + npm + npx
# --------------------------------------------------
COPY --from=node:22 /usr/local/bin/node /usr/local/bin/node
COPY --from=node:22 /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/npm

RUN ln -sf /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -sf /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx \
    && node --version \
    && npm --version \
    && npx --version

# --------------------------------------------------
# 2. Configure Puppeteer browser cache
# --------------------------------------------------
ENV PUPPETEER_CACHE_DIR=/var/www/.cache/puppeteer

RUN mkdir -p /var/www/.cache/puppeteer

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
RUN PUPPETEER_SKIP_DOWNLOAD=true npm ci

# --------------------------------------------------
# 10. Install Puppeteer Chrome Headless Shell
# --------------------------------------------------
RUN ./node_modules/.bin/puppeteer browsers install chrome-headless-shell

# --------------------------------------------------
# 11. Verify Puppeteer browser installation
# --------------------------------------------------
RUN ./node_modules/.bin/puppeteer browsers list

# --------------------------------------------------
# 12. Make browser cache accessible to Apache
# --------------------------------------------------
RUN chown -R www-data:www-data /var/www/.cache

# --------------------------------------------------
# 13. Build Vite production assets
# --------------------------------------------------
RUN npm run build

# --------------------------------------------------
# 14. Configure Apache to use Laravel /public
# --------------------------------------------------
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

RUN sed -ri \
    -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
    /etc/apache2/sites-available/000-default.conf \
    /etc/apache2/apache2.conf

# --------------------------------------------------
# 15. Optimize Laravel for production
# --------------------------------------------------
RUN php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache

# --------------------------------------------------
# 16. Laravel writable directories
# --------------------------------------------------
RUN chown -R www-data:www-data \
    storage \
    bootstrap/cache

# --------------------------------------------------
# 17. Expose HTTP
# --------------------------------------------------
EXPOSE 80

# --------------------------------------------------
# 18. Start application
# --------------------------------------------------
COPY docker/start.sh /usr/local/bin/start.sh

RUN chmod +x /usr/local/bin/start.sh

CMD ["/usr/local/bin/start.sh"]