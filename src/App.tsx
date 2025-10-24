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

function App() {
  
  const CONTRACT_ADDRESS = '0x9d24982E273eC30b333cbBCf241025d78C7ecd5A'

  const { selectedAccount } = useConnect()
  const [isLoading, setIsLoading] = useState(true)
  const [todos, setTodos] = useState<Array<{ id: bigint, content: string, completed: boolean }>>([])
  const [, setTodoCounter] = useState<bigint>(0n)

  const {api, client } = sdk('passet')

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
    
  }

  const getCounter = async () => {
    
  }

  const fetchTodos = async () => {

  }

  // Fetch todos when account is ready
  useEffect(() => {
    if (selectedAccount && !isLoading) {
      fetchTodos()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount, isLoading])

  const addTodo = async (content: string) => {
    
    
  }

  const toggleTodo = async (id: bigint) => {
    
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
                    Add
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
                              {todo.content}
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
