import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { del } from '@vercel/blob';
import type { 
  User, 
  Chat, 
  Message, 
  Vote, 
  Document, 
  Suggestion,
  UserInsert,
  ChatInsert,
  MessageInsert,
  VoteInsert,
  DocumentInsert,
  SuggestionInsert,
  DBMessage 
} from './types';
import type { ArtifactKind } from '../artifacts/artifact-kind';
import type { Attachment } from '@/lib/ai/types';

// User operations
export async function getUserByEmail(email: string): Promise<User[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get user from database', error);
    throw error;
  }
}

export async function createUser({
  email,
  name,
  image,
}: {
  email: string;
  name: string | null;
  image: string | null;
}) {
  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        name,
        image,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to create user in database', error);
    throw error;
  }
}

export async function getUserById({ userId }: { userId: string }): Promise<User | undefined> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // No rows returned
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Failed to get user by id from database', error);
    throw error;
  }
}

// Chat operations
export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('chats')
      .insert({
        id,
        user_id: userId,
        title,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to save chat in database', error);
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    const supabase = await createClient();
    
    // Get all messages for this chat to clean up their attachments
    const { data: messagesToDelete } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', id);

    // Clean up attachments before deleting the chat (which will cascade delete messages)
    if (messagesToDelete && messagesToDelete.length > 0) {
      await deleteAttachmentsFromMessages(messagesToDelete);
    }

    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Failed to delete chat by id from database', error);
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', id)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get chats by user from database', error);
    throw error;
  }
}

export async function tryGetChatById({ id }: { id: string }) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    return data;
  } catch (error) {
    return null;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to get chat by id from database', error);
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('chats')
      .update({ visibility })
      .eq('id', chatId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to update chat visibility in database', error);
    throw error;
  }
}

export async function updateChatTitleById({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('chats')
      .update({ title })
      .eq('id', chatId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to update chat title by id from database', error);
    throw error;
  }
}

export async function updateChatIsPinnedById({
  chatId,
  isPinned,
}: {
  chatId: string;
  isPinned: boolean;
}) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('chats')
      .update({ is_pinned: isPinned })
      .eq('id', chatId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to update chat isPinned by id from database', error);
    throw error;
  }
}

export async function updateChatUpdatedAt({
  chatId,
}: {
  chatId: string;
}) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to update chat updatedAt by id from database', error);
    throw error;
  }
}

// Message operations
export async function saveMessage({
  _message,
}: {
  _message: DBMessage;
}) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('messages')
      .insert({
        id: _message.id,
        chat_id: _message.chat_id,
        parent_message_id: _message.parent_message_id,
        role: _message.role,
        parts: _message.parts,
        attachments: _message.attachments,
        created_at: _message.created_at,
        annotations: _message.annotations,
        is_partial: _message.is_partial,
        selected_model: _message.selected_model,
        selected_tool: _message.selected_tool,
      })
      .select()
      .single();

    if (error) throw error;

    // Update chat's updatedAt timestamp
    await updateChatUpdatedAt({ chatId: _message.chat_id });

    return data;
  } catch (error) {
    console.error('Failed to save message in database', error);
    throw error;
  }
}

export async function saveMessages({
  _messages,
}: {
  _messages: DBMessage[];
}) {
  try {
    if (_messages.length === 0) {
      return;
    }
    
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('messages')
      .insert(_messages.map(msg => ({
        id: msg.id,
        chat_id: msg.chat_id,
        parent_message_id: msg.parent_message_id,
        role: msg.role,
        parts: msg.parts,
        attachments: msg.attachments,
        created_at: msg.created_at,
        annotations: msg.annotations,
        is_partial: msg.is_partial,
        selected_model: msg.selected_model,
        selected_tool: msg.selected_tool,
      })))
      .select();

    if (error) throw error;

    // Update chat's updatedAt timestamp for all affected chats
    const uniqueChatIds = [...new Set(_messages.map((msg) => msg.chat_id))];
    await Promise.all(
      uniqueChatIds.map((chatId) => updateChatUpdatedAt({ chatId })),
    );

    return data;
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function updateMessage({
  _message,
}: {
  _message: DBMessage;
}) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('messages')
      .update({
        parts: _message.parts,
        annotations: _message.annotations,
        attachments: _message.attachments,
        created_at: _message.created_at,
        is_partial: _message.is_partial,
        parent_message_id: _message.parent_message_id,
      })
      .eq('id', _message.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to update message in database', error);
    throw error;
  }
}

export async function getAllMessagesByChatId({ chatId }: { chatId: string }) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get all messages by chat ID', error);
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', id);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get message by id from database', error);
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const supabase = await createClient();
    
    const { data: messagesToDelete } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .gte('created_at', timestamp.toISOString());

    if (messagesToDelete && messagesToDelete.length > 0) {
      const messageIds = messagesToDelete.map((message) => message.id);

      // Clean up attachments before deleting messages
      await deleteAttachmentsFromMessages(messagesToDelete);

      // Delete votes first
      await supabase
        .from('votes')
        .delete()
        .eq('chat_id', chatId)
        .in('message_id', messageIds);

      // Delete messages
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('chat_id', chatId)
        .in('id', messageIds);
      
      if (error) throw error;
    }
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
      error
    );
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterMessageId({
  chatId,
  messageId,
}: {
  chatId: string;
  messageId: string;
}) {
  try {
    const supabase = await createClient();
    
    // First, get the target message to find its position in the chat
    const { data: targetMessage } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .eq('chat_id', chatId)
      .single();

    if (!targetMessage) {
      throw new Error('Target message not found');
    }

    // Get all messages in the chat ordered by creation time
    const { data: allMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (!allMessages) return;

    // Find the index of the target message
    const targetIndex = allMessages.findIndex((msg) => msg.id === messageId);

    if (targetIndex === -1) {
      throw new Error('Target message not found in chat');
    }

    // Delete all messages after the target message (including the target itself)
    const messagesToDelete = allMessages.slice(targetIndex);
    const messageIdsToDelete = messagesToDelete.map((msg) => msg.id);

    if (messageIdsToDelete.length > 0) {
      // Clean up attachments before deleting messages
      await deleteAttachmentsFromMessages(messagesToDelete);

      // Delete the messages (votes will be deleted automatically via CASCADE)
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('chat_id', chatId)
        .in('id', messageIdsToDelete);
      
      if (error) throw error;
    }
  } catch (error) {
    console.error(
      'Failed to delete messages by chat id after message id from database',
      error
    );
    throw error;
  }
}

// Vote operations
export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const supabase = await createClient();
    
    // Check if vote exists
    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('message_id', messageId)
      .eq('chat_id', chatId)
      .single();

    if (existingVote) {
      // Update existing vote
      const { data, error } = await supabase
        .from('votes')
        .update({ is_upvoted: type === 'up' })
        .eq('message_id', messageId)
        .eq('chat_id', chatId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // Create new vote
      const { data, error } = await supabase
        .from('votes')
        .insert({
          chat_id: chatId,
          message_id: messageId,
          is_upvoted: type === 'up',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Failed to vote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('chat_id', id);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

// Document operations
export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
  messageId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
  messageId: string;
}) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('documents')
      .insert({
        id,
        title,
        kind,
        content,
        user_id: userId,
        message_id: messageId,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to save document in database', error);
    throw error;
  }
}

export async function getDocumentsById({
  id,
  userId,
}: {
  id: string;
  userId?: string;
}) {
  try {
    const supabase = await createClient();
    
    // First, get the document and check ownership
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .order('created_at', { ascending: true });

    if (!documents || documents.length === 0) return [];

    const [doc] = documents;

    if (!userId || doc.user_id !== userId) {
      // Need to check if chat is public
      const { data: documentsWithVisibility } = await supabase
        .from('documents')
        .select(`
          *,
          messages!inner(
            chat_id,
            chats!inner(visibility)
          )
        `)
        .eq('id', id)
        .eq('messages.chats.visibility', 'public')
        .order('created_at', { ascending: true });

      return documentsWithVisibility || [];
    }

    return documents;
  } catch (error) {
    console.error(
      'Failed to get documents by id with visibility from database',
      error
    );
    throw error;
  }
}

export async function getPublicDocumentsById({ id }: { id: string }) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        messages!inner(
          chat_id,
          chats!inner(visibility)
        )
      `)
      .eq('id', id)
      .eq('messages.chats.visibility', 'public')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get public documents by id from database', error);
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to get document by id from database', error);
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    const supabase = await createClient();
    
    // Delete suggestions first
    await supabase
      .from('suggestions')
      .delete()
      .eq('document_id', id)
      .gt('document_created_at', timestamp.toISOString());

    // Delete documents
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .gt('created_at', timestamp.toISOString());
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
      error
    );
    throw error;
  }
}

export async function getDocumentsByMessageIds({
  messageIds,
}: {
  messageIds: string[];
}) {
  if (messageIds.length === 0) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .in('message_id', messageIds)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get documents by message IDs from database', error);
    throw error;
  }
}

export async function saveDocuments({
  documents,
}: {
  documents: Array<{
    id: string;
    title: string;
    kind: ArtifactKind;
    content: string | null;
    userId: string;
    messageId: string;
    createdAt: Date;
  }>;
}) {
  if (documents.length === 0) return;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('documents')
      .insert(documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        kind: doc.kind,
        content: doc.content,
        user_id: doc.userId,
        message_id: doc.messageId,
        created_at: doc.createdAt.toISOString(),
      })))
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to save documents in database', error);
    throw error;
  }
}

// Suggestion operations
export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('suggestions')
      .insert(suggestions.map(s => ({
        id: s.id,
        document_id: s.document_id,
        document_created_at: s.document_created_at,
        original_text: s.original_text,
        suggested_text: s.suggested_text,
        description: s.description,
        is_resolved: s.is_resolved,
        user_id: s.user_id,
        created_at: s.created_at,
      })))
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to save suggestions in database', error);
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('suggestions')
      .select('*')
      .eq('document_id', documentId);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
      error
    );
    throw error;
  }
}

// Attachment operations
export async function getMessagesWithAttachments() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('messages')
      .select('attachments');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(
      'Failed to get messages with attachments from database',
      error,
    );
    throw error;
  }
}

export async function getAllAttachmentUrls(): Promise<string[]> {
  try {
    const messages = await getMessagesWithAttachments();

    const attachmentUrls: string[] = [];

    for (const msg of messages) {
      if (msg.attachments && Array.isArray(msg.attachments)) {
        const attachments = msg.attachments as Attachment[];
        for (const attachment of attachments) {
          if (attachment.url) {
            attachmentUrls.push(attachment.url);
          }
        }
      }
    }

    return attachmentUrls;
  } catch (error) {
    console.error('Failed to get attachment URLs from database', error);
    throw error;
  }
}

async function deleteAttachmentsFromMessages(messages: DBMessage[]) {
  try {
    const attachmentUrls: string[] = [];

    for (const msg of messages) {
      if (msg.attachments && Array.isArray(msg.attachments)) {
        const attachments = msg.attachments as Attachment[];
        for (const attachment of attachments) {
          if (attachment.url) {
            attachmentUrls.push(attachment.url);
          }
        }
      }
    }

    if (attachmentUrls.length > 0) {
      await del(attachmentUrls);
    }
  } catch (error) {
    console.error('Failed to delete attachments from Vercel Blob:', error);
    // Don't throw here - we still want to proceed with message deletion
    // even if blob cleanup fails
  }
}