import { getKernel } from 'micronet-kernel'

export function useNavigation() {
  return getKernel().useNavigation()
}
