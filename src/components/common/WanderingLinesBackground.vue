<!-- WanderingLinesBackground.vue - 随机游走连线背景 -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

/**
 * 背景节点。
 * `size` 为基础半径，最终绘制大小还会叠加连接数量和鼠标影响。
 */
type BackgroundNode = {
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  turnVelocity: number;
  turnTarget: number;
  turnCooldown: number;
};

/**
 * 背景配色。
 * 统一保存为 RGB 字符串，便于在绘制时按距离、交互状态动态组合透明度。
 */
type BackgroundPalette = {
  lineRgb: string;
  lineAccentRgb: string;
  nodeRgb: string;
  nodeGlowRgb: string;
};

/**
 * 宿主容器与渲染画布引用。
 * 宿主用于读取尺寸与 CSS 变量；canvas 用于实际绘制背景。
 */
const host = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);

/**
 * 动画与画布运行时状态。
 */
let animationFrameId = 0;
let resizeObserver: ResizeObserver | null = null;
let reduceMotionQuery: MediaQueryList | null = null;
let isReducedMotion = false;
let canvasContext: CanvasRenderingContext2D | null = null;
let sceneWidth = 0;
let sceneHeight = 0;
let lastFrameTime = 0;
let backgroundNodes: BackgroundNode[] = [];

/**
 * 鼠标交互状态。
 * 使用 current / target 双值做平滑过渡，避免 pointermove 直接导致背景抖动。
 */
let pointerX = 0;
let pointerY = 0;
let pointerTargetX = 0;
let pointerTargetY = 0;
let pointerActive = 0;
let pointerTargetActive = 0;

/**
 * 默认配色。
 * 实际渲染时会优先读取组件 CSS 变量，以兼容亮色 / 暗色主题。
 */
let palette: BackgroundPalette = {
  lineRgb: '186, 199, 216',
  lineAccentRgb: '119, 144, 177',
  nodeRgb: '94, 119, 153',
  nodeGlowRgb: '255, 255, 255',
};

/**
 * 返回一个闭区间近似随机值，用于初始化节点位置、速度和转向参数。
 */
const randomBetween = (min: number, max: number): number => min + Math.random() * (max - min);

/**
 * 根据容器宽度决定节点数量。
 * 宽屏增加更多节点，避免背景在大分辨率下被拉得过于稀疏。
 */
const getNodeCount = (width: number): number => {
  if (width < 640) {
    return 26;
  }

  if (width < 1024) {
    return 40;
  }

  if (width < 1440) {
    return 62;
  }

  if (width < 1920) {
    return 78;
  }

  return 92;
};

/**
 * 根据容器宽度决定节点的最大连线距离。
 * 屏幕越大，允许的连接半径越大，线网密度更稳定。
 */
const getConnectionDistance = (width: number): number => {
  if (width < 640) {
    return 136;
  }

  if (width < 1024) {
    return 164;
  }

  return 190;
};

/**
 * 鼠标影响半径。
 * 仅在桌面端形成轻微吸引与高亮，移动端保持更克制的响应范围。
 */
const getPointerInfluenceDistance = (width: number): number => {
  if (width < 640) {
    return 110;
  }

  if (width < 1024) {
    return 138;
  }

  return 168;
};

/**
 * 创建单个节点。
 * 节点尺寸基础差异很小，主要视觉差异由连接数量和鼠标响应带出。
 */
const createBackgroundNode = (): BackgroundNode => ({
  x: randomBetween(0, sceneWidth),
  y: randomBetween(0, sceneHeight),
  angle: randomBetween(0, Math.PI * 2),
  speed: randomBetween(10, 20),
  size: randomBetween(1.02, 1.18),
  turnVelocity: randomBetween(-0.3, 0.3),
  turnTarget: randomBetween(-0.85, 0.85),
  turnCooldown: randomBetween(0.6, 2.4),
});

/**
 * 按当前容器尺寸重新生成节点集合。
 * 在尺寸变化后直接重建，比逐个迁移旧节点更稳定，也更容易控制密度策略。
 */
const rebuildBackgroundNodes = (): void => {
  backgroundNodes = Array.from({ length: getNodeCount(sceneWidth) }, createBackgroundNode);
};

/**
 * 从组件样式中读取颜色变量。
 * 这样颜色方案可以留在 CSS 中控制，canvas 逻辑只负责消费颜色值。
 */
const readPalette = (): void => {
  const hostElement = host.value;

  if (!hostElement) {
    return;
  }

  const styles = window.getComputedStyle(hostElement);

  palette = {
    lineRgb: styles.getPropertyValue('--wandering-line-rgb').trim() || palette.lineRgb,
    lineAccentRgb: styles.getPropertyValue('--wandering-line-accent-rgb').trim() || palette.lineAccentRgb,
    nodeRgb: styles.getPropertyValue('--wandering-node-rgb').trim() || palette.nodeRgb,
    nodeGlowRgb: styles.getPropertyValue('--wandering-node-glow-rgb').trim() || palette.nodeGlowRgb,
  };
};

/**
 * 更新节点游走状态。
 * 每个节点会以缓慢随机转向的方式漂移，接近边界时平滑折返，避免硬性卡边。
 */
const updateBackgroundNodes = (deltaSeconds: number): void => {
  const padding = 48;

  for (const node of backgroundNodes) {
    node.turnCooldown -= deltaSeconds;

    if (node.turnCooldown <= 0) {
      node.turnCooldown = randomBetween(0.6, 2.8);
      node.turnTarget = randomBetween(-0.95, 0.95);
    }

    node.turnVelocity += (node.turnTarget - node.turnVelocity) * Math.min(1, deltaSeconds * 2.2);
    node.angle += node.turnVelocity * deltaSeconds;
    node.x += Math.cos(node.angle) * node.speed * deltaSeconds;
    node.y += Math.sin(node.angle) * node.speed * deltaSeconds;

    if (node.x < -padding) {
      node.x = -padding;
      node.angle = randomBetween(-0.35, 0.35);
    } else if (node.x > sceneWidth + padding) {
      node.x = sceneWidth + padding;
      node.angle = Math.PI + randomBetween(-0.35, 0.35);
    }

    if (node.y < -padding) {
      node.y = -padding;
      node.angle = Math.PI / 2 + randomBetween(-0.4, 0.4);
    } else if (node.y > sceneHeight + padding) {
      node.y = sceneHeight + padding;
      node.angle = -Math.PI / 2 + randomBetween(-0.4, 0.4);
    }
  }
};

/**
 * 平滑更新鼠标交互状态。
 * 鼠标位置和激活强度都使用缓动过渡，避免交互过于生硬。
 */
const updatePointerState = (deltaSeconds: number): void => {
  const followFactor = Math.min(1, deltaSeconds * 12);
  const activeFactor = Math.min(1, deltaSeconds * 7);

  pointerX += (pointerTargetX - pointerX) * followFactor;
  pointerY += (pointerTargetY - pointerY) * followFactor;
  pointerActive += (pointerTargetActive - pointerActive) * activeFactor;
};

/**
 * 绘制整帧背景。
 *
 * 绘制流程：
 * 1. 更新节点与鼠标状态
 * 2. 计算每个节点的实际渲染位置（含鼠标吸引偏移）
 * 3. 绘制近邻连线，并顺手统计每个节点的连接数量
 * 4. 根据连接数量与鼠标影响绘制节点和柔光
 */
const drawBackground = (timestamp: number): void => {
  if (!canvasContext) {
    return;
  }

  const deltaSeconds = lastFrameTime ? Math.min((timestamp - lastFrameTime) / 1000, 0.05) : 1 / 60;
  lastFrameTime = timestamp;

  if (!isReducedMotion) {
    updateBackgroundNodes(deltaSeconds);
    updatePointerState(deltaSeconds);
  }

  const connectionDistance = getConnectionDistance(sceneWidth);
  const connectionDistanceSquared = connectionDistance * connectionDistance;
  const connectionCounts = new Uint8Array(backgroundNodes.length);
  const renderXs = new Float32Array(backgroundNodes.length);
  const renderYs = new Float32Array(backgroundNodes.length);
  const pointerInfluences = new Float32Array(backgroundNodes.length);
  const pointerDistance = getPointerInfluenceDistance(sceneWidth);
  const pointerDistanceSquared = pointerDistance * pointerDistance;

  canvasContext.clearRect(0, 0, sceneWidth, sceneHeight);
  canvasContext.lineCap = 'round';
  canvasContext.lineJoin = 'round';

  // 先为每个节点计算本帧渲染坐标，避免在连线和节点绘制时重复计算鼠标偏移。
  for (let index = 0; index < backgroundNodes.length; index += 1) {
    const node = backgroundNodes[index];

    if (!node) {
      continue;
    }

    let renderX = node.x;
    let renderY = node.y;
    let influence = 0;

    if (pointerActive > 0.01) {
      const dx = node.x - pointerX;
      const dy = node.y - pointerY;
      const distanceSquared = dx * dx + dy * dy;

      if (distanceSquared < pointerDistanceSquared) {
        const distance = Math.max(1, Math.sqrt(distanceSquared));
        influence = (1 - distance / pointerDistance) * pointerActive;
        const offset = 18 * influence;

        renderX -= (dx / distance) * offset;
        renderY -= (dy / distance) * offset;
      }
    }

    renderXs[index] = renderX;
    renderYs[index] = renderY;
    pointerInfluences[index] = influence;
  }

  // 两两检查距离，距离足够近时绘制连线，并同步累计连接数供节点大小微调使用。
  for (let index = 0; index < backgroundNodes.length; index += 1) {
    const node = backgroundNodes[index];

    if (!node) {
      continue;
    }

    for (let peerIndex = index + 1; peerIndex < backgroundNodes.length; peerIndex += 1) {
      const peer = backgroundNodes[peerIndex];

      if (!peer) {
        continue;
      }

      const nodeX = renderXs[index] ?? node.x;
      const nodeY = renderYs[index] ?? node.y;
      const peerX = renderXs[peerIndex] ?? peer.x;
      const peerY = renderYs[peerIndex] ?? peer.y;
      const dx = peerX - nodeX;
      const dy = peerY - nodeY;
      const distanceSquared = dx * dx + dy * dy;

      if (distanceSquared > connectionDistanceSquared) {
        continue;
      }

      const nodeConnectionCount = connectionCounts[index] ?? 0;
      const peerConnectionCount = connectionCounts[peerIndex] ?? 0;

      connectionCounts[index] = Math.min(nodeConnectionCount + 1, 255);
      connectionCounts[peerIndex] = Math.min(peerConnectionCount + 1, 255);

      const distance = Math.sqrt(distanceSquared);
      const strength = 1 - distance / connectionDistance;
      const pointerBoost = Math.max(pointerInfluences[index] ?? 0, pointerInfluences[peerIndex] ?? 0);

      canvasContext.beginPath();
      canvasContext.moveTo(nodeX, nodeY);
      canvasContext.lineTo(peerX, peerY);
      canvasContext.strokeStyle = `rgba(${palette.lineRgb}, ${0.05 + strength * 0.16 + pointerBoost * 0.12})`;
      canvasContext.lineWidth = 0.75 + strength * 1.15 + pointerBoost * 0.45;
      canvasContext.stroke();

      canvasContext.beginPath();
      canvasContext.moveTo(nodeX, nodeY);
      canvasContext.lineTo(peerX, peerY);
      canvasContext.strokeStyle = `rgba(${palette.lineAccentRgb}, ${0.025 + strength * 0.12 + pointerBoost * 0.16})`;
      canvasContext.lineWidth = 0.3 + strength * 0.72 + pointerBoost * 0.55;
      canvasContext.stroke();
    }
  }

  // 节点半径主要受连接数影响，鼠标附近会再轻微增强，形成更聚焦的视觉中心。
  for (let index = 0; index < backgroundNodes.length; index += 1) {
    const node = backgroundNodes[index];

    if (!node) {
      continue;
    }

    const connectionCount = connectionCounts[index] ?? 0;
    const sizeBoost = Math.min(connectionCount, 7) * 0.08;
    const pointerBoost = pointerInfluences[index] ?? 0;
    const renderX = renderXs[index] ?? node.x;
    const renderY = renderYs[index] ?? node.y;
    const nodeRadius = node.size + sizeBoost + pointerBoost * 0.18;
    const glowRadius = nodeRadius * 3.2;
    const glow = canvasContext.createRadialGradient(renderX, renderY, 0, renderX, renderY, glowRadius);

    glow.addColorStop(0, `rgba(${palette.nodeGlowRgb}, ${0.12 + pointerBoost * 0.12})`);
    glow.addColorStop(1, `rgba(${palette.nodeGlowRgb}, 0)`);

    canvasContext.beginPath();
    canvasContext.arc(renderX, renderY, glowRadius, 0, Math.PI * 2);
    canvasContext.fillStyle = glow;
    canvasContext.fill();

    canvasContext.beginPath();
    canvasContext.arc(renderX, renderY, nodeRadius + 0.55, 0, Math.PI * 2);
    canvasContext.fillStyle = `rgba(${palette.nodeRgb}, ${0.08 + pointerBoost * 0.08})`;
    canvasContext.fill();

    canvasContext.beginPath();
    canvasContext.arc(renderX, renderY, nodeRadius, 0, Math.PI * 2);
    canvasContext.fillStyle = `rgba(${palette.nodeRgb}, ${0.3 + pointerBoost * 0.16})`;
    canvasContext.fill();
  }
};

/**
 * 鼠标离开窗口或页面失焦时，逐步关闭交互状态。
 */
const handlePointerLeave = (): void => {
  pointerTargetActive = 0;
};

/**
 * 处理鼠标移动。
 * 仅记录目标位置和激活状态，实际过渡在动画帧中统一完成。
 */
const handlePointerMove = (event: PointerEvent): void => {
  if (event.pointerType === 'touch' || isReducedMotion) {
    pointerTargetActive = 0;
    return;
  }

  const hostElement = host.value;

  if (!hostElement) {
    return;
  }

  const bounds = hostElement.getBoundingClientRect();
  const relativeX = event.clientX - bounds.left;
  const relativeY = event.clientY - bounds.top;

  if (relativeX < 0 || relativeY < 0 || relativeX > bounds.width || relativeY > bounds.height) {
    pointerTargetActive = 0;
    return;
  }

  pointerTargetX = relativeX;
  pointerTargetY = relativeY;
  pointerTargetActive = 1;
};

/**
 * 根据容器尺寸重设 canvas。
 * 同时处理高 DPI 缩放、颜色变量读取和节点重建。
 */
const resizeCanvas = (): void => {
  const hostElement = host.value;
  const canvasElement = canvas.value;

  if (!hostElement || !canvasElement) {
    return;
  }

  const { width, height } = hostElement.getBoundingClientRect();

  if (width <= 0 || height <= 0) {
    return;
  }

  sceneWidth = width;
  sceneHeight = height;

  const pixelRatio = window.devicePixelRatio || 1;

  canvasElement.width = Math.round(width * pixelRatio);
  canvasElement.height = Math.round(height * pixelRatio);
  canvasElement.style.width = `${width}px`;
  canvasElement.style.height = `${height}px`;

  canvasContext = canvasElement.getContext('2d');
  canvasContext?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  readPalette();
  rebuildBackgroundNodes();
  drawBackground(performance.now());
};

/**
 * 停止动画循环。
 */
const stopAnimation = (): void => {
  if (!animationFrameId) {
    return;
  }

  cancelAnimationFrame(animationFrameId);
  animationFrameId = 0;
};

/**
 * 动画主循环。
 * 页面隐藏或减少动态效果开启时不再持续请求下一帧。
 */
const animationLoop = (timestamp: number): void => {
  animationFrameId = 0;
  drawBackground(timestamp);

  if (!isReducedMotion && !document.hidden) {
    animationFrameId = requestAnimationFrame(animationLoop);
  }
};

/**
 * 启动背景动画。
 * 若当前不应持续播放，则只绘制一帧静态结果。
 */
const startAnimation = (): void => {
  if (!canvas.value || !canvasContext) {
    return;
  }

  if (isReducedMotion || document.hidden) {
    drawBackground(performance.now());
    return;
  }

  if (animationFrameId) {
    return;
  }

  lastFrameTime = 0;
  animationFrameId = requestAnimationFrame(animationLoop);
};

/**
 * 页面可见性切换时暂停 / 恢复动画，避免后台标签页持续消耗资源。
 */
const handleVisibilityChange = (): void => {
  if (document.hidden) {
    stopAnimation();
    return;
  }

  startAnimation();
};

/**
 * 系统“减少动态效果”偏好变化时，切换到静态渲染模式。
 */
const handleReducedMotionChange = (event: MediaQueryListEvent): void => {
  isReducedMotion = event.matches;
  pointerTargetActive = 0;
  pointerActive = 0;

  if (isReducedMotion) {
    stopAnimation();
    drawBackground(performance.now());
    return;
  }

  startAnimation();
};

onMounted(() => {
  // 首次挂载时先建立画布与节点数据，再启动动画。
  resizeCanvas();

  resizeObserver = new ResizeObserver(() => {
    resizeCanvas();
    startAnimation();
  });

  if (host.value) {
    resizeObserver.observe(host.value);
  }

  reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  isReducedMotion = reduceMotionQuery.matches;
  reduceMotionQuery.addEventListener('change', handleReducedMotionChange);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  window.addEventListener('pointerleave', handlePointerLeave);
  window.addEventListener('blur', handlePointerLeave);

  startAnimation();
});

onBeforeUnmount(() => {
  // 组件销毁时清理动画与事件，避免页面切换后残留后台任务。
  stopAnimation();
  resizeObserver?.disconnect();
  reduceMotionQuery?.removeEventListener('change', handleReducedMotionChange);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerleave', handlePointerLeave);
  window.removeEventListener('blur', handlePointerLeave);
});
</script>

<template>
  <!-- 纯装饰性背景：不参与交互，也不进入辅助技术语义树 -->
  <div ref="host" aria-hidden="true" class="wandering-lines-host absolute inset-0 pointer-events-none select-none">
    <canvas ref="canvas" class="absolute inset-0 h-full w-full"></canvas>
  </div>
</template>

<style scoped>
/* 亮色主题下的默认背景与连线配色 */
.wandering-lines-host {
  background-color: var(--background);
  --wandering-line-rgb: 186, 199, 216;
  --wandering-line-accent-rgb: 119, 144, 177;
  --wandering-node-rgb: 94, 119, 153;
  --wandering-node-glow-rgb: 255, 255, 255;
}

/* 暗色主题下提升线条与节点亮度，确保在深色背景上仍有足够层次 */
:global(.dark) .wandering-lines-host {
  --wandering-line-rgb: 88, 108, 138;
  --wandering-line-accent-rgb: 148, 184, 219;
  --wandering-node-rgb: 214, 226, 241;
  --wandering-node-glow-rgb: 148, 163, 184;
}
</style>
