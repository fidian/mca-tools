import { HasEntityData } from './has-entity-data';
import { NbtString } from '../nbt/nbt-string';

export class CustomName extends HasEntityData {
    override readonly type: string = 'CUSTOM_NAME';

    customName(): string | undefined {
        return this.entityData.findChild<NbtString>('CustomName')?.data;
    }
}
