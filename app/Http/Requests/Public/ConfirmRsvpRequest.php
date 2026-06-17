<?php

namespace App\Http\Requests\Public;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmRsvpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'invite_token' => ['nullable', 'required_without:email', 'string', 'max:120'],
            'name' => ['nullable', 'string', 'max:160'],
            'email' => ['nullable', 'required_without:invite_token', 'email:rfc', 'max:255'],
            'status' => ['required', 'in:accepted,declined'],
            'companions' => ['required', 'integer', 'min:0', 'max:20'],
            'message' => ['nullable', 'string', 'max:1000'],
            'answers' => ['nullable', 'array'],
        ];
    }
}
