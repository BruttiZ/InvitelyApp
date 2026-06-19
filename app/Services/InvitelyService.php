<?php

namespace App\Services;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Http;
use InvalidArgumentException;

final class InvitelyService
{
    /**
     * @param  array<string, mixed>  $query
     * @param  array<string, mixed>  $json
     */
    public function send(string $method, string $path, array $query = [], array $json = [], ?string $authorization = null): Response
    {
        $baseUrl = $this->baseUrl();

        if (! $this->isValidBaseUrl($baseUrl)) {
            throw new InvalidArgumentException('invitely_api_url_invalid');
        }

        $request = Http::timeout($this->timeout())
            ->acceptJson()
            ->withHeaders($this->headers($authorization));

        $options = ['query' => $query];

        if (in_array(strtoupper($method), ['POST', 'PUT', 'PATCH'], true)) {
            $options['json'] = $json;
        }

        return $request->send(strtoupper($method), "{$baseUrl}/{$path}", $options);
    }

    public function baseUrl(): string
    {
        return rtrim((string) config('services.invitely.base_url'), '/');
    }

    public function isConfigured(): bool
    {
        return $this->baseUrl() !== '';
    }

    private function timeout(): int
    {
        return (int) config('services.invitely.timeout', 30);
    }

    /**
     * @return array<string, string>
     */
    private function headers(?string $authorization): array
    {
        $headers = [];
        $apiKey = config('services.invitely.api_key');

        if (is_string($authorization) && $authorization !== '') {
            $headers['Authorization'] = $authorization;
        }

        if (is_string($apiKey) && $apiKey !== '') {
            $headers['x-api-key'] = $apiKey;
        }

        return $headers;
    }

    private function isValidBaseUrl(string $baseUrl): bool
    {
        $host = parse_url($baseUrl, PHP_URL_HOST);
        $scheme = parse_url($baseUrl, PHP_URL_SCHEME);

        if (! is_string($host) || $host === '' || ! is_string($scheme)) {
            return false;
        }

        if (! in_array($scheme, ['http', 'https'], true)) {
            return false;
        }

        if (App::isProduction()) {
            return $scheme === 'https'
                && ! in_array($host, ['localhost', '127.0.0.1', '0.0.0.0'], true);
        }

        return true;
    }
}
