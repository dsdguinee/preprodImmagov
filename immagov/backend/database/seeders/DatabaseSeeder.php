<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\RolePrivilege;
use App\Models\roles_permissions;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        // \App\Models\User::factory(10)->create();
//        Menu::factory()->count(8)->sequence(['nom' => 'Tableau de bord'],['nom' => 'Nouvelle immatriculation'],['nom' => 'Mutations'],
//            ['nom' => 'Immatriculations'],['nom' => 'Reformes'],['nom' => 'Cartes grises'],['nom' => 'Ministères'],['nom' => 'Utilisateurs'])
//            ->create();
//        RolePrivilege::factory()->count(7)
//            ->sequence(['role_id' => 3,'privilege_id' => 1],['role_id' => 3,'privilege_id' => 5],['role_id' => 3,'privilege_id' => 16],['role_id' => 3,'privilege_id' => 17]
//                ,['role_id' => 3,'privilege_id' => 18],['role_id' => 3,'privilege_id' => 19],['role_id' => 3,'privilege_id' => 21],
//                )->create();;
//        RolePrivilege::factory()->count(1)
//            ->sequence(['role_id' => 2,'privilege_id' => 21]
//            )->create();;
    }
}
