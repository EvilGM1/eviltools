import { ClassicLevel } from 'classic-level';

const eqDb = new ClassicLevel('C:/Users/hisas/.gemini/antigravity/brain/66a2a09a-40b3-4b98-9728-c8034f3103ef/scratch/equipment', { valueEncoding: 'json' });
await eqDb.open();

let count = 0;
for await (const val of eqDb.values()) {
  if (val.name === 'Reading Ring' || val.name === 'Ghost Touch' || val.name === 'Traveler\'s Chair') {
    console.log(`\n=== ${val.name} ===`);
    console.log('Description:', val.system?.description?.value?.slice(0, 300));
  }
}
await eqDb.close();
