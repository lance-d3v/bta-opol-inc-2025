FROM php:8.3-apache

# Install PostgreSQL driver, Node.js, and dependencies
RUN apt-get update && apt-get install -y libpq-dev unzip curl \
    && docker-php-ext-install pdo pdo_pgsql pgsql \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Enable Apache rewrite rules and set public folder as root
RUN a2enmod rewrite
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy your application files
WORKDIR /var/www/html
COPY . .

# Install dependencies and compile Inertia (React/Vue)
RUN composer install --no-dev --optimize-autoloader
RUN npm install
RUN npm run build

# Set Laravel folder permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache