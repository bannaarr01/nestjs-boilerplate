import { Embeddable, OptionalProps, Property } from '@mikro-orm/core';

@Embeddable()
export class Auditable {
   [OptionalProps]?: 'createdBy' | 'updatedAt' | 'updatedBy' | 'deletedAt' | 'deletedBy';

  @Property({ onCreate: () => new Date() })
     createdAt: Date = new Date();

  @Property({ length: 120, nullable: true })
     createdBy?: string;

  @Property({ onUpdate: () => new Date(), nullable: true })
     updatedAt?: Date;

  @Property({ length: 120, nullable: true })
     updatedBy?: string;

  @Property({ nullable: true })
     deletedAt?: Date;

  @Property({ length: 120, nullable: true })
     deletedBy?: string;

  constructor(createdBy?: string) {
     if (createdBy) {
        this.createdBy = createdBy;
     }
  }
}



