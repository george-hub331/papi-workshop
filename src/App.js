import React, { useState, useEffect, useCallback } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import './App.css';

function App() {

  const [api, setApi] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [contractAddress] = useState('5EYiWfYtMRwn89pocCKUH5gQ8qbQ9NjjRAkNhSRFcAY2YhwN');
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(false);
  const [todoCounter, setTodoCounter] = useState(0);

  // Connect to Substrate node
  const connectToNode = async () => {
    try {
      setLoading(true);

      console.log('Connecting to local Substrate node...');
      
      // Connect to local node (Pop CLI)
      const wsProvider = new WsProvider('ws://localhost:9944');
      const apiInstance = await ApiPromise.create({ provider: wsProvider });
      
      setApi(apiInstance);
      setIsConnected(true);
      console.log('Connected to local Substrate node successfully!');
      
      // Get chain info
      const chain = await apiInstance.rpc.system.chain();
      const version = await apiInstance.rpc.system.version();
      console.log(`Connected to chain: ${chain} (${version})`);
      
    } catch (error) {
      console.log(`Connection failed: ${error.message}`);
      console.error('Connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTestAccount = () => {
    const { Keyring } = require('@polkadot/keyring');
    const keyring = new Keyring({ type: 'sr25519' });
    const testAccount = keyring.addFromUri('//Alice');
    setAccount(testAccount);
    console.log(`Test account created: ${testAccount.address}`);
  };

  // Load contract metadata
  const loadContractMetadata = async () => {
    try {
      const response = await fetch('/todo_app.json');
      if (!response.ok) {
        throw new Error('Failed to load contract metadata');
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading contract metadata:', error);
      return null;
    }
  };

  const getTodoCounter = async () => {
    if (!api || !contractAddress || !account) {
      console.log('Please connect, create account, and ensure contract is deployed');
      return;
    }

    try {
      setLoading(true);
      console.log('Getting todo counter...');
      
      const contractMetadata = await loadContractMetadata();
      if (!contractMetadata) return;
      
      // Create contract instance
      const contract = new api.contracts.ContractPromise(
        api,
        contractMetadata,
        contractAddress
      );
      
      // Call the 'get_counter' method
      const result = await contract.query.getCounter(account.address, {}, account.address);
      
      if (result.result.isOk) {
        const counter = result.output.toHuman();
        setTodoCounter(parseInt(counter));
        console.log(`Todo counter: ${counter}`);
      } else {
        console.log(`Contract call failed: ${result.result.asErr}`);
      }
      
    } catch (error) {
      console.log(`Failed to get counter: ${error.message}`);
      console.error('Get counter error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add a new todo
  const addTodo = async () => {
    if (!api || !contractAddress || !account || !newTodo.trim()) {
      console.log('Please connect, create account, and enter a todo');
      return;
    }

    try {
      setLoading(true);
      console.log(`Adding todo: ${newTodo}`);
      
      const contractMetadata = await loadContractMetadata();
      if (!contractMetadata) return;
      
      // Create contract instance
      const contract = new api.contracts.ContractPromise(
        api,
        contractMetadata,
        contractAddress
      );
      
      // Call the 'add_todo' method
      const tx = contract.tx.addTodo({}, newTodo.trim());
      
      await tx.signAndSend(account, (result) => {
        if (result.status.isInBlock) {
          console.log(`Transaction included in block: ${result.status.asInBlock}`);
        }
        if (result.status.isFinalized) {
          console.log(`Transaction finalized: ${result.status.asFinalized}`);
          console.log(`✅ Todo added: ${newTodo}`);
          setNewTodo('');
          // Refresh the counter and load todos
          getTodoCounter();
          loadTodos();
        }
      });
      
    } catch (error) {
      console.log(`Add todo failed: ${error.message}`);
      console.error('Add todo error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle todo completion
  const toggleTodo = async (todoId) => {
    if (!api || !contractAddress || !account) {
      console.log('Please connect, create account, and ensure contract is deployed');
      return;
    }

    try {
      setLoading(true);
      console.log(`Toggling todo ${todoId}...`);
      
      const contractMetadata = await loadContractMetadata();
      if (!contractMetadata) return;
      
      // Create contract instance
      const contract = new api.contracts.ContractPromise(
        api,
        contractMetadata,
        contractAddress
      );
      
      // Call the 'toggle_todo' method
      const tx = contract.tx.toggleTodo({}, todoId);
      
      await tx.signAndSend(account, (result) => {
        if (result.status.isInBlock) {
          console.log(`Transaction included in block: ${result.status.asInBlock}`);
        }
        if (result.status.isFinalized) {
          console.log(`Transaction finalized: ${result.status.asFinalized}`);
          console.log(`✅ Todo ${todoId} toggled`);
          // Refresh todos
          loadTodos();
        }
      });
      
    } catch (error) {
      console.log(`Toggle todo failed: ${error.message}`);
      console.error('Toggle todo error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load all todos for current account
  const loadTodos = useCallback(async () => {
    if (!api || !contractAddress || !account) {
      return;
    }

    try {
      const contractMetadata = await loadContractMetadata();
      if (!contractMetadata) return;
      
      // Create contract instance
      const contract = new api.contracts.ContractPromise(
        api,
        contractMetadata,
        contractAddress
      );
      
      const todosList = [];
      
      // Load todos up to the counter
      for (let i = 0; i < todoCounter; i++) {
        try {
          const result = await contract.query.getTodo(account.address, {}, i);
          if (result.result.isOk) {
            const todo = result.output.toHuman();
            todosList.push({
              id: i,
              content: todo.content,
              completed: todo.completed
            });
          }
        } catch (error) {
          console.log(`Failed to load todo ${i}:`, error);
        }
      }
      
      setTodos(todosList);
      console.log(`Loaded ${todosList.length} todos`);
      
    } catch (error) {
      console.log(`Failed to load todos: ${error.message}`);
      console.error('Load todos error:', error);
    }
  }, [api, contractAddress, account, todoCounter]);

  // Disconnect from node
  const disconnect = async () => {
    if (api) {
      await api.disconnect();
      setApi(null);
      setIsConnected(false);
      setAccount(null);
      setTodos([]);
      setTodoCounter(0);
      setNewTodo('');
      console.log('Disconnected from node');
    }
  };

  // Load todos when account and counter change
  useEffect(() => {
    if (account && todoCounter > 0) {
      loadTodos();
    }
  }, [account, todoCounter, loadTodos]);

  return (
    <div className="App">
      <header className="App-header">
        <div className="polkadot-logo">
   
          <div className="logo-text">
            <h1 style={{ margin: "auto" }}>Todo App</h1>
            <p>Decentralized Todo Management on Polkadot</p>
          </div>
        </div>
        
        <div className="connection-section">
          <h2>
            <span className="polkadot-icon">●</span>
            Connection
          </h2>
          {!isConnected ? (
            <button onClick={connectToNode} disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Connecting...
                </>
              ) : (
                'Connect to Local Node'
              )}
            </button>
          ) : (
            <>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
              <div className="status-indicator status-connected"></div><span>Connected to Local Node</span>
            </div>
            <button onClick={disconnect}>Disconnect</button>
            </>
          )}
        </div>

        <div className="account-section">
          <h2>
            <span className="polkadot-icon">●</span>
            Account
          </h2>
          {!account ? (
            <button onClick={createTestAccount} disabled={!isConnected}>
              Create Test Account (//Alice)
            </button>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
                <div className="status-indicator status-connected"></div><span>Account Ready</span>
              </div>
              <div className="contract-address">
                {account.address}
              </div>
            </div>
          )}
        </div>

        <div className="contract-section">
          <h2>
            <span className="polkadot-icon">●</span>
            Smart Contract
          </h2>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
            <div className="status-indicator status-connected"></div><span>Contract Deployed</span>
           
          </div>
          <div className="contract-address">
            {contractAddress}
          </div>
          
          <div className="todo-counter">
            Total Todos: {todoCounter}
          </div>
          
          <div className="contract-actions">
            <button onClick={getTodoCounter} disabled={loading || !account}>
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Loading...
                </>
              ) : (
                'Refresh Counter'
              )}
            </button>
          </div>
        </div>

        <div className="todos-section">
          <h2>
            <span className="polkadot-icon">●</span>
            Todo List
          </h2>
          
          <div className="add-todo-section">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Enter a new todo..."
              className="todo-input"
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            />
            <button onClick={addTodo} disabled={loading || !account || !newTodo.trim()}>
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Adding...
                </>
              ) : (
                'Add Todo'
              )}
            </button>
          </div>

          <div className="todos-list">
            {todos.length === 0 ? (
              <div className="no-todos">
                {account ? 'No todos yet. Add one above!' : 'Connect and create an account to manage todos.'}
              </div>
            ) : (
              todos.map((todo) => (
                <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                  <div className="todo-content">
                    <span className="todo-id">#{todo.id}</span>
                    <span className="todo-text">{todo.content}</span>
                  </div>
                  <button 
                    onClick={() => toggleTodo(todo.id)} 
                    disabled={loading}
                    className="toggle-btn"
                  >
                    {loading ? (
                      <span className="loading-spinner"></span>
                    ) : (
                      todo.completed ? '✓' : '○'
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </header>
    </div>
  );
}

export default App;