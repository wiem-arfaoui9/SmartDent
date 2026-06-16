<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Patient;
use App\Models\Employe;
use App\Models\Rendezvous;
use App\Models\Paiement;
use App\Models\SchemaDentaire;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\NotificationHistory;
use App\Http\Controllers\SchemaDentaireController;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Rôles ──
        $roles = ['admin', 'dentiste', 'secretaire', 'patient'];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        // ── Permissions ──
        $permissions = [
            'manage-patients', 'view-patients',
            'manage-rendezvous', 'view-rendezvous',
            'manage-dossiers', 'view-dossiers',
            'manage-paiements', 'view-paiements',
            'manage-employes', 'view-dashboard',
            'manage-schema-dentaire', 'manage-documents',
            'manage-messages', 'manage-conges',
        ];
        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm]);
        }

        Role::findByName('admin')->givePermissionTo(Permission::all());
        Role::findByName('dentiste')->givePermissionTo([
            'view-patients','manage-rendezvous','manage-dossiers','view-dashboard',
            'manage-schema-dentaire','manage-documents','manage-messages',
        ]);
        Role::findByName('secretaire')->givePermissionTo([
            'manage-patients','manage-rendezvous','manage-paiements','view-dashboard',
            'manage-documents','manage-conges',
        ]);
        Role::findByName('patient')->givePermissionTo(['view-rendezvous','view-dossiers','manage-messages']);

        // ── Utilisateurs staff ──
        $admin = User::firstOrCreate(['email' => 'admin@smartdent.com'], [
            'name' => 'Admin SmartDent', 'password' => Hash::make('password'),
        ]);
        $admin->assignRole('admin');

        $dentiste = User::firstOrCreate(['email' => 'dentiste@smartdent.com'], [
            'name' => 'Dr. Karim Mansouri', 'password' => Hash::make('password'),
        ]);
        $dentiste->assignRole('dentiste');

        $secretaire = User::firstOrCreate(['email' => 'secretaire@smartdent.com'], [
            'name' => 'Leila Benali', 'password' => Hash::make('password'),
        ]);
        $secretaire->assignRole('secretaire');

        // ── Employés ──
        Employe::firstOrCreate(['email' => 'dentiste@smartdent.com'], [
            'user_id' => $dentiste->id,
            'nom' => 'Mansouri', 'prenom' => 'Karim',
            'telephone' => '+216 71 000 001',
            'poste' => 'dentiste', 'specialite' => 'Orthodontie',
            'date_embauche' => '2020-01-15', 'salaire' => 4500,
        ]);

        Employe::firstOrCreate(['email' => 'secretaire@smartdent.com'], [
            'user_id' => $secretaire->id,
            'nom' => 'Benali', 'prenom' => 'Leila',
            'telephone' => '+216 71 000 002',
            'poste' => 'secretaire',
            'date_embauche' => '2021-03-01', 'salaire' => 1800,
        ]);

        // ── Compte patient de démonstration (portail patient) ──
        $patientUser = User::firstOrCreate(['email' => 'patient@smartdent.com'], [
            'name' => 'Mohamed Ben Ali', 'password' => Hash::make('password'),
        ]);
        $patientUser->assignRole('patient');

        // ── Patients ──
        $patientsData = [
            ['nom'=>'Ben Ali','prenom'=>'Mohamed','date_naissance'=>'1985-03-12','sexe'=>'M','telephone'=>'+216 22 111 222','email'=>'m.benali@email.com','groupe_sanguin'=>'A+','cin'=>'12345678','user_id'=>$patientUser->id,'contact_urgence_nom'=>'Salma Ben Ali','contact_urgence_telephone'=>'+216 22 000 111'],
            ['nom'=>'Trabelsi','prenom'=>'Amira','date_naissance'=>'1992-07-25','sexe'=>'F','telephone'=>'+216 55 333 444','email'=>'a.trabelsi@email.com','groupe_sanguin'=>'B+','cin'=>'87654321'],
            ['nom'=>'Chaabane','prenom'=>'Youssef','date_naissance'=>'1978-11-08','sexe'=>'M','telephone'=>'+216 98 555 666','groupe_sanguin'=>'O+','cin'=>'11223344'],
            ['nom'=>'Gharbi','prenom'=>'Sonia','date_naissance'=>'2001-05-19','sexe'=>'F','telephone'=>'+216 20 777 888','groupe_sanguin'=>'AB-'],
            ['nom'=>'Maalej','prenom'=>'Hatem','date_naissance'=>'1965-09-30','sexe'=>'M','telephone'=>'+216 52 999 000','groupe_sanguin'=>'A-','allergies'=>'Pénicilline'],
        ];

        $patients = [];
        foreach ($patientsData as $pd) {
            $patients[] = Patient::firstOrCreate(['telephone' => $pd['telephone']], $pd);
        }

        // ── Rendez-vous & Paiements ──
        $statuts = ['planifie','confirme','termine','annule'];
        $motifs  = ['Détartrage','Extraction','Carie','Blanchiment','Bilan','Orthodontie','Urgence'];
        foreach ($patients as $i => $patient) {
            Rendezvous::create([
                'patient_id'  => $patient->id,
                'dentiste_id' => $dentiste->id,
                'date_heure'  => now()->addDays($i + 1)->setTime(9 + $i, 0),
                'duree'       => 30,
                'motif'       => $motifs[$i % count($motifs)],
                'statut'      => $statuts[$i % count($statuts)],
            ]);

            Paiement::create([
                'patient_id'    => $patient->id,
                'montant'       => rand(50, 500),
                'mode_paiement' => ['especes','carte','mutuelle'][rand(0,2)],
                'statut'        => ['paye','en_attente'][rand(0,1)],
                'description'   => $motifs[$i % count($motifs)],
                'date_paiement' => now()->subDays(rand(1,30)),
            ]);
        }

        // ── Schéma dentaire pour le patient de démo ──
        $patientDemo = $patients[0];
        foreach (SchemaDentaireController::numerosFDI() as $numero) {
            $statut = 'saine';
            if (in_array($numero, [16, 26])) $statut = 'soignee';
            if (in_array($numero, [36]))     $statut = 'a_traiter';
            if (in_array($numero, [18]))     $statut = 'extraite';

            SchemaDentaire::firstOrCreate(
                ['patient_id' => $patientDemo->id, 'numero_dent' => $numero],
                ['statut' => $statut]
            );
        }

        // ── Conversation de démo (messagerie patient <-> cabinet) ──
        $conversation = Conversation::firstOrCreate(
            ['patient_id' => $patientDemo->id, 'sujet' => 'Question sur mon prochain rendez-vous'],
            ['statut' => 'ouverte']
        );
        if ($conversation->messages()->count() === 0) {
            Message::create([
                'conversation_id' => $conversation->id,
                'sender_id'       => $patientUser->id,
                'contenu'         => 'Bonjour, est-il possible de décaler mon rendez-vous de quelques jours ?',
            ]);
            Message::create([
                'conversation_id' => $conversation->id,
                'sender_id'       => $secretaire->id,
                'contenu'         => 'Bonjour, bien sûr ! Je vous propose le créneau du jeudi à 10h, cela vous convient-il ?',
                'lu'              => true,
            ]);
        }

        // ── Notifications de démo ──
        NotificationHistory::firstOrCreate([
            'patient_id' => $patientDemo->id,
            'type'       => 'rappel_rdv',
            'titre'      => 'Rappel de rendez-vous',
        ], [
            'canal'     => 'interne',
            'contenu'   => 'Vous avez un rendez-vous demain à 09:00 avec Dr. Mansouri.',
            'envoye_le' => now(),
        ]);

        NotificationHistory::firstOrCreate([
            'user_id' => $secretaire->id,
            'type'    => 'planning',
            'titre'   => 'Nouveau rendez-vous planifié',
        ], [
            'canal'     => 'interne',
            'contenu'   => 'Un nouveau rendez-vous a été ajouté au planning du Dr. Mansouri.',
            'envoye_le' => now(),
        ]);
    }
}
