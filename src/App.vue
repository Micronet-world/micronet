<script setup lang="ts">
import { ref, computed } from 'vue'
import LockScreen from './components/LockScreen.vue'
import HomeScreen from './components/home/HomeScreen.vue'
import SettingsScreen from './components/settings/SettingsScreen.vue'
import CameraScreen from './components/camera/CameraScreen.vue'
import PhotosScreen from './components/photos/PhotosScreen.vue'
import CardStackManager from './components/CardStackManager.vue'

type Screen = 'lock' | 'home' | 'settings' | 'camera' | 'photos'
const screenStack = ref<Screen[]>(['lock'])
const currentScreen = computed(() => screenStack.value[screenStack.value.length - 1])
const cardsExpanded = ref(false)

const goToLock = () => {
  cardsExpanded.value = false
  screenStack.value = ['lock']
}

const goHome = () => {
  cardsExpanded.value = false
  if (screenStack.value.length > 2) {
    screenStack.value = screenStack.value.slice(0, 2)
  }
}

const goBack = () => {
  cardsExpanded.value = false
  if (screenStack.value.length > 2) {
    screenStack.value = screenStack.value.slice(0, -1)
  }
}

const navigateToScreen = (screen: Screen) => {
  cardsExpanded.value = false
  const idx = screenStack.value.indexOf(screen)
  if (idx >= 0) {
    screenStack.value = screenStack.value.slice(0, idx + 1)
  }
}

const handleUnlock = () => {
  screenStack.value = [...screenStack.value, 'home']
}

const handleOpenSettings = () => {
  cardsExpanded.value = false
  screenStack.value = [...screenStack.value, 'settings']
}

const handleOpenCamera = () => {
  cardsExpanded.value = false
  screenStack.value = [...screenStack.value, 'camera']
}

const handleOpenPhotos = () => {
  cardsExpanded.value = false
  screenStack.value = [...screenStack.value, 'photos']
}

const handleShowCards = () => {
  cardsExpanded.value = true
}

const handleCollapseCards = () => {
  cardsExpanded.value = false
}
</script>

<template>
  <div class="app-container">
    <CardStackManager
      :screen-stack="screenStack"
      :current-screen="currentScreen"
      :expanded="cardsExpanded"
      @navigate-to="navigateToScreen"
      @collapse="handleCollapseCards"
    >
      <Transition name="slide-up">
        <LockScreen
          v-if="currentScreen === 'lock'"
          key="lock"
          @unlock="handleUnlock"
          @open-camera="handleOpenCamera"
        />
        <CameraScreen
          v-else-if="currentScreen === 'camera'"
          key="camera"
          @go-back="goBack"
          @go-home="goHome"
        />
        <PhotosScreen
          v-else-if="currentScreen === 'photos'"
          key="photos"
          @go-back="goBack"
          @go-home="goHome"
        />
        <SettingsScreen
          v-else-if="currentScreen === 'settings'"
          key="settings"
          @go-lock="goToLock"
          @go-back="goBack"
          @go-home="goHome"
          @show-cards="handleShowCards"
        />
        <HomeScreen
          v-else
          key="home"
          @go-lock="goToLock"
          @show-cards="handleShowCards"
          @open-settings="handleOpenSettings"
          @open-camera="handleOpenCamera"
          @open-photos="handleOpenPhotos"
        />
      </Transition>
    </CardStackManager>
  </div>
</template>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.slide-up-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-up-leave-active {
  transition: all 0.3s ease-in;
  position: absolute;
  inset: 0;
}

.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(-30%);
  opacity: 0;
}
</style>
