import { codeDocumentHandler } from '@/lib/artifacts/code/server';
import { sheetDocumentHandler } from '@/lib/artifacts/sheet/server';
import { textDocumentHandler } from '@/lib/artifacts/text/server';
import type { Document } from '../db/types';
import { saveDocument } from '../db/supabase-queries';
import type { User } from '@supabase/supabase-js';
import type { ModelId } from '../ai/model-id';
import type { StreamWriter } from '../ai/types';
import type { ArtifactKind } from './artifact-kind';

export interface SaveDocumentProps {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}

export interface CreateDocumentCallbackProps {
  id: string;
  title: string;
  dataStream: StreamWriter;
  user: User;
  description: string;
  prompt: string;
  messageId: string;
  selectedModel: ModelId;
}

export interface UpdateDocumentCallbackProps {
  document: Document;
  description: string;
  dataStream: StreamWriter;
  user: User;
  messageId: string;
  selectedModel: ModelId;
}

export interface DocumentHandler<T = ArtifactKind> {
  kind: T;
  onCreateDocument: (args: CreateDocumentCallbackProps) => Promise<void>;
  onUpdateDocument: (args: UpdateDocumentCallbackProps) => Promise<void>;
}

export function createDocumentHandler<T extends ArtifactKind>(config: {
  kind: T;
  onCreateDocument: (params: CreateDocumentCallbackProps) => Promise<string>;
  onUpdateDocument: (params: UpdateDocumentCallbackProps) => Promise<string>;
}): DocumentHandler<T> {
  return {
    kind: config.kind,
    onCreateDocument: async (args: CreateDocumentCallbackProps) => {
      const draftContent = await config.onCreateDocument(args);

      if (args.session?.user?.id) {
        await saveDocument({
          id: args.id,
          title: args.title,
          content: draftContent,
          kind: config.kind,
          userId: args.user.id,
          messageId: args.messageId,
        });
      }

      return;
    },
    onUpdateDocument: async (args: UpdateDocumentCallbackProps) => {
      const draftContent = await config.onUpdateDocument(args);

      if (args.session?.user?.id) {
        await saveDocument({
          id: args.document.id,
          title: args.document.title,
          content: draftContent,
          kind: config.kind,
          userId: args.user.id,
          messageId: args.messageId,
        });
      }

      return;
    },
  };
}

/*
 * Use this array to define the document handlers for each artifact kind.
 */
export const documentHandlersByArtifactKind: Array<DocumentHandler> = [
  textDocumentHandler,
  codeDocumentHandler,
  sheetDocumentHandler,
];
