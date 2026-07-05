import type { ScreenId, ScreenPlugin } from './types'
import LockScreen from '../components/LockScreen.vue'
import HomeScreen from '../components/home/HomeScreen.vue'
import SettingsScreen from '../components/settings/SettingsScreen.vue'
import CameraScreen from '../components/camera/CameraScreen.vue'
import PhotosScreen from '../components/photos/PhotosScreen.vue'
import MapsScreen from '../components/maps/MapsScreen.vue'
import CalendarScreen from '../components/calendar/CalendarScreen.vue'

const plugins: ScreenPlugin[] = [
  {
    id: 'lock',
    label: 'Lock Screen',
    color: '#faf9f6',
    icon: '🔒',
    component: LockScreen,
    events: {
      unlock: { type: 'push', screen: 'home' },
      'go-camera': { type: 'push', screen: 'camera' },
    },
  },
  {
    id: 'home',
    label: 'Home',
    color: '#faf9f6',
    icon: '🏠',
    component: HomeScreen,
    events: {
      'go-lock': { type: 'lock' },
      'go-settings': { type: 'push', screen: 'settings' },
      'go-camera': { type: 'push', screen: 'camera' },
      'go-photos': { type: 'push', screen: 'photos' },
      'go-maps': { type: 'push', screen: 'maps' },
      'go-calendar': { type: 'push', screen: 'calendar' },
    },
  },
  {
    id: 'settings',
    label: 'Settings',
    color: '#f5f3ef',
    icon: '⚙️',
    component: SettingsScreen,
    events: {
      'go-lock': { type: 'lock' },
      'go-back': { type: 'back' },
      'go-home': { type: 'home' },
    },
  },
  {
    id: 'camera',
    label: 'Camera',
    color: '#1a1a1a',
    icon: '📷',
    component: CameraScreen,
    events: {
      'go-back': { type: 'back' },
      'go-home': { type: 'home' },
    },
  },
  {
    id: 'photos',
    label: 'Photos',
    color: '#faf9f6',
    icon: '🖼️',
    component: PhotosScreen,
    events: {
      'go-back': { type: 'back' },
      'go-home': { type: 'home' },
    },
  },
  {
    id: 'maps',
    label: 'Maps',
    color: '#e8f0fe',
    icon: '🗺️',
    component: MapsScreen,
    events: {
      'go-back': { type: 'back' },
      'go-home': { type: 'home' },
    },
  },
  {
    id: 'calendar',
    label: 'Calendar',
    color: '#faf9f6',
    icon: '📅',
    component: CalendarScreen,
    events: {
      'go-back': { type: 'back' },
      'go-home': { type: 'home' },
    },
  },
]

export const screenRegistry = Object.fromEntries(
  plugins.map(p => [p.id, p])
) as Record<ScreenId, ScreenPlugin>

export const screenPlugins = plugins

export function getScreenPlugin(id: ScreenId): ScreenPlugin {
  return screenRegistry[id]
}
