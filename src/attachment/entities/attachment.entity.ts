import { randomUUID } from 'node:crypto';
import { Auditable } from '../../common/embeddables/auditable.embeddable';
import { Embedded, Entity, Index, OptionalProps, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'attachments' })
@Index({ properties: ['entityType', 'entityId'] })
export class AttachmentEntity {
   [OptionalProps]?: 'id' | 'uuid' | 'checksum' | 'description' | 'metadata';

  @PrimaryKey()
     id!: number;

  @Property({ type: 'string', length: 36, unique: true, onCreate: () => randomUUID() })
     uuid!: string;

  @Property({ length: 80 })
     entityType!: string;

  @Property({ length: 80 })
     entityId!: string;

  @Property({ length: 255 })
     originalFileName!: string;

  @Property({ length: 255, unique: true })
     storageKey!: string;

  @Property({ length: 120 })
     mimeType!: string;

  @Property({ type: 'bigint' })
     fileSize!: number;

  @Property({ length: 64, nullable: true })
     checksum?: string;

  @Property({ type: 'text', nullable: true })
     description?: string;

  @Property({ type: 'json', nullable: true })
     metadata?: Record<string, unknown>;

  @Embedded(() => Auditable, { prefix: false })
     audit!: Auditable;
}


