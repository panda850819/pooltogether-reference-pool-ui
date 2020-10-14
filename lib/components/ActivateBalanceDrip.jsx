import React from 'react'
import { ethers } from 'ethers'

import ComptrollerAbi from '@pooltogether/pooltogether-contracts/abis/Comptroller'

import { Button } from 'lib/components/Button'
import { FormLockedOverlay } from 'lib/components/FormLockedOverlay'
import { TextInputGroup } from 'lib/components/TextInputGroup'
import { TxMessage } from 'lib/components/TxMessage'
import { WalletContext } from 'lib/components/WalletContextProvider'
import { displayAmountInEther } from 'lib/utils/displayAmountInEther'
import { poolToast } from 'lib/utils/poolToast'
import { numberWithCommas } from 'lib/utils/numberWithCommas'
import { sendTx } from 'lib/utils/sendTx'

// deactivateBalanceDrip(prizeStrategyAddress, controlledTokenAddress, erc20Address)
// [1, 2, 3, 4, 5]
// if deactivating 3, pass in 2's address for prevDripToken
// or pass SENTINAL_ADDRESS if there are no other drips active
// const SENTINAL = '0x0000000000000000000000000000000000000001'

// activateBalanceDrip(prizeStrategyAddress, controlledTokenAddress, erc20Address, weiPerSecond)
// Decimals: erc20 to give away's decimals
const handleActivateBalanceDripSubmit = async (
  txName,
  setTx,
  provider,
  contractAddress,
  prizeStrategyAddress,
  ticketAddress,
  erc20Address,
  amountPerSecond,
  decimals
) => {
  if (
    !erc20Address ||
    !amountPerSecond
  ) {
    poolToast.error(`ERC20 token address to drip and the amount (in ether) per second needs to be filled in`)
    return
  }

  const params = [
    prizeStrategyAddress,
    ticketAddress,
    erc20Address,
    ethers.utils.parseUnits(amountPerSecond, decimals),
    {
      gasLimit: 200000
    }
  ]

  await sendTx(
    setTx,
    provider,
    contractAddress,
    ComptrollerAbi,
    'activateBalanceDrip',
    params,
    txName,
  )
}


export const ActivateBalanceDrip = (props) => {
  const {
    genericChainValues,
    // adminChainValues, ?
  } = props

  const walletContext = useContext(WalletContext)
  const provider = walletContext.state.provider
  const ticketAddress = props.poolAddresses.ticket
  const prizeStrategyAddress = props.poolAddresses.prizeStrategyAddress

  const [erc20TokenAddress, setErc20TokenAddress] = useState('')
  const [amountPerSecond, setAmountPerSecond] = useState('')
  const [tokenChainValues, setTokenChainValues] = useState({})

  const [tx, setTx] = useState({})
  const txInFlight = tx.inWallet || tx.sent

  const resetState = (e) => {
    e.preventDefault()

    setErc20TokenAddress('')
    setAmountPerSecond('')

    setTx({})
  }

  // will need to query for decimals(), symbol(), name(), etc each time the erc20token address changes and
  // when we have a legit eth address

  // Need a helper:
  // comptroller.balanceOf(erc20tokenAddress)
  // erc20 token transferToComptroller()
  // helper, copy this comptroller address and send token to comptroller

  // const {
  //   tokenDecimals,
  // } = genericChainValues || {}
  // const tokenSymbol = genericChainValues.tokenSymbol || 'TOKEN'

  
  useEffect(() => {
    if (erc20TokenAddress.valid) {
      const tokenChainValues = await fetchTokenChainData(erc20tokenAddress)

      setTokenChainValues(tokenChainValues)
    } else {
      setTokenChainValues({})
    }
  }, [erc20TokenAddress])

  const erc20TokenName = tokenChainValues?.name
  const erc20TokenSymbol = tokenChainValues?.symbol
  const erc20TokenDecimals = tokenChainValues?.decimals


  // let amountPerSecondBN
  // let overBalance = false
  // try {
  //   amountPerSecondBN = ethers.utils.parseUnits(amountPerSecond || '0', tokenDecimals)
  //   overBalance = amountPerSecondBN && usersTokenBalance && usersTokenBalance.lt(
  //     amountPerSecondBN
  //   )
  // } catch (e) {
  //   console.error(e)
  // }

  // const tokenBal = ethers.utils.formatUnits(usersTokenBalance, tokenDecimals)
  const txName = 'Activate Balance Drip'

  const handleSubmit = (e) => {
    e.preventDefault()

    handleActivateBalanceDripSubmit(
      txName,
      setTx,
      provider,
      comptrollerAddress,
      prizeStrategyAddress,
      ticketAddress,
      erc20TokenAddress,
      amountPerSecond,
      erc20TokenDecimals
    )
  }

  if (txInFlight) {
    return <TxMessage
      txType={txName}
      tx={tx}
      handleReset={resetState}
    />
  }

  return <>
    <form
      onSubmit={handleSubmit}
    >
      <div
        className='font-bold mb-2 py-2 text-lg sm:text-xl lg:text-2xl'
      >
        Activate balance drip:
      </div>

      <div
        className='w-full mx-auto'
      >
        <TextInputGroup
          id='amountPerSecond'
          name='amountPerSecond'
          label={<>
            Amount per second <span className='text-default italic'> (in {erc20TokenSymbol})</span>
          </>}
          required
          type='number'
          pattern='\d+'
          onChange={(e) => setDepositAmount(e.target.value)}
          value={amountPerSecond}
        />
      </div>

      <div
        className='w-full mx-auto'
      >
        <TextInputGroup
          id='erc20TokenAddress'
          name='erc20TokenAddress'
          label={<>
            ERC20 token address to drip
          </>}
          required
          onChange={(e) => setDepositAmount(e.target.value)}
          value={erc20TokenAddress}
        />
      </div>

      <div
        className='my-5'
      >
        <Button
          // disabled={overBalance}
          color='green'
        >
          Activate
        </Button>
      </div>
    </form>
  </>
}
