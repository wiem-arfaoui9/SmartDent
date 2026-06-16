<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; color: #1e293b; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
        .logo { font-size: 24px; font-weight: 800; color: #2563eb; }
        .logo span { color: #0f172a; }
        .title { font-size: 18px; font-weight: 700; color: #0f172a; }
        .meta { font-size: 12px; color: #64748b; }
        .section { margin-top: 24px; }
        .section h3 { font-size: 13px; text-transform: uppercase; color: #2563eb; letter-spacing: 1px; margin-bottom: 8px; }
        .content { font-size: 14px; line-height: 1.7; border-left: 3px solid #e2e8f0; padding-left: 16px; }
        .signature { margin-top: 80px; text-align: right; font-size: 13px; }
        .footer { margin-top: 60px; font-size: 11px; color: #94a3b8; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">Smart<span>Dent</span></div>
        <div style="text-align:right;">
            <div class="title">Ordonnance médicale</div>
            <div class="meta">{{ $date->format('d/m/Y') }}</div>
        </div>
    </div>

    <p><strong>Patient :</strong> {{ $patient->prenom }} {{ $patient->nom }}</p>
    <p><strong>Date de naissance :</strong> {{ $patient->date_naissance->format('d/m/Y') }}</p>

    <div class="section">
        <h3>Médicaments prescrits</h3>
        <div class="content">{{ $medicaments }}</div>
    </div>

    @if($instructions)
    <div class="section">
        <h3>Instructions</h3>
        <div class="content">{{ $instructions }}</div>
    </div>
    @endif

    <div class="signature">
        <p>Dr. {{ $dentiste->name }}</p>
        <p style="color:#94a3b8;">Signature</p>
    </div>

    <div class="footer">SmartDent — Cabinet Dentaire · Document généré automatiquement le {{ now()->format('d/m/Y H:i') }}</div>
</body>
</html>
