import { CharacterArt } from './CharacterArt';
import { TIER_BY_ID } from '../lib/gameData';

export const HackerArt = ({ type, small = false }) => {
  const tier = TIER_BY_ID[type];
  if (!tier) return <CharacterArt type={type} small={small}/>;
  return <img className={`hacker-art ${small ? 'small' : ''}`} src={tier.image} alt={tier.name} draggable="false" data-testid={`hacker-art-${type}-${small ? 'small' : 'full'}`}/>;
};
