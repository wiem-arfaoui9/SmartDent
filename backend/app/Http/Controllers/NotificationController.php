<?php

namespace App\Http\Controllers;

use App\Models\NotificationHistory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = NotificationHistory::latest();

        if ($request->user()->hasRole('patient')) {
            $query->where('patient_id', $request->user()->patient->id ?? null);
        } else {
            $query->where(function ($q) use ($request) {
                $q->where('user_id', $request->user()->id)
                  ->orWhereNull('user_id');
            });
        }

        if ($request->has('unread') && $request->unread) {
            $query->where('lu', false);
        }

        return response()->json($query->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id'    => 'nullable|exists:users,id',
            'patient_id' => 'nullable|exists:patients,id',
            'type'       => 'required|in:rappel_rdv,confirmation_rdv,annulation_rdv,facture,relance_paiement,planning,autre',
            'canal'      => 'in:email,sms,interne',
            'titre'      => 'required|string|max:255',
            'contenu'    => 'nullable|string',
        ]);

        $data['canal'] = $data['canal'] ?? 'interne';
        $data['envoye_le'] = now();

        $notif = NotificationHistory::create($data);

        return response()->json($notif, 201);
    }

    public function markRead(int $id): JsonResponse
    {
        $notif = NotificationHistory::findOrFail($id);
        $notif->update(['lu' => true]);
        return response()->json($notif);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $query = NotificationHistory::where('lu', false);

        if ($request->user()->hasRole('patient')) {
            $query->where('patient_id', $request->user()->patient->id ?? null);
        } else {
            $query->where('user_id', $request->user()->id);
        }

        $query->update(['lu' => true]);

        return response()->json(['message' => 'Toutes les notifications marquées comme lues.']);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $query = NotificationHistory::where('lu', false);

        if ($request->user()->hasRole('patient')) {
            $query->where('patient_id', $request->user()->patient->id ?? null);
        } else {
            $query->where('user_id', $request->user()->id);
        }

        return response()->json(['count' => $query->count()]);
    }
}
