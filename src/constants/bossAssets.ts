import { EnemyDefinition } from '@/types';
import { getHash } from '@/utils/games';

export const BOSS_ASSET_BANK = [
    { sprite: 'GoldStatue', intro: 'The Gold Statue stirs. "There can be only ONE instance of me!"' },
    { sprite: 'Monk', intro: 'The Monk raises his hand. "I delegate creation to my disciples!"' },
    { sprite: 'Sultan', intro: 'The Sultan commands his court. "My factory produces entire families!"' },
    { sprite: 'Caveman', intro: 'The Caveman growls. "Me build complex object... step by step!"' },
    { sprite: 'Spirit', intro: 'The Spirit flickers and splits. "I clone myself rather than be created anew!"' },
    { sprite: 'RobotGrey', intro: 'The Robot buzzes. "I convert incompatible interfaces. Resistance is futile!"' },
    { sprite: 'Knight', intro: 'The Knight stands firm. "Abstraction and implementation shall vary independently!"' },
    { sprite: 'GreenPig', intro: 'The Pig snorts. "Treat me as one or as many — I am the tree and its leaves!"' },
    { sprite: 'Vampire', intro: 'The Vampire grins. "I wrap you in new behaviour... without changing your class!"' },
    { sprite: 'Noble', intro: 'The Noble bows. "I present a simple face. The complexity behind me is none of your concern."' },
    { sprite: 'NinjaGray', intro: 'The gray ninja flickers — a hundred of him at once. "We share state to save memory!"' },
    { sprite: 'NinjaMasked', intro: 'The masked figure steps forward. "I am the surrogate. You deal with me, not the real object."' },
    { sprite: 'SamuraiRed', intro: 'The samurai draws his blade. "Every order is an object. I can queue them, log them... undo them!"' },
    { sprite: 'Shaman', intro: 'The shaman raises his staff. "All communication flows through me. None speak directly to each other!"' },
    { sprite: 'Tengu', intro: 'The tengu unfurls a scroll. "I hold the snapshot of your state. Undo is my power!"' },
    { sprite: 'NinjaMageBlack', intro: 'The black ninja observes silently. "I watch and react to changes in state. I am the Observer."' },
    { sprite: 'DemonGreen', intro: 'The demon shifts form. "My behaviour changes with my internal state. I am never the same twice!"' },
    { sprite: 'NinjaDark', intro: 'The dark ninja vanishes and reappears. "I swap my algorithm at runtime. Predict me if you can!"' },
    { sprite: 'Master', intro: 'The master stands unmoved. "The skeleton of the algorithm is mine. Only the steps are yours to fill."' },
    { sprite: 'SorcererBlack', intro: 'The sorcerer gestures. "I separate the algorithm from the structure it operates on. Nothing is safe from my visit!"' },
];

export const getBossDefinition = (patternName: string, zone: string): EnemyDefinition => {
    const index = getHash(patternName) % BOSS_ASSET_BANK.length;
    const asset = BOSS_ASSET_BANK[index];

    return {
        patternName: patternName,
        sprite: asset.sprite,
        zone: zone,
        battleIntro: asset.intro,
    };
};

export const getRandomBossAsset = (): string => {
    const randomNumber = Math.floor(Math.random() * BOSS_ASSET_BANK.length) + 1;
    const asset = BOSS_ASSET_BANK[randomNumber % BOSS_ASSET_BANK.length];
    return asset.sprite;
}