<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ConversationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Conversation::with(['patient', 'lastMessage']);

        // Patient connecté ne voit que ses conversations
        if ($request->user()->hasRole('patient')) {
            $query->where('patient_id', $request->user()->patient->id ?? null);
        } elseif ($request->patient_id) {
            $query->where('patient_id', $request->patient_id);
        }

        return response()->json($query->latest()->paginate(15));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'sujet'      => 'nullable|string|max:255',
            'message'    => 'required|string',
        ]);

        $conversation = Conversation::create([
            'patient_id' => $data['patient_id'],
            'sujet'      => $data['sujet'] ?? 'Nouvelle conversation',
        ]);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id'       => auth()->id(),
            'contenu'         => $data['message'],
        ]);

        return response()->json($conversation->load('messages'), 201);
    }

    public function show(Conversation $conversation): JsonResponse
    {
        return response()->json($conversation->load(['messages.sender', 'patient']));
    }

    public function sendMessage(Request $request, Conversation $conversation): JsonResponse
    {
        $data = $request->validate(['contenu' => 'required|string']);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id'       => auth()->id(),
            'contenu'         => $data['contenu'],
        ]);

        $conversation->touch();

        return response()->json($message->load('sender'), 201);
    }

    public function markRead(Conversation $conversation): JsonResponse
    {
        $conversation->messages()
            ->where('sender_id', '!=', auth()->id())
            ->update(['lu' => true]);

        return response()->json(['message' => 'Conversation marquée comme lue.']);
    }

    public function close(Conversation $conversation): JsonResponse
    {
        $conversation->update(['statut' => 'fermee']);
        return response()->json($conversation);
    }
}
