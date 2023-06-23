/*
    LittleJS Breakout Example
*/

'use strict';

let levelSize, ball, paddle, score, brickCount;

// sound effects
const sound_start  = new Sound([,0,500,,.04,.3,1,2,,,570,.02,.02,,,,.04]);
const sound_break  = new Sound([,,90,,.01,.03,4,,,,,,,9,50,.2,,.2,.01], 0);
const sound_bounce = new Sound([,,1e3,,.03,.02,1,2,,,940,.03,,,,,.2,.6,,.06], 0);

///////////////////////////////////////////////////////////////////////////////
function gameInit()
{
    canvasFixedSize = vec2(1280, 720); // 720p
    levelSize = vec2(72, 40);
    cameraPos = levelSize.scale(.5);
    paddle = new Paddle(vec2(levelSize.x/2-12,2));
    score = brickCount = 0;

    // spawn bricks
    const pos = vec2();
    for (pos.x = 6; pos.x <= levelSize.x-6; pos.x += 4)
    for (pos.y = levelSize.y/2; pos.y <= levelSize.y-4; pos.y += 2)
        new Brick(pos);

    initPostProcess(); // set up a post processing shader
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate()
{
    // spawn ball
    if (!ball && (mouseWasPressed(0) || gamepadWasPressed(0)))
    {
        ball = new Ball(vec2(levelSize.x/2, levelSize.y/2-6));
        sound_start.play();
    }
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost()
{

}

///////////////////////////////////////////////////////////////////////////////
function gameRender()
{
    // draw a the background
    drawRect(cameraPos, levelSize.scale(2), new Color(.4,.4,.4));
    drawRect(cameraPos, levelSize, new Color(.1,.1,.1));
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost()
{
    // use built in image font for text
    const font = new FontImage;
    font.drawText('Score: ' + score, cameraPos.add(vec2(0,22)), .2, 1);
    if (!brickCount)
        font.drawText('You Win!', cameraPos.add(vec2(0,-5)), .25, 1);
    else if (!ball)
        font.drawText('Click to Play', cameraPos.add(vec2(0,-5)), .25, 1);
}

///////////////////////////////////////////////////////////////////////////////
// an example shader that can be used to apply a post processing effect
function initPostProcess()
{
    const televisionShader = `
    // Simple TV Shader Code
    float hash(vec2 p)
    {
        p=fract(p*.3197);
        return fract(1.+sin(51.*p.x+73.*p.y)*13753.3);
    }
    float noise(vec2 p)
    {
        vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+1.),u.x),u.y);
    }
    void mainImage(out vec4 c, vec2 p)
    {
        p /= iResolution.xy;

        // apply fuzz as horizontal offset
        const float fuzz = .001;
        const float fuzzScale = 800.;
        p.x += fuzz*(noise(vec2(p.y*fuzzScale, iTime*9.))*2.-1.);

        // init output color
        c = texture2D(iChannel0, p);

        // chromatic aberration
        const float chromatic = .003;
        c.r = texture2D(iChannel0, p - vec2(chromatic, 0)).r;
        c.b = texture2D(iChannel0, p + vec2(chromatic, 0)).b;

        // tv static noise
        const float staticNoise = .1;
        const float staticNoiseScale = 1931.7;
        c += staticNoise * hash(vec2(p*staticNoiseScale+mod(iTime*1e4,7777.)));

        // scan lines
        const float scanlineScale = 800.;
        const float scanlineAlpha = .1;
        c *= 1. + scanlineAlpha*sin(p.y*scanlineScale);

        // black vignette around the outside
        const float vignette = 2.;
        float dx = 2.*p.x - 1., dy = 2.*p.y - 1.;
        c *= 1.-pow((dx*dx + dy*dy)/vignette, 6.);
    }`;
    glInitPostProcess(televisionShader);
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, 'tiles.png');