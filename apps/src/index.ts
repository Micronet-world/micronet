import type { Component } from 'vue'
import type { AppManifest } from '@micronet/sdk'

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
import CalculatorScreen from './components/calculator/CalculatorScreen.vue'
import CompassScreen from './components/compass/CompassScreen.vue'

import lockManifest from './components/LockScreen.manifest.json'
import homeManifest from './components/home/HomeScreen.manifest.json'
import settingsManifest from './components/settings/SettingsScreen.manifest.json'
import cameraManifest from './components/camera/CameraScreen.manifest.json'
import photosManifest from './components/photos/PhotosScreen.manifest.json'
import mapsManifest from './components/maps/MapsScreen.manifest.json'
import calendarManifest from './components/calendar/CalendarScreen.manifest.json'
import notesManifest from './components/notes/NotesScreen.manifest.json'
import clockManifest from './components/clock/ClockScreen.manifest.json'
import filesManifest from './components/files/FilesScreen.manifest.json'
import weatherManifest from './components/weather/WeatherScreen.manifest.json'
import calculatorManifest from './components/calculator/CalculatorScreen.manifest.json'
import compassManifest from './components/compass/CompassScreen.manifest.json'

export interface AppEntry {
  manifest: AppManifest
  component: Component
}

function entry(manifest: unknown, component: Component): AppEntry {
  return { manifest: manifest as AppManifest, component }
}

export const appEntries: AppEntry[] = [
  entry(lockManifest, LockScreen),
  entry(homeManifest, HomeScreen),
  entry(settingsManifest, SettingsScreen),
  entry(cameraManifest, CameraScreen),
  entry(photosManifest, PhotosScreen),
  entry(mapsManifest, MapsScreen),
  entry(calendarManifest, CalendarScreen),
  entry(notesManifest, NotesScreen),
  entry(clockManifest, ClockScreen),
  entry(filesManifest, FilesScreen),
  entry(weatherManifest, WeatherScreen),
  entry(calculatorManifest, CalculatorScreen),
  entry(compassManifest, CompassScreen),
]
