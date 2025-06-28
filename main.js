// キャンバスで横長12x5のボードを描画
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const rows = 5;
const cols = 12;
const cellSize = 30; // ボードとピースの正方形サイズを統一
const gap = 0; // ボードの隙間なし

// --- ボード描画 ---
for (let y = 0; y < rows; y++) {
  for (let x = 0; x < cols; x++) {
    const px = x * cellSize;
    const py = y * cellSize;
    ctx.fillStyle = '#fff';
    ctx.fillRect(px, py, cellSize, cellSize);
    ctx.strokeStyle = '#ccc';
    ctx.strokeRect(px, py, cellSize, cellSize);
  }
}

// --- ピース単体表示エリア ---
const pieceArea = document.getElementById('piece-area');
const rotateBtn = document.getElementById('rotate-piece');
const flipBtn = document.getElementById('flip-piece');
const solveBtn = document.getElementById('solve-board');
const pieceCtx = pieceArea.getContext('2d');
let currentPieceIndex = 0;
let currentRotation = 0;
let currentFlip = false;

// ピース描画用サイズ
const pieceCellSize = 30; // cellSizeと同じ値で明示的に定義
const pieceGap = 8;

// Kataminoのペントミノピース定義（例: 5マス分の形状のみ、色は仮）
const pieces = [
  { name: 'I', color: '#e60012', shape: [[1,1,1,1,1]] }, // 赤
  { name: 'L', color: '#f39800', shape: [[1,0,0,0],[1,1,1,1]] }, // オレンジ
  { name: 'T', color: '#fff100', shape: [[1,1,1],[0,1,0],[0,1,0]] }, // 黄
  { name: 'U', color: '#009944', shape: [[1,0,1],[1,1,1]] }, // 緑
  { name: 'V', color: '#0068b7', shape: [[1,0,0],[1,0,0],[1,1,1]] }, // 青
  { name: 'W', color: '#920783', shape: [[1,0,0],[1,1,0],[0,1,1]] }, // 紫
  { name: 'X', color: '#e4007f', shape: [[0,1,0],[1,1,1],[0,1,0]] }, // ピンク
  { name: 'Y', color: '#00a0e9', shape: [[1,0],[1,1],[1,0],[1,0]] }, // 水色
  { name: 'Z', color: '#8c6239', shape: [[1,1,0],[0,1,0],[0,1,1]] }, // 茶色
  { name: 'F', color: '#b7d34c', shape: [[0,1,1],[1,1,0],[0,1,0]] }, // 黄緑
  { name: 'P', color: '#1d2088', shape: [[1,1],[1,1],[1,0]] }, // 濃い青
  { name: 'N', color: '#888888', shape: [[1,0],[1,1],[0,1],[0,1]] } // 灰色
];

function rotateShape(shape) {
  // 90度右回転
  const h = shape.length;
  const w = shape[0].length;
  const newShape = [];
  for (let x = 0; x < w; x++) {
    const row = [];
    for (let y = h - 1; y >= 0; y--) {
      row.push(shape[y][x]);
    }
    newShape.push(row);
  }
  return newShape;
}

function flipShape(shape) {
  // 左右反転
  return shape.map(row => row.slice().reverse());
}

// ピースリストエリアに全ピースを表示
const pieceList = document.getElementById('piece-list');
const pieceCanvases = [];
for (let i = 0; i < pieces.length; i++) {
  const canvas = document.createElement('canvas');
  canvas.width = 50;
  canvas.height = 50;
  canvas.style.border = '1px solid #ccc';
  canvas.style.background = '#fafafa';
  canvas.style.cursor = 'pointer';
  pieceList.appendChild(canvas);
  pieceCanvases.push(canvas);
}

function drawAllPieceCanvases() {
  for (let i = 0; i < pieces.length; i++) {
    const ctx2 = pieceCanvases[i].getContext('2d');
    ctx2.clearRect(0, 0, 50, 50);
    let shape = pieces[i].shape;
    if (i === currentPieceIndex) {
      for (let r = 0; r < currentRotation; r++) shape = rotateShape(shape);
      if (currentFlip) shape = flipShape(shape);
    }
    // スケーリング
    const w = shape[0].length * pieceCellSize;
    const h = shape.length * pieceCellSize;
    const scale = Math.min(48 / w, 48 / h, 1);
    const drawCell = pieceCellSize * scale;
    const offsetX = Math.floor((50 - shape[0].length * drawCell) / 2);
    const offsetY = Math.floor((50 - shape.length * drawCell) / 2);
    ctx2.save();
    ctx2.translate(offsetX, offsetY);
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          ctx2.fillStyle = pieces[i].color;
          ctx2.fillRect(x * drawCell, y * drawCell, drawCell, drawCell);
          ctx2.strokeStyle = '#333';
          ctx2.strokeRect(x * drawCell, y * drawCell, drawCell, drawCell);
        }
      }
    }
    ctx2.restore();
    // 選択中は枠を強調
    if (i === currentPieceIndex) {
      ctx2.save();
      ctx2.strokeStyle = '#1976d2';
      ctx2.lineWidth = 3;
      ctx2.strokeRect(1, 1, 48, 48);
      ctx2.restore();
    }
  }
}

drawAllPieceCanvases();

// ピース選択
for (let i = 0; i < pieceCanvases.length; i++) {
  pieceCanvases[i].onclick = function() {
    // すでにボードに置かれているピースは選択不可
    const alreadyPlaced = placedPieces.some(p => p.index === i);
    if (alreadyPlaced) return;
    currentPieceIndex = i;
    currentRotation = 0;
    currentFlip = false;
    drawAllPieceCanvases();
    drawSinglePiece(currentPieceIndex);
    drawBoardWithPieces();
  };
}

// 1つだけ大きく表示するエリアはpiece-areaとして再利用
function drawSinglePiece(index) {
  pieceCtx.clearRect(0, 0, pieceArea.width, pieceArea.height);
  let shape = pieces[index].shape;
  for (let i = 0; i < currentRotation; i++) shape = rotateShape(shape);
  if (currentFlip) shape = flipShape(shape);
  // ピースがエリアに収まるようにスケーリング
  const w = shape[0].length * pieceCellSize;
  const h = shape.length * pieceCellSize;
  const scale = Math.min(pieceArea.width / w, pieceArea.height / h, 1);
  const drawCell = pieceCellSize * scale;
  const offsetX = Math.floor((pieceArea.width - shape[0].length * drawCell) / 2);
  const offsetY = Math.floor((pieceArea.height - shape.length * drawCell) / 2);
  pieceCtx.save();
  pieceCtx.translate(offsetX, offsetY);
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        pieceCtx.fillStyle = pieces[index].color;
        pieceCtx.fillRect(x * drawCell, y * drawCell, drawCell, drawCell);
        pieceCtx.strokeStyle = '#333';
        pieceCtx.strokeRect(x * drawCell, y * drawCell, drawCell, drawCell);
      }
    }
  }
  pieceCtx.restore();
}

drawSinglePiece(currentPieceIndex);

// ボード上にピースを置くための状態
let placedPieces = [];
let redoStack = [];
let solveOverlay = null;

// ボードをクリックしたらピースを置く
canvas.addEventListener('click', function(e) {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const gx = Math.floor(mx / cellSize);
  const gy = Math.floor(my / cellSize);
  const shape = getRotatedShape(pieces[currentPieceIndex].shape, currentRotation, currentFlip);
  // プレビューと同じく中心合わせで配置
  const shapeW = shape[0].length;
  const shapeH = shape.length;
  const offsetX = Math.floor(shapeW / 2);
  const offsetY = Math.floor(shapeH / 2);
  const baseX = gx - offsetX;
  const baseY = gy - offsetY;
  if (!canPlacePiece(baseX, baseY, shape)) return;
  // UNDO用にスタックをクリア
  redoStack = [];
  placedPieces.push({
    index: currentPieceIndex,
    x: baseX,
    y: baseY,
    rotation: currentRotation,
    flip: currentFlip
  });
  // 次の未配置ピースを自動選択
  let nextIndex = -1;
  for (let i = 0; i < pieces.length; i++) {
    if (!placedPieces.some(p => p.index === i)) {
      nextIndex = i;
      break;
    }
  }
  if (nextIndex !== -1) {
    currentPieceIndex = nextIndex;
    currentRotation = 0;
    currentFlip = false;
  }
  // solveOverlayがONなら解を再検索して更新
  if (solveBtn.classList.contains('active')) {
    let matchIdx = -1;
    for (let i = 0; i < solutions.length; i++) {
      const rowsData = solutions[i];
      let match = true;
      for (const p of placedPieces) {
        let shape = pieces[p.index].shape;
        for (let r = 0; r < (p.rotation || 0); r++) shape = rotateShape(shape);
        if (p.flip) shape = flipShape(shape);
        for (let sy = 0; sy < shape.length; sy++) {
          for (let sx = 0; sx < shape[sy].length; sx++) {
            if (shape[sy][sx]) {
              const by = p.y + sy;
              const bx = p.x + sx;
              if (by < 0 || by >= 5 || bx < 0 || bx >= 12) { match = false; break; }
              const ch = rowsData[by][bx];
              if (pieces[p.index].name !== ch) match = false;
            }
          }
        }
        if (!match) break;
      }
      if (match) { matchIdx = i; break; }
    }
    if (matchIdx === -1) {
      solveOverlay = null;
    } else {
      solveOverlay = solutions[matchIdx];
    }
  }
  drawAllPieceCanvases();
  drawSinglePiece(currentPieceIndex);
  drawBoardWithPieces();
});

let hoverCell = null;

canvas.addEventListener('mousemove', function(e) {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const gx = Math.floor(mx / cellSize);
  const gy = Math.floor(my / cellSize);
  if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) {
    hoverCell = { x: gx, y: gy };
  } else {
    hoverCell = null;
  }
  drawBoardWithPieces();
});

canvas.addEventListener('mouseleave', function() {
  hoverCell = null;
  drawBoardWithPieces();
});

function getRotatedShape(shape, rot, flip) {
  let s = shape;
  for (let i = 0; i < rot; i++) {
    s = rotateShape(s);
  }
  if (flip) s = flipShape(s);
  return s;
}

function canPlacePiece(gx, gy, shape) {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        const bx = gx + x;
        const by = gy + y;
        if (bx < 0 || bx >= cols || by < 0 || by >= rows) {
          return false;
        }
        for (const p of placedPieces) {
          const otherShape = getRotatedShape(pieces[p.index].shape, p.rotation || 0, p.flip || false);
          for (let oy = 0; oy < otherShape.length; oy++) {
            for (let ox = 0; ox < otherShape[oy].length; ox++) {
              if (otherShape[oy][ox]) {
                const obx = p.x + ox;
                const oby = p.y + oy;
                if (bx === obx && by === oby) {
                  return false;
                }
              }
            }
          }
        }
      }
    }
  }
  return true;
}

function drawBoardWithPieces() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // solveOverlay===null かつ solveモードON（=solveBtnがON状態）かつ解が見つからない場合はグレー半透明
  if (solveOverlay === null && solveBtn && solveBtn.classList.contains('active')) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#888';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  } else {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        ctx.strokeStyle = '#ccc';
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }
  // 置かれたピース
  for (const p of placedPieces) {
    const piece = pieces[p.index];
    const shape = getRotatedShape(piece.shape, p.rotation || 0, p.flip || false);
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const bx = p.x + x;
          const by = p.y + y;
          if (bx >= 0 && bx < cols && by >= 0 && by < rows) {
            ctx.fillStyle = piece.color;
            ctx.fillRect(bx * cellSize, by * cellSize, cellSize, cellSize);
            ctx.strokeStyle = '#333';
            ctx.strokeRect(bx * cellSize, by * cellSize, cellSize, cellSize);
          }
        }
      }
    }
  }
  // solveOverlayがあれば半透明で解を重ねて描画
  if (solveOverlay) {
    ctx.save();
    ctx.globalAlpha = 0.22; // さらに薄く
    for (let y = 0; y < solveOverlay.length; y++) {
      for (let x = 0; x < solveOverlay[y].length; x++) {
        const ch = solveOverlay[y][x];
        const idx = pieces.findIndex(p => p.name === ch);
        if (idx !== -1 && !placedPieces.some(p => p.index === idx)) {
          ctx.fillStyle = pieces[idx].color;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          ctx.strokeStyle = '#333';
          ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
    ctx.restore();
  }
  // 半透明のピース（マウスホバー）
  if (hoverCell) {
    const piece = pieces[currentPieceIndex];
    const shape = getRotatedShape(piece.shape, currentRotation, currentFlip);
    const shapeW = shape[0].length;
    const shapeH = shape.length;
    const offsetX = Math.floor(shapeW / 2);
    const offsetY = Math.floor(shapeH / 2);
    const baseX = hoverCell.x - offsetX;
    const baseY = hoverCell.y - offsetY;
    ctx.save();
    ctx.globalAlpha = canPlacePiece(baseX, baseY, shape) ? 0.5 : 0.18; // 配置不可時はさらに薄く
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const bx = baseX + x;
          const by = baseY + y;
          if (bx >= 0 && bx < cols && by >= 0 && by < rows) {
            ctx.fillStyle = piece.color;
            ctx.fillRect(bx * cellSize, by * cellSize, cellSize, cellSize);
            ctx.strokeStyle = '#333';
            ctx.strokeRect(bx * cellSize, by * cellSize, cellSize, cellSize);
          }
        }
      }
    }
    ctx.restore();
  }
}
// 初期ボード描画
drawBoardWithPieces();

rotateBtn.onclick = function() {
  currentRotation = (currentRotation + 1) % 4;
  drawSinglePiece(currentPieceIndex);
  drawAllPieceCanvases();
  drawBoardWithPieces();
};
flipBtn.onclick = function() {
  currentFlip = !currentFlip;
  drawSinglePiece(currentPieceIndex);
  drawAllPieceCanvases();
  drawBoardWithPieces();
};

const resetBtn = document.getElementById('reset-board');
const undoBtn = document.getElementById('undo-board');
const redoBtn = document.getElementById('redo-board');
resetBtn.onclick = function() {
  placedPieces = [];
  redoStack = [];
  solveOverlay = null;
  // solveモードONなら解を再検索（グレー表示も含む）
  if (solveBtn.classList.contains('active')) {
    let matchIdx = -1;
    for (let i = 0; i < solutions.length; i++) {
      const rowsData = solutions[i];
      let match = true;
      for (const p of placedPieces) {
        let shape = pieces[p.index].shape;
        for (let r = 0; r < (p.rotation || 0); r++) shape = rotateShape(shape);
        if (p.flip) shape = flipShape(shape);
        for (let sy = 0; sy < shape.length; sy++) {
          for (let sx = 0; sx < shape[sy].length; sx++) {
            if (shape[sy][sx]) {
              const by = p.y + sy;
              const bx = p.x + sx;
              if (by < 0 || by >= 5 || bx < 0 || bx >= 12) { match = false; break; }
              const ch = rowsData[by][bx];
              if (pieces[p.index].name !== ch) match = false;
            }
          }
        }
        if (!match) break;
      }
      if (match) { matchIdx = i; break; }
    }
    if (matchIdx === -1) {
      solveOverlay = null;
    } else {
      solveOverlay = solutions[matchIdx];
    }
  }
  drawBoardWithPieces();
};

undoBtn.onclick = function() {
  if (placedPieces.length === 0) return;
  // 最後のピースをredoStackに退避
  redoStack.push(placedPieces.pop());
  // 次に選択されるべきピースを自動選択
  let nextIndex = -1;
  for (let i = 0; i < pieces.length; i++) {
    if (!placedPieces.some(p => p.index === i)) {
      nextIndex = i;
      break;
    }
  }
  if (nextIndex !== -1) {
    currentPieceIndex = nextIndex;
    currentRotation = 0;
    currentFlip = false;
  }
  // solveモードONなら解を再検索
  if (solveBtn.classList.contains('active')) {
    let matchIdx = -1;
    for (let i = 0; i < solutions.length; i++) {
      const rowsData = solutions[i];
      let match = true;
      for (const p of placedPieces) {
        let shape = pieces[p.index].shape;
        for (let r = 0; r < (p.rotation || 0); r++) shape = rotateShape(shape);
        if (p.flip) shape = flipShape(shape);
        for (let sy = 0; sy < shape.length; sy++) {
          for (let sx = 0; sx < shape[sy].length; sx++) {
            if (shape[sy][sx]) {
              const by = p.y + sy;
              const bx = p.x + sx;
              if (by < 0 || by >= 5 || bx < 0 || bx >= 12) { match = false; break; }
              const ch = rowsData[by][bx];
              if (pieces[p.index].name !== ch) match = false;
            }
          }
        }
        if (!match) break;
      }
      if (match) { matchIdx = i; break; }
    }
    if (matchIdx === -1) {
      solveOverlay = null;
    } else {
      solveOverlay = solutions[matchIdx];
    }
  }
  drawAllPieceCanvases();
  drawSinglePiece(currentPieceIndex);
  drawBoardWithPieces();
};

redoBtn.onclick = function() {
  if (redoStack.length === 0) return;
  const piece = redoStack.pop();
  placedPieces.push(piece);
  // 次に選択されるべきピースを自動選択
  let nextIndex = -1;
  for (let i = 0; i < pieces.length; i++) {
    if (!placedPieces.some(p => p.index === i)) {
      nextIndex = i;
      break;
    }
  }
  if (nextIndex !== -1) {
    currentPieceIndex = nextIndex;
    currentRotation = 0;
    currentFlip = false;
  }
  // solveモードONなら解を再検索
  if (solveBtn.classList.contains('active')) {
    let matchIdx = -1;
    for (let i = 0; i < solutions.length; i++) {
      const rowsData = solutions[i];
      let match = true;
      for (const p of placedPieces) {
        let shape = pieces[p.index].shape;
        for (let r = 0; r < (p.rotation || 0); r++) shape = rotateShape(shape);
        if (p.flip) shape = flipShape(shape);
        for (let sy = 0; sy < shape.length; sy++) {
          for (let sx = 0; sx < shape[sy].length; sx++) {
            if (shape[sy][sx]) {
              const by = p.y + sy;
              const bx = p.x + sx;
              if (by < 0 || by >= 5 || bx < 0 || bx >= 12) { match = false; break; }
              const ch = rowsData[by][bx];
              if (pieces[p.index].name !== ch) match = false;
            }
          }
        }
        if (!match) break;
      }
      if (match) { matchIdx = i; break; }
    }
    if (matchIdx === -1) {
      solveOverlay = null;
    } else {
      solveOverlay = solutions[matchIdx];
    }
  }
  drawAllPieceCanvases();
  drawSinglePiece(currentPieceIndex);
  drawBoardWithPieces();
};

let solutions = [];

// サーバーからkatamino.txtを読み込む
fetch('katamino.txt')
  .then(res => res.text())
  .then(text => {
    // 解パターンをパース
    // #n\n(5行)\n の繰り返し
    const lines = text.split(/\r?\n/);
    let buf = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#')) {
        if (buf.length === 5) solutions.push(buf);
        buf = [];
      } else if (lines[i].trim() !== '') {
        buf.push(lines[i]);
      }
    }
    if (buf.length === 5) solutions.push(buf);
    // 最初の解は表示しない
  });

function showSolution(idx) {
  if (!solutions[idx]) return;
  // 盤面クリア
  placedPieces = [];
  // 5x12の盤面にピースを配置
  const rowsData = solutions[idx];
  // ピース記号→index変換
  const pieceMap = {};
  for (let i = 0; i < pieces.length; i++) pieceMap[pieces[i].name] = i;
  // 盤面上の各ピースの位置を記録
  const used = {};
  for (let y = 0; y < rowsData.length; y++) {
    for (let x = 0; x < rowsData[y].length; x++) {
      const ch = rowsData[y][x];
      if (!used[ch]) used[ch] = [];
      used[ch].push({x, y});
    }
  }
  // 各ピースごとに左上座標・回転・反転を推定して配置
  for (const ch in used) {
    const idx = pieceMap[ch];
    if (idx === undefined) continue;
    // 形状探索（回転・反転含めて一致するものを探す）
    const positions = used[ch];
    let found = false;
    for (let rot = 0; rot < 4 && !found; rot++) {
      for (let flip = 0; flip < 2 && !found; flip++) {
        let shape = pieces[idx].shape;
        for (let r = 0; r < rot; r++) shape = rotateShape(shape);
        if (flip) shape = flipShape(shape);
        // 探索範囲
        for (let oy = 0; oy <= 5 - shape.length; oy++) {
          for (let ox = 0; ox <= 12 - shape[0].length; ox++) {
            // 形状が盤面上のpositionsと一致するか
            let match = true;
            let cnt = 0;
            for (let sy = 0; sy < shape.length; sy++) {
              for (let sx = 0; sx < shape[sy].length; sx++) {
                if (shape[sy][sx]) {
                  cnt++;
                  const foundPos = positions.some(p => p.x === ox + sx && p.y === oy + sy);
                  if (!foundPos) match = false;
                }
              }
            }
            if (match && cnt === positions.length) {
              placedPieces.push({
                index: idx,
                x: ox,
                y: oy,
                rotation: rot,
                flip: !!flip
              });
              found = true;
            }
          }
        }
      }
    }
  }
  // 次に選択できるピースを自動選択
  let nextIndex = -1;
  for (let i = 0; i < pieces.length; i++) {
    if (!placedPieces.some(p => p.index === i)) {
      nextIndex = i;
      break;
    }
  }
  if (nextIndex !== -1) {
    currentPieceIndex = nextIndex;
    currentRotation = 0;
    currentFlip = false;
  }
  drawAllPieceCanvases();
  drawSinglePiece(currentPieceIndex);
  drawBoardWithPieces();
}

solveBtn.onclick = function() {
  if (solutions.length === 0) return;
  // solveOverlayが表示中ならOFFにして消す
  if (solveBtn.classList.contains('active')) {
    solveBtn.classList.remove('active');
    solveOverlay = null;
    drawBoardWithPieces();
    return;
  }
  // ONにする
  solveBtn.classList.add('active');
  // 現在の盤面状態に一致する解を探す
  let matchIdx = -1;
  for (let i = 0; i < solutions.length; i++) {
    // 盤面上のピース配置を文字列化
    const rowsData = solutions[i];
    // 既に置いたピースの位置と記号を比較
    let match = true;
    for (const p of placedPieces) {
      // 盤面上でpの形状がrowsDataのどこにあるかを調べる
      let found = false;
      let shape = pieces[p.index].shape;
      for (let r = 0; r < (p.rotation || 0); r++) shape = rotateShape(shape);
      if (p.flip) shape = flipShape(shape);
      for (let sy = 0; sy < shape.length; sy++) {
        for (let sx = 0; sx < shape[sy].length; sx++) {
          if (shape[sy][sx]) {
            const by = p.y + sy;
            const bx = p.x + sx;
            if (by < 0 || by >= 5 || bx < 0 || bx >= 12) { match = false; break; }
            const ch = rowsData[by][bx];
            if (pieces[p.index].name !== ch) match = false;
          }
        }
      }
      if (!match) break;
    }
    if (match) { matchIdx = i; break; }
  }
  if (matchIdx === -1) {
    solveOverlay = null;
    drawBoardWithPieces();
    return;
  }
  // 半透明で解をオーバーレイ表示
  solveOverlay = solutions[matchIdx];
  drawBoardWithPieces();
};

// ピースを置いたときもsolveBtnのactive状態を考慮してグレー表示
canvas.addEventListener('click', function(e) {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const gx = Math.floor(mx / cellSize);
  const gy = Math.floor(my / cellSize);
  const shape = getRotatedShape(pieces[currentPieceIndex].shape, currentRotation, currentFlip);
  // プレビューと同じく中心合わせで配置
  const shapeW = shape[0].length;
  const shapeH = shape.length;
  const offsetX = Math.floor(shapeW / 2);
  const offsetY = Math.floor(shapeH / 2);
  const baseX = gx - offsetX;
  const baseY = gy - offsetY;
  if (!canPlacePiece(baseX, baseY, shape)) return;
  // UNDO用にスタックをクリア
  redoStack = [];
  placedPieces.push({
    index: currentPieceIndex,
    x: baseX,
    y: baseY,
    rotation: currentRotation,
    flip: currentFlip
  });
  // 次の未配置ピースを自動選択
  let nextIndex = -1;
  for (let i = 0; i < pieces.length; i++) {
    if (!placedPieces.some(p => p.index === i)) {
      nextIndex = i;
      break;
    }
  }
  if (nextIndex !== -1) {
    currentPieceIndex = nextIndex;
    currentRotation = 0;
    currentFlip = false;
  }
  // solveOverlayがONなら解を再検索して更新
  if (solveBtn.classList.contains('active')) {
    let matchIdx = -1;
    for (let i = 0; i < solutions.length; i++) {
      const rowsData = solutions[i];
      let match = true;
      for (const p of placedPieces) {
        let shape = pieces[p.index].shape;
        for (let r = 0; r < (p.rotation || 0); r++) shape = rotateShape(shape);
        if (p.flip) shape = flipShape(shape);
        for (let sy = 0; sy < shape.length; sy++) {
          for (let sx = 0; sx < shape[sy].length; sx++) {
            if (shape[sy][sx]) {
              const by = p.y + sy;
              const bx = p.x + sx;
              if (by < 0 || by >= 5 || bx < 0 || bx >= 12) { match = false; break; }
              const ch = rowsData[by][bx];
              if (pieces[p.index].name !== ch) match = false;
            }
          }
        }
        if (!match) break;
      }
      if (match) { matchIdx = i; break; }
    }
    if (matchIdx === -1) {
      solveOverlay = null;
    } else {
      solveOverlay = solutions[matchIdx];
    }
  }
  drawAllPieceCanvases();
  drawSinglePiece(currentPieceIndex);
  drawBoardWithPieces();
});
