import { TextureLoader, NearestFilter, RepeatWrapping } from 'three';

import dirtImg from './dirt.jpg';
import grassImg from './grass.png';
import glassImg from './glass.png';
import logImg from './log.jpg';
import woodImg from './wood.png';

const dirtTexture = new TextureLoader().load(dirtImg);
const grassTexture = new TextureLoader().load(grassImg);
const glassTexture = new TextureLoader().load(glassImg);
const logTexture = new TextureLoader().load(logImg);
const woodTexture = new TextureLoader().load(woodImg);

const textures = [dirtTexture, grassTexture, glassTexture, logTexture, woodTexture];

textures.forEach(texture => {
    texture.magFilter = NearestFilter;
    texture.minFilter = NearestFilter;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
});

export const images = {
    dirt: dirtTexture,
    grass: grassTexture,
    glass: glassTexture,
    wood: woodTexture,
    log: logTexture,
};
