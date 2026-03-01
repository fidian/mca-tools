import { CustomName } from './mixins/custom-name.js';
import { HasEntityData } from './has-entity-data.js';
import { Lock } from './mixins/lock.js';
import { Mixin } from './mixins/mixin.js';
import { NbtString } from '../nbt/nbt-string.js';

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
