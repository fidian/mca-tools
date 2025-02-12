import { CustomName } from './mixins/custom-name';
import { HasEntityData } from './has-entity-data';
import { Lock } from './mixins/lock';
import { Mixin } from './mixins/mixin';
import { NbtString } from '../nbt/nbt-string';

export class Beacon extends Mixin(
    HasEntityData,
    CustomName,
    Lock,
    class extends HasEntityData {
        primaryEffect(): string | undefined {
            return this.entityData.findChild<NbtString>('LootTable')?.data;
        }

        secondaryEffect(): string | undefined {
            return this.entityData.findChild<NbtString>('LootTableSeed')?.data;
        }
    }
) {}
