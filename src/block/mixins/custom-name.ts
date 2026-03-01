import { HasEntityData } from '../has-entity-data.js';
import { NbtString } from '../../nbt/nbt-string.js';

export class CustomName extends HasEntityData {
    customName(): string | undefined {
        return this.entityData.findChild<NbtString>('CustomName')?.data;
    }
}
