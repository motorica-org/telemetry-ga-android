import React, { Component } from 'react';
import {
  AsyncStorage,
  Image,
  StyleSheet,
  Text,
  View,
  ToastAndroid,
} from 'react-native';

import { connect } from 'react-redux';
import Immutable from 'seamless-immutable';

import I18n from './i18n';
import Media from './Media';
import Styles from './Styles';
import Matrix from './Matrix';


const groundLevel = Styles.screenH - 30;


/*
 * Return a reducer that runs the reducer `reductions[action]`, defaulting to
 * `reductions.DEFAULT` if not found.
 */
const defaultReducer = reductions => (state, action, ...rest) =>
  (reductions[action.type] || reductions.DEFAULT)(state, action, ...rest);


/**
 * Bird
 *
 * Bird's (x, y) is position of its center
 */

const BIRD_FREQ = 1.2;
const BIRD_AMP = Styles.screenH * (3 / 5);

const GHOST = false;

const birdReduce = defaultReducer({
  START() {
    return Immutable({
      time: 0,
      alive: true,
      x: Styles.screenW / 5,
      y: groundLevel / 2,
      w: 128,
      h: 200,
      vx: 100,
      vy: 0,
      ay: 700,
      ax: 7,
      tickCount: 0,
    });
  },

  TICK({ splash, bird, pipes: { pipes }, score }, { dt }, dispatch) {
    let die = false;
    if (bird.alive) {
      // Screen borders
      // top
      if (bird.y - (bird.h / 2) < 0) {
        return bird.merge({
          y: bird.h / 2,
          vy: 0,
          ay: -bird.ay * (bird.vx / 100 / 2),
        });
      }
      // bottom
      if (bird.y + (bird.h / 2) > groundLevel) {
        return bird.merge({
          y: groundLevel - (bird.h / 2),
          vy: 0,
          ay: bird.ay,
        });
      }

      if (!GHOST && pipes.some(({ x, y, w, bottom }) => (
        x + w > bird.x - (bird.w / 2) &&
        x < bird.x + (bird.w / 2) &&
        (bottom ?
         bird.y + (bird.h / 2) > y :
         bird.y - (bird.h / 2) < y)
      ))) {
        die = true;
      }
    } else if (bird.y > groundLevel + 400 || bird.y < 0) {
        Matrix.sendMessage('motorica-org.mechanical.v1.platformerscore',
        {
          body: `Platformer score: ${score}`,
          timestamp: Date.now(),
          power: Math.trunc(score),
        }).done();
      AsyncStorage.getItem('platformerscore')
        .then(JSON.parse)
        .then(x => Array.isArray(x) ? x : [])
        .then(x => x.concat([Math.trunc(score)]))
        .then(JSON.stringify)
        .then(x => AsyncStorage.setItem('platformerscore', x))
        .done();
      ToastAndroid.show(`Score: ${Math.trunc(score)}`, ToastAndroid.SHORT);
      dispatch({ type: 'START' });
    }

    let vy = bird.vy;
    if (GHOST || splash) {
      vy = BIRD_AMP * Math.sin(BIRD_FREQ * Math.PI * bird.time);
    } else if (die) {
      vy = -150;
    } else {
      vy += bird.ay * dt;
    }

    return bird.merge({
      time: bird.time + dt,
      alive: bird.alive && !die,
      y: bird.y + bird.vy * dt,
      x: bird.alive ? bird.x : bird.x - 0.5 * bird.vx * dt,
      vx: splash ? bird.vx : Math.max(0, bird.vx + bird.ax * dt),
      vy,
      ax: (die ?
           Math.min(-bird.vx / 2, -0.25 * bird.vx * bird.vx / (bird.x - bird.w)) :
           bird.ax),
      ay: die ? 700 : bird.ay,
      tickCount: bird.tickCount > 10 ? 0 : bird.tickCount + 1,
    });
  },

  TOUCH({ bird }) {
    return bird.merge({
      ay: -280 * (1 + bird.ax / 100),
    });
  },

  DEFAULT({ bird }) {
    return bird;
  },
});

const birdRunImgs = [
  require('./img/platformer/run1.svg.png'),
  require('./img/platformer/run2.svg.png'),
  require('./img/platformer/run3.svg.png'),
  require('./img/platformer/run4.svg.png'),
  require('./img/platformer/run5.svg.png'),
  require('./img/platformer/run6.svg.png'),
];

const birdJumpImgs = [
  require('./img/platformer/jump2.svg.png'),
  require('./img/platformer/jump3.svg.png'),
  require('./img/platformer/jump4.svg.png'),
];

const Bird = connect(
  ({ bird }) => bird,
)(
  ({ x, y, w, h, tickCount }) => {
    const nearBorder = (epsilon) => y + h / 2 - groundLevel > -epsilon;
    const img = ((tick, nearBorder) => {
      if (!nearBorder(100)) { return birdJumpImgs[2]; }
      if (!nearBorder(60)) { return birdJumpImgs[1]; }
      if (!nearBorder(10)) { return birdJumpImgs[0]; }
      return birdRunImgs[Math.floor(tick / 2)];
    })(tickCount, nearBorder);
    return (
      <Image
        key="bird-image"
        style={{ position: 'absolute',
          // Convert vertical position (i.e. `y` + account for `h`) => -1..1
          left: x - w / 2,
          top: y - h / 2,
          width: w,
          height: h,
          backgroundColor: 'transparent' }}
        source={img}
      />
    );
  },
);


/**
 * Pipes
 *
 * A pipe's (x, y) is where the left corner of its 'surface' is (bottom edge for
 * top-pipe, top edge for bottom-pipe)
 */

const defaultPipe = {
  x: Styles.screenW + 2,
  y: -2,
  w: 60,
  h: 60,
  bottom: false,
};

const pipeImgs = [
  'box.png',
];

const pickPipeImg = () =>
  pipeImgs[Math.floor(pipeImgs.length * Math.random())];

const pipesReduce = defaultReducer({
  START() {
    return Immutable({
      cursor: 100,
      cursorDir: Math.random() < 0.5,
      cursorFlipTime: Math.random(),
      distance: 300,
      pipes: [],
    });
  },

  TICK({ splash, bird, pipes }, { dt }, dispatch) {
    if (splash) {
      return pipes;
    }

    if (pipes.distance < 0) {
      dispatch({ type: 'ADD_PIPES' });
    }

    const cursorV = Math.random() * (pipes.cursorDir ? 1 : -1) * 220;
    let cursorDir;
    if (pipes.cursor < 40) {
      cursorDir = true;
    } else if (pipes.cursor > groundLevel - 340) {
      cursorDir = false;
    } else {
      cursorDir = (pipes.cursorFlipTime < 0 ?
                   !pipes.cursorDir :
                   pipes.cursorDir);
    }

    return pipes.merge({
      cursor: (pipes.cursor + cursorV * dt),
      cursorFlipTime: (pipes.cursorFlipTime < 0 ?
                       2.2 * Math.random() :
                       pipes.cursorFlipTime - dt),
      cursorDir,

      distance: (pipes.distance < 0 ?
                 360 * Math.random() + 400 :
                 pipes.distance - bird.vx * dt),
      pipes: pipes.pipes.map(pipe => pipe.merge({
        x: pipe.x - bird.vx * dt,
      })).filter(pipe => pipe.x + pipe.w > 0),
    });
  },

  ADD_PIPES({ pipes }) {
    const bottom = true;
    return pipes.merge({
      pipes: pipes.pipes.concat([
        // Makes sense for non-scalable objects (as in boxes and not f.i. pipes).
        { ...defaultPipe, y: bottom ? groundLevel - 60 : 60, bottom, img: pickPipeImg() }, // FIXME: hardcoded height
      ]),
    });
  },

  DEFAULT({ pipes }) {
    return pipes;
  },
});

// Ensure a constant-ish number of components by rendering extra
// off-screen pipes
const maxNumPipes = pipeImgs.reduce((o, img) => ({ ...o, [img]: 10 }), {});
const Pipes = connect(
  ({ pipes: { cursor, pipes } }) => Immutable({ cursor, pipes }),
)(
  ({ pipes }) => {
    const pipesByImg = {};
    pipeImgs.forEach(img => pipesByImg[img] = []);
    pipes.forEach(pipe => pipesByImg[pipe.img].push(pipe));
    pipeImgs.forEach((img) => {
      const extraPipe = { ...defaultPipe, img };
      maxNumPipes[img] = Math.max(maxNumPipes[img], pipesByImg[img].length);
      while (pipesByImg[img].length < maxNumPipes[img]) {
        pipesByImg[img].push(extraPipe);
      }
    });
    const elems = [];
    pipeImgs.forEach((img) => {
      pipesByImg[img].forEach(({ x, y, w, h, bottom, img }, i) => {
        elems.push(
          <Image
            key={`pipe-image-${img}-${i}`}
            style={{ position: 'absolute',
              left: x,
              top: bottom ? y : y - h,
              width: w,
              height: h,
              backgroundColor: 'transparent' }}
            source={Media[img]}
          />,
        );
      });
    });
    return (
      <View
        key="pipes-container"
        style={Styles.container}
      >
        {elems}
      </View>
    );
  },
);


/**
 * Score
 */

const scoreReduce = defaultReducer({
  START() {
    return 0;
  },

  TICK({ splash, score }, { dt }) {
    return splash ? score : score + dt;
  },

  DEFAULT({ score }) {
    return score;
  },
});

const Score = connect(
  ({ splash, score }) => Immutable({ splash, score: Math.floor(score) }),
)(
  ({ splash, score }) => {
    if (splash) {
      return <View>{null}</View>;
    }

    return (
      <View style={styles.scoreContainer}>
        <Text
          key="score-text"
          style={styles.score}
        >
          {score}
        </Text>
      </View>
    );
  },
);


/**
 * Clouds
 */

const cloudImgs = [
  'cloud-1.png',
  'cloud-2.png',
  'cloud-3.png',
  'cloud-4.png',
];

const CLOUD_WIDTH = 283;
const CLOUD_HEIGHT = 142;

const cloudReduce = defaultReducer({
  START() {
    return Immutable({
      clouds: cloudImgs.map(img => ({
        x: Styles.screenW * 3 * Math.random(),
        y: groundLevel * Math.random() - CLOUD_HEIGHT / 2,
        vxFactor: 0.1 + 0.2 * Math.random(),
        img,
      })),
    });
  },

  TICK({ bird, clouds }, { dt }) {
    return clouds.merge({
      clouds: clouds.clouds.map((cloud) => {
        if (cloud.x + CLOUD_WIDTH > 0) {
          return cloud.merge({
            x: cloud.x - cloud.vxFactor * (bird.vx + 65) * dt,
          });
        }
        return cloud.merge({
          x: Styles.screenW * (1 + Math.random()),
          y: groundLevel * Math.random() - CLOUD_HEIGHT / 2,
          vxFactor: 0.2 + 0.2 * Math.random(),
        });
      }),
    });
  },

  DEFAULT({ clouds }) {
    return clouds;
  },
});

const Clouds = connect(
  ({ clouds: { clouds } }) => Immutable({ clouds }),
)(
  ({ clouds }) => (
    <View
      key="clouds-container"
      style={Styles.container}
    >
      {
          clouds.asMutable().map(({ x, y, img }) => (
            <Image
              key={`cloud-image-${img}`}
              style={{ position: 'absolute',
                left: x,
                top: y,
                width: CLOUD_WIDTH,
                height: CLOUD_HEIGHT,
                backgroundColor: 'transparent' }}
              source={Media[img]}
            />
          ))
        }
    </View>
    ),
);


/**
 * Splash
 */

const Splash = connect(
  ({ splash }) => Immutable({ splash }),
)(
  ({ splash }) =>
    !splash ?
      <View key="splash-empty" /> :
      <View
        key="splash-image"
        style={{
          flex: 1,
          position: 'absolute',
          left: 0,
          top: 0,
          width: Styles.screenW,
          height: Styles.screenH / 2,
          marginTop: 15,
          alignItems: 'center',
        }}
      >
        <Image
          style={{
            flex: 1,
          }}
          resizeMode="contain"
          source={Media['splash.png']}
        />
        <Text
          style={{
            flex: 1,
            fontSize: 36,
          }}
        >
          { I18n.t('flex_to_play') }
        </Text>
      </View>
,
);


const Background = () =>
  <Image
    style={{
      flex: 1,
      width: null,
      height: null,
    }}
    resizeMode="cover"
    source={Media['background.png']}
  />;


/**
 * End of game score screen
 */
const ScoreScreen = connect(
  ({ score, dispatch }) => Immutable({ score: Math.floor(score), dispatch }),
)(
  ({ score, dispatch }) =>
      <View
        style={{
          flex: 1,
          position: 'absolute',
          left: 0,
          top: 0,
          width: Styles.screenW,
          height: Styles.screenH / 2,
          marginTop: 15,
          alignItems: 'center',
        }}
      >
    <Button onPress={() => dispatch({ type: 'START' })}>{score}</Button>
        <Text
          style={{
            flex: 1,
            fontSize: 36,
          }}
        >
          { I18n.t('flex_to_play') }
        </Text>
      </View>
);


/**
 * Rewind
 */

const Rewind = connect(
  ({ reverse }) => Immutable({ reverse }),
)(
  ({ reverse }) => {
    if (!reverse) {
      return <View key="rewind-empty">{null}</View>;
    }

    const w = 36;
    const h = 36;
    return (
      <Image
        key="rewind-image"
        style={{ position: 'absolute',
          left: (Styles.screenW - 30 - w),
          top: 42,
          width: w,
          height: h,
          backgroundColor: '#f00' }}
        source={Media['rewind.png']}
      />
    );
  },
);


/**
 * Fluxpy
 */

const sceneReduce = (state = Immutable({}), action, dispatch) => {
  let newState = state.merge({ parent: state });

  switch (action.type) {
    case 'START':
      // No parent when re-starting
      newState = Immutable({
        splash: true,
      });
      break;

    case 'TICK':
      // If in reverse mode, abort and return the parent (also in reverse mode)
      if (state.reverse) {
        if (!state.parent) {
          return state;
        }
        return state.parent.merge({ reverse: true });
      }
      break;

    case 'TOUCH':
      newState = newState.merge({
        splash: null,
        // reverse: !state.bird.alive,
      });
      break;
  }

  return newState.merge({
    bird: birdReduce(state, action, dispatch),
    pipes: pipesReduce(state, action, dispatch),
    score: scoreReduce(state, action, dispatch),
    clouds: cloudReduce(state, action, dispatch),
  });
};

const Scene = () => (
  <View
    key="scene-container"
    style={[Styles.container]}
  >
    <Background />
    <Pipes />
    <Clouds />
    <Bird />
    <Score />
    <Rewind />
    <Splash />
  </View>
);


const styles = StyleSheet.create({
  scoreContainer: {
    position: 'absolute',
    top: 42,
    left: 30,
    paddingRight: 2,
    paddingLeft: 5,
    paddingTop: 2,
    backgroundColor: '#363029',
  },
  score: {
    color: '#fcfaf8',
    fontSize: 33,
    fontFamily: '04b_19',
    backgroundColor: 'transparent',
    margin: -1,
  },
});

export {
  sceneReduce,
  Scene,
};
