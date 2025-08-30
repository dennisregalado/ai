import { tool } from 'ai';
import type { User } from '@supabase/supabase-js';
import { z } from 'zod';
import { getDocumentById } from '@/lib/db/queries';
import type { StreamWriter } from '../types';

interface ReadDocumentProps {
  user: User;
  dataStream: StreamWriter;
}

export const readDocument = ({ user, dataStream }: ReadDocumentProps) =>
  tool({
    description: `Read the contents of a document created earlier in this chat.

Use for:
- Retrieve document text for follow-up analysis or questions

Avoid:
- Documents that were not produced in the current conversation`,
    inputSchema: z.object({
      id: z.string().describe('The ID of the document to read'),
    }),
    execute: async ({ id }) => {
      const document = await getDocumentById({ id });

      if (!document) {
        return {
          error: 'Document not found',
        };
      }

      if (document.user_id !== session.id) {
        return {
          error: 'Unauthorized access to document',
        };
      }

      return {
        id: document.id,
        title: document.title,
        kind: document.kind,
        content: document.content,
        createdAt: document.createdAt,
      };
    },
  });
