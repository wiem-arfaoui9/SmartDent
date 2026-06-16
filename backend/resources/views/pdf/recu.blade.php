<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; color: #1e293b; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
        .logo { font-size: 24px; font-weight: 800; color: #2563eb; }
        .logo span { color: #0f172a; }
        .title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
        .meta { font-size: 12px; color: #64748b; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
        th { background: #f1f5f9; font-weight: 600; color: #475569; text-transform: uppercase; font-size: 11px; }
        .total { text-align: right; font-size: 16px; font-weight: 800; color: #2563eb; margin-top: 16px; }
        .footer { margin-top: 60px; font-size: 11px; color: #94a3b8; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">Smart<span>Dent</span></div>
        <div style="text-align:right;">
            <div class="title">Reçu de paiement</div>
            <div class="meta">N° {{ $paiement->id }} — {{ $paiement->created_at->format('d/m/Y') }}</div>
        </div>
    </div>

    <p><strong>Patient :</strong> {{ $patient->prenom }} {{ $patient->nom }}</p>
    <p><strong>Téléphone :</strong> {{ $patient->telephone }}</p>

    <table>
        <thead>
            <tr><th>Description</th><th>Mode de paiement</th><th>Statut</th><th>Montant</th></tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ $paiement->description ?? 'Prestation médicale' }}</td>
                <td>{{ ucfirst($paiement->mode_paiement) }}</td>
                <td>{{ $paiement->statut === 'paye' ? 'Payé' : 'En attente' }}</td>
                <td>{{ number_format($paiement->montant, 2) }} DT</td>
            </tr>
        </tbody>
    </table>

    <div class="total">Total : {{ number_format($paiement->montant, 2) }} DT</div>

    <div class="footer">SmartDent — Cabinet Dentaire · Document généré automatiquement le {{ now()->format('d/m/Y H:i') }}</div>
</body>
</html>
