import type { Component } from 'vue'
import type { KernelAPI } from '@micronet/kernel'

import * as lockReg from './components/LockScreen.register'
import * as homeReg from './components/home/HomeScreen.register'
import * as settingsReg from './components/settings/SettingsScreen.register'
import * as cameraReg from './components/camera/CameraScreen.register'
import * as photosReg from './components/photos/PhotosScreen.register'
import * as mapsReg from './components/maps/MapsScreen.register'
import * as calendarReg from './components/calendar/CalendarScreen.register'
import * as notesReg from './components/notes/NotesScreen.register'
import * as clockReg from './components/clock/ClockScreen.register'
import * as filesReg from './components/files/FilesScreen.register'
import * as weatherReg from './components/weather/WeatherScreen.register'

import LockScreen from './components/LockScreen.vue'
import HomeScreen from './components/home/HomeScreen.vue'
import SettingsScreen from './components/settings/SettingsScreen.vue'
import CameraScreen from './components/camera/CameraScreen.vue'
import PhotosScreen from './components/photos/PhotosScreen.vue'
import MapsScreen from './components/maps/MapsScreen.vue'
import CalendarScreen from './components/calendar/CalendarScreen.vue'
import NotesScreen from './components/notes/NotesScreen.vue'
import ClockScreen from './components/clock/ClockScreen.vue'
import FilesScreen from './components/files/FilesScreen.vue'
import WeatherScreen from './components/weather/WeatherScreen.vue'

const registrations = [
  lockReg, homeReg, settingsReg, cameraReg, photosReg, mapsReg, calendarReg, notesReg,
  clockReg, filesReg, weatherReg,
]

export const screenComponents: Record<string, Component> = {
  lock: LockScreen,
  home: HomeScreen,
  settings: SettingsScreen,
  camera: CameraScreen,
  photos: PhotosScreen,
  maps: MapsScreen,
  calendar: CalendarScreen,
  notes: NotesScreen,
  clock: ClockScreen,
  files: FilesScreen,
  weather: WeatherScreen,
}

export function registerApps(kernel: KernelAPI): void {
  for (const reg of registrations) {
    kernel.registerScreen(reg.meta, reg.events)
  }
  kernel.registerScreenComponents(screenComponents)
}
