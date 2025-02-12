import { HasEntityData } from '../has-entity-data';
import { NbtString } from '../../nbt/nbt-string';

export class Lock extends HasEntityData {
    lock(): string | undefined {
        return this.entityData.findChild<NbtString>('Lock')?.data;
    }
}
