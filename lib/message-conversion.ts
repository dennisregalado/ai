import type { UIChat } from '@/lib/types/uiChat';
import type { DBMessage, Chat } from '@/lib/db/types';
import type { ChatMessage, UiToolName } from './ai/types';
import type { ModelId } from './ai/model-id';

// Helper functions for type conversion
export function dbChatToUIChat(chat: Chat): UIChat {
  return {
    id: chat.id,
    createdAt: chat.created_at,
    updatedAt: chat.updated_at,
    title: chat.title,
    visibility: chat.visibility,
    userId: chat.user_id,
    isPinned: chat.is_pinned,
  };
}

export function dbMessageToChatMessage(message: DBMessage): ChatMessage {
  return {
    id: message.id,
    parts: message.parts as ChatMessage['parts'],
    role: message.role as ChatMessage['role'],
    metadata: {
      createdAt: message.created_at,
      isPartial: message.is_partial,
      parentMessageId: message.parent_message_id,
      selectedModel: (message.selected_model as ModelId) || ('' as ModelId),
      selectedTool: (message.selected_tool as UiToolName | null) || undefined,
    },
  };
}

export function chatMessageToDbMessage(
  message: ChatMessage,
  chatId: string,
): DBMessage {
  const parentMessageId = message.metadata.parentMessageId || null;
  const isPartial = message.metadata.isPartial || false;
  const selectedModel = message.metadata.selectedModel;

  return {
    id: message.id,
    chat_id: chatId,
    role: message.role,
    parts: message.parts,
    attachments: [],
    created_at: message.metadata?.createdAt || new Date().toISOString(),
    annotations: [],
    is_partial: isPartial,
    parent_message_id: parentMessageId,
    selected_model: selectedModel,
    selected_tool: message.metadata?.selectedTool || null,
  };
}
