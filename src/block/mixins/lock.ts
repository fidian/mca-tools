import { HasEntityData } from '../has-entity-data.js';
import { NbtString } from '../../nbt/nbt-string.js';

export class Lock extends HasEntityData {
    lock(): string | undefined {
        return this.entityData.findChild<NbtString>('Lock')?.data;
    }
}
