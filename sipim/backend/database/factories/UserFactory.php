<?php

namespace Database\Factories;

use App\Models\Agence;
use App\Models\Commune;
use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        $dir = "/public/images/face";
        $all = Storage::allFiles($dir,['jpg','jpeg','png']);
        $profile_photo = $all[array_rand($all)];
        return [
            'nom' => $this->faker->lastName,
            'prenom' => $this->faker->firstName,
            'email' => $this->faker->unique()->safeEmail(),
            'agence_id' => Agence::all()->random()->agence_id,
            'telephone' => $this->faker->phoneNumber(),
            'role_id' => Role::all()->random()->role_id,
            'commune_id' => Commune::all()->random()->commune_id,
            'photo' => str_replace('public/','',$profile_photo),
            'email_verified_at' => now(),
            'password' =>  Hash::make('12345'), // 12345
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory
     */
    public function unverified()
    {
        return $this->state(function (array $attributes) {
            return [
                'email_verified_at' => null,
            ];
        });
    }
}
