import m from 'mithril'
import {fabric} from 'fabric'

const COLORS = {
  RED: '#D33159',
  BLUE: '#3187D3',
  RED_FADED: '#F7DCE3',
  BLUE_FADED: '#DCEAF7'
}

function updateCanvas (vnode) {
  let {canvas, tool} = vnode.state
  let game = vnode.attrs.game
  canvas.clear()
  let canEdit = vnode.attrs.game.currentPlayer === vnode.state.viewingPlayer
  canvas.isDrawingMode = canEdit && vnode.state.tool === 'sketch'
  canvas.freeDrawingBrush.color = vnode.attrs.game.currentPlayer === 'red' ? COLORS.RED : COLORS.BLUE
  canvas.freeDrawingBrush.width = 10
  canvas.hoverCursor = 'default'
  if (canEdit && tool !== 'erase') {
    canvas.hoverCursor = 'crosshair'
  }
  function sketchHandler (color) {
    return ([player, sketchId, sketch]) => {
      let sketchData = JSON.parse(sketch)
      var path = new fabric.Path(sketchData.path)
      path.firebaseId = sketchId
      path.playerName = player
      path.set({
        strokeWidth: 10,
        stroke: color,
        strokeLineCap: 'round',
        fill: 'transparent',
        top: sketchData.top,
        left: sketchData.left,
        hoverCursor: (canEdit && tool === 'erase' && player === game.currentPlayer) ? 'pointer' : null,
        selectable: false})
      canvas.add(path)
    }
  }
  function getSketches(player) {
    let sketches = game.sketches(player)
    return Object.keys(sketches).map(k => [player, k, sketches[k]])
  }
  if (vnode.state.viewingPlayer === 'red') {
    getSketches('blue').forEach(sketchHandler(COLORS.BLUE_FADED))
    getSketches('red').forEach(sketchHandler(COLORS.RED))
  } else {
    getSketches('red').forEach(sketchHandler(COLORS.RED_FADED))
    getSketches('blue').forEach(sketchHandler(COLORS.BLUE))
  }
}

export default {
  oninit: (vnode) => {
    vnode.state.tool = 'sketch' // either 'sketch', 'rect', 'pixel', 'erase'
    vnode.state.viewingPlayer = vnode.attrs.game.currentPlayer === 'blue' ? 'blue' : 'red'
  },
  oncreate: (vnode) => {
    vnode.state.canvas = new fabric.Canvas('play')
    vnode.state.canvas.on('path:created', ({path}) => {
      let pathString = path.toJSON().path.map(p => p.join(' ')).join(' ')
      vnode.attrs.game.addSketch(JSON.stringify({path: pathString, left: path.left, top: path.top}))
      m.redraw()
    })
    vnode.state.canvas.on('mouse:down', ({e, target}) => {
      if (target && target.playerName && target.playerName === vnode.attrs.game.currentPlayer && vnode.state.tool === 'erase') {
        vnode.attrs.game.removeSketch(target.firebaseId)
        m.redraw()
      }
    })
    updateCanvas(vnode)
  },
  onupdate: (vnode) => {
    updateCanvas(vnode)
  },
  view: (vnode) => {
    const button = (type, name, label) => {
      return m('button', {
        disabled: vnode.state[type] === name,
        onclick: () => {vnode.state[type] = name}
      }, label)
    }

    let playerbar = m('div', [
      button('viewingPlayer', 'red', vnode.attrs.game.currentPlayer === 'red' ? 'Your Drawing' : "Red's Drawing"),
      button('viewingPlayer', 'blue', vnode.attrs.game.currentPlayer === 'blue' ? 'Your Drawing' : "Blue's Drawing"),
    ])

    let toolbar = null
    if (vnode.attrs.game.currentPlayer === vnode.state.viewingPlayer) {
      toolbar = m('div', [
        button('tool', 'sketch', 'Sketch Tool'),
        button('tool', 'rect', 'Rectangle Tool'),
        button('tool', 'pixel', 'Pixel Reveal Tool'),
        button('tool', 'erase', 'Eraser'),
      ])
    }

    return m('div', [
      playerbar,
      m('canvas#play', {width: 500, height: 500, style: 'border: 1px solid #ccc'}),
      toolbar,
    ])
  }
}