// @flow
import type { AbcCurrencyWallet, EdgeReceiveAddress } from 'edge-core-js'

import type { Dispatch, GetState } from '../../ReduxTypes'
import * as SETTINGS_SELECTORS from '../../UI/Settings/selectors'
import * as CORE_SELECTORS from '../selectors'

export const PREFIX = 'Core/Wallets/'
export const UPDATE_WALLETS = PREFIX + 'UPDATE_WALLETS'

const getReceiveAddresses = (currencyWallets: { [id: string]: AbcCurrencyWallet }): Promise<{ [id: string]: EdgeReceiveAddress }> => {
  const ids = Object.keys(currencyWallets)
  const promises = ids.map(id => {
    return currencyWallets[id].getReceiveAddress()
  })
  return Promise.all(promises).then(receiveAddresses => {
    return ids.reduce(
      (result, id, index) => {
        return {
          ...result,
          [id]: receiveAddresses[index]
        }
      },
      {}
    )
  })
}

export const updateWallets = (activeWalletIds: Array<string>, archivedWalletIds: Array<string>, currencyWallets: { [id: string]: AbcCurrencyWallet }, receiveAddresses: { [id: string]: EdgeReceiveAddress }) => ({
  type: UPDATE_WALLETS,
  data: {
    activeWalletIds,
    archivedWalletIds,
    currencyWallets,
    receiveAddresses
  }
})

export const updateWalletsRequest = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const loginStatus = SETTINGS_SELECTORS.getLoginStatus(state)
  if (!loginStatus) {
    return {
      type: 'LOGGED_OUT'
    }
  }

  const account = CORE_SELECTORS.getAccount(state)
  const { activeWalletIds, archivedWalletIds, currencyWallets } = account

  getReceiveAddresses(currencyWallets).then((receiveAddresses) => {
    for (const walletId: string of Object.keys(currencyWallets)) {
      const abcWallet: AbcCurrencyWallet = currencyWallets[walletId]
      if (abcWallet.type === 'wallet:ethereum') {
        if (state.ui.wallets && state.ui.wallets.byId && state.ui.wallets.byId[walletId]) {
          const enabledTokens = state.ui.wallets.byId[walletId].enabledTokens
          abcWallet.enableTokens(enabledTokens)
        }
      }
    }

    return dispatch(updateWallets(activeWalletIds, archivedWalletIds, currencyWallets, receiveAddresses))
  })
}
