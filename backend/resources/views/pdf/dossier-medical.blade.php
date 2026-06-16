<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; color: #1e293b; padding: 40px; font-size: 12px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
        .logo { font-size: 24px; font-weight: 800; color: #2563eb; }
        .logo span { color: #0f172a; }
        .title { font-size: 18px; font-weight: 700; color: #0f172a; }
        .meta { font-size: 11px; color: #64748b; }
        .section { margin-top: 20px; }
        .section h3 { font-size: 12px; text-transform: uppercase; color: #2563eb; letter-spacing: 1px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
        th { background: #f8fafc; font-weight: 600; color: #475569; }
        .info-grid { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 8px; }
        .info-item { min-width: 200px; }
        .label { color: #94a3b8; font-size: 10px; text-transform: uppercase; }
        .footer { margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">Smart<span>Dent</span></div>
        <div style="text-align:right;">
            <div class="title">Dossier médical complet</div>
            <div class="meta">{{ $date->format('d/m/Y H:i') }}</div>
        </div>
    </div>

    <div class="info-grid">
        <div class="info-item"><div class="label">Nom complet</div>{{ $patient->prenom }} {{ $patient->nom }}</div>
        <div class="info-item"><div class="label">Date de naissance</div>{{ $patient->date_naissance->format('d/m/Y') }}</div>
        <div class="info-item"><div class="label">Téléphone</div>{{ $patient->telephone }}</div>
        <div class="info-item"><div class="label">Groupe sanguin</div>{{ $patient->groupe_sanguin ?? '—' }}</div>
        <div class="info-item"><div class="label">Allergies</div>{{ $patient->allergies ?? 'Aucune' }}</div>
        <div class="info-item"><div class="label">Antécédents</div>{{ $patient->antecedents ?? 'Aucun' }}</div>
    </div>

    <div class="section">
        <h3>Historique des soins</h3>
        <table>
            <thead><tr><th>Date</th><th>Diagnostic</th><th>Traitement</th><th>Dent</th><th>Médicaments</th></tr></thead>
            <tbody>
                @forelse($patient->dossiersMedicaux as $d)
                <tr>
                    <td>{{ $d->created_at->format('d/m/Y') }}</td>
                    <td>{{ $d->diagnostic }}</td>
                    <td>{{ $d->traitement }}</td>
                    <td>{{ $d->dent_concernee ?? '—' }}</td>
                    <td>{{ $d->medicaments ?? '—' }}</td>
                </tr>
                @empty
                <tr><td colspan="5">Aucun dossier médical enregistré.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="section">
        <h3>Rendez-vous</h3>
        <table>
            <thead><tr><th>Date</th><th>Motif</th><th>Statut</th></tr></thead>
            <tbody>
                @forelse($patient->rendezvous as $r)
                <tr>
                    <td>{{ \Carbon\Carbon::parse($r->date_heure)->format('d/m/Y H:i') }}</td>
                    <td>{{ $r->motif }}</td>
                    <td>{{ ucfirst($r->statut) }}</td>
                </tr>
                @empty
                <tr><td colspan="3">Aucun rendez-vous enregistré.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="section">
        <h3>Historique des paiements</h3>
        <table>
            <thead><tr><th>Date</th><th>Description</th><th>Mode</th><th>Statut</th><th>Montant</th></tr></thead>
            <tbody>
                @forelse($patient->paiements as $p)
                <tr>
                    <td>{{ $p->created_at->format('d/m/Y') }}</td>
                    <td>{{ $p->description ?? '—' }}</td>
                    <td>{{ ucfirst($p->mode_paiement) }}</td>
                    <td>{{ ucfirst($p->statut) }}</td>
                    <td>{{ number_format($p->montant, 2) }} DT</td>
                </tr>
                @empty
                <tr><td colspan="5">Aucun paiement enregistré.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="footer">SmartDent — Document confidentiel généré automatiquement le {{ now()->format('d/m/Y H:i') }}</div>
</body>
</html>
