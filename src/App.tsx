import { createInkSdk } from '@polkadot-api/sdk-ink'
import { ApiPromise, WsProvider } from '@polkadot/api'
import {
  u8aToHex,
} from '@polkadot/util'

import {
  decodeAddress,
  keccakAsU8a,
} from '@polkadot/util-crypto'

import { useEffect, useState } from 'react'
import Footer from './components/Footer'
import Header from './components/Header'
import { contracts } from './descriptors'
import { useConnect } from './hooks/useConnect'

import sdk, { config } from './utils/sdk'

import { polkadotSigner } from './utils/sdk-interface'
import { Binary } from 'polkadot-api'

function App() {
  
  const CONTRACT_ADDRESS = '0x7845C37F932323C4f206bbcf264841b44Ea073Dd'

  const { selectedAccount } = useConnect()
  const [isLoading, setIsLoading] = useState(true)
  const [todos, setTodos] = useState<Array<{ id: bigint, amount: number, content: string, completed: boolean }>>([])
  const [, setTodoCounter] = useState<bigint>(0n)
  const [addTodoLoader, setAddTodoLoader] = useState<boolean>(false)

  const { client } = sdk('passet')

  const inkSdk = createInkSdk(client)

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;

    (async () => {
      if (selectedAccount) {
        const checkMapping = async () => {
          setIsLoading(true)
          try {
            const mapped = await inkSdk.addressIsMapped(selectedAccount.address)

            if (!mapped) {
              const provider = new WsProvider(config.pas_asset_hub.providers[0])
              const api = await ApiPromise.create({ provider })

              const signer = selectedAccount.wallet!.signer
              try {
                api.setSigner(signer)

                const tx = api.tx.revive.mapAccount()
                await tx.signAndSend(selectedAccount.address)

                // Wait a bit for the transaction to be processed
                timeout = setTimeout(() => {
                  setIsLoading(false)
                }, 3000)
              }
              catch (error) {
                console.error('Error mapping account:', error)
                setIsLoading(false)
              }
            }
            else {
              setIsLoading(false)
            }
          }
          catch (error) {
            console.error('Error checking mapping status:', error)
            setIsLoading(false)
          }
        }

        checkMapping()
      }
      else {
        setIsLoading(false)
      }
    })()

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount])

  const substrateToEthereumAddress = (ss58: string) => {
    // 1. Decode the SS58 to public key (Uint8Array of 32 bytes)
    const publicKey = decodeAddress(ss58)

    // 2. Hash it with keccak256
    const keccakHash = keccakAsU8a(publicKey)

    // 3. Ethereum address is last 20 bytes
    const ethAddress = keccakHash.slice(-20)

    // 4. Return hex string
    return u8aToHex(ethAddress)
    
  }

  const getTodo = async (id: bigint) => {
    if (!selectedAccount)
      return

    console.log(id, 'id')


    const todoContract = inkSdk.getContract(contracts.todo, CONTRACT_ADDRESS)

    const result = await todoContract.query('get_todo', {
      data: { id },
      origin: selectedAccount.address,
    })

    console.warn(result, 'getTodo result')
    return result
  }

  const getCounter = async () => {
    if (!selectedAccount)
      return

    const todoContract = inkSdk.getContract(contracts.todo, CONTRACT_ADDRESS)


    const result = await todoContract.query('get_counter', {
      data: { account_id: Binary.fromHex(substrateToEthereumAddress(selectedAccount.address)) },
      origin: selectedAccount.address,
    })

    console.warn(result, 'getCounter result')
    return result
  }

  const fetchTodos = async () => {

    if (!selectedAccount)
      return


    try {
      // First get the counter to know how many todos we have
      const counterResult = await getCounter()

      console.log(counterResult, 'counterResult')

      if (counterResult?.success) {
        
        const count = counterResult.value.response - 1n;

        setTodoCounter(count)

        const todosList: Array<{ id: bigint, amount: number, content: string, completed: boolean }> = []
        for (let i = 0n; i <= count; i++) {
          try {
            const todoResult = await getTodo(i)
            if (todoResult?.success) {
              todosList.push({
                id: i,
                amount: Number((todoResult.value.response?.amount[0] || 0n) / (10n * 10n ** 10n)),
                content: todoResult.value.response?.content ?? '',
                completed: todoResult.value.response?.completed ?? false,
              })
            }
          }
          catch (error) {
            console.error(`Error fetching todo ${i}:`, error)
          }
        }

        setTodos(todosList)
        console.warn('Fetched todos:', todosList)
      }
    }
    catch (error) {
      console.error('Error fetching todos:', error)
    }
  }

  // Fetch todos when account is ready
  useEffect(() => {
    if (selectedAccount && !isLoading) {
      fetchTodos()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount, isLoading])

  const addTodo = async (content: string) => {
    
    if (!selectedAccount || addTodoLoader)
      return

    setAddTodoLoader(true)

    const signer = (await polkadotSigner())!
    const todoContract = inkSdk.getContract(contracts.todo, CONTRACT_ADDRESS)

    const result = await todoContract.send('add_todo', {
      data: { content },
      origin: selectedAccount.address,
      value: 10n * 10n ** 10n,
    }).signAndSubmit(signer)

    setAddTodoLoader(false);

    // Refresh todos after adding
    setTimeout(() => {
      fetchTodos()
    }, 2000)

    return result
  }

  const toggleTodo = async (id: bigint) => {
    if (!selectedAccount)
      return

    const signer = (await polkadotSigner())!
    const todoContract = inkSdk.getContract(contracts.todo, CONTRACT_ADDRESS)

    const result = await todoContract.send('toggle_todo', {
      data: { id },
      origin: selectedAccount.address,
    }).signAndSubmit(signer)

    console.warn(result, 'toggleTodo result')

    // Refresh todos after toggling
    setTimeout(() => {
      fetchTodos()
    }, 2000)

    return result
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Header />

      <section className="bg-white py-16 hidden sm:block">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            <span>Simple Todo App</span>
          </h1>
          <p className="text-xl text-gray-600 font-mono flex items-center justify-center gap-2">
            <span>Powered by</span>
            <span className="icon-[token-branded--polkadot] animate-spin" style={{ animationDuration: '16s' }} />
          </p>
        </div>
      </section>

      <main className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">

          {!selectedAccount && (
            <div className="text-center py-16">
              <h2 className="text-2xl font-medium mb-4">Connect Your Wallet</h2>
              <p className="text-gray-600 mb-8">
                Please connect your wallet to start managing your todos.
              </p>
              <div className="bg-gray-100 p-6 rounded-lg">
                <p className="text-sm text-gray-500">
                  Use the connect button in the header to get started.
                </p>
              </div>
            </div>
          )}

          {selectedAccount && isLoading && (
            <div className="text-center py-16">
              <div className="mb-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
              </div>
              <h2 className="text-xl font-medium mb-2">Setting up your account...</h2>
              <p className="text-gray-600">
                Mapping your account to the blockchain...
              </p>
            </div>
          )}

          {selectedAccount && !isLoading && (
            <>
              <div className="mb-8">
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="todoInput"
                    placeholder="What needs to be done?"
                    className="flex-1 px-4 py-3 border border-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('todoInput') as HTMLInputElement
                      if (input.value.trim()) {
                        addTodo(input.value.trim())
                        input.value = ''
                      }
                    }}
                    className="bg-black text-white px-6 py-3 border border-black hover:bg-white hover:text-black transition-colors"
                  >
                    {addTodoLoader ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-medium mb-4">
                  Your Todos (
                  {todos.length}
                  )
                </h2>

                {todos.length === 0
                  ? (
                      <div className="text-center py-12 text-gray-500 border border-gray-200">
                        No todos yet. Add one above!
                      </div>
                    )
                  : (
                      <div className="space-y-2">
                        {todos.map(todo => (
                          <div key={todo.id.toString()} className="border border-gray-200 p-4 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => toggleTodo(todo.id)}
                              className={`w-6 h-6 border border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors ${
                                todo.completed ? 'bg-black text-white' : ''
                              }`}
                            >
                              {todo.completed ? '✓' : ''}
                            </button>
                            <span className={`flex-1 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                              {todo.content} - {todo.amount} PAS
                            </span>
                            <span className="text-xs text-gray-400">
                              ID:
                              {' '}
                              {todo.id.toString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
              </div>
            </>
          )}

        </div>
      </main>

      <Footer />
    </div>
  )
}

export default App
