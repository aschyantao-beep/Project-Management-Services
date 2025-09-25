<template>
  <div class="animated-gradient-container">
    <motion.div
      class="gradient-orb orb-1"
      :animate="{
        x: [0, 100, 0],
        y: [0, -50, 0],
        scale: [1, 1.2, 1],
      }"
      :transition="{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      }"
    />

    <motion.div
      class="gradient-orb orb-2"
      :animate="{
        x: [0, -80, 0],
        y: [0, 60, 0],
        scale: [1, 0.8, 1],
      }"
      :transition="{
        duration: 10,
        repeat: Infinity,
        ease: 'easeInOut',
      }"
    />

    <motion.div
      class="gradient-orb orb-3"
      :animate="{
        x: [0, 60, 0],
        y: [0, -80, 0],
        scale: [1, 1.1, 1],
      }"
      :transition="{
        duration: 12,
        repeat: Infinity,
        ease: 'easeInOut',
      }"
    />

    <div class="gradient-overlay" />

    <div class="content-container">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { motion } from 'motion-v'
</script>

<style scoped>
.animated-gradient-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.7;
}

.orb-1 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%);
  top: 20%;
  left: 10%;
}

.orb-2 {
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
  top: 60%;
  right: 15%;
}

.orb-3 {
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%);
  top: 40%;
  left: 60%;
}

.gradient-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.1) 100%
  );
  pointer-events: none;
}

.content-container {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .orb-1 {
    width: 200px;
    height: 200px;
  }

  .orb-2 {
    width: 150px;
    height: 150px;
  }

  .orb-3 {
    width: 120px;
    height: 120px;
  }
}
</style>