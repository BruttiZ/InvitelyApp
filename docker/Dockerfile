FROM node:22-alpine AS frontend

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY resources ./resources
COPY public ./public
COPY components.json tsconfig.json vite.config.js ./
RUN npm run build

FROM php:8.4-fpm-alpine AS app

WORKDIR /var/www/html

RUN apk add --no-cache \
    bash \
    git \
    icu-dev \
    libpng-dev \
    libzip-dev \
    postgresql-dev \
    unzip \
    zip \
    $PHPIZE_DEPS \
    && docker-php-ext-install bcmath intl opcache pdo_pgsql zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del $PHPIZE_DEPS

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock ./
RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-scripts

COPY . .
COPY --from=frontend /app/public/build ./public/build
COPY Docker/entrypoint.sh /usr/local/bin/invitely-entrypoint

RUN chmod +x /usr/local/bin/invitely-entrypoint \
    && rm -f bootstrap/cache/*.php \
    && composer dump-autoload --optimize \
    && chown -R www-data:www-data storage bootstrap/cache

ENTRYPOINT ["invitely-entrypoint"]
CMD ["php-fpm"]
